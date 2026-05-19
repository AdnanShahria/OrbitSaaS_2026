import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
import { translations } from '../../frontend/src/lib/i18n.ts'; // extension is .ts since we run with bun/tsx

dotenv.config();

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

const db = createClient({
    url: url || '',
    authToken: authToken || '',
});

async function run() {
    try {
        console.log("Starting DB update for services...");
        for (const lang of ['en', 'bn'] as const) {
            const data = translations[lang].services;
            const res = await db.execute({
                sql: `UPDATE site_content SET data = ? WHERE section = 'services' AND lang = ?`,
                args: [JSON.stringify(data), lang]
            });
            // If rowsAffected is 0, it might mean the row didn't exist, we fallback to insert
            if (res.rowsAffected === 0) {
                await db.execute({
                    sql: `INSERT INTO site_content (section, lang, data) VALUES ('services', ?, ?)`,
                    args: [lang, JSON.stringify(data)]
                });
                console.log(`Inserted services for ${lang}`);
            } else {
                console.log(`Updated services for ${lang}`);
            }
        }
        console.log("Successfully updated services in the database.");
        process.exit(0);
    } catch (err) {
        console.error("Database update failed:", err);
        process.exit(1);
    }
}
run();
