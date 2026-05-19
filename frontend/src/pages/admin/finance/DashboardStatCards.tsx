import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, Share2, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface StatCardsProps {
    monthIncome: number;
    monthExpense: number;
    monthDistribution: number;
    monthNet: number;
    incomeChange: number;
    expenseChange: number;
}

function formatCurrency(amount: number) {
    return `৳${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

const StatCard = ({ title, value, change, icon: Icon, color }: any) => (
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
                    {formatCurrency(value)}
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

export default function DashboardStatCards({
    monthIncome,
    monthExpense,
    monthDistribution,
    monthNet,
    incomeChange,
    expenseChange
}: StatCardsProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="This Month Income" value={monthIncome} change={incomeChange} icon={TrendingUp} color="#10B981" />
            <StatCard title="Expense (Funding)" value={monthExpense} change={expenseChange} icon={TrendingDown} color="#F43F5E" />
            <StatCard title="Distributions Shared" value={monthDistribution} change={null} icon={Share2} color="#818CF8" />
            <StatCard title="Net Balance" value={monthNet} change={null} icon={DollarSign} color={monthNet >= 0 ? '#10B981' : '#EF4444'} />
        </div>
    );
}
