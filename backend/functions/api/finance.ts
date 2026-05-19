import { getDb } from '../_lib/db';
import { handleOptions, jsonResponse } from '../_lib/cors';
import { isAuthorized, getAdminIdentity } from '../_lib/auth';
import { ensureAuditTable, logAudit, getRequestMeta } from '../_lib/audit';
import type { Env } from '../_lib/types';

// ─── Ensure finance tables exist & run migrations if needed ───
async function ensureTables(env: Env) {
    const db = getDb(env);

    await db.execute(`
        CREATE TABLE IF NOT EXISTS finance_transactions (
            id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
            type TEXT NOT NULL CHECK(type IN ('income','expense','distribution','savings_deposit','savings_withdrawal')),
            amount REAL NOT NULL,
            currency TEXT DEFAULT 'BDT',
            category TEXT NOT NULL,
            subcategory TEXT,
            description TEXT NOT NULL,
            date TEXT NOT NULL,
            project_id TEXT,
            client_name TEXT,
            payment_method TEXT DEFAULT 'cash',
            receipt_url TEXT,
            tags TEXT,
            is_recurring INTEGER DEFAULT 0,
            recurring_interval TEXT,
            notes TEXT,
            recipient TEXT,
            parent_id TEXT,
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now'))
        )
    `);

    // Migrate old tables if they don't support distribution check constraint or columns
    try {
        const tableInfo = await db.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='finance_transactions'");
        const sql = tableInfo.rows[0]?.sql as string || '';
        if (sql && (!sql.includes('distribution') || !sql.includes('recipient') || !sql.includes('parent_id'))) {
            // Need migration! Rename and copy
            await db.execute(`ALTER TABLE finance_transactions RENAME TO temp_finance_transactions`);
            
            await db.execute(`
                CREATE TABLE finance_transactions (
                    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
                    type TEXT NOT NULL CHECK(type IN ('income','expense','distribution','savings_deposit','savings_withdrawal')),
                    amount REAL NOT NULL,
                    currency TEXT DEFAULT 'BDT',
                    category TEXT NOT NULL,
                    subcategory TEXT,
                    description TEXT NOT NULL,
                    date TEXT NOT NULL,
                    project_id TEXT,
                    client_name TEXT,
                    payment_method TEXT DEFAULT 'cash',
                    receipt_url TEXT,
                    tags TEXT,
                    is_recurring INTEGER DEFAULT 0,
                    recurring_interval TEXT,
                    notes TEXT,
                    recipient TEXT,
                    parent_id TEXT,
                    created_at TEXT DEFAULT (datetime('now')),
                    updated_at TEXT DEFAULT (datetime('now'))
                )
            `);
            
            // Check if temp table has older columns first and select them
            const tempColumnsRes = await db.execute("PRAGMA table_info(temp_finance_transactions)");
            const tempCols = tempColumnsRes.rows.map(r => r.name as string);
            
            const colsToSelect = [
                'id', 'type', 'amount', 'currency', 'category', 'subcategory', 'description', 'date',
                'project_id', 'client_name', 'payment_method', 'receipt_url', 'tags', 'is_recurring',
                'recurring_interval', 'notes', 'created_at', 'updated_at'
            ].filter(c => tempCols.includes(c));

            const recipientSel = tempCols.includes('recipient') ? 'recipient' : 'NULL';
            const parentIdSel = tempCols.includes('parent_id') ? 'parent_id' : 'NULL';

            await db.execute(`
                INSERT INTO finance_transactions (
                    id, type, amount, currency, category, subcategory, description, date,
                    project_id, client_name, payment_method, receipt_url, tags, is_recurring,
                    recurring_interval, notes, recipient, parent_id, created_at, updated_at
                )
                SELECT 
                    id, type, amount, currency, category, subcategory, description, date,
                    project_id, client_name, payment_method, receipt_url, tags, is_recurring,
                    recurring_interval, notes, ${recipientSel}, ${parentIdSel}, created_at, updated_at
                FROM temp_finance_transactions
            `);
            
            await db.execute(`DROP TABLE temp_finance_transactions`);
            console.log("Migration for finance_transactions completed successfully.");
        }
    } catch (e) {
        console.error("Migration check failed or was skipped:", e);
    }

    await db.execute(`
        CREATE TABLE IF NOT EXISTS finance_categories (
            id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)))),
            name TEXT NOT NULL,
            name_bn TEXT,
            type TEXT NOT NULL CHECK(type IN ('income','expense','distribution','both')),
            icon TEXT,
            color TEXT,
            sort_order INTEGER DEFAULT 0
        )
    `);

    // Migrate finance_categories type constraint if needed
    try {
        const catTableInfo = await db.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='finance_categories'");
        const catSql = catTableInfo.rows[0]?.sql as string || '';
        if (catSql && !catSql.includes('distribution')) {
            await db.execute(`ALTER TABLE finance_categories RENAME TO temp_finance_categories`);
            await db.execute(`
                CREATE TABLE finance_categories (
                    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)))),
                    name TEXT NOT NULL,
                    name_bn TEXT,
                    type TEXT NOT NULL CHECK(type IN ('income','expense','distribution','both')),
                    icon TEXT,
                    color TEXT,
                    sort_order INTEGER DEFAULT 0
                )
            `);
            await db.execute(`
                INSERT INTO finance_categories SELECT * FROM temp_finance_categories
            `);
            await db.execute(`DROP TABLE temp_finance_categories`);
        }
    } catch (e) {
        console.error("Category table migration failed or skipped:", e);
    }

    await db.execute(`
        CREATE TABLE IF NOT EXISTS finance_budgets (
            id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)))),
            category TEXT NOT NULL,
            month TEXT NOT NULL,
            budget_amount REAL NOT NULL,
            currency TEXT DEFAULT 'BDT',
            UNIQUE(category, month)
        )
    `);

    await db.execute(`
        CREATE TABLE IF NOT EXISTS finance_savings_goals (
            id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)))),
            name TEXT NOT NULL,
            target_amount REAL NOT NULL,
            current_amount REAL DEFAULT 0,
            currency TEXT DEFAULT 'BDT',
            deadline TEXT,
            status TEXT DEFAULT 'active' CHECK(status IN ('active','completed','paused')),
            created_at TEXT DEFAULT (datetime('now'))
        )
    `);
}

