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

// ─── Provider 1: SendPulse (REST API) ───
async function trySendPulse(env: Env, options: MailOptions): Promise<boolean> {
    const { to, subject, text, html, fromName = 'ORBIT SaaS', attachments } = options;
    const spUserId = env.SENDPULSE_API_USER_ID;
    const spSecret = env.SENDPULSE_API_SECRET;

    if (!spUserId || !spSecret) {
        console.warn('[Mail] SendPulse credentials not configured, skipping.');
        return false;
    }

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
            const clean = (commaIdx !== -1 ? att.content.substring(commaIdx + 1) : att.content)
                .trim()
                .replace(/[\r\n\s]+/g, '');
            attachmentsDict[att.filename] = clean;
        }
        // SendPulse REST API requires attachments_binary for Base64-encoded binary files (PDFs, images)
        // Using 'attachments' causes SendPulse to store raw Base64 ASCII text, corrupting binary files.
        spEmailObj.attachments_binary = attachmentsDict;
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
}

// ─── Provider 2: Gmail (Nodemailer SMTP — requires nodejs_compat) ───
async function tryGmail(env: Env, options: MailOptions): Promise<boolean> {
    const { to, subject, text, html, fromName = 'ORBIT SaaS', attachments } = options;
    const gmailUser = env.GMAIL_USER;
    const gmailPass = env.GMAIL_APP_PASSWORD;

    if (!gmailUser || !gmailPass) {
        console.warn('[Mail] Gmail credentials not configured, skipping.');
        return false;
    }

    console.log(`[Mail] Attempting to send email via Gmail SMTP to: ${to}`);

    // Dynamic import so the module only loads when actually needed
    const nodemailer = await import('nodemailer');

    const transporter = nodemailer.default.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: gmailUser,
            pass: gmailPass,
        },
        // Tight timeouts so we don't hang the Worker
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 30000,
    });

    const mailPayload: any = {
        from: `"${fromName}" <${gmailUser}>`,
        to,
        subject,
        text,
        html,
    };

    if (attachments && attachments.length > 0) {
        mailPayload.attachments = attachments.map(att => {
            const commaIdx = att.content.indexOf(',');
            const clean = commaIdx !== -1 ? att.content.substring(commaIdx + 1) : att.content;
            return {
                filename: att.filename,
                content: clean,
                encoding: 'base64',
                contentType: att.contentType,
            };
        });
    }

    await transporter.sendMail(mailPayload);
    console.log(`[Mail] Email successfully sent via Gmail SMTP to ${to}`);
    return true;
}

// ─── Main Entry Point ───
export async function sendMail(env: Env, options: MailOptions): Promise<boolean> {
    // 1. Try SendPulse (REST API — preferred, no socket dependency)
    try {
        if (await trySendPulse(env, options)) return true;
    } catch (err: any) {
        console.error('[Mail] SendPulse failed:', err.message || err);
    }

    // 2. Fallback to Gmail (Nodemailer SMTP — requires nodejs_compat)
    try {
        if (await tryGmail(env, options)) return true;
    } catch (err: any) {
        console.error('[Mail] Gmail SMTP fallback failed:', err.message || err);
    }

    console.error(`[Mail] Failed to send email to ${options.to} using all available providers.`);
    return false;
}
