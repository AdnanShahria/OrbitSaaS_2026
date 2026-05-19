import { getDb } from '../_lib/db';
import { handleOptions, jsonResponse } from '../_lib/cors';
import { isAuthorized } from '../_lib/auth';
import type { Env } from '../_lib/types';

// ─── Ensure finance tables exist ───
async function ensureTables(env: Env) {
    const db = getDb(env);

    await db.execute(`
        CREATE TABLE IF NOT EXISTS finance_transactions (
            id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
            type TEXT NOT NULL CHECK(type IN ('income','expense','savings_deposit','savings_withdrawal')),
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
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now'))
        )
    `);

    await db.execute(`
        CREATE TABLE IF NOT EXISTS finance_categories (
            id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)))),
            name TEXT NOT NULL,
            name_bn TEXT,
            type TEXT NOT NULL CHECK(type IN ('income','expense','both')),
            icon TEXT,
            color TEXT,
            sort_order INTEGER DEFAULT 0
        )
    `);

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

    // Monthly breakdown (last N months)
    const monthlyRes = await db.execute({
        sql: `
            SELECT 
                strftime('%Y-%m', date) as month,
                SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
                SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
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
        net: Number(r.income ?? 0) - Number(r.expense ?? 0),
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
            netBalance: totalIncome - totalExpense,
            totalSavings,
            monthIncome,
            monthExpense,
            monthNet: monthIncome - monthExpense,
            lastMonthIncome,
            lastMonthExpense,
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
        if (search) { whereClause += ` AND (description LIKE ? OR client_name LIKE ? OR notes LIKE ?)`; args.push(`%${search}%`, `%${search}%`, `%${search}%`); }

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

        await db.execute({
            sql: `INSERT INTO finance_transactions (id, type, amount, currency, category, subcategory, description, date, project_id, client_name, payment_method, receipt_url, tags, is_recurring, recurring_interval, notes)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
                id, body.type, body.amount, body.currency || 'BDT', body.category,
                body.subcategory || null, body.description, body.date,
                body.project_id || null, body.client_name || null,
                body.payment_method || 'cash', body.receipt_url || null,
                body.tags ? JSON.stringify(body.tags) : null,
                body.is_recurring ? 1 : 0, body.recurring_interval || null,
                body.notes || null,
            ],
        });

        // If savings deposit/withdrawal, update savings goal if specified
        if (body.savings_goal_id && (body.type === 'savings_deposit' || body.type === 'savings_withdrawal')) {
            const delta = body.type === 'savings_deposit' ? body.amount : -body.amount;
            await db.execute({
                sql: `UPDATE finance_savings_goals SET current_amount = MAX(0, current_amount + ?) WHERE id = ?`,
                args: [delta, body.savings_goal_id],
            });
        }

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
                    updated_at = datetime('now')
                  WHERE id = ?`,
            args: [
                body.type, body.amount, body.currency || 'BDT', body.category,
                body.subcategory || null, body.description, body.date,
                body.project_id || null, body.client_name || null,
                body.payment_method || 'cash', body.receipt_url || null,
                body.tags ? JSON.stringify(body.tags) : null,
                body.is_recurring ? 1 : 0, body.recurring_interval || null,
                body.notes || null, id,
            ],
        });

        return jsonResponse({ success: true }, request);
    }

    if (request.method === 'DELETE') {
        const id = url.searchParams.get('id');
        if (!id) return jsonResponse({ error: 'ID required' }, request, 400);

        await db.execute({ sql: 'DELETE FROM finance_transactions WHERE id = ?', args: [id] });
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

// ─── Action: Seed default categories ───
async function handleSeed(request: Request, env: Env): Promise<Response> {
    if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, request, 405);

    const db = getDb(env);
    await ensureTables(env);

    for (let i = 0; i < DEFAULT_CATEGORIES.length; i++) {
        const cat = DEFAULT_CATEGORIES[i];
        await db.execute({
            sql: `INSERT OR IGNORE INTO finance_categories (id, name, name_bn, type, icon, color, sort_order)
                  VALUES (?, ?, ?, ?, ?, ?, ?)`,
            args: [`fc_${i}`, cat.name, cat.name_bn, cat.type, cat.icon, cat.color, i],
        });
    }

    return jsonResponse({ success: true, message: 'Finance tables created and categories seeded' }, request);
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
