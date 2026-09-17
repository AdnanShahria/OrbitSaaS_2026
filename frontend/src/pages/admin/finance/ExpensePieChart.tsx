import { PieChart as PieChartIcon } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useFinanceTheme } from './FinanceThemeContext';

interface ExpensePieChartProps {
    categoryBreakdown: { category: string; total: number }[];
}

// Apple HIG harmonious palette
const APPLE_COLORS = ['#34c759', '#0071e3', '#ff9500', '#ff3b30', '#af52de', '#ff2d55', '#5856d6', '#5ac8fa', '#ffcc00'];

function formatCurrency(amount: number) {
    return `৳${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export default function ExpensePieChart({ categoryBreakdown }: ExpensePieChartProps) {
    const { isLight } = useFinanceTheme();

    return (
        <div
            className={`rounded-3xl p-5 sm:p-6 flex flex-col justify-between transition-all duration-300 ${
                isLight
                    ? 'bg-white/85 backdrop-blur-xl border border-black/[0.06] shadow-[0_4px_24px_rgba(0,0,0,0.03)]'
                    : 'bg-[#1c1c1e]/80 backdrop-blur-xl border border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.4)]'
            }`}
        >
            <div className="flex items-center gap-2.5 mb-4">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isLight ? 'bg-amber-500/10 text-amber-600' : 'bg-amber-500/15 text-amber-400'}`}>
                    <PieChartIcon className="w-4 h-4" />
                </div>
                <div>
                    <h3 className={`text-sm font-bold ${isLight ? 'text-[#1d1d1f]' : 'text-white'}`}>
                        Expense Categories
                    </h3>
                    <p className={`text-[11px] ${isLight ? 'text-[#6e6e73]' : 'text-[#86868b]'}`}>
                        Funding Allocation Split
                    </p>
                </div>
            </div>

            {categoryBreakdown.length > 0 ? (
                <>
                    <div className="relative py-1">
                        <ResponsiveContainer width="100%" height={175}>
                            <PieChart>
                                <Pie
                                    data={categoryBreakdown}
                                    dataKey="total"
                                    nameKey="category"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={75}
                                    paddingAngle={3}
                                    strokeWidth={0}
                                >
                                    {categoryBreakdown.map((_, i) => (
                                        <Cell key={i} fill={APPLE_COLORS[i % APPLE_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(v: number) => [formatCurrency(v), 'Amount']}
                                    contentStyle={{
                                        background: isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(28, 28, 30, 0.95)',
                                        backdropFilter: 'blur(16px)',
                                        border: isLight ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(255, 255, 255, 0.12)',
                                        borderRadius: '16px',
                                        boxShadow: isLight ? '0 12px 32px rgba(0,0,0,0.1)' : '0 16px 40px rgba(0,0,0,0.5)',
                                        fontSize: '12px',
                                        color: isLight ? '#1d1d1f' : '#ffffff',
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="space-y-1.5 mt-2 max-h-[130px] overflow-y-auto custom-scrollbar pr-1">
                        {categoryBreakdown.slice(0, 6).map((c, i) => (
                            <div
                                key={c.category}
                                className={`flex items-center justify-between text-xs px-2.5 py-1.5 rounded-xl transition-colors ${
                                    isLight ? 'hover:bg-black/[0.03]' : 'hover:bg-white/[0.04]'
                                }`}
                            >
                                <div className="flex items-center gap-2 min-w-0">
                                    <div
                                        className="w-2.5 h-2.5 rounded-full shrink-0"
                                        style={{ backgroundColor: APPLE_COLORS[i % APPLE_COLORS.length] }}
                                    />
                                    <span className={`truncate max-w-[130px] font-medium ${isLight ? 'text-[#1d1d1f]' : 'text-neutral-300'}`}>
                                        {c.category}
                                    </span>
                                </div>
                                <span className={`font-bold font-mono ${isLight ? 'text-[#1d1d1f]' : 'text-white'}`}>
                                    {formatCurrency(c.total)}
                                </span>
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <div className={`h-[200px] flex items-center justify-center text-sm font-medium ${isLight ? 'text-[#86868b]' : 'text-neutral-500'}`}>
                    No recorded expenses yet
                </div>
            )}
        </div>
    );
}
