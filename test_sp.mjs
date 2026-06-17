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
                html: 'test',
                text: 'test',
                subject: 'Test',
                from: { name: 'Admin', email: 'contact@orbitsaas.cloud' },
                to: [{ email: 'adnanshahria2019@gmail.com' }]
            }
        })
    });
    const emailData = await emailResp.json();
    console.log("Email response:", emailData);
}

run();
