import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { Plus, Wallet, ArrowRight, Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Import our decoupled subcomponents
import DashboardStatCards from './DashboardStatCards';
import CorporateCharts from './CorporateCharts';
import ExpensePieChart from './ExpensePieChart';
import RecentMutations from './RecentMutations';
import SavingsGoalsWidget from './SavingsGoalsWidget';
import AppleThemeToggle from './AppleThemeToggle';
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
    incomeChange: number;
    expenseChange: number;
    monthlyData: { month: string; income: number; expense: number; distribution: number; net: number }[];
    categoryBreakdown: { category: string; total: number }[];
    recentTransactions: any[];
    savingsGoals: any[];
    topClients: any[];
    transactionCount: number;
    currentMonth: string;
}

function FinanceDashboardContent() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { isLight } = useFinanceTheme();

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

    useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

    if (loading) {
        return (
            <div className={`space-y-6 -m-4 sm:-m-5 lg:-m-8 p-4 sm:p-5 lg:p-8 min-h-[100dvh] transition-colors duration-300 ${isLight ? 'bg-[#f5f5f7]' : 'bg-[#09090b]'}`}>
                <div className="flex items-center justify-between">
                    <Skeleton className={`h-10 w-64 rounded-2xl ${isLight ? 'bg-black/5' : 'bg-white/5'}`} />
                    <Skeleton className={`h-10 w-44 rounded-full ${isLight ? 'bg-black/5' : 'bg-white/5'}`} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <Skeleton key={i} className={`h-36 rounded-3xl ${isLight ? 'bg-black/5' : 'bg-white/5'}`} />
                    ))}
                </div>
                <Skeleton className={`h-80 rounded-3xl ${isLight ? 'bg-black/5' : 'bg-white/5'}`} />
            </div>
        );
    }

    const isEmpty = !data || data.transactionCount === 0;

    return (
        <div className={`space-y-6 -m-4 sm:-m-5 lg:-m-8 p-4 sm:p-5 lg:p-8 min-h-[100dvh] transition-colors duration-300 font-sans ${isLight ? 'bg-[#f5f5f7] text-[#1d1d1f]' : 'bg-[#09090b] text-white'}`}>
            {/* Apple Styled Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b transition-colors duration-300" style={{ borderColor: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)' }}>
                <div>
                    <div className="flex items-center gap-2.5">
                        <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shadow-xs ${isLight ? 'bg-emerald-500/10 text-emerald-600' : 'bg-emerald-500/15 text-emerald-400'}`}>
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

                {/* Right controls: Theme Toggle + Action buttons */}
                <div className="flex items-center gap-2.5 flex-wrap">
                    {/* Functional Apple Theme Toggle */}
                    <AppleThemeToggle showLabel={true} />

                    <button
                        onClick={() => navigate('/admin/finance/transactions')}
                        className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                            isLight
                                ? 'bg-white hover:bg-black/[0.04] text-[#1d1d1f] border-black/[0.08] shadow-xs'
                                : 'bg-white/[0.06] hover:bg-white/[0.1] text-white border-white/[0.1] shadow-xs'
                        }`}
                    >
                        <Layers className="w-3.5 h-3.5" />
                        <span>Ledger & Log</span>
                    </button>

                    <button
                        onClick={() => navigate('/admin/finance/transactions')}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all shadow-md cursor-pointer ${
                            isLight
                                ? 'bg-[#28cd41] hover:bg-[#24b73a] text-white shadow-[#28cd4144] hover:shadow-[#28cd4166]'
                                : 'bg-[#30d158] hover:bg-[#28cd41] text-black shadow-[#30d15833] hover:shadow-[#30d15855]'
                        }`}
                    >
                        <Plus className="w-4 h-4" />
                        <span>Record Mutation</span>
                    </button>
                </div>
            </div>

            {isEmpty ? (
                /* Apple Empty State */
                <motion.div
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`flex flex-col items-center justify-center py-20 px-6 rounded-3xl transition-all duration-300 text-center ${
                        isLight
                            ? 'bg-white/85 backdrop-blur-xl border border-black/[0.06] shadow-[0_4px_24px_rgba(0,0,0,0.03)]'
                            : 'bg-[#1c1c1e]/80 backdrop-blur-xl border border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.4)]'
                    }`}
                >
                    <div className="relative mb-6">
                        <div
                            className="absolute -inset-2 rounded-3xl blur-xl opacity-50"
                            style={{ backgroundColor: isLight ? '#28cd4133' : '#30d15822' }}
                        />
                        <div
                            className={`relative w-20 h-20 rounded-3xl flex items-center justify-center ${
                                isLight
                                    ? 'bg-white shadow-[0_8px_24px_rgba(0,0,0,0.08)] border border-black/[0.06] text-emerald-600'
                                    : 'bg-[#2c2c2e] shadow-2xl border border-white/[0.1] text-emerald-400'
                            }`}
                        >
                            <Wallet className="w-10 h-10" />
                        </div>
                    </div>

                    <h3 className={`text-xl font-bold tracking-tight mb-2 ${isLight ? 'text-[#1d1d1f]' : 'text-white'}`}>
                        No Financial Data Yet
                    </h3>
                    <p className={`text-sm mb-6 max-w-md ${isLight ? 'text-[#6e6e73]' : 'text-[#86868b]'}`}>
                        Start tracking your revenue and operations. Record corporate income, reserve splits, operational funding, and team payouts.
                    </p>

                    <button
                        onClick={() => navigate('/admin/finance/transactions')}
                        className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all shadow-md cursor-pointer ${
                            isLight
                                ? 'bg-[#28cd41] hover:bg-[#24b73a] text-white shadow-[#28cd4144]'
                                : 'bg-[#30d158] hover:bg-[#28cd41] text-black shadow-[#30d15833]'
                        }`}
                    >
                        <span>Record First Transaction</span>
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </motion.div>
            ) : (
                <>
                    {/* Stat Cards Component */}
                    <DashboardStatCards
                        monthIncome={data.monthIncome}
                        monthExpense={data.monthExpense}
                        monthDistribution={data.monthDistribution}
                        monthNet={data.monthNet}
                        incomeChange={data.incomeChange}
                        expenseChange={data.expenseChange}
                        netBalance={data.netBalance}
                        totalDistribution={data.totalDistribution}
                    />

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <CorporateCharts monthlyData={data.monthlyData} />
                        <ExpensePieChart categoryBreakdown={data.categoryBreakdown} />
                    </div>

                    {/* Bottom Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <RecentMutations
                            recentTransactions={data.recentTransactions}
                            onNavigate={() => navigate('/admin/finance/transactions')}
                        />
                        <SavingsGoalsWidget
                            savingsGoals={data.savingsGoals}
                            totalIncome={data.totalIncome}
                            totalExpense={data.totalExpense}
                            totalDistribution={data.totalDistribution}
                            netBalance={data.netBalance}
                        />
                    </div>
                </>
            )}
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
