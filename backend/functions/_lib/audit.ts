import { getDb } from './db';
import type { Env } from './types';

/**
 * Audit log entry structure for tracking admin actions.
 */
export interface AuditEntry {
    admin_email: string;
    action: 'create' | 'update' | 'delete' | 'login' | 'cache_publish' | 'cache_delete' | 'export' | 'seed' | 'logout';
    entity_type: string; // 'content', 'transaction', 'category', 'savings_goal', 'budget', 'cache', 'auth', etc.
    entity_id?: string | null;
    entity_label?: string | null;
    changes_summary?: string | null; // Human-readable summary of what changed
    ip_address?: string | null;
    user_agent?: string | null;
}

/**
 * Ensure the admin_audit_log table exists.
 */
export async function ensureAuditTable(env: Env) {
    const db = getDb(env);
    await db.execute(`
        CREATE TABLE IF NOT EXISTS admin_audit_log (
            id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
            admin_email TEXT NOT NULL,
            action TEXT NOT NULL,
            entity_type TEXT NOT NULL,
            entity_id TEXT,
            entity_label TEXT,
            changes_summary TEXT,
            ip_address TEXT,
            user_agent TEXT,
            created_at TEXT DEFAULT (datetime('now'))
        )
    `);
}

/**
 * Insert an audit log entry. Silently fails to avoid breaking main operations.
 */
export async function logAudit(env: Env, entry: AuditEntry) {
    try {
        const db = getDb(env);
        const id = crypto.randomUUID().replace(/-/g, '').slice(0, 16);

        await db.execute({
            sql: `INSERT INTO admin_audit_log (id, admin_email, action, entity_type, entity_id, entity_label, changes_summary, ip_address, user_agent)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
                id,
                entry.admin_email,
                entry.action,
                entry.entity_type,
                entry.entity_id || null,
                entry.entity_label || null,
                entry.changes_summary || null,
                entry.ip_address || null,
                entry.user_agent || null,
            ],
        });
    } catch (err) {
        console.error('Audit log write failed (non-fatal):', err);
    }
}

/**
 * Extract client metadata from a request for audit logging.
 */
export function getRequestMeta(request: Request) {
    return {
        ip_address: request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
    };
}
