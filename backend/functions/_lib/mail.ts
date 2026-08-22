import nodemailer from 'nodemailer';
import type { Env } from './types';

export interface MailAttachment {
    filename: string;
    content: string; // Base64 encoded string
    contentType?: string;
    encoding?: string;
}

export interface MailOptions {
    to: string;
    subject: string;
    text: string;
    html: string;
    fromName?: string;
    attachments?: MailAttachment[];
}

function encodeBase64(str: string): string {
    if (typeof Buffer !== 'undefined') {
        return Buffer.from(str, 'utf-8').toString('base64');
    }
    const bytes = new TextEncoder().encode(str);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

export async function sendMail(env: Env, options: MailOptions): Promise<boolean> {
    const { to, subject, text, html, fromName = 'ORBIT SaaS', attachments } = options;

    // 1. Try Gmail (Nodemailer SMTP) first
    // Note: Nodemailer (TCP sockets) is not fully supported in standard Cloudflare Workers
    // and causes hangs/warnings. Using SendPulse REST API directly instead.

    // 2. Try SendPulse (REST API) as primary provider
    const spUserId = env.SENDPULSE_API_USER_ID;
    const spSecret = env.SENDPULSE_API_SECRET;

    if (spUserId && spSecret) {
        try {
            console.log(`[Mail] Attempting to send email via SendPulse to: ${to}`);
            
            // Get Access Token
            const tokenResp = await fetch('https://api.sendpulse.com/oauth/access_token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    grant_type: 'client_credentials',
                    client_id: spUserId,
                    client_secret: spSecret,
                }),
                signal: AbortSignal.timeout(15000),
            });

            if (!tokenResp.ok) {
                const errText = await tokenResp.text();
                throw new Error(`SendPulse auth failed: ${tokenResp.status} ${errText}`);
            }

            const tokenData = await tokenResp.json() as { access_token?: string };
            if (!tokenData.access_token) {
                throw new Error('No access token returned from SendPulse');
            }

            // Build SendPulse email payload
            const spEmailObj: any = {
                html: encodeBase64(html),
                text,
                subject,
                from: { name: fromName, email: 'contact@orbitsaas.cloud' },
                to: [{ email: to }]
            };

            if (attachments && attachments.length > 0) {
                const attachmentsDict: Record<string, string> = {};
                for (const att of attachments) {
                    const commaIdx = att.content.indexOf(',');
                    const clean = commaIdx !== -1 ? att.content.substring(commaIdx + 1).trim() : att.content.trim();
                    attachmentsDict[att.filename] = clean;
                }
                spEmailObj.attachments = attachmentsDict;
            }

            // Send Email via REST API
            const emailResp = await fetch('https://api.sendpulse.com/smtp/emails', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${tokenData.access_token}`,
                },
                body: JSON.stringify({ email: spEmailObj }),
                signal: AbortSignal.timeout(60000),
            });

            if (!emailResp.ok) {
                const errText = await emailResp.text();
                throw new Error(`SendPulse email sending failed: ${emailResp.status} ${errText}`);
            }

            console.log(`[Mail] Email successfully sent via SendPulse to ${to}`);
            return true;
        } catch (err: any) {
            console.error('[Mail] SendPulse fallback failed:', err.message || err);
        }
    } else {
        console.warn('[Mail] SendPulse credentials not configured, fallback skipped.');
    }

    console.error(`[Mail] Failed to send email to ${to} using all available methods.`);
    return false;
}
