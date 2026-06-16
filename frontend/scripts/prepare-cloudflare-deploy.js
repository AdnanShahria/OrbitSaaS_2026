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
        console.log('[prepare-deploy] Patching npx wrangler to intercept wrangler deploy...');
        const binWranglerPath = path.resolve(rootDir, 'node_modules/.bin/wrangler');
        if (fs.existsSync(binWranglerPath)) {
            const wrapper = `#!/usr/bin/env node
const args = process.argv.slice(2);
if (args[0] === 'deploy') {
    const extraArgs = args.slice(1);
    console.log('[wrangler-wrapper] Intercepted wrangler deploy. Redirecting to wrangler pages deploy frontend/dist...');
    const spawnSync = require('child_process').spawnSync;
    const result = spawnSync('npx', ['wrangler', 'pages', 'deploy', 'frontend/dist', '--compatibility-date', '2024-12-01', '--compatibility-flag', 'nodejs_compat', ...extraArgs], { stdio: 'inherit', shell: true });
    process.exit(result.status);
} else {
    const spawnSync = require('child_process').spawnSync;
    // We must execute the real wrangler. To avoid infinite loop, we can resolve the real script.
    // Or just run npx wrangler with the exact args, but the wrapper is node_modules/.bin/wrangler.
    // Let's resolve the actual bin file from wrangler package.json
    const wranglerPkg = require('wrangler/package.json');
    const binPath = require('path').resolve(__dirname, '..', 'wrangler', typeof wranglerPkg.bin === 'string' ? wranglerPkg.bin : wranglerPkg.bin.wrangler);
    const result = spawnSync(process.execPath, [binPath, ...args], { stdio: 'inherit' });
    process.exit(result.status);
}
`;
            fs.writeFileSync(binWranglerPath, wrapper);
            // Also write .cmd for windows just in case, though Cloudflare CI is Linux
            const wrapperCmd = `@ECHO OFF
node "%~dp0\\wrangler" %*
`;
            fs.writeFileSync(binWranglerPath + '.cmd', wrapperCmd);
            console.log('[prepare-deploy] Wrangler patched successfully.');
        }

    } catch (err) {
        console.error('[prepare-deploy] Error modifying package.json or patching wrangler:', err);
    }
} else {
    console.log('[prepare-deploy] Skipping as not in Cloudflare Pages build environment.');
}
