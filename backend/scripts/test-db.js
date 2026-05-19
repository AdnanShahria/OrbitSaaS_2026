import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

console.log('Testing Turso Connection...');
console.log('URL:', url ? 'Set' : 'Missing');
console.log('Auth Token:', authToken ? 'Set' : 'Missing');

if (!url) {
    console.error('Error: TURSO_DATABASE_URL is missing');
    process.exit(1);
}

const client = createClient({
    url: url,
    authToken: authToken || '',
});

async function test() {
    try {
        console.log('Executing test query...');
        const result = await client.execute('SELECT 1');
        console.log('Success! Result:', result.rows);
    } catch (err) {
        console.error('Connection failed:', err);
    }
}

test();
