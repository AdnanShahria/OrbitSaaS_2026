import { getDb } from '../_lib/db';
import { handleOptions, jsonResponse } from '../_lib/cors';
import { isAuthorized, getAdminIdentity } from '../_lib/auth';
import { logAudit, getRequestMeta } from '../_lib/audit';
import type { Env } from '../_lib/types';
import { sendMail } from '../_lib/mail';

// ─── Ensure Invoices table exists & migrations ───
async function ensureInvoiceTable(env: Env) {
    const db = getDb(env);

    await db.execute(`
        CREATE TABLE IF NOT EXISTS invoices (
            id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
            invoice_number TEXT UNIQUE NOT NULL,
            client_name TEXT NOT NULL,
            client_email TEXT NOT NULL,
            client_phone TEXT,
            client_address TEXT,
            service_type TEXT NOT NULL DEFAULT 'Web Development',
            project_name TEXT,
            issue_date TEXT NOT NULL,
            due_date TEXT NOT NULL,
            items TEXT NOT NULL,
            subtotal REAL NOT NULL DEFAULT 0,
            discount REAL DEFAULT 0,
            tax REAL DEFAULT 0,
            total_amount REAL NOT NULL DEFAULT 0,
            paid_amount REAL DEFAULT 0,
            due_amount REAL NOT NULL DEFAULT 0,
            currency TEXT DEFAULT 'BDT',
            status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'sent', 'paid', 'partially_paid', 'overdue', 'cancelled')),
            email_subject TEXT,
            email_message TEXT,
            payment_instructions TEXT,
            notes TEXT,
            sent_at TEXT,
            sent_by TEXT,
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now')),
            created_by TEXT,
            updated_by TEXT
        )
    `);

    // Column migrations for existing tables created with older schemas
    const migrations = [
        `ALTER TABLE invoices ADD COLUMN project_name TEXT`,
        `ALTER TABLE invoices ADD COLUMN payment_instructions TEXT`,
        `ALTER TABLE invoices ADD COLUMN notes TEXT`,
        `ALTER TABLE invoices ADD COLUMN paid_amount REAL DEFAULT 0`,
        `ALTER TABLE invoices ADD COLUMN currency TEXT DEFAULT 'BDT'`,
        `ALTER TABLE invoices ADD COLUMN email_subject TEXT`,
        `ALTER TABLE invoices ADD COLUMN email_message TEXT`,
        `ALTER TABLE invoices ADD COLUMN sent_at TEXT`,
        `ALTER TABLE invoices ADD COLUMN sent_by TEXT`,
        `ALTER TABLE invoices ADD COLUMN created_by TEXT`,
        `ALTER TABLE invoices ADD COLUMN updated_by TEXT`,
    ];

    for (const sql of migrations) {
        try {
            await db.execute(sql);
        } catch {
            // Column already exists or table is fresh, safe to ignore
        }
    }

    // Create index for fast searching and sorting
    try {
        await db.execute(`CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at DESC)`);
        await db.execute(`CREATE INDEX IF NOT EXISTS idx_invoices_client_email ON invoices(client_email)`);
        await db.execute(`CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status)`);
        await db.execute(`CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number)`);
    } catch { /* skip */ }
}

// ─── Generate Next Sequential Invoice Number (INV-YYYY-MM-XXXX) ───
async function generateNextInvoiceNumber(env: Env): Promise<string> {
    const db = getDb(env);
    await ensureInvoiceTable(env);

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const prefix = `INV-${year}-${month}-`;

    const res = await db.execute({
        sql: `SELECT invoice_number FROM invoices WHERE invoice_number LIKE ? ORDER BY invoice_number DESC LIMIT 1`,
        args: [`${prefix}%`],
    });

    if (res.rows.length === 0) {
        return `${prefix}0001`;
    }

    const lastNumStr = (res.rows[0].invoice_number as string).replace(prefix, '');
    const lastNum = parseInt(lastNumStr, 10);
    const nextNum = isNaN(lastNum) ? 1 : lastNum + 1;
    return `${prefix}${String(nextNum).padStart(4, '0')}`;
}

// ─── Currency Formatter for Email ───
function formatCurrencySymbol(amount: number, currency: string = 'BDT'): string {
    const formatted = amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    switch (currency.toUpperCase()) {
        case 'USD': return `$${formatted}`;
        case 'EUR': return `€${formatted}`;
        case 'GBP': return `£${formatted}`;
        case 'BDT':
        default: return `৳${formatted} BDT`;
    }
}

