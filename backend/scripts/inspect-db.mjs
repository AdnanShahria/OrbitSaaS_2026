import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
});

async function run() {
  const r = await db.execute("SELECT section, lang, data FROM site_content WHERE section = 'achievements'");
  for (const row of r.rows) {
    const data = JSON.parse(row.data);
    console.log(`Achievements (${row.lang}):`);
    data.items?.forEach((it, i) => {
      console.log(`  ${i+1}. id: ${it.id}, title: "${it.title}"`);
    });
  }
}

run().finally(() => db.close());
