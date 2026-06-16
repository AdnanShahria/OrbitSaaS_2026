import { spawn, execSync } from 'child_process';
import readline from 'readline';

// ── Config ───────────────────────────────────────────────────────────
const isWindows = process.platform === 'win32';
let isShuttingDown = false;
let frontendReady = false;
let backendReady = false;

// ── ANSI helpers ─────────────────────────────────────────────────────
const c = {
    reset:   '\x1b[0m',
    bold:    '\x1b[1m',
    dim:     '\x1b[2m',
    cyan:    '\x1b[36m',
    green:   '\x1b[32m',
    yellow:  '\x1b[33m',
    red:     '\x1b[31m',
    blue:    '\x1b[34m',
    magenta: '\x1b[35m',
    bgCyan:  '\x1b[46m',
    bgGreen: '\x1b[42m',
    black:   '\x1b[30m',
    white:   '\x1b[37m',
};

// Clears the current line completely and resets cursor to column 1
const CLEAR_LINE = '\x1b[2K\r';

// ── Branding ─────────────────────────────────────────────────────────
function printLogo() {
    console.log();
    console.log(`  ${c.cyan}${c.bold}╔═══════════════════════════════════╗${c.reset}`);
    console.log(`  ${c.cyan}${c.bold}║${c.reset}   ${c.magenta}${c.bold}◉  O R B I T  S a a S${c.reset}          ${c.cyan}${c.bold}║${c.reset}`);
    console.log(`  ${c.cyan}${c.bold}║${c.reset}   ${c.dim}Development Environment${c.reset}         ${c.cyan}${c.bold}║${c.reset}`);
    console.log(`  ${c.cyan}${c.bold}╚═══════════════════════════════════╝${c.reset}`);
    console.log();
}

// ── Kill leftover processes on ports ─────────────────────────────────
function killPort(port) {
    if (!isWindows) return;
    try {
        const result = execSync(
            `netstat -ano | findstr :${port} | findstr LISTENING`,
            { encoding: 'utf8', stdio: 'pipe' }
        );
        const pids = new Set();
        for (const line of result.trim().split('\n')) {
            const pid = line.trim().split(/\s+/).pop();
            if (pid && pid !== '0') pids.add(pid);
        }
        for (const pid of pids) {
            try {
                execSync(`taskkill /PID ${pid} /T /F`, { stdio: 'pipe' });
                console.log(`  ${c.yellow}⚠  Killed stale process on :${port} (PID ${pid})${c.reset}`);
            } catch { /* already gone */ }
        }
    } catch { /* port is free */ }
}

// ── Start ────────────────────────────────────────────────────────────
printLogo();
killPort(5173);
killPort(3000);

const frontend = spawn('npm run dev:frontend', { shell: true, stdio: 'pipe' });
const backend  = spawn('npm run dev:api',      { shell: true, stdio: 'pipe' });

// ── Spinner ──────────────────────────────────────────────────────────
const dots = ['⣾', '⣽', '⣻', '⢿', '⡿', '⣟', '⣯', '⣷'];
let frame = 0;
let pulsePhase = 0;

function getStatusLine() {
    const spinner = dots[frame % dots.length];

    // Pulsing dots effect for waiting items
    pulsePhase++;
    const pulse = pulsePhase % 6 < 3 ? c.yellow : c.dim;

    const fIcon = frontendReady ? `${c.green}${c.bold}✔${c.reset}` : `${pulse}●${c.reset}`;
    const bIcon = backendReady  ? `${c.green}${c.bold}✔${c.reset}` : `${pulse}●${c.reset}`;

    const fLabel = frontendReady ? `${c.green}Frontend${c.reset}` : `${c.white}Frontend${c.reset}`;
    const bLabel = backendReady  ? `${c.green}Backend${c.reset}`  : `${c.white}Backend${c.reset}`;

    return `  ${c.cyan}${spinner}${c.reset}  ${fIcon} ${fLabel}  ${c.dim}│${c.reset}  ${bIcon} ${bLabel}`;
}

const spinnerInterval = setInterval(() => {
    if (frontendReady && backendReady) return;
    frame++;
    process.stdout.write(`${CLEAR_LINE}${getStatusLine()}`);
}, 100);

// ── API Tracking Dashboard ───────────────────────────────────────────
let apiCallsHistory = [];
let lastApiCallTime = 0;
let dashboardInterval;

function trackApiCall() {
    apiCallsHistory.push(Date.now());
    lastApiCallTime = Date.now();
}

