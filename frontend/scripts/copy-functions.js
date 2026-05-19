import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths resolved relative to this script's directory (frontend/scripts/)
const rootDir = path.resolve(__dirname, '../../');
const sourceDir = path.resolve(rootDir, 'backend/functions');
const targetDir = path.resolve(rootDir, 'functions');

function copyFunctions() {
    try {
        console.log(`[copy-functions] Preparing to sync functions folder...`);
        
        // Remove existing target folder if present to ensure clean copy
        if (fs.existsSync(targetDir)) {
            console.log(`[copy-functions] Removing old root functions folder...`);
            fs.rmSync(targetDir, { recursive: true, force: true });
        }

        // Copy recursively from source to target
        console.log(`[copy-functions] Copying ${sourceDir} -> ${targetDir}...`);
        fs.cpSync(sourceDir, targetDir, { recursive: true });

        console.log(`[copy-functions] Functions synced successfully!`);
    } catch (err) {
        console.error(`[copy-functions] Error copying functions folder:`, err);
        process.exit(1);
    }
}

copyFunctions();
