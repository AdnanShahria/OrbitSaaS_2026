import nodemailer from 'nodemailer';
import type { Env } from './types';

interface MailOptions {
    to: string;
    subject: string;
    text: string;
    html: string;
    fromName?: string;
}

export async function sendMail(env: Env, options: MailOptions): Promise<boolean> {
    const { to, subject, text, html, fromName = 'ORBIT SaaS' } = options;

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

            await transporter.sendMail({
                from: `"${fromName}" <${env.GMAIL_USER}>`,
                to,
                subject,
                text,
                html
            });
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

            // Send Email via REST API
            const emailResp = await fetch('https://api.sendpulse.com/smtp/emails', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${tokenData.access_token}`,
                },
                body: JSON.stringify({
                    email: {
                        html,
                        text,
                        subject,
                        from: { name: fromName, email: 'contact@orbitsaas.cloud' },
                        to: [{ email: to }]
                    }
                }),
                signal: AbortSignal.timeout(5000),
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