function renderDashboard() {
    if (!frontendReady || !backendReady) return;
    
    const now = Date.now();
    apiCallsHistory = apiCallsHistory.filter(time => now - time < 60000);
    const rate = apiCallsHistory.length;
    
    let status = '';
    if (rate === 0) status = `${c.dim}Idle${c.reset}`;
    else if (rate <= 15) status = `${c.green}Optimal${c.reset}`;
    else if (rate <= 30) status = `${c.yellow}Elevated${c.reset}`;
    else status = `${c.red}${c.bold}Spamming!${c.reset}`;

    const dashSpinner = dots[frame % dots.length];
    const isRecent = (now - lastApiCallTime) < 500;
    const spark = isRecent ? `${c.cyan}${c.bold}⚡${c.reset}` : `${c.dim}⚡${c.reset}`;
    
    // Construct the visible text first to measure its length
    const plainText = `  *  *  API Calls (60s): ${rate}  │  Status: ` + status.replace(/\x1b\[\d+m/g, '');
    let output = `  ${c.magenta}${dashSpinner}${c.reset}  ${spark}  ${c.white}API Calls (60s): ${c.bold}${rate}${c.reset}  ${c.dim}│${c.reset}  ${c.white}Status: ${status}`;
    
    // If the terminal is too narrow, just show API calls
    if (process.stdout.columns && plainText.length > process.stdout.columns) {
        output = `  ${c.magenta}${dashSpinner}${c.reset}  ${spark}  ${c.white}APIs/min: ${c.bold}${rate}${c.reset}`;
    }
    
    process.stdout.write(`${CLEAR_LINE}${output}`);
}

function printLog(tag, line) {
    process.stdout.write(`${CLEAR_LINE}  ${tag} ${c.dim}${line}${c.reset}\n`);
    renderDashboard();
}

// ── Ready banner ─────────────────────────────────────────────────────
function showReadyBanner() {
    if (!frontendReady || !backendReady) return;
    clearInterval(spinnerInterval);
    process.stdout.write(CLEAR_LINE);

    console.log();
    console.log(`  ${c.green}${c.bold}┌──────────────────────────────────────────┐${c.reset}`);
    console.log(`  ${c.green}${c.bold}│${c.reset}  ${c.green}${c.bold}✓${c.reset}  ${c.bold}All servers ready!${c.reset}                  ${c.green}${c.bold}│${c.reset}`);
    console.log(`  ${c.green}${c.bold}│${c.reset}                                          ${c.green}${c.bold}│${c.reset}`);
    console.log(`  ${c.green}${c.bold}│${c.reset}  ${c.blue}Frontend${c.reset}  ${c.dim}→${c.reset}  ${c.cyan}${c.bold}http://localhost:5173/${c.reset}   ${c.green}${c.bold}│${c.reset}`);
    console.log(`  ${c.green}${c.bold}│${c.reset}  ${c.green}Backend${c.reset}   ${c.dim}→${c.reset}  ${c.cyan}${c.bold}http://127.0.0.1:3000${c.reset}    ${c.green}${c.bold}│${c.reset}`);
    console.log(`  ${c.green}${c.bold}│${c.reset}                                          ${c.green}${c.bold}│${c.reset}`);
    console.log(`  ${c.green}${c.bold}│${c.reset}  ${c.dim}Press ${c.yellow}Ctrl+C${c.reset}${c.dim} to stop${c.reset}                   ${c.green}${c.bold}│${c.reset}`);
    console.log(`  ${c.green}${c.bold}└──────────────────────────────────────────┘${c.reset}`);
    console.log();

    dashboardInterval = setInterval(() => {
        frame++;
        renderDashboard();
    }, 100);
}

// ── Stream child output ──────────────────────────────────────────────
function handleOutput(stream, label, color, isStderr = false) {
    const rl = readline.createInterface({ input: stream });
    rl.on('line', (line) => {
        // Detect ready signals
        if (!isStderr && label === 'Frontend' && line.includes('ready in')) {
            frontendReady = true;
            showReadyBanner();
            return;
        }
        if (!isStderr && label === 'Backend' && line.includes('Ready on')) {
            backendReady = true;
            showReadyBanner();
            return;
        }

        // Suppress noisy deprecation warnings
        if (isStderr && (
            line.includes('optimizeDeps.rollupOptions') ||
            line.includes('optimizeDeps.rolldownOptions') ||
            line.includes('recommend switching to') ||
            line.includes('VITE_DEPRECATION_TRACE') ||
            line.includes('Invalid key: Expected never')
        )) return;

        // Detect API calls
        if (label === 'Backend' && line.match(/api/i)) {
            trackApiCall();
        }

        // After ready, show log output cleanly
        if (frontendReady && backendReady) {
            const tag = `${color}${c.bold}[${label}]${c.reset}`;
            printLog(tag, line);
        }
    });
}

handleOutput(frontend.stdout, 'Frontend', c.blue,   false);
handleOutput(frontend.stderr, 'Frontend', c.yellow, true);
handleOutput(backend.stdout,  'Backend',  c.green,  false);
handleOutput(backend.stderr,  'Backend',  c.yellow, true);

// ── Cleanup ──────────────────────────────────────────────────────────
function killChild(child) {
    if (!child || child.killed) return;
    if (isWindows) {
        try { execSync(`taskkill /PID ${child.pid} /T /F`, { stdio: 'pipe' }); }
        catch { /* already gone */ }
    } else {
        child.kill('SIGTERM');
    }
}

function shutdown(reason) {
    if (isShuttingDown) return;
    isShuttingDown = true;

    clearInterval(spinnerInterval);
    if (dashboardInterval) clearInterval(dashboardInterval);
    process.stdout.write(CLEAR_LINE);

    if (reason) {
        console.log(`\n  ${c.red}${c.bold}✖  ${reason}${c.reset}`);
    }
    console.log(`  ${c.yellow}${c.bold}↓  Shutting down servers...${c.reset}\n`);

    killChild(frontend);
    killChild(backend);

    setTimeout(() => process.exit(reason ? 1 : 0), 1500);
}

frontend.on('close', (code) => {
    if (code !== 0 && code !== null && !isShuttingDown) {
        shutdown(`Frontend exited with code ${code}`);
    }
});
backend.on('close', (code) => {
    if (code !== 0 && code !== null && !isShuttingDown) {
        shutdown(`Backend exited with code ${code}`);
    }
});

process.on('SIGINT',  () => shutdown());
process.on('SIGTERM', () => shutdown());