// ─── Default categories ───
const DEFAULT_CATEGORIES = [
    { name: 'Freelance / Client Work', name_bn: 'ফ্রিল্যান্স / ক্লায়েন্ট', type: 'income', icon: '💼', color: '#10B981' },
    { name: 'Product Sales', name_bn: 'প্রোডাক্ট বিক্রয়', type: 'income', icon: '📦', color: '#3B82F6' },
    { name: 'Investments', name_bn: 'বিনিয়োগ', type: 'income', icon: '📈', color: '#8B5CF6' },
    { name: 'Other Income', name_bn: 'অন্যান্য আয়', type: 'income', icon: '💰', color: '#F59E0B' },
    { name: 'Hosting & Infrastructure', name_bn: 'হোস্টিং ও পরিকাঠামো', type: 'expense', icon: '🖥️', color: '#EF4444' },
    { name: 'Tools & Software', name_bn: 'টুলস ও সফটওয়্যার', type: 'expense', icon: '🛠️', color: '#F97316' },
    { name: 'Team & Salary', name_bn: 'টিম ও বেতন', type: 'expense', icon: '👥', color: '#EC4899' },
    { name: 'Marketing', name_bn: 'মার্কেটিং', type: 'expense', icon: '📢', color: '#8B5CF6' },
    { name: 'Office & Utilities', name_bn: 'অফিস ও ইউটিলিটি', type: 'expense', icon: '🏢', color: '#6366F1' },
    { name: 'Learning & Education', name_bn: 'শিক্ষা ও প্রশিক্ষণ', type: 'expense', icon: '📚', color: '#14B8A6' },
    { name: 'Food & Entertainment', name_bn: 'খাবার ও বিনোদন', type: 'expense', icon: '🍕', color: '#F43F5E' },
    { name: 'Travel', name_bn: 'ভ্রমণ', type: 'expense', icon: '🚗', color: '#0EA5E9' },
    { name: 'Miscellaneous', name_bn: 'বিবিধ', type: 'both', icon: '📦', color: '#78716C' },
];

