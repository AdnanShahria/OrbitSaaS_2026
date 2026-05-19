const { createClient } = require('@libsql/client');
require('dotenv').config();

const db = createClient({
    url: process.env.TURSO_DATABASE_URL || '',
    authToken: process.env.TURSO_AUTH_TOKEN || '',
});

async function dump() {
    const res = await db.execute("SELECT section, lang, data FROM site_content WHERE section = 'whyUs'");
    const fs = require('fs');
    fs.writeFileSync('db-dump.json', JSON.stringify(res.rows, null, 2));
    console.log("Dumped to db-dump.json");
    process.exit(0);
}

dump();
