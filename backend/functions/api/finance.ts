import { getDb } from '../_lib/db';
import { handleOptions, jsonResponse } from '../_lib/cors';
import { isAuthorized, getAdminIdentity, verifyToken } from '../_lib/auth';
import { ensureAuditTable, logAudit, getRequestMeta } from '../_lib/audit';
import type { Env } from '../_lib/types';

// ─── Author Tracking Helper ───
async function getFinanceIdentity(req: Request, secret: string): Promise<string> {
    const authHeader = req.headers.get('Finance-Token');
    if (!authHeader) return 'unknown';
    const payload = await verifyToken(authHeader, secret);
    if (payload && payload.purpose === 'finance_auth' && payload.verified_email) {
        return payload.verified_email as string;
    }
    return 'unknown';
}

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
            updated_at TEXT DEFAULT (datetime('now')),
            created_by TEXT,
            updated_by TEXT
        )
    `);

    // Migrate old tables if they don't support distribution check constraint or columns
    try {
        const tableInfo = await db.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='finance_transactions'");
        const sql = tableInfo.rows[0]?.sql as string || '';
        if (sql && (!sql.includes('distribution') || !sql.includes('recipient') || !sql.includes('parent_id') || !sql.includes('created_by'))) {
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
                    updated_at TEXT DEFAULT (datetime('now')),
                    created_by TEXT,
                    updated_by TEXT
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

            const createdBySel = tempCols.includes('created_by') ? 'created_by' : 'NULL';
            const updatedBySel = tempCols.includes('updated_by') ? 'updated_by' : 'NULL';

            await db.execute(`
                INSERT INTO finance_transactions (
                    id, type, amount, currency, category, subcategory, description, date,
                    project_id, client_name, payment_method, receipt_url, tags, is_recurring,
                    recurring_interval, notes, recipient, parent_id, created_at, updated_at, created_by, updated_by
                )
                SELECT 
                    id, type, amount, currency, category, subcategory, description, date,
                    project_id, client_name, payment_method, receipt_url, tags, is_recurring,
                    recurring_interval, notes, ${recipientSel}, ${parentIdSel}, created_at, updated_at, ${createdBySel}, ${updatedBySel}
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
            type TEXT NOT NULL CHECK(type IN ('income','expense','distribution','both','receiver','client')),
            icon TEXT,
            color TEXT,
            sort_order INTEGER DEFAULT 0
        )
    `);

    // Migrate finance_categories type constraint if needed
    try {
        const catTableInfo = await db.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='finance_categories'");
        const catSql = catTableInfo.rows[0]?.sql as string || '';
        if (catSql && (!catSql.includes('distribution') || !catSql.includes('receiver'))) {
            await db.execute(`ALTER TABLE finance_categories RENAME TO temp_finance_categories`);
            await db.execute(`
                CREATE TABLE finance_categories (
                    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)))),
                    name TEXT NOT NULL,
                    name_bn TEXT,
                    type TEXT NOT NULL CHECK(type IN ('income','expense','distribution','both','receiver','client')),
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
        const authorEmail = await getFinanceIdentity(request, env.JWT_SECRET);
        if (authorEmail === 'unknown') return jsonResponse({ error: 'Financial Authorization Token missing or expired.' }, request, 401);

        // 1. Insert parent transaction
        await db.execute({
            sql: `INSERT INTO finance_transactions (id, type, amount, currency, category, subcategory, description, date, project_id, client_name, payment_method, receipt_url, tags, is_recurring, recurring_interval, notes, recipient, parent_id, created_by, updated_by)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
                id, body.type, body.amount, body.currency || 'BDT', body.category,
                body.subcategory || null, body.description, body.date,
                body.project_id || null, body.client_name || null,
                body.payment_method || 'cash', body.receipt_url || null,
                body.tags ? JSON.stringify(body.tags) : null,
                body.is_recurring ? 1 : 0, body.recurring_interval || null,
                body.notes || null, body.recipient || null, body.parent_id || null, authorEmail, authorEmail
            ],
        });

        // 2. If it is an Income transaction and contains distribution splits, insert them automatically
        let distributionsCreated = 0;
        if (body.type === 'income' && body.distributions && Array.isArray(body.distributions)) {
            for (const dist of body.distributions) {
                if (dist.amount > 0) {
                    const distId = crypto.randomUUID().replace(/-/g, '').slice(0, 16);
                    await db.execute({
                        sql: `INSERT INTO finance_transactions (id, type, amount, currency, category, subcategory, description, date, recipient, parent_id, notes, payment_method, created_by, updated_by)
                              VALUES (?, 'distribution', ?, ?, 'Distribution', 'Pending', ?, ?, ?, ?, ?, 'bank_transfer', ?, ?)`,
                        args: [
                            distId, dist.amount, body.currency || 'BDT',
                            `Split: ${dist.recipient} Share from "${body.description}"`,
                            body.date, dist.recipient, id, 'Automatic split share', authorEmail, authorEmail
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
                sql: `INSERT INTO finance_transactions (id, type, amount, currency, category, subcategory, description, date, parent_id, notes, payment_method, recipient, created_by, updated_by)
                      VALUES (?, 'expense', ?, ?, 'Miscellaneous', 'Misc Income Deduction', ?, ?, ?, ?, ?, 'Company Funding', ?, ?)`,
                args: [
                    miscId, body.misc_amount, body.currency || 'BDT',
                    body.misc_description || 'Miscellaneous Expense (Bus/Tea)',
                    body.date, id, 'Deducted directly from Company Funding split', body.payment_method || 'cash', authorEmail, authorEmail
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
        const meta = getRequestMeta(request);
        await logAudit(env, {
            admin_email: authorEmail || 'unknown',
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
        const authorEmail = await getFinanceIdentity(request, env.JWT_SECRET);
        if (authorEmail === 'unknown') return jsonResponse({ error: 'Financial Authorization Token missing or expired.' }, request, 401);

        await db.execute({
            sql: `UPDATE finance_transactions SET
                    type = ?, amount = ?, currency = ?, category = ?, subcategory = ?,
                    description = ?, date = ?, project_id = ?, client_name = ?,
                    payment_method = ?, receipt_url = ?, tags = ?,
                    is_recurring = ?, recurring_interval = ?, notes = ?,
                    recipient = ?, parent_id = ?,
                    updated_at = datetime('now'),
                    updated_by = ?
                  WHERE id = ?`,
            args: [
                body.type, body.amount, body.currency || 'BDT', body.category,
                body.subcategory || null, body.description, body.date,
                body.project_id || null, body.client_name || null,
                body.payment_method || 'cash', body.receipt_url || null,
                body.tags ? JSON.stringify(body.tags) : null,
                body.is_recurring ? 1 : 0, body.recurring_interval || null,
                body.notes || null, body.recipient || null, body.parent_id || null, authorEmail, id,
            ],
        });

        // Audit log
        const meta = getRequestMeta(request);
        await logAudit(env, {
            admin_email: authorEmail || 'unknown',
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

        const authorEmail = await getFinanceIdentity(request, env.JWT_SECRET);
        if (authorEmail === 'unknown') return jsonResponse({ error: 'Financial Authorization Token missing or expired.' }, request, 401);

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
        const meta = getRequestMeta(request);
        await logAudit(env, {
            admin_email: authorEmail,
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
        const authorEmail = await getAdminIdentity(request, env.JWT_SECRET) || 'unknown';

        const body = await request.json() as any;
        const id = crypto.randomUUID().replace(/-/g, '').slice(0, 8);

        await db.execute({
            sql: `INSERT INTO finance_categories (id, name, name_bn, type, icon, color, sort_order)
                  VALUES (?, ?, ?, ?, ?, ?, ?)`,
            args: [id, body.name, body.name_bn || null, body.type, body.icon || '📦', body.color || '#78716C', body.sort_order || 0],
        });

        // Audit log
        const meta = getRequestMeta(request);
        await logAudit(env, {
            admin_email: authorEmail,
            action: 'create',
            entity_type: 'category',
            entity_id: id,
            entity_label: body.name,
            changes_summary: `Created finance category: ${body.name} (${body.type})`,
            ...meta,
        });

        return jsonResponse({ success: true, id }, request);
    }

    if (request.method === 'DELETE') {
        const authorEmail = await getAdminIdentity(request, env.JWT_SECRET) || 'unknown';

        const url = new URL(request.url);
        const id = url.searchParams.get('id');
        if (!id) return jsonResponse({ error: 'ID required' }, request, 400);

        await db.execute({ sql: 'DELETE FROM finance_categories WHERE id = ?', args: [id] });

        // Audit log
        const meta = getRequestMeta(request);
        await logAudit(env, {
            admin_email: authorEmail,
            action: 'delete',
            entity_type: 'category',
            entity_id: id,
            entity_label: `Deleted category ${id}`,
            changes_summary: `Deleted finance category ID: ${id}`,
            ...meta,
        });

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
        const authorEmail = await getAdminIdentity(request, env.JWT_SECRET) || 'unknown';
        const body = await request.json() as any;
        const id = crypto.randomUUID().replace(/-/g, '').slice(0, 8);

        await db.execute({
            sql: `INSERT INTO finance_savings_goals (id, name, target_amount, current_amount, currency, deadline, status)
                  VALUES (?, ?, ?, ?, ?, ?, ?)`,
            args: [id, body.name, body.target_amount, body.current_amount || 0, body.currency || 'BDT', body.deadline || null, body.status || 'active'],
        });

        // Audit log
        const meta = getRequestMeta(request);
        await logAudit(env, {
            admin_email: authorEmail,
            action: 'create',
            entity_type: 'savings_goal',
            entity_id: id,
            entity_label: body.name,
            changes_summary: `Created savings goal: ${body.name} with target ${body.target_amount} ${body.currency || 'BDT'}`,
            ...meta,
        });

        return jsonResponse({ success: true, id }, request);
    }

    if (request.method === 'PUT') {
        const authorEmail = await getAdminIdentity(request, env.JWT_SECRET) || 'unknown';
        const id = url.searchParams.get('id');
        if (!id) return jsonResponse({ error: 'ID required' }, request, 400);

        const body = await request.json() as any;
        await db.execute({
            sql: `UPDATE finance_savings_goals SET name = ?, target_amount = ?, current_amount = ?, currency = ?, deadline = ?, status = ? WHERE id = ?`,
            args: [body.name, body.target_amount, body.current_amount || 0, body.currency || 'BDT', body.deadline || null, body.status || 'active', id],
        });

        // Audit log
        const meta = getRequestMeta(request);
        await logAudit(env, {
            admin_email: authorEmail,
            action: 'update',
            entity_type: 'savings_goal',
            entity_id: id,
            entity_label: body.name,
            changes_summary: `Updated savings goal: ${body.name} (target: ${body.target_amount}, current: ${body.current_amount})`,
            ...meta,
        });

        return jsonResponse({ success: true }, request);
    }

    if (request.method === 'DELETE') {
        const authorEmail = await getAdminIdentity(request, env.JWT_SECRET) || 'unknown';
        const id = url.searchParams.get('id');
        if (!id) return jsonResponse({ error: 'ID required' }, request, 400);

        await db.execute({ sql: 'DELETE FROM finance_savings_goals WHERE id = ?', args: [id] });

        // Audit log
        const meta = getRequestMeta(request);
        await logAudit(env, {
            admin_email: authorEmail,
            action: 'delete',
            entity_type: 'savings_goal',
            entity_id: id,
            entity_label: `Deleted savings goal ${id}`,
            changes_summary: `Deleted savings goal ID: ${id}`,
            ...meta,
        });

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
        const authorEmail = await getAdminIdentity(request, env.JWT_SECRET) || 'unknown';
        const body = await request.json() as any;
        const id = crypto.randomUUID().replace(/-/g, '').slice(0, 8);

        await db.execute({
            sql: `INSERT INTO finance_budgets (id, category, month, budget_amount, currency)
                  VALUES (?, ?, ?, ?, ?)
                  ON CONFLICT(category, month) DO UPDATE SET budget_amount = ?, currency = ?`,
            args: [id, body.category, body.month, body.budget_amount, body.currency || 'BDT', body.budget_amount, body.currency || 'BDT'],
        });

        // Audit log
        const meta = getRequestMeta(request);
        await logAudit(env, {
            admin_email: authorEmail,
            action: 'update',
            entity_type: 'budget',
            entity_id: id,
            entity_label: `${body.category} - ${body.month}`,
            changes_summary: `Set budget for ${body.category} in ${body.month} to ${body.budget_amount} ${body.currency || 'BDT'}`,
            ...meta,
        });

        return jsonResponse({ success: true }, request);
    }

    return jsonResponse({ error: 'Method not allowed' }, request, 405);
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
            default: return jsonResponse({ error: 'Unknown action. Use ?action=dashboard|transactions|categories|savings|budgets|export' }, request, 400);
        }
    } catch (error) {
        console.error('Finance API error:', error);
        return jsonResponse({ error: 'Failed to process finance request' }, request, 500);
    }
};
