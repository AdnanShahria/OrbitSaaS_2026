import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { SectionHeader } from '@/components/admin/EditorComponents';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import {
    TrendingUp, TrendingDown, DollarSign, PiggyBank, Wallet, ArrowUpRight, ArrowDownRight,
    Plus, Download, Calendar, Filter, ChevronRight, CreditCard, RefreshCw, Loader2,
    Target, PieChart as PieChartIcon, BarChart3
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import { useNavigate } from 'react-router-dom';

interface DashboardData {
    totalIncome: number;
    totalExpense: number;
    netBalance: number;
    totalSavings: number;
    monthIncome: number;
    monthExpense: number;
    monthNet: number;
    lastMonthIncome: number;
    lastMonthExpense: number;
    incomeChange: number;
    expenseChange: number;
    monthlyData: { month: string; income: number; expense: number; net: number }[];
    categoryBreakdown: { category: string; total: number }[];
    recentTransactions: any[];
    savingsGoals: any[];
    topClients: any[];
    transactionCount: number;
    currentMonth: string;
}

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#6366F1'];

function formatCurrency(amount: number, currency = 'BDT') {
    if (currency === 'USD') return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    return `৳${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatMonth(m: string) {
    const [y, mo] = m.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[parseInt(mo) - 1]} ${y.slice(2)}`;
}

const StatCard = ({ title, value, change, icon: Icon, color, prefix = '৳' }: any) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-2xl p-5 relative overflow-hidden group hover:border-white/10 transition-all duration-300"
    >
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `radial-gradient(circle at 80% 20%, ${color}08, transparent 60%)` }} />
        <div className="relative flex items-start justify-between">
            <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
                <p className="text-2xl md:text-3xl font-black text-foreground tracking-tight">
                    {prefix}{typeof value === 'number' ? value.toLocaleString() : value}
                </p>
                {change !== undefined && change !== null && (
                    <div className={`flex items-center gap-1 text-xs font-semibold ${change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {change >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                        {Math.abs(change).toFixed(1)}% vs last month
                    </div>
                )}
            </div>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}15` }}>
                <Icon className="w-5 h-5" style={{ color }} />
            </div>
        </div>
    </motion.div>
);

const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-[#0f1419] border border-white/10 rounded-xl px-4 py-3 shadow-2xl">
            <p className="text-xs font-bold text-muted-foreground mb-2">{formatMonth(label)}</p>
            {payload.map((p: any, i: number) => (
                <p key={i} className="text-sm font-semibold flex items-center gap-2" style={{ color: p.color }}>
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                    {p.name}: {formatCurrency(p.value)}
                </p>
            ))}
        </div>
    );
};