// ─── Action: Dashboard Aggregates ───
async function handleDashboard(request: Request, env: Env): Promise<Response> {
    const db = getDb(env);
    const url = new URL(request.url);
    const months = parseInt(url.searchParams.get('months') || '12');

    // Current month key
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const currentYear = now.getFullYear();

    // Total income
    const incomeRes = await db.execute(`SELECT COALESCE(SUM(amount), 0) as total FROM finance_transactions WHERE type = 'income'`);
    const totalIncome = Number(incomeRes.rows[0]?.total ?? 0);

    // Total expenses
    const expenseRes = await db.execute(`SELECT COALESCE(SUM(amount), 0) as total FROM finance_transactions WHERE type = 'expense'`);
    const totalExpense = Number(expenseRes.rows[0]?.total ?? 0);

    // Total distributions
    const distributionRes = await db.execute(`SELECT COALESCE(SUM(amount), 0) as total FROM finance_transactions WHERE type = 'distribution'`);
    const totalDistribution = Number(distributionRes.rows[0]?.total ?? 0);

    // This month income
    const monthIncomeRes = await db.execute({
        sql: `SELECT COALESCE(SUM(amount), 0) as total FROM finance_transactions WHERE type = 'income' AND strftime('%Y-%m', date) = ?`,
        args: [currentMonth],
    });
    const monthIncome = Number(monthIncomeRes.rows[0]?.total ?? 0);

    // This month expenses
    const monthExpenseRes = await db.execute({
        sql: `SELECT COALESCE(SUM(amount), 0) as total FROM finance_transactions WHERE type = 'expense' AND strftime('%Y-%m', date) = ?`,
        args: [currentMonth],
    });
    const monthExpense = Number(monthExpenseRes.rows[0]?.total ?? 0);

    // This month distributions
    const monthDistributionRes = await db.execute({
        sql: `SELECT COALESCE(SUM(amount), 0) as total FROM finance_transactions WHERE type = 'distribution' AND strftime('%Y-%m', date) = ?`,
        args: [currentMonth],
    });
    const monthDistribution = Number(monthDistributionRes.rows[0]?.total ?? 0);

    // Last month for comparison
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonth = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;

    const lastMonthIncomeRes = await db.execute({
        sql: `SELECT COALESCE(SUM(amount), 0) as total FROM finance_transactions WHERE type = 'income' AND strftime('%Y-%m', date) = ?`,
        args: [lastMonth],
    });
    const lastMonthIncome = Number(lastMonthIncomeRes.rows[0]?.total ?? 0);

    const lastMonthExpenseRes = await db.execute({
        sql: `SELECT COALESCE(SUM(amount), 0) as total FROM finance_transactions WHERE type = 'expense' AND strftime('%Y-%m', date) = ?`,
        args: [lastMonth],
    });
    const lastMonthExpense = Number(lastMonthExpenseRes.rows[0]?.total ?? 0);

    const lastMonthDistributionRes = await db.execute({
        sql: `SELECT COALESCE(SUM(amount), 0) as total FROM finance_transactions WHERE type = 'distribution' AND strftime('%Y-%m', date) = ?`,
        args: [lastMonth],
    });
    const lastMonthDistribution = Number(lastMonthDistributionRes.rows[0]?.total ?? 0);

    // Monthly breakdown (last N months)
    const monthlyRes = await db.execute({
        sql: `
            SELECT 
                strftime('%Y-%m', date) as month,
                SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
                SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense,
                SUM(CASE WHEN type = 'distribution' THEN amount ELSE 0 END) as distribution
            FROM finance_transactions
            WHERE date >= date('now', '-' || ? || ' months')
            GROUP BY strftime('%Y-%m', date)
            ORDER BY month ASC
        `,
        args: [months],
    });
    const monthlyData = monthlyRes.rows.map(r => ({
        month: r.month as string,
        income: Number(r.income ?? 0),
        expense: Number(r.expense ?? 0),
        distribution: Number(r.distribution ?? 0),
        net: Number(r.income ?? 0) - Number(r.expense ?? 0) - Number(r.distribution ?? 0),
    }));

    // Category breakdown (expenses)
    const categoryRes = await db.execute(`
        SELECT category, SUM(amount) as total
        FROM finance_transactions
        WHERE type = 'expense'
        GROUP BY category
        ORDER BY total DESC
    `);
    const categoryBreakdown = categoryRes.rows.map(r => ({
        category: r.category as string,
        total: Number(r.total ?? 0),
    }));

    // Recent transactions
    const recentRes = await db.execute(`
        SELECT * FROM finance_transactions
        ORDER BY date DESC, created_at DESC
        LIMIT 10
    `);
    const recentTransactions = recentRes.rows.map(r => ({
        ...r,
        tags: r.tags ? JSON.parse(r.tags as string) : [],
    }));

    // Savings goals
    const savingsRes = await db.execute(`SELECT * FROM finance_savings_goals WHERE status = 'active'`);

    // Total savings deposits - withdrawals
    const savingsDepositRes = await db.execute(`SELECT COALESCE(SUM(amount), 0) as total FROM finance_transactions WHERE type = 'savings_deposit'`);
    const savingsWithdrawalRes = await db.execute(`SELECT COALESCE(SUM(amount), 0) as total FROM finance_transactions WHERE type = 'savings_withdrawal'`);
    const totalSavings = Number(savingsDepositRes.rows[0]?.total ?? 0) - Number(savingsWithdrawalRes.rows[0]?.total ?? 0);

    // Top clients by income
    const clientRes = await db.execute(`
        SELECT client_name, SUM(amount) as total
        FROM finance_transactions
        WHERE type = 'income' AND client_name IS NOT NULL AND client_name != ''
        GROUP BY client_name
        ORDER BY total DESC
        LIMIT 5
    `);

    // Transaction count
    const countRes = await db.execute(`SELECT COUNT(*) as count FROM finance_transactions`);

    return jsonResponse({
        success: true,
        dashboard: {
            totalIncome,
            totalExpense,
            totalDistribution,
            netBalance: totalIncome - totalExpense - totalDistribution,
            totalSavings,
            monthIncome,
            monthExpense,
            monthDistribution,
            monthNet: monthIncome - monthExpense - monthDistribution,
            lastMonthIncome,
            lastMonthExpense,
            lastMonthDistribution,
            incomeChange: lastMonthIncome > 0 ? ((monthIncome - lastMonthIncome) / lastMonthIncome * 100) : 0,
            expenseChange: lastMonthExpense > 0 ? ((monthExpense - lastMonthExpense) / lastMonthExpense * 100) : 0,
            monthlyData,
            categoryBreakdown,
            recentTransactions,
            savingsGoals: savingsRes.rows,
            topClients: clientRes.rows,
            transactionCount: Number(countRes.rows[0]?.count ?? 0),
            currentMonth,
        },
    }, request);
}