// ─── Generate Clean HTML Email Template for Invoice ───
function buildInvoiceEmailHtml(invoice: any, customMessage?: string): string {
    const items = typeof invoice.items === 'string' ? JSON.parse(invoice.items) : (invoice.items || []);
    const currency = invoice.currency || 'BDT';
    const clientName = invoice.client_name || 'Valued Customer';
    const invoiceNum = invoice.invoice_number || 'INV-0000';
    const issueDate = invoice.issue_date || new Date().toISOString().split('T')[0];
    const dueDate = invoice.due_date || invoice.issue_date;
    const serviceType = invoice.service_type || 'Digital Services';
    const totalFormatted = formatCurrencySymbol(Number(invoice.total_amount || 0), currency);
    const paidFormatted = formatCurrencySymbol(Number(invoice.paid_amount || 0), currency);
    const dueFormatted = formatCurrencySymbol(Number(invoice.due_amount || 0), currency);

    // Items table rows HTML
    const itemsHtml = items.map((item: any) => `
        <tr style="border-bottom: 1px solid #232338;">
            <td style="padding: 12px 16px; color: #f1f1f6; font-size: 14px; text-align: left;">
                <div style="font-weight: 600;">${item.description || 'Service Item'}</div>
            </td>
            <td style="padding: 12px 16px; color: #a0a0b8; font-size: 14px; text-align: center;">${item.quantity || 1}</td>
            <td style="padding: 12px 16px; color: #a0a0b8; font-size: 14px; text-align: right;">${formatCurrencySymbol(Number(item.unit_price || 0), currency)}</td>
            <td style="padding: 12px 16px; color: #f1f1f6; font-size: 14px; font-weight: 600; text-align: right;">${formatCurrencySymbol(Number(item.amount || (item.quantity * item.unit_price) || 0), currency)}</td>
        </tr>
    `).join('');

    const personalMessageBlock = customMessage ? `
        <div style="background: rgba(108, 92, 231, 0.08); border-left: 4px solid #6c5ce7; border-radius: 8px; padding: 18px 20px; margin-bottom: 28px;">
            <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #a29bfe; margin-bottom: 6px;">Message from Orbit SaaS</div>
            <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #e2e2ec; white-space: pre-wrap;">${customMessage}</p>
        </div>
    ` : '';

    const paymentInstructionsBlock = invoice.payment_instructions ? `
        <div style="background: #151522; border: 1px solid #26263a; border-radius: 10px; padding: 18px 20px; margin-top: 24px;">
            <h4 style="margin: 0 0 10px 0; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #e2e2ec;">Payment Instructions</h4>
            <div style="font-size: 13px; line-height: 1.6; color: #a0a0b8; white-space: pre-wrap;">${invoice.payment_instructions}</div>
        </div>
    ` : '';

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice ${invoiceNum} - Orbit SaaS</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0b12; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e2ec;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0b0b12; padding: 40px 15px;">
        <tr>
            <td align="center">
                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 650px; background-color: #12121c; border: 1px solid #232338; border-radius: 16px; overflow: hidden; box-shadow: 0 12px 40px rgba(0,0,0,0.5);">
                    
                    <!-- Header -->
                    <tr>
                        <td style="padding: 36px 40px; background: linear-gradient(135deg, #181828 0%, #12121c 100%); border-bottom: 1px solid #232338;">
                            <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                <tr>
                                    <td valign="middle">
                                        <div style="display: inline-block;">
                                            <span style="font-size: 24px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff;">ORBIT <span style="color: #6c5ce7;">SaaS</span></span>
                                            <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 2px; color: #8888a0; margin-top: 2px;">Engineering Digital Excellence</div>
                                        </div>
                                    </td>
                                    <td align="right" valign="middle">
                                        <span style="display: inline-block; background: rgba(108, 92, 231, 0.15); border: 1px solid rgba(108, 92, 231, 0.4); color: #a29bfe; font-size: 13px; font-weight: 700; padding: 6px 14px; border-radius: 20px; text-transform: uppercase; letter-spacing: 1px;">
                                            INVOICE
                                        </span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Body Content -->
                    <tr>
                        <td style="padding: 40px;">
                            
                            <!-- Greeting -->
                            <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 700; color: #ffffff;">
                                Hello, ${clientName} 👋
                            </h2>
                            <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #a0a0b8;">
                                Thank you for partnering with <strong>ORBIT SaaS</strong>. Here is the official invoice for your <strong>${serviceType}</strong> project.
                            </p>

                            ${personalMessageBlock}

                            <!-- Invoice Details Box -->
                            <div style="background: #171724; border: 1px solid #26263c; border-radius: 12px; padding: 24px; margin-bottom: 28px;">
                                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td width="50%" valign="top" style="padding-right: 15px;">
                                            <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #8888a0; margin-bottom: 4px;">Invoice Number</div>
                                            <div style="font-size: 16px; font-weight: 700; color: #ffffff; font-family: monospace;">${invoiceNum}</div>
                                            
                                            <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #8888a0; margin-top: 16px; margin-bottom: 4px;">Service Type</div>
                                            <div style="font-size: 14px; font-weight: 600; color: #a29bfe;">${serviceType}</div>
                                        </td>
                                        <td width="50%" valign="top" style="padding-left: 15px; border-left: 1px solid #232338;">
                                            <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #8888a0; margin-bottom: 4px;">Issue Date</div>
                                            <div style="font-size: 14px; color: #e2e2ec;">${issueDate}</div>
                                            
                                            <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #8888a0; margin-top: 16px; margin-bottom: 4px;">Payment Due Date</div>
                                            <div style="font-size: 14px; font-weight: 700; color: #f43f5e;">${dueDate}</div>
                                        </td>
                                    </tr>
                                </table>
                            </div>

                            <!-- Line Items Table -->
                            <div style="margin-bottom: 28px; border: 1px solid #232338; border-radius: 12px; overflow: hidden;">
                                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
                                    <thead>
                                        <tr style="background: #181828; border-bottom: 2px solid #2c2c44;">
                                            <th style="padding: 12px 16px; text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #8888a0;">Description</th>
                                            <th style="padding: 12px 16px; text-align: center; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #8888a0;">Qty</th>
                                            <th style="padding: 12px 16px; text-align: right; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #8888a0;">Rate</th>
                                            <th style="padding: 12px 16px; text-align: right; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #8888a0;">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${itemsHtml}
                                    </tbody>
                                </table>
                            </div>

                            <!-- Totals Breakdown -->
                            <div style="display: flex; justify-content: flex-end; margin-bottom: 28px;">
                                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td width="40%"></td>
                                        <td width="60%">
                                            <table width="100%" border="0" cellspacing="0" cellpadding="6" style="font-size: 14px;">
                                                <tr>
                                                    <td style="color: #8888a0;">Subtotal:</td>
                                                    <td align="right" style="color: #e2e2ec; font-weight: 600;">${formatCurrencySymbol(Number(invoice.subtotal || 0), currency)}</td>
                                                </tr>
                                                ${Number(invoice.discount || 0) > 0 ? `
                                                <tr>
                                                    <td style="color: #10b981;">Discount:</td>
                                                    <td align="right" style="color: #10b981; font-weight: 600;">-${formatCurrencySymbol(Number(invoice.discount || 0), currency)}</td>
                                                </tr>` : ''}
                                                ${Number(invoice.tax || 0) > 0 ? `
                                                <tr>
                                                    <td style="color: #8888a0;">Tax / VAT:</td>
                                                    <td align="right" style="color: #e2e2ec; font-weight: 600;">+${formatCurrencySymbol(Number(invoice.tax || 0), currency)}</td>
                                                </tr>` : ''}
                                                <tr style="border-top: 1px solid #232338;">
                                                    <td style="font-weight: 700; color: #ffffff; padding-top: 10px;">Total Amount:</td>
                                                    <td align="right" style="font-weight: 800; font-size: 16px; color: #ffffff; padding-top: 10px;">${totalFormatted}</td>
                                                </tr>
                                                ${Number(invoice.paid_amount || 0) > 0 ? `
                                                <tr>
                                                    <td style="color: #10b981;">Paid / Advance:</td>
                                                    <td align="right" style="color: #10b981; font-weight: 600;">${paidFormatted}</td>
                                                </tr>` : ''}
                                                <tr style="border-top: 2px solid #6c5ce7;">
                                                    <td style="font-weight: 800; font-size: 16px; color: #a29bfe; padding-top: 12px;">Amount Due:</td>
                                                    <td align="right" style="font-weight: 900; font-size: 20px; color: ${Number(invoice.due_amount || 0) > 0 ? '#f43f5e' : '#10b981'}; padding-top: 12px;">${dueFormatted}</td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                </table>
                            </div>

                            ${paymentInstructionsBlock}

                            ${invoice.notes ? `
                            <div style="margin-top: 24px; padding: 16px; border-radius: 8px; background: rgba(255,255,255,0.03); border: 1px solid #232338;">
                                <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #8888a0; margin-bottom: 4px;">Terms & Notes</div>
                                <div style="font-size: 13px; color: #a0a0b8; line-height: 1.5;">${invoice.notes}</div>
                            </div>` : ''}

                            <!-- Footer Notice -->
                            <div style="margin-top: 36px; padding-top: 24px; border-top: 1px solid #232338; text-align: center;">
                                <p style="margin: 0; font-size: 13px; color: #8888a0; line-height: 1.6;">
                                    The full PDF invoice is attached to this email.<br>
                                    Have questions? Reply directly to this email or contact us at <a href="mailto:contact@orbitsaas.cloud" style="color: #6c5ce7; text-decoration: none;">contact@orbitsaas.cloud</a>.
                                </p>
                            </div>

                        </td>
                    </tr>

                    <!-- Branding Footer -->
                    <tr>
                        <td style="background: #0d0d14; padding: 24px 40px; text-align: center; border-top: 1px solid #1c1c2b;">
                            <div style="font-size: 12px; color: #60607a;">
                                © ${new Date().getFullYear()} ORBIT SaaS. All rights reserved.
                            </div>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `;
}

// ─── Action: List Invoices (with search, status filters, metrics) ───
async function handleList(request: Request, env: Env): Promise<Response> {
    const db = getDb(env);
    await ensureInvoiceTable(env);

    const url = new URL(request.url);
    const search = url.searchParams.get('search') || '';
    const status = url.searchParams.get('status') || '';
    const serviceType = url.searchParams.get('service_type') || '';
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    const offset = (page - 1) * limit;

    let whereClause = '1=1';
    const args: any[] = [];

    if (status && status !== 'all') {
        whereClause += ` AND status = ?`;
        args.push(status);
    }

    if (serviceType && serviceType !== 'all') {
        whereClause += ` AND service_type = ?`;
        args.push(serviceType);
    }

    if (search) {
        whereClause += ` AND (invoice_number LIKE ? OR client_name LIKE ? OR client_email LIKE ? OR client_phone LIKE ? OR project_name LIKE ?)`;
        const q = `%${search}%`;
        args.push(q, q, q, q, q);
    }

    // Fetch count
    const countRes = await db.execute({
        sql: `SELECT COUNT(*) as count FROM invoices WHERE ${whereClause}`,
        args,
    });
    const total = Number(countRes.rows[0]?.count || 0);

    // Fetch paginated invoices
    const listRes = await db.execute({
        sql: `SELECT * FROM invoices WHERE ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
        args: [...args, limit, offset],
    });

    // Summary statistics for dashboard widgets
    const statsRes = await db.execute(`
        SELECT 
            COUNT(*) as total_invoices,
            COALESCE(SUM(total_amount), 0) as total_invoiced,
            COALESCE(SUM(paid_amount), 0) as total_collected,
            COALESCE(SUM(due_amount), 0) as total_due,
            COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_count,
            COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent_count,
            COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_count,
            COUNT(CASE WHEN status = 'overdue' OR (due_date < date('now') AND status NOT IN ('paid', 'cancelled')) THEN 1 END) as overdue_count
        FROM invoices
    `);

    const stats = statsRes.rows[0] || {};

    return jsonResponse({
        success: true,
        invoices: listRes.rows,
        total,
        page,
        limit,
        stats: {
            total_invoices: Number(stats.total_invoices || 0),
            total_invoiced: Number(stats.total_invoiced || 0),
            total_collected: Number(stats.total_collected || 0),
            total_due: Number(stats.total_due || 0),
            draft_count: Number(stats.draft_count || 0),
            sent_count: Number(stats.sent_count || 0),
            paid_count: Number(stats.paid_count || 0),
            overdue_count: Number(stats.overdue_count || 0),
        },
    }, request);
}

