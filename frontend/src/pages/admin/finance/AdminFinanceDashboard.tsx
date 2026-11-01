import { useState, useEffect, useCallback, useRef, useMemo, lazy, Suspense } from 'react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Wallet, ArrowRight, Layers, Clock, RefreshCw, ChevronDown, Calendar, CalendarDays, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import DashboardStatCards from './DashboardStatCards';
const CorporateCharts = lazy(() => import('./CorporateCharts'));
const ExpensePieChart = lazy(() => import('./ExpensePieChart'));
import RecentMutations from './RecentMutations';
import SavingsGoalsWidget from './SavingsGoalsWidget';
import { FinanceThemeProvider, useFinanceTheme } from './FinanceThemeContext';

interface DashboardData {
    totalIncome: number;
    totalExpense: number;
    totalDistribution: number;
    netBalance: number;
    totalSavings: number;
    monthIncome: number;
    monthExpense: number;
    monthDistribution: number;
    monthNet: number;
    lastMonthIncome: number;
    lastMonthExpense: number;
    lastMonthDistribution: number;
    incomeChange: number | null;
    expenseChange: number | null;
    monthlyData: { month: string; income: number; expense: number; distribution: number; net: number }[];
    categoryBreakdown: { category: string; total: number }[];
    allTimeCategoryBreakdown?: { category: string; total: number }[];
    allTimeExpense?: number;
    recentTransactions: any[];
    savingsGoals: any[];
    topClients: any[];
    transactionCount: number;
    currentMonth: string;
}

type PeriodMode = 'this_month' | 'prev_month' | 'last_30_days' | 'this_year' | 'all_time' | 'custom';