// ─── Action: Transactions CRUD ───
async function handleTransactions(request: Request, env: Env): Promise<Response> {
    const db = getDb(env);
    const url = new URL(request.url);

    if (request.method === 'GET') {
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '50');
        const offset = (page - 1) * limit;
        const type = url.searchParams.get('type') || '';
        const category = url.searchParams.get('category') || '';
        const dateFrom = url.searchParams.get('from') || '';
        const dateTo = url.searchParams.get('to') || '';
        const search = url.searchParams.get('search') || '';

        let whereClause = '1=1';
        const args: any[] = [];

        if (type) { whereClause += ` AND type = ?`; args.push(type); }
        if (category) { whereClause += ` AND category = ?`; args.push(category); }
        if (dateFrom) { whereClause += ` AND date >= ?`; args.push(dateFrom); }
        if (dateTo) { whereClause += ` AND date <= ?`; args.push(dateTo); }
        if (search) { whereClause += ` AND (description LIKE ? OR client_name LIKE ? OR notes LIKE ? OR recipient LIKE ?)`; args.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`); }

        const countRes = await db.execute({ sql: `SELECT COUNT(*) as count FROM finance_transactions WHERE ${whereClause}`, args });
        const total = Number(countRes.rows[0]?.count ?? 0);

        const result = await db.execute({
            sql: `SELECT * FROM finance_transactions WHERE ${whereClause} ORDER BY date DESC, created_at DESC LIMIT ? OFFSET ?`,
            args: [...args, limit, offset],
        });

        const transactions = result.rows.map(r => ({
            ...r,
            tags: r.tags ? JSON.parse(r.tags as string) : [],
        }));

        return jsonResponse({ success: true, transactions, total, page, limit }, request);
    }

    if (request.method === 'POST') {
        const body = await request.json() as any;
        const id = crypto.randomUUID().replace(/-/g, '').slice(0, 16);

        // 1. Insert parent transaction
        await db.execute({
            sql: `INSERT INTO finance_transactions (id, type, amount, currency, category, subcategory, description, date, project_id, client_name, payment_method, receipt_url, tags, is_recurring, recurring_interval, notes, recipient, parent_id)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
                id, body.type, body.amount, body.currency || 'BDT', body.category,
                body.subcategory || null, body.description, body.date,
                body.project_id || null, body.client_name || null,
                body.payment_method || 'cash', body.receipt_url || null,
                body.tags ? JSON.stringify(body.tags) : null,
                body.is_recurring ? 1 : 0, body.recurring_interval || null,
                body.notes || null, body.recipient || null, body.parent_id || null
            ],
        });

        // 2. If it is an Income transaction and contains distribution splits, insert them automatically
        let distributionsCreated = 0;
        if (body.type === 'income' && body.distributions && Array.isArray(body.distributions)) {
            for (const dist of body.distributions) {
                if (dist.amount > 0) {
                    const distId = crypto.randomUUID().replace(/-/g, '').slice(0, 16);
                    await db.execute({
                        sql: `INSERT INTO finance_transactions (id, type, amount, currency, category, subcategory, description, date, recipient, parent_id, notes, payment_method)
                              VALUES (?, 'distribution', ?, ?, 'Distribution', 'Pending', ?, ?, ?, ?, ?, 'bank_transfer')`,
                        args: [
                            distId, dist.amount, body.currency || 'BDT',
                            `Split: ${dist.recipient} Share from "${body.description}"`,
                            body.date, dist.recipient, id, 'Automatic split share'
                        ]
                    });
                    distributionsCreated++;
                }
            }
        }

        // 3. If there is a miscellaneous expense, insert it as a linked expense transaction
        if (body.type === 'income' && body.misc_amount && body.misc_amount > 0) {
            const miscId = crypto.randomUUID().replace(/-/g, '').slice(0, 16);
            await db.execute({
                sql: `INSERT INTO finance_transactions (id, type, amount, currency, category, subcategory, description, date, parent_id, notes, payment_method, recipient)
                      VALUES (?, 'expense', ?, ?, 'Miscellaneous', 'Misc Income Deduction', ?, ?, ?, ?, ?, 'Company Funding')`,
                args: [
                    miscId, body.misc_amount, body.currency || 'BDT',
                    body.misc_description || 'Miscellaneous Expense (Bus/Tea)',
                    body.date, id, 'Deducted directly from Company Funding split', body.payment_method || 'cash'
                ]
            });
        }

        // If savings deposit/withdrawal, update savings goal if specified
        if (body.savings_goal_id && (body.type === 'savings_deposit' || body.type === 'savings_withdrawal')) {
            const delta = body.type === 'savings_deposit' ? body.amount : -body.amount;
            await db.execute({
                sql: `UPDATE finance_savings_goals SET current_amount = MAX(0, current_amount + ?) WHERE id = ?`,
                args: [delta, body.savings_goal_id],
            });
        }

        // Audit log
        const adminEmail = await getAdminIdentity(request, env.JWT_SECRET);
        const meta = getRequestMeta(request);
        await logAudit(env, {
            admin_email: adminEmail || 'unknown',
            action: 'create',
            entity_type: 'transaction',
            entity_id: id,
            entity_label: `${body.type}: ${body.description} (${body.amount} ${body.currency || 'BDT'})`,
            changes_summary: `New ${body.type} transaction created.${distributionsCreated > 0 ? ` Automatically generated ${distributionsCreated} linked split distributions.` : ''}`,
            ...meta,
        });

        return jsonResponse({ success: true, id }, request);
    }

    if (request.method === 'PUT') {
        const id = url.searchParams.get('id');
        if (!id) return jsonResponse({ error: 'ID required' }, request, 400);

        const body = await request.json() as any;

        await db.execute({
            sql: `UPDATE finance_transactions SET
                    type = ?, amount = ?, currency = ?, category = ?, subcategory = ?,
                    description = ?, date = ?, project_id = ?, client_name = ?,
                    payment_method = ?, receipt_url = ?, tags = ?,
                    is_recurring = ?, recurring_interval = ?, notes = ?,
                    recipient = ?, parent_id = ?,
                    updated_at = datetime('now')
                  WHERE id = ?`,
            args: [
                body.type, body.amount, body.currency || 'BDT', body.category,
                body.subcategory || null, body.description, body.date,
                body.project_id || null, body.client_name || null,
                body.payment_method || 'cash', body.receipt_url || null,
                body.tags ? JSON.stringify(body.tags) : null,
                body.is_recurring ? 1 : 0, body.recurring_interval || null,
                body.notes || null, body.recipient || null, body.parent_id || null, id,
            ],
        });

        // Audit log
        const adminEmail = await getAdminIdentity(request, env.JWT_SECRET);
        const meta = getRequestMeta(request);
        await logAudit(env, {
            admin_email: adminEmail || 'unknown',
            action: 'update',
            entity_type: 'transaction',
            entity_id: id,
            entity_label: `Updated: ${body.description} (${body.amount} ${body.currency || 'BDT'})`,
            changes_summary: `Updated ${body.type} transaction — ${body.category}`,
            ...meta,
        });

        return jsonResponse({ success: true }, request);
    }

    if (request.method === 'DELETE') {
        const id = url.searchParams.get('id');
        if (!id) return jsonResponse({ error: 'ID required' }, request, 400);

        // Also delete any linked distribution transactions automatically!
        const linkedRes = await db.execute({
            sql: `SELECT COUNT(*) as count FROM finance_transactions WHERE parent_id = ?`,
            args: [id]
        });
        const linkedCount = Number(linkedRes.rows[0]?.count ?? 0);

        if (linkedCount > 0) {
            await db.execute({ sql: 'DELETE FROM finance_transactions WHERE parent_id = ?', args: [id] });
        }
        await db.execute({ sql: 'DELETE FROM finance_transactions WHERE id = ?', args: [id] });

        // Audit log
        const adminEmail = await getAdminIdentity(request, env.JWT_SECRET);
        const meta = getRequestMeta(request);
        await logAudit(env, {
            admin_email: adminEmail || 'unknown',
            action: 'delete',
            entity_type: 'transaction',
            entity_id: id,
            entity_label: `Deleted transaction ${id}`,
            changes_summary: `Deleted transaction ${id}.${linkedCount > 0 ? ` Also automatically removed ${linkedCount} linked split distribution records.` : ''}`,
            ...meta,
        });

        return jsonResponse({ success: true }, request);
    }
    return jsonResponse({ error: 'Method not allowed' }, request, 405);
}