// ─── Action: Get Single Invoice ───
async function handleGet(request: Request, env: Env): Promise<Response> {
    const db = getDb(env);
    await ensureInvoiceTable(env);

    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) return jsonResponse({ error: 'Invoice ID is required' }, request, 400);

    const res = await db.execute({
        sql: `SELECT * FROM invoices WHERE id = ?`,
        args: [id],
    });

    if (res.rows.length === 0) {
        return jsonResponse({ error: 'Invoice not found' }, request, 404);
    }

    return jsonResponse({ success: true, invoice: res.rows[0] }, request);
}

// ─── Action: Create Invoice ───
async function handleCreate(request: Request, env: Env): Promise<Response> {
    if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, request, 405);

    const body = await request.json() as any;
    const {
        client_name,
        client_email,
        client_phone,
        client_address,
        service_type,
        project_name,
        issue_date,
        due_date,
        items,
        subtotal,
        discount,
        tax,
        total_amount,
        paid_amount,
        due_amount,
        currency,
        status,
        payment_instructions,
        notes,
    } = body;

    if (!client_name || !client_email) {
        return jsonResponse({ error: 'Client Name and Email are required' }, request, 400);
    }

    const db = getDb(env);
    await ensureInvoiceTable(env);

    let invoiceNumber = body.invoice_number;
    if (!invoiceNumber) {
        invoiceNumber = await generateNextInvoiceNumber(env);
    }

    const adminEmail = (await getAdminIdentity(request, env.JWT_SECRET)) || 'admin';
    const itemsJson = typeof items === 'string' ? items : JSON.stringify(items || []);

    const res = await db.execute({
        sql: `
            INSERT INTO invoices (
                invoice_number, client_name, client_email, client_phone, client_address,
                service_type, project_name, issue_date, due_date, items,
                subtotal, discount, tax, total_amount, paid_amount, due_amount,
                currency, status, payment_instructions, notes, created_by, updated_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            RETURNING *
        `,
        args: [
            invoiceNumber,
            client_name,
            client_email,
            client_phone || null,
            client_address || null,
            service_type || 'Web Development',
            project_name || null,
            issue_date || new Date().toISOString().split('T')[0],
            due_date || issue_date || new Date().toISOString().split('T')[0],
            itemsJson,
            Number(subtotal || 0),
            Number(discount || 0),
            Number(tax || 0),
            Number(total_amount || 0),
            Number(paid_amount || 0),
            Number(due_amount || 0),
            currency || 'BDT',
            status || 'draft',
            payment_instructions || null,
            notes || null,
            adminEmail,
            adminEmail,
        ],
    });

    const createdInvoice = res.rows[0];

    // Audit log
    const meta = getRequestMeta(request);
    await logAudit(env, {
        admin_email: adminEmail,
        action: 'create',
        entity_type: 'invoice',
        entity_id: createdInvoice.id as string,
        entity_label: `Created invoice ${invoiceNumber} for ${client_name}`,
        ...meta,
    });

    return jsonResponse({ success: true, invoice: createdInvoice }, request);
}

