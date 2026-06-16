import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');
const pkgPath = path.resolve(rootDir, 'package.json');

// Only run this inside Cloudflare Pages or CI build environments
if (process.env.CF_PAGES === '1' || process.env.CF_PAGES || process.env.CI) {
    try {
        console.log('[prepare-deploy] Checking for workspaces in package.json...');
        if (fs.existsSync(pkgPath)) {
            const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
            if (pkg.workspaces) {
                console.log('[prepare-deploy] Removing "workspaces" from root package.json temporarily to bypass Wrangler workspace detection...');
                pkg._workspaces = pkg.workspaces;
                delete pkg.workspaces;
                fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
                console.log('[prepare-deploy] Done. package.json modified.');
            }
        }
    } catch (err) {
        console.error('[prepare-deploy] Error modifying package.json:', err);
    }
} else {
    console.log('[prepare-deploy] Skipping as not in Cloudflare Pages build environment.');
}