// ─── Action: Categories ───
async function handleCategories(request: Request, env: Env): Promise<Response> {
    const db = getDb(env);

    if (request.method === 'GET') {
        const result = await db.execute('SELECT * FROM finance_categories ORDER BY sort_order ASC, name ASC');
        return jsonResponse({ success: true, categories: result.rows }, request);
    }

    if (request.method === 'POST') {
        const body = await request.json() as any;
        const id = crypto.randomUUID().replace(/-/g, '').slice(0, 8);

        await db.execute({
            sql: `INSERT INTO finance_categories (id, name, name_bn, type, icon, color, sort_order)
                  VALUES (?, ?, ?, ?, ?, ?, ?)`,
            args: [id, body.name, body.name_bn || null, body.type, body.icon || '📦', body.color || '#78716C', body.sort_order || 0],
        });

        return jsonResponse({ success: true, id }, request);
    }

    if (request.method === 'DELETE') {
        const url = new URL(request.url);
        const id = url.searchParams.get('id');
        if (!id) return jsonResponse({ error: 'ID required' }, request, 400);

        await db.execute({ sql: 'DELETE FROM finance_categories WHERE id = ?', args: [id] });
        return jsonResponse({ success: true }, request);
    }

    return jsonResponse({ error: 'Method not allowed' }, request, 405);
}