// ─── Action: Update Invoice ───
async function handleUpdate(request: Request, env: Env): Promise<Response> {
    if (request.method !== 'PUT' && request.method !== 'POST') {
        return jsonResponse({ error: 'Method not allowed' }, request, 405);
    }

    const body = await request.json() as any;
    const { id } = body;

    if (!id) return jsonResponse({ error: 'Invoice ID is required' }, request, 400);

    const db = getDb(env);
    await ensureInvoiceTable(env);

    const adminEmail = (await getAdminIdentity(request, env.JWT_SECRET)) || 'admin';
    const itemsJson = typeof body.items === 'string' ? body.items : JSON.stringify(body.items || []);

    const res = await db.execute({
        sql: `
            UPDATE invoices SET
                invoice_number = COALESCE(?, invoice_number),
                client_name = COALESCE(?, client_name),
                client_email = COALESCE(?, client_email),
                client_phone = ?,
                client_address = ?,
                service_type = COALESCE(?, service_type),
                project_name = ?,
                issue_date = COALESCE(?, issue_date),
                due_date = COALESCE(?, due_date),
                items = COALESCE(?, items),
                subtotal = COALESCE(?, subtotal),
                discount = COALESCE(?, discount),
                tax = COALESCE(?, tax),
                total_amount = COALESCE(?, total_amount),
                paid_amount = COALESCE(?, paid_amount),
                due_amount = COALESCE(?, due_amount),
                currency = COALESCE(?, currency),
                status = COALESCE(?, status),
                payment_instructions = ?,
                notes = ?,
                updated_at = datetime('now'),
                updated_by = ?
            WHERE id = ?
            RETURNING *
        `,
        args: [
            body.invoice_number || null,
            body.client_name || null,
            body.client_email || null,
            body.client_phone ?? null,
            body.client_address ?? null,
            body.service_type || null,
            body.project_name ?? null,
            body.issue_date || null,
            body.due_date || null,
            itemsJson,
            body.subtotal !== undefined ? Number(body.subtotal) : null,
            body.discount !== undefined ? Number(body.discount) : null,
            body.tax !== undefined ? Number(body.tax) : null,
            body.total_amount !== undefined ? Number(body.total_amount) : null,
            body.paid_amount !== undefined ? Number(body.paid_amount) : null,
            body.due_amount !== undefined ? Number(body.due_amount) : null,
            body.currency || null,
            body.status || null,
            body.payment_instructions ?? null,
            body.notes ?? null,
            adminEmail,
            id,
        ],
    });

    if (res.rows.length === 0) {
        return jsonResponse({ error: 'Invoice not found or could not be updated' }, request, 404);
    }

    const updatedInvoice = res.rows[0];

    // Audit log
    const meta = getRequestMeta(request);
    await logAudit(env, {
        admin_email: adminEmail,
        action: 'update',
        entity_type: 'invoice',
        entity_id: id,
        entity_label: `Updated invoice ${updatedInvoice.invoice_number}`,
        ...meta,
    });

    return jsonResponse({ success: true, invoice: updatedInvoice }, request);
}

