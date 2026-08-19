import dotenv from 'dotenv';
dotenv.config();

async function run() {
    const userId = process.env.SENDPULSE_API_USER_ID;
    const secret = process.env.SENDPULSE_API_SECRET;

    const tokenResp = await fetch('https://api.sendpulse.com/oauth/access_token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            grant_type: 'client_credentials',
            client_id: userId,
            client_secret: secret,
        }),
    });
    const tokenData = await tokenResp.json();
    console.log("Token response:", tokenData);

    const emailResp = await fetch('https://api.sendpulse.com/smtp/emails', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${tokenData.access_token}`,
        },
        body: JSON.stringify({
            email: {
                html: Buffer.from('<div style="background:#6c5ce7;padding:20px;color:white;border-radius:8px;font-family:sans-serif;"><h2>ORBIT SaaS Test</h2><p>This is styled HTML via SendPulse!</p></div>').toString('base64'),
                text: 'This is fallback plain text',
                subject: 'SendPulse Base64 HTML Test',
                from: { name: 'Admin', email: 'contact@orbitsaas.cloud' },
                to: [{ email: 'adnanshahria2019@gmail.com' }]
            }
        })
    });
    const emailData = await emailResp.json();
    console.log("Email response:", emailData);
}

run();