// ─── Action: Savings Goals ───
async function handleSavings(request: Request, env: Env): Promise<Response> {
    const db = getDb(env);
    const url = new URL(request.url);

    if (request.method === 'GET') {
        const result = await db.execute('SELECT * FROM finance_savings_goals ORDER BY created_at DESC');
        return jsonResponse({ success: true, goals: result.rows }, request);
    }

    if (request.method === 'POST') {
        const body = await request.json() as any;
        const id = crypto.randomUUID().replace(/-/g, '').slice(0, 8);

        await db.execute({
            sql: `INSERT INTO finance_savings_goals (id, name, target_amount, current_amount, currency, deadline, status)
                  VALUES (?, ?, ?, ?, ?, ?, ?)`,
            args: [id, body.name, body.target_amount, body.current_amount || 0, body.currency || 'BDT', body.deadline || null, body.status || 'active'],
        });

        return jsonResponse({ success: true, id }, request);
    }

    if (request.method === 'PUT') {
        const id = url.searchParams.get('id');
        if (!id) return jsonResponse({ error: 'ID required' }, request, 400);

        const body = await request.json() as any;
        await db.execute({
            sql: `UPDATE finance_savings_goals SET name = ?, target_amount = ?, current_amount = ?, currency = ?, deadline = ?, status = ? WHERE id = ?`,
            args: [body.name, body.target_amount, body.current_amount || 0, body.currency || 'BDT', body.deadline || null, body.status || 'active', id],
        });

        return jsonResponse({ success: true }, request);
    }

    if (request.method === 'DELETE') {
        const id = url.searchParams.get('id');
        if (!id) return jsonResponse({ error: 'ID required' }, request, 400);

        await db.execute({ sql: 'DELETE FROM finance_savings_goals WHERE id = ?', args: [id] });
        return jsonResponse({ success: true }, request);
    }

    return jsonResponse({ error: 'Method not allowed' }, request, 405);
}

// ─── Action: Budgets ───
async function handleBudgets(request: Request, env: Env): Promise<Response> {
    const db = getDb(env);

    if (request.method === 'GET') {
        const url = new URL(request.url);
        const month = url.searchParams.get('month') || '';

        let result;
        if (month) {
            result = await db.execute({ sql: 'SELECT * FROM finance_budgets WHERE month = ?', args: [month] });
        } else {
            result = await db.execute('SELECT * FROM finance_budgets ORDER BY month DESC');
        }

        return jsonResponse({ success: true, budgets: result.rows }, request);
    }

    if (request.method === 'POST') {
        const body = await request.json() as any;
        const id = crypto.randomUUID().replace(/-/g, '').slice(0, 8);

        await db.execute({
            sql: `INSERT INTO finance_budgets (id, category, month, budget_amount, currency)
                  VALUES (?, ?, ?, ?, ?)
                  ON CONFLICT(category, month) DO UPDATE SET budget_amount = ?, currency = ?`,
            args: [id, body.category, body.month, body.budget_amount, body.currency || 'BDT', body.budget_amount, body.currency || 'BDT'],
        });

        return jsonResponse({ success: true }, request);
    }

    return jsonResponse({ error: 'Method not allowed' }, request, 405);
}

