import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { SectionHeader } from '@/components/admin/EditorComponents';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { Plus, RefreshCw, Loader2, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Import our decoupled subcomponents
import DashboardStatCards from './DashboardStatCards';
import CorporateCharts from './CorporateCharts';
import ExpensePieChart from './ExpensePieChart';
import RecentMutations from './RecentMutations';
import SavingsGoalsWidget from './SavingsGoalsWidget';

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


    useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-64 mb-2" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
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
                <SectionHeader title="💰 Financial Command Center" description="Monitor SaaS Income, Operational Funding, and Partitioned Distribution Splits." />
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => navigate('/admin/finance/transactions')}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors text-sm font-semibold shadow-lg shadow-emerald-500/20"
                    >
                        <Plus className="w-4 h-4" /> Record
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
                        Start tracking your income and expenses. Record your corporate categories, budgets, savings goals, and transactional history!
                    </p>
                    <div className="flex gap-3">
                        <button onClick={() => navigate('/admin/finance/transactions')} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 text-sm font-semibold">
                            Record Transaction
                        </button>
                    </div>
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
                    />

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {/* Decoupled AreaChart component */}
                        <CorporateCharts monthlyData={data.monthlyData} />

                        {/* Decoupled PieChart component */}
                        <ExpensePieChart categoryBreakdown={data.categoryBreakdown} />
                    </div>

                    {/* Bottom Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Decoupled Recent Mutations component */}
                        <RecentMutations
                            recentTransactions={data.recentTransactions}
                            onNavigate={() => navigate('/admin/finance/transactions')}
                        />

                        {/* Decoupled Reserves/Savings goals component */}
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