export default function AdminFinanceDashboard() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [seeding, setSeeding] = useState(false);
    const navigate = useNavigate();

    const fetchDashboard = useCallback(async () => {
        try {
            const token = localStorage.getItem('admin_token');
            const API_BASE = import.meta.env.VITE_API_URL || '';
            const res = await fetch(`${API_BASE}/api/finance?action=dashboard`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.status === 401) { toast.error('Session expired'); return; }
            if (!res.ok) throw new Error('Failed');
            const json = await res.json();
            setData(json.dashboard);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load financial data');
        } finally {
            setLoading(false);
        }
    }, []);

    const handleSeed = async () => {
        setSeeding(true);
        try {
            const token = localStorage.getItem('admin_token');
            const API_BASE = import.meta.env.VITE_API_URL || '';
            const res = await fetch(`${API_BASE}/api/finance?action=seed`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                toast.success('Finance tables initialized!');
                fetchDashboard();
            } else {
                toast.error('Failed to initialize');
            }
        } catch { toast.error('Error initializing'); }
        finally { setSeeding(false); }
    };

    useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-64 mb-2" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
                </div>
                <Skeleton className="h-80 rounded-2xl" />
            </div>
        );
    }

    const isEmpty = !data || data.transactionCount === 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <SectionHeader title="💰 Financial Overview" description="Track your income, expenses, savings, and profit at a glance." />
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleSeed}
                        disabled={seeding}
                        className="flex items-center gap-2 px-3 py-2 bg-secondary text-foreground rounded-lg hover:bg-secondary/80 transition-colors text-sm font-medium disabled:opacity-50"
                    >
                        {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                        Init DB
                    </button>
                    <button
                        onClick={() => navigate('/admin/finance/transactions')}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors text-sm font-semibold shadow-lg shadow-emerald-500/20"
                    >
                        <Plus className="w-4 h-4" />
                        Add Transaction
                    </button>
                </div>
            </div>

            {isEmpty ? (
                /* Empty State */
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center py-20 bg-card border border-border rounded-2xl"
                >
                    <div className="w-20 h-20 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-6">
                        <Wallet className="w-10 h-10 text-emerald-500" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">No Financial Data Yet</h3>
                    <p className="text-sm text-muted-foreground mb-6 max-w-sm text-center">
                        Start tracking your income and expenses. Click "Init DB" to set up categories, then add your first transaction.
                    </p>
                    <div className="flex gap-3">
                        <button onClick={handleSeed} disabled={seeding} className="px-4 py-2 bg-secondary text-foreground rounded-lg hover:bg-secondary/80 text-sm font-medium disabled:opacity-50">
                            {seeding ? 'Initializing...' : '1. Initialize Categories'}
                        </button>
                        <button onClick={() => navigate('/admin/finance/transactions')} className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 text-sm font-semibold">
                            2. Add Transaction
                        </button>
                    </div>
                </motion.div>
            ) : (
                <>
                    {/* Stat Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard title="This Month Income" value={data.monthIncome} change={data.incomeChange} icon={TrendingUp} color="#10B981" />
                        <StatCard title="This Month Expenses" value={data.monthExpense} change={data.expenseChange} icon={TrendingDown} color="#EF4444" />
                        <StatCard title="Net Profit" value={data.monthNet} change={null} icon={DollarSign} color={data.monthNet >= 0 ? '#10B981' : '#EF4444'} />
                        <StatCard title="Total Savings" value={data.totalSavings} change={null} icon={PiggyBank} color="#3B82F6" />
                    </div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {/* Income vs Expense Chart */}
                        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-5">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                                    <BarChart3 className="w-4 h-4 text-emerald-500" />
                                    Income vs Expenses
                                </h3>
                                <span className="text-xs text-muted-foreground">Last 12 months</span>
                            </div>
                            {data.monthlyData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={280}>
                                    <AreaChart data={data.monthlyData}>
                                        <defs>
                                            <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                                        <XAxis dataKey="month" tickFormatter={formatMonth} tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `৳${(v / 1000).toFixed(0)}k`} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Area type="monotone" dataKey="income" name="Income" stroke="#10B981" fill="url(#incomeGrad)" strokeWidth={2} dot={false} />
                                        <Area type="monotone" dataKey="expense" name="Expense" stroke="#EF4444" fill="url(#expenseGrad)" strokeWidth={2} dot={false} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">No monthly data yet</div>
                            )}
                        </div>

                        {/* Category Breakdown */}
                        <div className="bg-card border border-border rounded-2xl p-5">
                            <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-4">
                                <PieChartIcon className="w-4 h-4 text-amber-500" />
                                Expense Categories
                            </h3>
                            {data.categoryBreakdown.length > 0 ? (
                                <>
                                    <ResponsiveContainer width="100%" height={180}>
                                        <PieChart>
                                            <Pie
                                                data={data.categoryBreakdown}
                                                dataKey="total"
                                                nameKey="category"
                                                cx="50%" cy="50%"
                                                innerRadius={50} outerRadius={75}
                                                paddingAngle={2}
                                                strokeWidth={0}
                                            >
                                                {data.categoryBreakdown.map((_, i) => (
                                                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ background: '#0f1419', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="space-y-1.5 mt-2 max-h-[120px] overflow-y-auto custom-scrollbar">
                                        {data.categoryBreakdown.slice(0, 6).map((c, i) => (
                                            <div key={c.category} className="flex items-center justify-between text-xs">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                                    <span className="text-muted-foreground truncate max-w-[120px]">{c.category}</span>
                                                </div>
                                                <span className="font-semibold text-foreground">{formatCurrency(c.total)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">No expenses yet</div>
                            )}
                        </div>
                    </div>

                    {/* Bottom Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Recent Transactions */}
                        <div className="bg-card border border-border rounded-2xl p-5">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                                    <CreditCard className="w-4 h-4 text-blue-500" />
                                    Recent Transactions
                                </h3>
                                <button onClick={() => navigate('/admin/finance/transactions')} className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1">
                                    View All <ChevronRight className="w-3 h-3" />
                                </button>
                            </div>
                            <div className="space-y-2">
                                {data.recentTransactions.length > 0 ? data.recentTransactions.slice(0, 7).map((t: any) => (
                                    <div key={t.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-secondary/30 transition-colors">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${t.type === 'income' ? 'bg-emerald-500/10' : t.type === 'expense' ? 'bg-red-500/10' : 'bg-blue-500/10'}`}>
                                                {t.type === 'income' ? <ArrowUpRight className="w-4 h-4 text-emerald-500" /> : t.type === 'expense' ? <ArrowDownRight className="w-4 h-4 text-red-500" /> : <PiggyBank className="w-4 h-4 text-blue-500" />}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-foreground truncate">{t.description}</p>
                                                <p className="text-[10px] text-muted-foreground">{t.category} · {t.date}</p>
                                            </div>
                                        </div>
                                        <span className={`text-sm font-bold shrink-0 ${t.type === 'income' ? 'text-emerald-400' : t.type === 'expense' ? 'text-red-400' : 'text-blue-400'}`}>
                                            {t.type === 'income' || t.type === 'savings_withdrawal' ? '+' : '-'}{formatCurrency(t.amount, t.currency)}
                                        </span>
                                    </div>
                                )) : (
                                    <div className="py-8 text-center text-muted-foreground text-sm">No transactions yet</div>
                                )}
                            </div>
                        </div>

                        {/* Savings Goals + Top Clients */}
                        <div className="space-y-4">
                            {/* Savings Goals */}
                            <div className="bg-card border border-border rounded-2xl p-5">
                                <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-4">
                                    <Target className="w-4 h-4 text-blue-500" />
                                    Savings Goals
                                </h3>
                                {data.savingsGoals.length > 0 ? (
                                    <div className="space-y-3">
                                        {data.savingsGoals.map((g: any) => {
                                            const pct = g.target_amount > 0 ? Math.min(100, (g.current_amount / g.target_amount) * 100) : 0;
                                            return (
                                                <div key={g.id} className="space-y-1.5">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm font-medium text-foreground">{g.name}</span>
                                                        <span className="text-xs text-muted-foreground">{pct.toFixed(0)}%</span>
                                                    </div>
                                                    <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${pct}%` }}
                                                            transition={{ duration: 1, ease: 'easeOut' }}
                                                            className="h-full rounded-full"
                                                            style={{
                                                                background: pct >= 100 ? 'linear-gradient(90deg, #10B981, #34D399)' : pct >= 60 ? 'linear-gradient(90deg, #3B82F6, #60A5FA)' : 'linear-gradient(90deg, #F59E0B, #FBBF24)',
                                                                boxShadow: `0 0 8px ${pct >= 100 ? '#10B98166' : pct >= 60 ? '#3B82F666' : '#F59E0B66'}`
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="flex justify-between text-[10px] text-muted-foreground">
                                                        <span>{formatCurrency(g.current_amount, g.currency)}</span>
                                                        <span>{formatCurrency(g.target_amount, g.currency)}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="py-6 text-center text-muted-foreground text-sm">No savings goals set</div>
                                )}
                            </div>

                            {/* Quick Stats */}
                            <div className="bg-card border border-border rounded-2xl p-5">
                                <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-4">
                                    <BarChart3 className="w-4 h-4 text-purple-500" />
                                    All-Time Summary
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3 text-center">
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Total Income</p>
                                        <p className="text-lg font-black text-emerald-400">{formatCurrency(data.totalIncome)}</p>
                                    </div>
                                    <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-3 text-center">
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Total Expenses</p>
                                        <p className="text-lg font-black text-red-400">{formatCurrency(data.totalExpense)}</p>
                                    </div>
                                    <div className={`${data.netBalance >= 0 ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-red-500/5 border-red-500/10'} border rounded-xl p-3 text-center`}>
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Net Balance</p>
                                        <p className={`text-lg font-black ${data.netBalance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatCurrency(data.netBalance)}</p>
                                    </div>
                                    <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-3 text-center">
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Transactions</p>
                                        <p className="text-lg font-black text-blue-400">{data.transactionCount}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