// ─── Live Clock ───
function useLiveClock() {
    const [now, setNow] = useState(() => new Date());
    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(t);
    }, []);
    return now;
}
function formatClockTime(date: Date) {
    return date.toLocaleTimeString('en-BD', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true, timeZone: 'Asia/Dhaka' });
}
function formatClockDate(date: Date) {
    return date.toLocaleDateString('en-BD', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', timeZone: 'Asia/Dhaka' });
}
function formatRelativeTime(from: Date | null): string {
    if (!from) return 'never';
    const d = Math.floor((Date.now() - from.getTime()) / 1000);
    if (d < 5) return 'just now';
    if (d < 60) return `${d}s ago`;
    if (d < 3600) return `${Math.floor(d / 60)}m ago`;
    return `${Math.floor(d / 3600)}h ago`;
}

// Helper: pad number to 2 digits
const pad2 = (n: number) => String(n).padStart(2, '0');
const toYMD = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

// Returns { from, to } for a given period
function getPeriodDates(mode: PeriodMode, customFrom: string, customTo: string): { from: string; to: string } | null {
    const now = new Date();
    if (mode === 'this_month') {
        const y = now.getFullYear(), m = now.getMonth();
        const start = new Date(y, m, 1);
        const end = new Date(y, m + 1, 0);
        return { from: toYMD(start), to: toYMD(end) };
    }
    if (mode === 'prev_month') {
        const y = now.getFullYear(), m = now.getMonth() - 1;
        const start = new Date(y, m, 1);
        const end = new Date(y, m + 1, 0);
        return { from: toYMD(start), to: toYMD(end) };
    }
    if (mode === 'last_30_days') {
        const start = new Date(now.getTime() - 30 * 86400000);
        return { from: toYMD(start), to: toYMD(now) };
    }
    if (mode === 'this_year') {
        const y = now.getFullYear();
        return { from: `${y}-01-01`, to: `${y}-12-31` };
    }
    if (mode === 'all_time') {
        return null;
    }
    if (mode === 'custom' && customFrom && customTo) {
        return { from: customFrom, to: customTo };
    }
    return null;
}

function getPeriodLabel(mode: PeriodMode, customFrom: string, customTo: string): string {
    if (mode === 'this_month') return 'This Month';
    if (mode === 'prev_month') return 'Previous Month';
    if (mode === 'last_30_days') return 'Last 30 Days';
    if (mode === 'this_year') return `This Year (${new Date().getFullYear()})`;
    if (mode === 'all_time') return 'All Time';
    if (mode === 'custom' && customFrom && customTo) return `${customFrom} → ${customTo}`;
    return 'Custom Range';
}

// ─── Period Picker ───
function PeriodPicker({ mode, setMode, customFrom, setCustomFrom, customTo, setCustomTo, isLight }: {
    mode: PeriodMode; setMode: (m: PeriodMode) => void;
    customFrom: string; setCustomFrom: (s: string) => void;
    customTo: string; setCustomTo: (s: string) => void;
    isLight: boolean;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const fn = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
        document.addEventListener('mousedown', fn);
        return () => document.removeEventListener('mousedown', fn);
    }, []);

    const PERIODS: { label: string; value: PeriodMode; icon: any }[] = [
        { label: 'This Month', value: 'this_month', icon: CalendarDays },
        { label: 'Previous Month', value: 'prev_month', icon: Calendar },
        { label: 'Last 30 Days', value: 'last_30_days', icon: Clock },
        { label: 'This Year', value: 'this_year', icon: TrendingUp },
        { label: 'All Time', value: 'all_time', icon: Layers },
        { label: 'Custom Range', value: 'custom', icon: Calendar },
    ];

    const applyCustom = () => {
        if (!customFrom || !customTo) {
            toast.warning('Please select both start and end dates');
            return;
        }
        if (customFrom > customTo) {
            toast.error('Start date cannot be after end date');
            return;
        }
        setOpen(false);
    };

    return (
        <div ref={ref} className="relative z-50">
            <button
                onClick={() => setOpen(o => !o)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    isLight
                        ? 'bg-white border-black/[0.1] text-[#1d1d1f] hover:border-black/[0.25] shadow-xs'
                        : 'bg-white/[0.06] border-white/[0.1] text-white hover:border-white/[0.25]'
                } ${open ? (isLight ? 'border-[#0071e3] ring-2 ring-[#0071e3]/20' : 'border-primary/50 ring-2 ring-primary/20') : ''}`}
            >
                <CalendarDays className="w-3.5 h-3.5 opacity-70" />
                <span>{getPeriodLabel(mode, customFrom, customTo)}</span>
                <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown className="w-3.5 h-3.5 opacity-50" />
                </motion.div>
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.97 }}
                        transition={{ duration: 0.15 }}
                        className={`absolute right-0 top-full mt-2 w-72 rounded-2xl shadow-2xl z-[99999] p-2.5 ${
                            isLight
                                ? 'bg-white border border-black/[0.12] shadow-[0_16px_40px_rgba(0,0,0,0.18)] text-[#1d1d1f]'
                                : 'bg-[#1c1c1e] border border-white/[0.14] shadow-[0_20px_50px_rgba(0,0,0,0.85)] text-white'
                        }`}
                    >
                        <p className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1.5 ${isLight ? 'text-[#86868b]' : 'text-[#86868b]'}`}>
                            Select Dashboard Period
                        </p>
                        <div className="space-y-0.5">
                            {PERIODS.map(({ label, value, icon: Icon }) => (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => {
                                        setMode(value);
                                        if (value !== 'custom') setOpen(false);
                                    }}
                                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer text-left ${
                                        mode === value
                                            ? (isLight ? 'bg-[#0071e3]/10 text-[#0071e3] font-bold' : 'bg-primary/15 text-primary font-bold')
                                            : (isLight ? 'text-[#1d1d1f] hover:bg-black/[0.04]' : 'text-neutral-200 hover:bg-white/[0.06]')
                                    }`}
                                >
                                    <Icon className="w-4 h-4 opacity-75 shrink-0" />
                                    <span>{label}</span>
                                    {mode === value && (
                                        <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${isLight ? 'bg-[#0071e3]/10 text-[#0071e3]' : 'bg-primary/20 text-primary'}`}>
                                            Active
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Custom Range inputs */}
                        <AnimatePresence>
                            {mode === 'custom' && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className={`mt-2 p-3 rounded-xl space-y-2.5 ${isLight ? 'bg-black/[0.03] border border-black/[0.06]' : 'bg-white/[0.04] border border-white/[0.08]'}`}>
                                        <div className="flex items-center justify-between">
                                            <span className={`text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-[#86868b]' : 'text-[#86868b]'}`}>
                                                Custom Date Range
                                            </span>
                                            {/* Quick Range Presets */}
                                            <div className="flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setCustomFrom('2026-06-01');
                                                        setCustomTo('2026-06-30');
                                                    }}
                                                    className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                                                        isLight ? 'bg-black/[0.05] hover:bg-black/[0.1] text-[#1d1d1f]' : 'bg-white/[0.08] hover:bg-white/[0.15] text-white'
                                                    }`}
                                                >
                                                    Jun '26
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const now = new Date();
                                                        const s = new Date(now.getTime() - 30 * 86400000);
                                                        setCustomFrom(toYMD(s));
                                                        setCustomTo(toYMD(now));
                                                    }}
                                                    className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                                                        isLight ? 'bg-black/[0.05] hover:bg-black/[0.1] text-[#1d1d1f]' : 'bg-white/[0.08] hover:bg-white/[0.15] text-white'
                                                    }`}
                                                >
                                                    30d
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className={`text-[10px] font-semibold uppercase tracking-wider block mb-1 ${isLight ? 'text-[#86868b]' : 'text-[#86868b]'}`}>
                                                    From
                                                </label>
                                                <input
                                                    type="date"
                                                    value={customFrom}
                                                    onChange={e => setCustomFrom(e.target.value)}
                                                    className={`w-full rounded-lg px-2 py-1.5 text-xs border outline-none transition-all ${
                                                        isLight
                                                            ? 'bg-white border-black/[0.12] text-[#1d1d1f] focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3]'
                                                            : 'bg-[#2c2c2e] border-white/[0.12] text-white focus:border-primary focus:ring-1 focus:ring-primary'
                                                    }`}
                                                />
                                            </div>
                                            <div>
                                                <label className={`text-[10px] font-semibold uppercase tracking-wider block mb-1 ${isLight ? 'text-[#86868b]' : 'text-[#86868b]'}`}>
                                                    To
                                                </label>
                                                <input
                                                    type="date"
                                                    value={customTo}
                                                    onChange={e => setCustomTo(e.target.value)}
                                                    className={`w-full rounded-lg px-2 py-1.5 text-xs border outline-none transition-all ${
                                                        isLight
                                                            ? 'bg-white border-black/[0.12] text-[#1d1d1f] focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3]'
                                                            : 'bg-[#2c2c2e] border-white/[0.12] text-white focus:border-primary focus:ring-1 focus:ring-primary'
                                                    }`}
                                                />
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={applyCustom}
                                            className={`w-full py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm ${
                                                isLight ? 'bg-[#0071e3] text-white hover:bg-[#0071e3]/90' : 'bg-[#30d158] text-black hover:bg-[#28cd41]'
                                            }`}
                                        >
                                            Apply Range
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── Timing Bar ───
function TimingBar({ lastRefreshed, onRefresh, refreshing, isLight, mode, setMode, customFrom, setCustomFrom, customTo, setCustomTo }: {
    lastRefreshed: Date | null; onRefresh: () => void; refreshing: boolean; isLight: boolean;
    mode: PeriodMode; setMode: (m: PeriodMode) => void;
    customFrom: string; setCustomFrom: (s: string) => void;
    customTo: string; setCustomTo: (s: string) => void;
}) {
    const now = useLiveClock();
    const [relTime, setRelTime] = useState('');
    useEffect(() => { setRelTime(formatRelativeTime(lastRefreshed)); }, [now, lastRefreshed]);

    return (
        <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`flex items-center justify-between px-4 py-2.5 rounded-2xl text-[11px] font-medium transition-all duration-300 relative z-40 ${
                isLight ? 'bg-white/60 backdrop-blur border border-black/[0.06] shadow-xs' : 'bg-white/[0.04] backdrop-blur border border-white/[0.07]'
            }`}
        >
            {/* Left: clock */}
            <div className="flex items-center gap-2">
                <Clock className={`w-3 h-3 shrink-0 ${isLight ? 'text-[#6e6e73]' : 'text-[#86868b]'}`} />
                <div className={`flex items-center gap-1.5 ${isLight ? 'text-[#1d1d1f]' : 'text-white'}`}>
                    <span className="font-mono font-bold tabular-nums">{formatClockTime(now)}</span>
                    <span className={isLight ? 'text-[#86868b]' : 'text-[#636366]'}>·</span>
                    <span className={isLight ? 'text-[#6e6e73]' : 'text-[#86868b]'}>{formatClockDate(now)}</span>
                    <span className={`hidden sm:inline ${isLight ? 'text-[#86868b]' : 'text-[#636366]'}`}>·</span>
                    <span className={`hidden sm:inline ${isLight ? 'text-[#6e6e73]' : 'text-[#636366]'}`}>BDT</span>
                </div>
            </div>

            {/* Right: period picker + refresh */}
            <div className="flex items-center gap-2.5">
                <PeriodPicker
                    mode={mode} setMode={setMode}
                    customFrom={customFrom} setCustomFrom={setCustomFrom}
                    customTo={customTo} setCustomTo={setCustomTo}
                    isLight={isLight}
                />
                <span className={isLight ? 'text-[#86868b]' : 'text-[#636366]'}>
                    Updated: <span className={`font-semibold ${isLight ? 'text-[#6e6e73]' : 'text-[#86868b]'}`}>{relTime}</span>
                </span>
                <button
                    onClick={onRefresh} disabled={refreshing} title="Refresh"
                    className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                        isLight ? 'hover:bg-black/[0.06] text-[#6e6e73]' : 'hover:bg-white/[0.08] text-[#636366]'
                    } disabled:opacity-40`}
                >
                    <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
            </div>
        </motion.div>
    );
}

function FinanceDashboardContent() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [allTransactions, setAllTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

    // Period state
    const [periodMode, setPeriodMode] = useState<PeriodMode>('this_month');
    const [customFrom, setCustomFrom] = useState('');
    const [customTo, setCustomTo] = useState('');

    const navigate = useNavigate();
    const { isLight } = useFinanceTheme();
    const autoRefreshRef = useRef<ReturnType<typeof setInterval>>();

    const fetchDashboard = useCallback(async (isManual = false) => {
        try {
            if (isManual) setRefreshing(true);
            const token = localStorage.getItem('admin_token');
            const API_BASE = import.meta.env.VITE_API_URL || '';
            const headers = { Authorization: `Bearer ${token}` };

            // Build date range params
            const dates = getPeriodDates(periodMode, customFrom, customTo);
            let url = `${API_BASE}/api/finance?action=dashboard`;
            if (dates) url += `&from=${dates.from}&to=${dates.to}`;

            const [dashRes, txRes] = await Promise.all([
                fetch(url, { headers }),
                fetch(`${API_BASE}/api/finance?action=transactions&limit=2000`, { headers })
            ]);

            if (dashRes.status === 401 || txRes.status === 401) {
                toast.error('Session expired');
                return;
            }

            if (dashRes.ok) {
                const json = await dashRes.json();
                if (json.dashboard) setData(json.dashboard);
            }
            if (txRes.ok) {
                const txJson = await txRes.json();
                if (txJson.transactions) setAllTransactions(txJson.transactions);
            }

            setLastRefreshed(new Date());
            if (isManual) toast.success('Dashboard refreshed');
        } catch (err) {
            console.error(err);
            toast.error('Failed to load financial data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [periodMode, customFrom, customTo]);

    // Refetch on period change
    useEffect(() => {
        setLoading(true);
        fetchDashboard();
    }, [fetchDashboard]);

    // Auto-refresh every 5 min
    useEffect(() => {
        autoRefreshRef.current = setInterval(() => fetchDashboard(), 5 * 60 * 1000);
        return () => clearInterval(autoRefreshRef.current);
    }, [fetchDashboard]);

    // Reactive computation from live transactions according to active period option
    const activeData = useMemo(() => {
        const dates = getPeriodDates(periodMode, customFrom, customTo);

        if (allTransactions && allTransactions.length > 0) {
            // 1. All-time aggregates (treasury and total splits)
            const totalIncome = allTransactions
                .filter(t => t.type === 'income')
                .reduce((s, t) => s + Number(t.amount || 0), 0);
            const totalExpense = allTransactions
                .filter(t => t.type === 'expense')
                .reduce((s, t) => s + Number(t.amount || 0), 0);
            const totalDistribution = allTransactions
                .filter(t => t.type === 'distribution')
                .reduce((s, t) => s + Number(t.amount || 0), 0);
            const netBalance = totalIncome - totalExpense - totalDistribution;

            // 2. Period filtering
            let periodTxs = allTransactions;
            if (dates) {
                periodTxs = allTransactions.filter(t => t.date >= dates.from && t.date <= dates.to);
            }

            const periodIncome = periodTxs
                .filter(t => t.type === 'income')
                .reduce((s, t) => s + Number(t.amount || 0), 0);
            const periodExpense = periodTxs
                .filter(t => t.type === 'expense')
                .reduce((s, t) => s + Number(t.amount || 0), 0);
            const periodDistribution = periodTxs
                .filter(t => t.type === 'distribution')
                .reduce((s, t) => s + Number(t.amount || 0), 0);
            const periodNet = periodIncome - periodExpense - periodDistribution;

            // 3. Comparison window for percentage indicators
            let priorIncome = 0;
            let priorExpense = 0;
            if (dates && periodMode !== 'all_time') {
                const fDate = new Date(dates.from);
                const tDate = new Date(dates.to);
                const durationMs = Math.max(86400000, tDate.getTime() - fDate.getTime());
                const prevEnd = new Date(fDate.getTime() - 86400000);
                const prevStart = new Date(prevEnd.getTime() - durationMs);
                const pStartStr = toYMD(prevStart);
                const pEndStr = toYMD(prevEnd);

                const priorTxs = allTransactions.filter(t => t.date >= pStartStr && t.date <= pEndStr);
                priorIncome = priorTxs.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount || 0), 0);
                priorExpense = priorTxs.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount || 0), 0);
            }

            const incomeChange = priorIncome > 0
                ? ((periodIncome - priorIncome) / priorIncome) * 100
                : (periodIncome > 0 && priorIncome === 0 ? 100 : null);
            const expenseChange = priorExpense > 0
                ? ((periodExpense - priorExpense) / priorExpense) * 100
                : (periodExpense > 0 && priorExpense === 0 ? 100 : null);

            // 4. Category breakdown for expenses in this selected period
            const catMap: Record<string, number> = {};
            periodTxs
                .filter(t => t.type === 'expense')
                .forEach(t => {
                    const c = t.category || 'Uncategorized';
                    catMap[c] = (catMap[c] || 0) + Number(t.amount || 0);
                });
            const categoryBreakdown = Object.entries(catMap)
                .map(([category, total]) => ({ category, total }))
                .sort((a, b) => b.total - a.total);

            // All-time categories breakdown (enables instant fallback and toggle in Expense card)
            const allTimeCatMap: Record<string, number> = {};
            allTransactions
                .filter(t => t.type === 'expense')
                .forEach(t => {
                    const c = t.category || 'Uncategorized';
                    allTimeCatMap[c] = (allTimeCatMap[c] || 0) + Number(t.amount || 0);
                });
            const allTimeCategoryBreakdown = Object.entries(allTimeCatMap)
                .map(([category, total]) => ({ category, total }))
                .sort((a, b) => b.total - a.total);

            // 5. Monthly breakdown for Corporate Flow History chart
            const monthMap: Record<string, { income: number; expense: number; distribution: number }> = {};
            const sourceForFlow = (periodMode === 'all_time' || periodMode === 'this_year')
                ? allTransactions
                : (periodTxs.length > 0 ? periodTxs : allTransactions);

            sourceForFlow.forEach(t => {
                const m = (t.date || '').slice(0, 7);
                if (!m || m.length < 7) return;
                if (!monthMap[m]) monthMap[m] = { income: 0, expense: 0, distribution: 0 };
                if (t.type === 'income') monthMap[m].income += Number(t.amount || 0);
                else if (t.type === 'expense') monthMap[m].expense += Number(t.amount || 0);
                else if (t.type === 'distribution') monthMap[m].distribution += Number(t.amount || 0);
            });

            const monthlyData = Object.keys(monthMap).sort().map(m => ({
                month: m,
                income: monthMap[m].income,
                expense: monthMap[m].expense,
                distribution: monthMap[m].distribution,
                net: monthMap[m].income - monthMap[m].expense - monthMap[m].distribution,
            }));

            return {
                totalIncome,
                totalExpense,
                totalDistribution,
                netBalance,
                totalSavings: data?.totalSavings ?? 0,
                monthIncome: periodIncome,
                monthExpense: periodExpense,
                monthDistribution: periodDistribution,
                monthNet: periodNet,
                incomeChange,
                expenseChange,
                monthlyData: monthlyData.length > 0 ? monthlyData : (data?.monthlyData || []),
                categoryBreakdown: categoryBreakdown.length > 0 ? categoryBreakdown : (data?.categoryBreakdown || []),
                allTimeCategoryBreakdown,
                allTimeExpense: totalExpense,
                recentTransactions: (periodTxs.length > 0 ? periodTxs : allTransactions).slice(0, 10),
                savingsGoals: data?.savingsGoals || [],
                topClients: data?.topClients || [],
                transactionCount: allTransactions.length,
            };
        }

        return data;
    }, [data, allTransactions, periodMode, customFrom, customTo]);

    if (loading && !data && allTransactions.length === 0) {
        return (
            <div className="space-y-4 w-full">
                <div className="flex items-center justify-between">
                    <Skeleton className={`h-10 w-64 rounded-2xl ${isLight ? 'bg-black/5' : 'bg-white/5'}`} />
                    <Skeleton className={`h-10 w-44 rounded-full ${isLight ? 'bg-black/5' : 'bg-white/5'}`} />
                </div>
                <Skeleton className={`h-10 w-full rounded-2xl ${isLight ? 'bg-black/5' : 'bg-white/5'}`} />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className={`h-36 rounded-3xl ${isLight ? 'bg-black/5' : 'bg-white/5'}`} />)}
                </div>
                <Skeleton className={`h-80 rounded-3xl ${isLight ? 'bg-black/5' : 'bg-white/5'}`} />
            </div>
        );
    }

    const currentStats = activeData || data;
    const isEmpty = !currentStats || currentStats.transactionCount === 0;
    const periodLabel = getPeriodLabel(periodMode, customFrom, customTo);

    return (
        <div className={`space-y-4 w-full transition-colors duration-300 font-sans ${isLight ? 'text-[#1d1d1f]' : 'text-white'}`}>
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b" style={{ borderColor: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)' }}>
                <div>
                    <div className="flex items-center gap-2.5">
                        <div className={`w-9 h-9 rounded-2xl flex items-center justify-center ${isLight ? 'bg-emerald-500/10 text-emerald-600' : 'bg-emerald-500/15 text-emerald-400'}`}>
                            <Wallet className="w-5 h-5" />
                        </div>
                        <h1 className={`text-xl sm:text-2xl font-extrabold tracking-tight ${isLight ? 'text-[#1d1d1f]' : 'text-white'}`}>
                            Financial Command Center
                        </h1>
                    </div>
                    <p className={`text-xs mt-1 ml-11.5 font-medium ${isLight ? 'text-[#6e6e73]' : 'text-[#86868b]'}`}>
                        Monitor SaaS Income, Operational Funding, and Partitioned Distribution Splits.
                    </p>
                </div>
                <div className="flex items-center gap-2.5 flex-wrap">
                    <button onClick={() => navigate('/admin/finance/transactions')} className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-semibold border transition-all cursor-pointer ${isLight ? 'bg-white hover:bg-black/[0.04] text-[#1d1d1f] border-black/[0.08] shadow-xs' : 'bg-white/[0.06] hover:bg-white/[0.1] text-white border-white/[0.1]'}`}>
                        <Layers className="w-3.5 h-3.5" /><span>Ledger &amp; Log</span>
                    </button>
                    <button onClick={() => navigate('/admin/finance/transactions')} className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all shadow-md cursor-pointer ${isLight ? 'bg-[#28cd41] hover:bg-[#24b73a] text-white' : 'bg-[#30d158] hover:bg-[#28cd41] text-black'}`}>
                        <Plus className="w-4 h-4" /><span>Record Mutation</span>
                    </button>
                </div>
            </div>

            {/* Timing Bar with Period Picker */}
            <TimingBar
                lastRefreshed={lastRefreshed}
                onRefresh={() => fetchDashboard(true)}
                refreshing={refreshing}
                isLight={isLight}
                mode={periodMode}
                setMode={setPeriodMode}
                customFrom={customFrom}
                setCustomFrom={setCustomFrom}
                customTo={customTo}
                setCustomTo={setCustomTo}
            />

            <AnimatePresence mode="wait">
                {isEmpty ? (
                    <motion.div key="empty" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                        className={`flex flex-col items-center justify-center py-20 px-6 rounded-3xl text-center ${isLight ? 'bg-white/85 border border-black/[0.06]' : 'bg-[#1c1c1e]/80 border border-white/[0.08]'}`}>
                        <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-6 ${isLight ? 'bg-white shadow-lg text-emerald-600' : 'bg-[#2c2c2e] text-emerald-400'}`}>
                            <Wallet className="w-10 h-10" />
                        </div>
                        <h3 className={`text-xl font-bold mb-2 ${isLight ? 'text-[#1d1d1f]' : 'text-white'}`}>No Financial Data Yet</h3>
                        <p className={`text-sm mb-6 max-w-md ${isLight ? 'text-[#6e6e73]' : 'text-[#86868b]'}`}>Start by recording your first transaction.</p>
                        <button onClick={() => navigate('/admin/finance/transactions')} className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold shadow-md cursor-pointer ${isLight ? 'bg-[#28cd41] text-white' : 'bg-[#30d158] text-black'}`}>
                            <span>Record First Transaction</span><ArrowRight className="w-4 h-4" />
                        </button>
                    </motion.div>
                ) : (
                    <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 relative z-10">
                        {/* Period context badge */}
                        <div className={`flex items-center gap-2 text-[11px] font-semibold ${isLight ? 'text-[#6e6e73]' : 'text-[#86868b]'}`}>
                            <CalendarDays className="w-3.5 h-3.5" />
                            <span>Showing metrics for: </span>
                            <span className={`px-2 py-0.5 rounded-full font-bold ${isLight ? 'bg-[#0071e3]/10 text-[#0071e3]' : 'bg-primary/10 text-primary'}`}>
                                {periodLabel}
                            </span>
                            <span className={isLight ? 'text-[#86868b]' : 'text-[#636366]'}>
                                · Company Fund is total retained treasury
                            </span>
                        </div>

                        <DashboardStatCards
                            monthIncome={currentStats.monthIncome}
                            monthExpense={currentStats.monthExpense}
                            monthDistribution={currentStats.monthDistribution}
                            monthNet={currentStats.monthNet}
                            incomeChange={currentStats.incomeChange}
                            expenseChange={currentStats.expenseChange}
                            netBalance={currentStats.netBalance}
                            totalDistribution={currentStats.totalDistribution}
                            periodLabel={periodLabel}
                        />

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            <Suspense fallback={<div className="h-64 rounded-2xl border border-white/10 flex items-center justify-center text-xs text-muted-foreground">Loading charts...</div>}>
                                <CorporateCharts monthlyData={currentStats.monthlyData} />
                            </Suspense>
                            <Suspense fallback={<div className="h-64 rounded-2xl border border-white/10 flex items-center justify-center text-xs text-muted-foreground">Loading breakdown...</div>}>
                                <ExpensePieChart
                                    categoryBreakdown={currentStats.categoryBreakdown}
                                    totalExpense={currentStats.monthExpense}
                                    allTimeBreakdown={currentStats.allTimeCategoryBreakdown}
                                    allTimeExpense={currentStats.totalExpense}
                                    periodLabel={periodLabel}
                                    onSelectAllTime={() => setPeriodMode('all_time')}
                                />
                            </Suspense>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <RecentMutations recentTransactions={currentStats.recentTransactions} onNavigate={() => navigate('/admin/finance/transactions')} />
                            <SavingsGoalsWidget savingsGoals={currentStats.savingsGoals} totalIncome={currentStats.totalIncome} totalExpense={currentStats.totalExpense} totalDistribution={currentStats.totalDistribution} netBalance={currentStats.netBalance} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function AdminFinanceDashboard() {
    return (
        <FinanceThemeProvider>
            <FinanceDashboardContent />
        </FinanceThemeProvider>
    );
}
