const { createClient } = require('@libsql/client');
require('dotenv').config();

const db = createClient({
    url: process.env.TURSO_DATABASE_URL || '',
    authToken: process.env.TURSO_AUTH_TOKEN || '',
});

async function check() {
    try {
        const res = await db.execute("SELECT * FROM site_content WHERE section = 'whyUs'");
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (err) {
        console.error(err);
    }
}

check();