// ─── Action: Delete Invoice ───
async function handleDelete(request: Request, env: Env): Promise<Response> {
    if (request.method !== 'DELETE') return jsonResponse({ error: 'Method not allowed' }, request, 405);

    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) return jsonResponse({ error: 'Invoice ID is required' }, request, 400);

    const db = getDb(env);
    await ensureInvoiceTable(env);

    const checkRes = await db.execute({ sql: `SELECT invoice_number FROM invoices WHERE id = ?`, args: [id] });
    const invoiceNumber = (checkRes.rows[0]?.invoice_number as string) || id;

    await db.execute({ sql: `DELETE FROM invoices WHERE id = ?`, args: [id] });

    const adminEmail = (await getAdminIdentity(request, env.JWT_SECRET)) || 'admin';
    const meta = getRequestMeta(request);
    await logAudit(env, {
        admin_email: adminEmail,
        action: 'delete',
        entity_type: 'invoice',
        entity_id: id,
        entity_label: `Deleted invoice ${invoiceNumber}`,
        ...meta,
    });

    return jsonResponse({ success: true, message: 'Invoice deleted successfully' }, request);
}

// ─── Action: Preview Email (Render HTML without sending) ───
async function handlePreviewEmail(request: Request, env: Env): Promise<Response> {
    if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, request, 405);

    const body = await request.json() as any;
    const { invoice, message, subject } = body;

    if (!invoice) return jsonResponse({ error: 'Invoice data is required' }, request, 400);

    const finalSubject = subject || `Invoice ${invoice.invoice_number || 'INV-0000'} for ${invoice.service_type || 'Digital Services'} - ORBIT SaaS`;
    const html = buildInvoiceEmailHtml(invoice, message);

    return jsonResponse({ success: true, subject: finalSubject, html }, request);
}

