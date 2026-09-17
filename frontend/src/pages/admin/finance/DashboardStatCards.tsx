import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, Share2, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useFinanceTheme } from './FinanceThemeContext';

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

interface StatCardConfig {
    title: string;
    value: number;
    change?: number | null;
    icon: any;
    accentColor: string;
    lightTint: string;
    darkTint: string;
    isLight: boolean;
}

const StatCard = ({ title, value, change, icon: Icon, accentColor, lightTint, darkTint, isLight }: StatCardConfig) => {
    const isPositive = change !== undefined && change !== null && change >= 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -3, transition: { duration: 0.2 } }}
            className={`rounded-3xl p-5 sm:p-6 relative overflow-hidden transition-all duration-300 ${
                isLight
                    ? 'bg-white/85 backdrop-blur-xl border border-black/[0.06] shadow-[0_4px_24px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_36px_rgba(0,0,0,0.08)] hover:border-black/[0.12]'
                    : 'bg-[#1c1c1e]/80 backdrop-blur-xl border border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.4)] hover:shadow-[0_12px_36px_rgba(0,0,0,0.6)] hover:border-white/[0.16]'
            }`}
        >
            {/* Subtle Apple ambient glow on card corner */}
            <div
                className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-2xl pointer-events-none opacity-40 transition-opacity duration-500"
                style={{ backgroundColor: isLight ? lightTint : darkTint }}
            />

            <div className="relative flex items-start justify-between gap-3">
                <div className="space-y-2.5">
                    <p className={`text-[11px] font-semibold tracking-wider uppercase ${isLight ? 'text-[#6e6e73]' : 'text-[#86868b]'}`}>
                        {title}
                    </p>
                    <p className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isLight ? 'text-[#1d1d1f]' : 'text-white'}`}>
                        {formatCurrency(value)}
                    </p>
                    {change !== undefined && change !== null && (
                        <div className="flex items-center gap-1.5 pt-0.5">
                            <span
                                className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                                    isPositive
                                        ? (isLight ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20' : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30')
                                        : (isLight ? 'bg-rose-500/10 text-rose-700 border border-rose-500/20' : 'bg-rose-500/15 text-rose-400 border border-rose-500/30')
                                }`}
                            >
                                {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                {Math.abs(change).toFixed(1)}%
                            </span>
                            <span className={`text-[11px] ${isLight ? 'text-[#86868b]' : 'text-[#636366]'}`}>vs last month</span>
                        </div>
                    )}
                </div>

                <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs transition-transform duration-300 group-hover:scale-105 ${
                        isLight
                            ? 'bg-black/[0.03] border border-black/[0.04]'
                            : 'bg-white/[0.06] border border-white/[0.08]'
                    }`}
                    style={{ color: accentColor }}
                >
                    <Icon className="w-5 h-5" style={{ color: accentColor }} />
                </div>
            </div>
        </motion.div>
    );
};

export default function DashboardStatCards({
    monthIncome,
    monthExpense,
    monthDistribution,
    monthNet,
    incomeChange,
    expenseChange
}: StatCardsProps) {
    const { isLight } = useFinanceTheme();

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
                title="This Month Income"
                value={monthIncome}
                change={incomeChange}
                icon={TrendingUp}
                accentColor={isLight ? '#28cd41' : '#30d158'}
                lightTint="#28cd4133"
                darkTint="#30d15822"
                isLight={isLight}
            />
            <StatCard
                title="Expense (Funding)"
                value={monthExpense}
                change={expenseChange}
                icon={TrendingDown}
                accentColor={isLight ? '#ff3b30' : '#ff453a'}
                lightTint="#ff3b3033"
                darkTint="#ff453a22"
                isLight={isLight}
            />
            <StatCard
                title="Distributions Shared"
                value={monthDistribution}
                change={null}
                icon={Share2}
                accentColor={isLight ? '#5856d6' : '#5e5ce6'}
                lightTint="#5856d633"
                darkTint="#5e5ce622"
                isLight={isLight}
            />
            <StatCard
                title="Net Balance"
                value={monthNet}
                change={null}
                icon={DollarSign}
                accentColor={monthNet >= 0 ? (isLight ? '#0071e3' : '#0a84ff') : (isLight ? '#ff3b30' : '#ff453a')}
                lightTint="#0071e333"
                darkTint="#0a84ff22"
                isLight={isLight}
            />
        </div>
    );
}
