import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
dotenv.config();

const db = createClient({
    url: process.env.TURSO_DATABASE_URL || '',
    authToken: process.env.TURSO_AUTH_TOKEN || '',
});

async function check() {
    const res = await db.execute("SELECT * FROM site_content WHERE section = 'whyUs'");
    console.log(JSON.stringify(res.rows, null, 2));
    process.exit(0);
}

check();