// ─── Action: Seed default categories & demo data ───
async function handleSeed(request: Request, env: Env): Promise<Response> {
    if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, request, 405);

    const db = getDb(env);
    await ensureTables(env);
    await ensureAuditTable(env);

    // 1. Seed categories
    for (let i = 0; i < DEFAULT_CATEGORIES.length; i++) {
        const cat = DEFAULT_CATEGORIES[i];
        await db.execute({
            sql: `INSERT OR IGNORE INTO finance_categories (id, name, name_bn, type, icon, color, sort_order)
                  VALUES (?, ?, ?, ?, ?, ?, ?)`,
            args: [`fc_${i}`, cat.name, cat.name_bn, cat.type, cat.icon, cat.color, i],
        });
    }

    // 2. Clear old data to prevent infinite growth on multiple seeds
    await db.execute(`DELETE FROM finance_transactions`);
    await db.execute(`DELETE FROM finance_savings_goals`);
    await db.execute(`DELETE FROM finance_budgets`);

    // 3. Seed Savings Goals
    const goal1Id = crypto.randomUUID().replace(/-/g, '').slice(0, 8);
    const goal2Id = crypto.randomUUID().replace(/-/g, '').slice(0, 8);
    await db.execute({
        sql: `INSERT INTO finance_savings_goals (id, name, target_amount, current_amount, currency, deadline, status)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [goal1Id, 'Emergency Fund', 500000, 350000, 'BDT', '2027-12-31', 'active'],
    });
    await db.execute({
        sql: `INSERT INTO finance_savings_goals (id, name, target_amount, current_amount, currency, deadline, status)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [goal2Id, 'Office Renovation', 200000, 120000, 'BDT', '2026-12-31', 'active'],
    });

    // 4. Generate historical transactions for the last 6 months (up to current date)
    const now = new Date();
    const transactions = [];

    // Let's seed monthly transaction loops for the last 6 months
    for (let monthOffset = 5; monthOffset >= 0; monthOffset--) {
        const d = new Date(now.getFullYear(), now.getMonth() - monthOffset, 15);
        const year = d.getFullYear();
        const monthStr = String(d.getMonth() + 1).padStart(2, '0');
        const datePrefix = `${year}-${monthStr}`;

        // Seed Budgets for this month
        const budgetCategories = [
            { cat: 'Hosting & Infrastructure', amt: 30000 },
            { cat: 'Tools & Software', amt: 15000 },
            { cat: 'Team & Salary', amt: 120000 },
            { cat: 'Marketing', amt: 35000 },
            { cat: 'Office & Utilities', amt: 20000 },
            { cat: 'Food & Entertainment', amt: 10000 }
        ];
        for (const bc of budgetCategories) {
            const bId = crypto.randomUUID().replace(/-/g, '').slice(0, 8);
            await db.execute({
                sql: `INSERT OR IGNORE INTO finance_budgets (id, category, month, budget_amount, currency) VALUES (?, ?, ?, ?, ?)`,
                args: [bId, bc.cat, datePrefix, bc.amt, 'BDT']
            });
        }

        // Add monthly income
        transactions.push({
            type: 'income',
            amount: 120000 + Math.floor(Math.random() * 20000),
            category: 'Freelance / Client Work',
            description: 'Client Project Retainer Payment',
            date: `${datePrefix}-15`,
            payment_method: 'bank_transfer',
            client_name: 'Orbit Tech LLC'
        });

        transactions.push({
            type: 'income',
            amount: 85000 + Math.floor(Math.random() * 15000),
            category: 'Product Sales',
            description: 'Orbit SaaS Subscription Sales',
            date: `${datePrefix}-25`,
            payment_method: 'card',
            client_name: 'Stripe SaaS Sales'
        });

        transactions.push({
            type: 'income',
            amount: 10000 + Math.floor(Math.random() * 5000),
            category: 'Investments',
            description: 'Mutual Fund Investment Dividend',
            date: `${datePrefix}-05`,
            payment_method: 'bank_transfer',
            client_name: 'IDLC Assets'
        });

        // Add monthly expenses
        transactions.push({
            type: 'expense',
            amount: 22000 + Math.floor(Math.random() * 5000),
            category: 'Hosting & Infrastructure',
            description: 'AWS Servers & Vercel Pro Hosting',
            date: `${datePrefix}-02`,
            payment_method: 'card'
        });

        transactions.push({
            type: 'expense',
            amount: 12000 + Math.floor(Math.random() * 2000),
            category: 'Tools & Software',
            description: 'Notion, Slack, Figma & Google Workspace Pro',
            date: `${datePrefix}-03`,
            payment_method: 'card'
        });

        transactions.push({
            type: 'expense',
            amount: 110000,
            category: 'Team & Salary',
            description: 'Core Engineering & Designer Salaries',
            date: `${datePrefix}-28`,
            payment_method: 'bank_transfer'
        });

        transactions.push({
            type: 'expense',
            amount: 25000 + Math.floor(Math.random() * 10000),
            category: 'Marketing',
            description: 'Google Ads & LinkedIn Outreach Campaign',
            date: `${datePrefix}-10`,
            payment_method: 'card'
        });

        transactions.push({
            type: 'expense',
            amount: 18000,
            category: 'Office & Utilities',
            description: 'Co-working Office Spaces Rent & Highspeed Internet',
            date: `${datePrefix}-05`,
            payment_method: 'cash'
        });

        transactions.push({
            type: 'expense',
            amount: 6000 + Math.floor(Math.random() * 4000),
            category: 'Food & Entertainment',
            description: 'Monthly Team Dinner & Outing',
            date: `${datePrefix}-18`,
            payment_method: 'cash'
        });

        // Seed a Savings Goal deposit to make savings goal data active
        transactions.push({
            type: 'savings_deposit',
            amount: 15000,
            category: 'Miscellaneous',
            description: 'Monthly allocation to Emergency Fund',
            date: `${datePrefix}-28`,
            payment_method: 'bank_transfer'
        });
    }

    // Insert all generated transactions into DB with high-fidelity split distributions
    let totalSeeded = 0;
    for (const t of transactions) {
        const tId = crypto.randomUUID().replace(/-/g, '').slice(0, 16);
        await db.execute({
            sql: `INSERT INTO finance_transactions (id, type, amount, category, description, date, payment_method, client_name)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [tId, t.type, t.amount, t.category, t.description, t.date, t.payment_method, t.client_name || null]
        });
        totalSeeded++;

        // If it's income, automatically generate and seed the four-way split distribution!
        if (t.type === 'income') {
            const companyAmt = Math.round((t.amount * 30) / 100);
            const brokerAmt = Math.round((t.amount * 10) / 100);
            const marketingAmt = Math.round((t.amount * 25) / 100);
            const devAmt = Math.round((t.amount * 35) / 100);

            const splits = [
                { recipient: 'Company Funding', amt: companyAmt },
                { recipient: 'Broker Allowance', amt: brokerAmt },
                { recipient: 'Marketing Team', amt: marketingAmt },
                { recipient: 'Development Team', amt: devAmt }
            ];

            for (const s of splits) {
                if (s.amt > 0) {
                    const distId = crypto.randomUUID().replace(/-/g, '').slice(0, 16);
                    await db.execute({
                        sql: `INSERT INTO finance_transactions (id, type, amount, category, description, date, recipient, parent_id, notes, payment_method)
                              VALUES (?, 'distribution', ?, 'Distribution', ?, ?, ?, ?, 'Seeded split share', 'bank_transfer')`,
                        args: [
                            distId, s.amt, `Split: ${s.recipient} Share from "${t.description}"`,
                            t.date, s.recipient, tId
                        ]
                    });
                    totalSeeded++;
                }
            }
        }
    }

    // Audit log
    const adminEmail = await getAdminIdentity(request, env.JWT_SECRET);
    const meta = getRequestMeta(request);
    await logAudit(env, {
        admin_email: adminEmail || 'unknown',
        action: 'seed',
        entity_type: 'finance',
        entity_label: 'Finance tables initialized & categories seeded',
        changes_summary: `Seeded ${totalSeeded} historical transactions (including linked split distributions), 2 savings goals and budgets for the last 6 months.`,
        ...meta,
    });

    return jsonResponse({ success: true, message: `Finance tables initialized and seeded with ${totalSeeded} transactions!` }, request);
}

// ─── Action: Export CSV ───
async function handleExport(request: Request, env: Env): Promise<Response> {
    const db = getDb(env);
    const url = new URL(request.url);
    const type = url.searchParams.get('type') || '';
    const dateFrom = url.searchParams.get('from') || '';
    const dateTo = url.searchParams.get('to') || '';

    let whereClause = '1=1';
    const args: any[] = [];
    if (type) { whereClause += ` AND type = ?`; args.push(type); }
    if (dateFrom) { whereClause += ` AND date >= ?`; args.push(dateFrom); }
    if (dateTo) { whereClause += ` AND date <= ?`; args.push(dateTo); }

    const result = await db.execute({
        sql: `SELECT * FROM finance_transactions WHERE ${whereClause} ORDER BY date DESC`,
        args,
    });

    const headers = ['Date', 'Type', 'Category', 'Description', 'Amount', 'Currency', 'Client', 'Payment Method', 'Notes'];
    const csvLines = [headers.join(',')];
    for (const r of result.rows) {
        csvLines.push([
            r.date, r.type, `"${(r.category as string || '').replace(/"/g, '""')}"`,
            `"${(r.description as string || '').replace(/"/g, '""')}"`,
            r.amount, r.currency,
            `"${(r.client_name as string || '').replace(/"/g, '""')}"`,
            r.payment_method,
            `"${(r.notes as string || '').replace(/"/g, '""')}"`,
        ].join(','));
    }

    return new Response(csvLines.join('\n'), {
        status: 200,
        headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="orbit_finance_${new Date().toISOString().split('T')[0]}.csv"`,
        },
    });
}

// ─── Main Router ───
export const onRequest: PagesFunction<Env> = async (context) => {
    const { request, env } = context;

    if (request.method === 'OPTIONS') return handleOptions(request);

    const url = new URL(request.url);
    const action = url.searchParams.get('action') || '';

    // Seed action creates tables too
    if (action === 'seed') {
        if (!(await isAuthorized(request, env.JWT_SECRET))) {
            return jsonResponse({ error: 'Unauthorized' }, request, 401);
        }
        return handleSeed(request, env);
    }

    // All other actions require auth + tables
    if (!(await isAuthorized(request, env.JWT_SECRET))) {
        return jsonResponse({ error: 'Unauthorized' }, request, 401);
    }

    // Ensure tables exist
    await ensureTables(env);

    try {
        switch (action) {
            case 'dashboard': return await handleDashboard(request, env);
            case 'transactions': return await handleTransactions(request, env);
            case 'categories': return await handleCategories(request, env);
            case 'savings': return await handleSavings(request, env);
            case 'budgets': return await handleBudgets(request, env);
            case 'export': return await handleExport(request, env);
            default: return jsonResponse({ error: 'Unknown action. Use ?action=dashboard|transactions|categories|savings|budgets|export|seed' }, request, 400);
        }
    } catch (error) {
        console.error('Finance API error:', error);
        return jsonResponse({ error: 'Failed to process finance request' }, request, 500);
    }
};
