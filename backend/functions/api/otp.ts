import { getDb } from '../_lib/db';
import { handleOptions, jsonResponse } from '../_lib/cors';
import { isAuthorized } from '../_lib/auth';
import type { Env } from '../_lib/types';

// Generate a random 6-digit OTP
function generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

import nodemailer from 'nodemailer';

async function sendOtpEmail(env: Env, otp: string, targetEmail: string) {
    if (!env.GMAIL_USER || !env.GMAIL_APP_PASSWORD) {
        console.warn('Gmail credentials are missing, cannot send OTP email.');
        return;
    }

    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: env.GMAIL_USER,
                pass: env.GMAIL_APP_PASSWORD
            }
        });

        await transporter.sendMail({
            from: `"ORBIT SaaS Admin" <${env.GMAIL_USER}>`,
            to: targetEmail,
            subject: "Admin OTP - Image Compression Authorization",
            text: `Your ORBIT SaaS admin OTP for image compression is: ${otp}`,
            html: `
            <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1a1a2e;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #6c5ce7; margin: 0; font-size: 28px; font-weight: 800;">ORBIT SaaS Admin</h1>
              </div>
              <div style="background: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 4px 24px rgba(0,0,0,0.06); border: 1px solid #eef0f6;">
                <h2 style="margin-top: 0; font-size: 22px; color: #1a1a2e;">Image Compression Authorization</h2>
                <p style="font-size: 16px; line-height: 1.6; color: #64648a;">
                  You requested to bulk-compress images in the ORBIT SaaS admin panel. Please use the following One-Time Password to proceed. This code expires in 10 minutes.
                </p>
                <div style="margin-top: 30px; margin-bottom: 30px; text-align: center;">
                  <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #1a1a2e; background: #f3f4f6; padding: 10px 20px; border-radius: 8px;">${otp}</span>
                </div>
                <div style="margin-top: 30px; padding-top: 30px; border-top: 1px solid #eef0f6; text-align: center;">
                  <p style="font-size: 14px; color: #8888a0; margin: 0;">
                    If you did not request this, please secure your admin panel immediately.<br>
                    <strong>The ORBIT SaaS Team</strong>
                  </p>
                </div>
              </div>
            </div>
            `
        });
        
        console.log(`Connected with Gmail and sent to the ${targetEmail} address`);
    } catch (err) {
        console.error('Gmail OTP email error:', err);
    }
}

async function handleSend(request: Request, env: Env): Promise<Response> {
    if (!(await isAuthorized(request, env.JWT_SECRET))) {
        return jsonResponse({ error: 'Unauthorized' }, request, 401);
    }

    const db = getDb(env);

    // Create otps table if it doesn't exist
    await db.execute(`
    CREATE TABLE IF NOT EXISTS otps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      expires_at TEXT NOT NULL
    )
  `);

    // Clean up expired OTPs
    await db.execute(`DELETE FROM otps WHERE datetime('now') > expires_at`);

    const otp = generateOtp();
    // Set expiry to 10 minutes from now
    await db.execute({
        sql: `INSERT INTO otps (code, expires_at) VALUES (?, datetime('now', '+10 minutes'))`,
        args: [otp],
    });

    // Send email without blocking
    const targetEmail = env.ADMIN_EMAIL || env.GMAIL_USER;
    if (targetEmail) {
        await sendOtpEmail(env, otp, targetEmail);
    } else {
        console.warn("No target email configured to receive OTP");
    }

    return jsonResponse({ success: true, message: 'OTP sent successfully' }, request);
}

async function handleVerify(request: Request, env: Env): Promise<Response> {
    if (!(await isAuthorized(request, env.JWT_SECRET))) {
        return jsonResponse({ error: 'Unauthorized' }, request, 401);
    }

    if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, request, 405);

    const body = await request.json() as { code?: string };
    const { code } = body;

    if (!code || typeof code !== 'string') {
        return jsonResponse({ error: 'OTP code is required' }, request, 400);
    }

    const db = getDb(env);

    // Delete expired OTPs first
    await db.execute(`DELETE FROM otps WHERE datetime('now') > expires_at`);

    // Find valid OTP
    const result = await db.execute({
        sql: `SELECT id FROM otps WHERE code = ?`,
        args: [code],
    });

    if (result.rows.length === 0) {
        return jsonResponse({ error: 'Invalid or expired OTP' }, request, 400);
    }

    // Delete the verified OTP
    const otpId = result.rows[0].id;
    await db.execute({
        sql: `DELETE FROM otps WHERE id = ?`,
        args: [otpId],
    });

    return jsonResponse({ success: true, message: 'OTP verified successfully' }, request);
}

export const onRequest: PagesFunction<Env> = async (context) => {
    const { request, env } = context;

    if (request.method === 'OPTIONS') return handleOptions(request);

    const url = new URL(request.url);
    const action = url.searchParams.get('action') || '';

    try {
        switch (action) {
            case 'send': return await handleSend(request, env);
            case 'verify': return await handleVerify(request, env);
            default: return jsonResponse({ error: 'Unknown action. Use ?action=send|verify' }, request, 400);
        }
    } catch (error) {
        console.error('OTP API error:', error);
        return jsonResponse({ error: 'Internal server error' }, request, 500);
    }
};
