import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load env vars manually
const envPath = path.resolve(process.cwd(), '.env');
console.log('Loading .env from:', envPath);

if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
} else {
    console.error('❌ .env file not found!');
    process.exit(1);
}

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
    console.error('❌ TURSO_DATABASE_URL not found in .env');
    process.exit(1);
}

const db = createClient({
    url: url,
    authToken: authToken,
});

async function clearProjects() {
    console.log('🧹 Clearing projects from database...');

    try {
        // We need to delete entries where section = 'projects' for both languages
        await db.execute({
            sql: "DELETE FROM site_content WHERE section = 'projects'",
            args: []
        });

        console.log('✅ Successfully removed all projects from site_content table.');
    } catch (error) {
        console.error('❌ Error clearing projects:', error);
    } finally {
        db.close();
    }
}

clearProjects();
