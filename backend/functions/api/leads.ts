import { getDb } from '../_lib/db';
import { handleOptions, jsonResponse } from '../_lib/cors';
import { isAuthorized } from '../_lib/auth';
import type { Env } from '../_lib/types';

// ─── SendPulse REST API (replaces Node.js SDK) ───
async function sendWelcomeEmail(env: Env, email: string, name: string) {
    if (!env.SENDPULSE_API_USER_ID || !env.SENDPULSE_API_SECRET) return;

    try {
        // 1. Get access token
        const tokenResp = await fetch('https://api.sendpulse.com/oauth/access_token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                grant_type: 'client_credentials',
                client_id: env.SENDPULSE_API_USER_ID,
                client_secret: env.SENDPULSE_API_SECRET,
            }),
        });
        if (!tokenResp.ok) return;
        const tokenData = await tokenResp.json() as { access_token: string };

        // 2. Send email
        await fetch('https://api.sendpulse.com/smtp/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${tokenData.access_token}`,
            },
            body: JSON.stringify({
                email: {
                    html: `
            <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1a1a2e;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #6c5ce7; margin: 0; font-size: 28px; font-weight: 800;">ORBIT SaaS</h1>
              </div>
              <div style="background: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 4px 24px rgba(0,0,0,0.06); border: 1px solid #eef0f6;">
                <h2 style="margin-top: 0; font-size: 22px; color: #1a1a2e;">You're on the list! 🎉</h2>
                <p style="font-size: 16px; line-height: 1.6; color: #64648a;">
                  Thank you for joining the ORBIT SaaS waitlist. We are thrilled to have you onboard as we build the next generation of digital experiences.
                </p>
                <p style="font-size: 16px; line-height: 1.6; color: #64648a;">
                  We'll keep you updated with our latest launches, exclusive tools, and early-access features before anyone else.
                </p>
                <div style="margin-top: 30px; padding-top: 30px; border-top: 1px solid #eef0f6; text-align: center;">
                  <p style="font-size: 14px; color: #8888a0; margin: 0;">
                    Stay awesome,<br>
                    <strong>The ORBIT SaaS Team</strong>
                  </p>
                </div>
              </div>
            </div>
          `,
                    text: "Thank you for joining the ORBIT SaaS waitlist! We'll keep you updated.",
                    subject: "Welcome to the ORBIT SaaS Waitlist! 🚀",
                    from: { name: "ORBIT SaaS", email: "contact@orbitsaas.cloud" },
                    to: [{ name: name || "Subscriber", email }],
                },
            }),
        });
    } catch (err) {
        console.error('SendPulse email error:', err);
    }
}

// ─── Action: Submit Lead (public) ───
async function handleSubmit(request: Request, env: Env): Promise<Response> {
    if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, request, 405);

    const body = await request.json() as {
        email?: string; source?: string; name?: string;
        interest?: string; chat_summary?: string;
    };
    const { email, source, name, interest, chat_summary } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
        return jsonResponse({ error: 'Valid email is required' }, request, 400);
    }

    const db = getDb(env);

    // Ensure tables exist
    await db.execute(`
    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      source TEXT,
      name TEXT,
      interest TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
    try { await db.execute('ALTER TABLE leads ADD COLUMN interest TEXT'); } catch { /* exists */ }
    try { await db.execute('ALTER TABLE leads ADD COLUMN chat_summary TEXT'); } catch { /* exists */ }

    // Dedup check
    const existing = await db.execute({ sql: 'SELECT id FROM leads WHERE email = ?', args: [email] });

    if (existing.rows.length > 0) {
        if (chat_summary || interest) {
            // Append new chat_summary to existing (with timestamp separator) instead of overwriting
            await db.execute({
                sql: `UPDATE leads SET 
                  chat_summary = CASE 
                    WHEN chat_summary IS NOT NULL AND ? IS NOT NULL 
                    THEN chat_summary || char(10) || '---[' || datetime('now') || ']---' || char(10) || ? 
                    ELSE COALESCE(?, chat_summary) 
                  END,
                  interest = COALESCE(?, interest) 
                WHERE email = ?`,
                args: [chat_summary || null, chat_summary || null, chat_summary || null, interest || null, email],
            });
        }
        return jsonResponse({ success: true, message: 'Lead already captured, updated via chat' }, request);
    }

    await db.execute({
        sql: `INSERT INTO leads (email, source, name, interest, chat_summary, created_at) VALUES (?, ?, ?, ?, ?, datetime('now'))`,
        args: [email, source || 'website', name || null, interest || null, chat_summary || null],
    });

    // Send welcome email asynchronously (non-blocking)
    sendWelcomeEmail(env, email, name || '');

    return jsonResponse({ success: true, message: 'Lead captured successfully' }, request);
}

// ─── Action: List Leads (admin) ───
async function handleList(request: Request, env: Env): Promise<Response> {
    if (!(await isAuthorized(request, env.JWT_SECRET))) {
        return jsonResponse({ error: 'Unauthorized' }, request, 401);
    }

    const db = getDb(env);

    if (request.method === 'GET') {
        const result = await db.execute('SELECT * FROM leads ORDER BY created_at DESC');
        return jsonResponse({ success: true, leads: result.rows }, request);
    }

    if (request.method === 'DELETE') {
        const url = new URL(request.url);
        const id = url.searchParams.get('id');
        if (!id) return jsonResponse({ error: 'Lead ID required' }, request, 400);
        await db.execute({ sql: 'DELETE FROM leads WHERE id = ?', args: [id] });
        return jsonResponse({ success: true, message: 'Lead deleted' }, request);
    }

    return jsonResponse({ error: 'Method not allowed' }, request, 405);
}

// ─── Action: Visitors (POST=public, GET=admin) ───
async function handleVisitors(request: Request, env: Env): Promise<Response> {
    const db = getDb(env);

    await db.execute(`
    CREATE TABLE IF NOT EXISTS visitors (
      session_id TEXT PRIMARY KEY,
      visited_at TEXT DEFAULT (datetime('now'))
    )
  `);

    if (request.method === 'POST') {
        const body = await request.json() as { session_id?: string };
        const { session_id } = body;
        if (!session_id || typeof session_id !== 'string') {
            return jsonResponse({ error: 'Valid Session ID required' }, request, 400);
        }
        await db.execute({
            sql: 'INSERT OR IGNORE INTO visitors (session_id) VALUES (?)',
            args: [session_id],
        });
        return jsonResponse({ success: true }, request);
    }

    if (request.method === 'GET') {
        if (!(await isAuthorized(request, env.JWT_SECRET))) {
            return jsonResponse({ error: 'Unauthorized' }, request, 401);
        }
        const result = await db.execute('SELECT COUNT(*) as count FROM visitors');
        const count = result.rows[0]?.count || 0;
        return jsonResponse({ count: Number(count) }, request);
    }

    return jsonResponse({ error: 'Method not allowed' }, request, 405);
}

// ─── Main Router ───
export const onRequest: PagesFunction<Env> = async (context) => {
    const { request, env } = context;

    if (request.method === 'OPTIONS') return handleOptions(request);

    const url = new URL(request.url);
    const action = url.searchParams.get('action') || '';

    try {
        switch (action) {
            case 'submit': return await handleSubmit(request, env);
            case 'list': return await handleList(request, env);
            case 'visitors': return await handleVisitors(request, env);
            default: return jsonResponse({ error: 'Unknown action. Use ?action=submit|list|visitors' }, request, 400);
        }
    } catch (error) {
        console.error('Leads API error:', error);
        return jsonResponse({ error: 'Internal server error' }, request, 500);
    }
};
