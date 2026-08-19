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
    if (env.GMAIL_USER && env.GMAIL_APP_PASSWORD) {
        try {
            console.log(`[Mail] Attempting to send email via Gmail to: ${to}`);
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: env.GMAIL_USER,
                    pass: env.GMAIL_APP_PASSWORD
                }
            });

            const mailPayload: any = {
                from: `"${fromName}" <${env.GMAIL_USER}>`,
                to,
                subject,
                text,
                html
            };

            if (attachments && attachments.length > 0) {
                mailPayload.attachments = attachments.map(att => ({
                    filename: att.filename,
                    content: att.content,
                    encoding: att.encoding || 'base64',
                    contentType: att.contentType || 'application/pdf',
                }));
            }

            await transporter.sendMail(mailPayload);
            console.log(`[Mail] Email successfully sent via Gmail to ${to}`);
            return true;
        } catch (err: any) {
            console.error('[Mail] Gmail SMTP failed, falling back to SendPulse:', err.message || err);
        }
    } else {
        console.log('[Mail] Gmail credentials not configured, trying SendPulse directly.');
    }

    // 2. Try SendPulse (REST API) as fallback
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
                signal: AbortSignal.timeout(5000),
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
                const attachmentsBinary: Record<string, string> = {};
                for (const att of attachments) {
                    // SendPulse accepts raw base64 string
                    attachmentsBinary[att.filename] = att.content.replace(/^data:[^;]+;base64,/, '');
                }
                spEmailObj.attachments_binary = attachmentsBinary;
            }

            // Send Email via REST API
            const emailResp = await fetch('https://api.sendpulse.com/smtp/emails', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${tokenData.access_token}`,
                },
                body: JSON.stringify({ email: spEmailObj }),
                signal: AbortSignal.timeout(10000),
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