// ─── Action: Send Invoice Email to Customer ───
async function handleSendInvoice(request: Request, env: Env): Promise<Response> {
    if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, request, 405);

    const body = await request.json() as any;
    const { id, to_email, subject, message, pdf_base64 } = body;

    const db = getDb(env);
    await ensureInvoiceTable(env);

    let invoice: any = null;

    if (id) {
        const fetchRes = await db.execute({ sql: `SELECT * FROM invoices WHERE id = ?`, args: [id] });
        if (fetchRes.rows.length > 0) invoice = fetchRes.rows[0];
    }

    if (!invoice && body.invoice) {
        invoice = body.invoice;
    }

    if (!invoice) {
        return jsonResponse({ error: 'Invoice details not found' }, request, 400);
    }

    const targetEmail = to_email || invoice.client_email;
    if (!targetEmail || !targetEmail.includes('@')) {
        return jsonResponse({ error: 'A valid customer email is required' }, request, 400);
    }

    const invoiceNum = invoice.invoice_number || 'INV-0000';
    const emailSubject = subject || `Invoice ${invoiceNum} from ORBIT SaaS (${invoice.service_type || 'Services'})`;
    const emailHtml = buildInvoiceEmailHtml(invoice, message);
    const emailText = `Hello ${invoice.client_name},\n\nPlease find attached your invoice ${invoiceNum} for ${invoice.service_type || 'Services'}.\nTotal: ${invoice.total_amount} ${invoice.currency}\nDue: ${invoice.due_amount} ${invoice.currency}\n\n${message || ''}\n\nThank you,\nORBIT SaaS Team`;

    const attachments: any[] = [];
    if (pdf_base64 && typeof pdf_base64 === 'string') {
        // Strip data URI prefix cleanly (e.g. data:application/pdf;filename=xxx;base64,...)
        const commaIdx = pdf_base64.indexOf(',');
        const cleanBase64 = (commaIdx !== -1 ? pdf_base64.substring(commaIdx + 1) : pdf_base64)
            .trim()
            .replace(/[\r\n\s]+/g, '');
        if (cleanBase64.length > 0) {
            const safeFileName = `${(invoiceNum || 'invoice').replace(/[^a-zA-Z0-9._-]/g, '_')}.pdf`;
            attachments.push({
                filename: safeFileName,
                content: cleanBase64,
                contentType: 'application/pdf',
                encoding: 'base64',
            });
        }
    }

    console.log(`[Invoices] Sending invoice ${invoiceNum} to ${targetEmail} with ${attachments.length} attachment(s)...`);

    const mailSent = await sendMail(env, {
        to: targetEmail,
        subject: emailSubject,
        text: emailText,
        html: emailHtml,
        fromName: 'ORBIT SaaS Billing',
        attachments: attachments.length > 0 ? attachments : undefined,
    });

    if (!mailSent) {
        return jsonResponse({ error: 'Failed to send email via SMTP and fallback provider' }, request, 500);
    }

    const adminEmail = (await getAdminIdentity(request, env.JWT_SECRET)) || 'admin';

    // Update invoice record in DB if ID exists
    if (invoice.id) {
        await db.execute({
            sql: `
                UPDATE invoices SET
                    status = CASE WHEN status = 'draft' THEN 'sent' ELSE status END,
                    email_subject = ?,
                    email_message = ?,
                    sent_at = datetime('now'),
                    sent_by = ?,
                    updated_at = datetime('now'),
                    updated_by = ?
                WHERE id = ?
            `,
            args: [emailSubject, message || null, adminEmail, adminEmail, invoice.id],
        });
    }

    // Log to audit trail
    const meta = getRequestMeta(request);
    await logAudit(env, {
        admin_email: adminEmail,
        action: 'send_email',
        entity_type: 'invoice',
        entity_id: invoice.id || invoiceNum,
        entity_label: `Sent invoice ${invoiceNum} to ${targetEmail}`,
        ...meta,
    });

    return jsonResponse({
        success: true,
        message: `Invoice ${invoiceNum} successfully sent to ${targetEmail}`,
        sent_at: new Date().toISOString(),
    }, request);
}

// ─── Main Router ───
export const onRequest: PagesFunction<Env> = async (context) => {
    const { request, env } = context;

    if (request.method === 'OPTIONS') return handleOptions(request);

    // Ensure all invoice operations are authenticated
    if (!(await isAuthorized(request, env.JWT_SECRET))) {
        return jsonResponse({ error: 'Unauthorized' }, request, 401);
    }

    const url = new URL(request.url);
    const action = url.searchParams.get('action') || 'list';

    try {
        switch (action) {
            case 'list': return await handleList(request, env);
            case 'get': return await handleGet(request, env);
            case 'next_number': {
                const nextNum = await generateNextInvoiceNumber(env);
                return jsonResponse({ success: true, next_number: nextNum }, request);
            }
            case 'create': return await handleCreate(request, env);
            case 'update': return await handleUpdate(request, env);
            case 'delete': return await handleDelete(request, env);
            case 'preview_email': return await handlePreviewEmail(request, env);
            case 'send': return await handleSendInvoice(request, env);
            default: return jsonResponse({ error: `Unknown action: ${action}` }, request, 400);
        }
    } catch (error: any) {
        console.error('Invoice API error:', error);
        return jsonResponse({ error: error.message || 'Internal server error processing invoice' }, request, 500);
    }
};
