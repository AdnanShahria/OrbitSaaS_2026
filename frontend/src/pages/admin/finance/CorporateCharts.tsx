import { BarChart3 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useFinanceTheme } from './FinanceThemeContext';

interface CorporateChartsProps {
    monthlyData: { month: string; income: number; expense: number; distribution: number; net: number }[];
}

function formatCurrency(amount: number) {
    return `৳${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatMonth(m: string) {
    if (!m) return '';
    const [y, mo] = m.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[parseInt(mo) - 1]} ${y.slice(2)}`;
}

const CustomTooltip = ({ active, payload, label, isLight }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div
            className={`backdrop-blur-xl rounded-2xl px-4 py-3 transition-all duration-200 ${
                isLight
                    ? 'bg-white/95 border border-black/[0.08] shadow-[0_12px_32px_rgba(0,0,0,0.12)]'
                    : 'bg-[#1c1c1e]/95 border border-white/[0.12] shadow-2xl'
            }`}
        >
            <p className={`text-xs font-bold mb-2 ${isLight ? 'text-[#6e6e73]' : 'text-[#86868b]'}`}>
                {formatMonth(label)}
            </p>
            <div className="space-y-1">
                {payload.map((p: any, i: number) => (
                    <div key={i} className="text-xs font-semibold flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                            <span className={isLight ? 'text-[#1d1d1f]' : 'text-neutral-200'}>{p.name}:</span>
                        </div>
                        <span className="font-mono font-bold" style={{ color: p.color }}>
                            {formatCurrency(p.value)}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default function CorporateCharts({ monthlyData }: CorporateChartsProps) {
    const { isLight } = useFinanceTheme();

    const incomeColor = isLight ? '#28cd41' : '#30d158';
    const expenseColor = isLight ? '#ff3b30' : '#ff453a';
    const distColor = isLight ? '#5856d6' : '#5e5ce6';
    const axisColor = isLight ? '#86868b' : '#636366';
    const gridColor = isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)';

    return (
        <div
            className={`lg:col-span-2 rounded-3xl p-5 sm:p-6 transition-all duration-300 ${
                isLight
                    ? 'bg-white/85 backdrop-blur-xl border border-black/[0.06] shadow-[0_4px_24px_rgba(0,0,0,0.03)]'
                    : 'bg-[#1c1c1e]/80 backdrop-blur-xl border border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.4)]'
            }`}
        >
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isLight ? 'bg-emerald-500/10 text-emerald-600' : 'bg-emerald-500/15 text-emerald-400'}`}>
                        <BarChart3 className="w-4 h-4" />
                    </div>
                    <div>
                        <h3 className={`text-sm font-bold ${isLight ? 'text-[#1d1d1f]' : 'text-white'}`}>
                            Corporate Flow History
                        </h3>
                        <p className={`text-[11px] ${isLight ? 'text-[#6e6e73]' : 'text-[#86868b]'}`}>
                            Income vs Expense & Distributions
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 text-[11px] font-medium">
                    <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: incomeColor }} />
                        <span className={isLight ? 'text-[#6e6e73]' : 'text-[#86868b]'}>Income</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: expenseColor }} />
                        <span className={isLight ? 'text-[#6e6e73]' : 'text-[#86868b]'}>Expense</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: distColor }} />
                        <span className={isLight ? 'text-[#6e6e73]' : 'text-[#86868b]'}>Split</span>
                    </div>
                </div>
            </div>

            {monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="appleIncomeGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={incomeColor} stopOpacity={isLight ? 0.35 : 0.4} />
                                <stop offset="95%" stopColor={incomeColor} stopOpacity={0.0} />
                            </linearGradient>
                            <linearGradient id="appleExpenseGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={expenseColor} stopOpacity={isLight ? 0.3 : 0.35} />
                                <stop offset="95%" stopColor={expenseColor} stopOpacity={0.0} />
                            </linearGradient>
                            <linearGradient id="appleDistGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={distColor} stopOpacity={isLight ? 0.25 : 0.3} />
                                <stop offset="95%" stopColor={distColor} stopOpacity={0.0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                        <XAxis
                            dataKey="month"
                            tickFormatter={formatMonth}
                            tick={{ fill: axisColor, fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            tick={{ fill: axisColor, fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(v) => `৳${(v / 1000).toFixed(0)}k`}
                        />
                        <Tooltip content={<CustomTooltip isLight={isLight} />} />
                        <Area
                            type="monotone"
                            dataKey="income"
                            name="Income"
                            stroke={incomeColor}
                            fill="url(#appleIncomeGrad)"
                            strokeWidth={2.5}
                            dot={false}
                        />
                        <Area
                            type="monotone"
                            dataKey="expense"
                            name="Expense"
                            stroke={expenseColor}
                            fill="url(#appleExpenseGrad)"
                            strokeWidth={2}
                            dot={false}
                        />
                        <Area
                            type="monotone"
                            dataKey="distribution"
                            name="Distribution"
                            stroke={distColor}
                            fill="url(#appleDistGrad)"
                            strokeWidth={2}
                            dot={false}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            ) : (
                <div className={`h-[280px] flex items-center justify-center text-sm font-medium ${isLight ? 'text-[#86868b]' : 'text-neutral-500'}`}>
                    No historical flow data yet
                </div>
            )}
        </div>
    );
}
