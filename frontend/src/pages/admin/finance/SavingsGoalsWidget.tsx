import { Target, BarChart3 } from 'lucide-react';
import { useFinanceTheme } from './FinanceThemeContext';

interface SavingsGoalsWidgetProps {
    savingsGoals: any[];
    totalIncome: number;
    totalExpense: number;
    totalDistribution: number;
    netBalance: number;
}

function formatCurrency(amount: number) {
    return `৳${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export default function SavingsGoalsWidget({
    savingsGoals,
    totalIncome,
    totalExpense,
    totalDistribution,
    netBalance
}: SavingsGoalsWidgetProps) {
    const { isLight } = useFinanceTheme();

    return (
        <div className="space-y-4">
            {/* Savings Goals */}
            <div
                className={`rounded-3xl p-5 sm:p-6 transition-all duration-300 ${
                    isLight
                        ? 'bg-white/85 backdrop-blur-xl border border-black/[0.06] shadow-[0_4px_24px_rgba(0,0,0,0.03)]'
                        : 'bg-[#1c1c1e]/80 backdrop-blur-xl border border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.4)]'
                }`}
            >
                <div className="flex items-center gap-2.5 mb-4">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isLight ? 'bg-indigo-500/10 text-indigo-600' : 'bg-indigo-500/15 text-indigo-400'}`}>
                        <Target className="w-4 h-4" />
                    </div>
                    <div>
                        <h3 className={`text-sm font-bold ${isLight ? 'text-[#1d1d1f]' : 'text-white'}`}>
                            Corporate Savings & Reserves
                        </h3>
                        <p className={`text-[11px] ${isLight ? 'text-[#6e6e73]' : 'text-[#86868b]'}`}>
                            Target Milestones
                        </p>
                    </div>
                </div>

                {savingsGoals.length > 0 ? (
                    <div className="space-y-3.5">
                        {savingsGoals.map((g: any) => {
                            const pct = g.target_amount > 0 ? Math.min(100, (g.current_amount / g.target_amount) * 100) : 0;
                            return (
                                <div key={g.id} className="space-y-1.5">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className={`font-semibold ${isLight ? 'text-[#1d1d1f]' : 'text-white'}`}>{g.name}</span>
                                        <span className={`font-mono font-bold ${isLight ? 'text-[#0071e3]' : 'text-[#0a84ff]'}`}>{pct.toFixed(0)}%</span>
                                    </div>
                                    <div className={`w-full h-2 rounded-full overflow-hidden ${isLight ? 'bg-black/[0.06]' : 'bg-white/[0.08]'}`}>
                                        <div
                                            className="h-full rounded-full transition-all duration-500 ease-out"
                                            style={{
                                                width: `${pct}%`,
                                                background: pct >= 100
                                                    ? 'linear-gradient(90deg, #28cd41, #34c759)'
                                                    : pct >= 60
                                                    ? 'linear-gradient(90deg, #0071e3, #5ac8fa)'
                                                    : 'linear-gradient(90deg, #ff9500, #ffcc00)',
                                                boxShadow: `0 0 10px ${pct >= 100 ? '#28cd4155' : pct >= 60 ? '#0071e355' : '#ff950055'}`
                                            }}
                                        />
                                    </div>
                                    <div className={`flex justify-between text-[11px] font-mono ${isLight ? 'text-[#86868b]' : 'text-[#636366]'}`}>
                                        <span>Current: {formatCurrency(g.current_amount)}</span>
                                        <span>Target: {formatCurrency(g.target_amount)}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className={`py-6 text-center text-xs font-medium ${isLight ? 'text-[#86868b]' : 'text-neutral-500'}`}>
                        No reserve goals configured
                    </div>
                )}
            </div>

            {/* Quick Stats */}
            <div
                className={`rounded-3xl p-5 sm:p-6 transition-all duration-300 ${
                    isLight
                        ? 'bg-white/85 backdrop-blur-xl border border-black/[0.06] shadow-[0_4px_24px_rgba(0,0,0,0.03)]'
                        : 'bg-[#1c1c1e]/80 backdrop-blur-xl border border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.4)]'
                }`}
            >
                <div className="flex items-center gap-2.5 mb-4">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isLight ? 'bg-purple-500/10 text-purple-600' : 'bg-purple-500/15 text-purple-400'}`}>
                        <BarChart3 className="w-4 h-4" />
                    </div>
                    <div>
                        <h3 className={`text-sm font-bold ${isLight ? 'text-[#1d1d1f]' : 'text-white'}`}>
                            All-Time Summary
                        </h3>
                        <p className={`text-[11px] ${isLight ? 'text-[#6e6e73]' : 'text-[#86868b]'}`}>
                            Cumulative Corporate Metrics
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className={`rounded-2xl p-3.5 text-center transition-all ${isLight ? 'bg-emerald-500/[0.06] border border-emerald-500/15' : 'bg-emerald-500/10 border border-emerald-500/20'}`}>
                        <p className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${isLight ? 'text-emerald-800' : 'text-emerald-300'}`}>Total Income</p>
                        <p className={`text-lg font-black font-mono ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>{formatCurrency(totalIncome)}</p>
                    </div>
                    <div className={`rounded-2xl p-3.5 text-center transition-all ${isLight ? 'bg-rose-500/[0.06] border border-rose-500/15' : 'bg-rose-500/10 border border-rose-500/20'}`}>
                        <p className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${isLight ? 'text-rose-800' : 'text-rose-300'}`}>Funding Expenses</p>
                        <p className={`text-lg font-black font-mono ${isLight ? 'text-rose-700' : 'text-rose-400'}`}>{formatCurrency(totalExpense)}</p>
                    </div>
                    <div className={`rounded-2xl p-3.5 text-center transition-all ${isLight ? 'bg-indigo-500/[0.06] border border-indigo-500/15' : 'bg-indigo-500/10 border border-indigo-500/20'}`}>
                        <p className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${isLight ? 'text-indigo-800' : 'text-indigo-300'}`}>Distributions</p>
                        <p className={`text-lg font-black font-mono ${isLight ? 'text-indigo-700' : 'text-indigo-400'}`}>{formatCurrency(totalDistribution)}</p>
                    </div>
                    <div className={`rounded-2xl p-3.5 text-center transition-all ${
                        netBalance >= 0
                            ? (isLight ? 'bg-blue-500/[0.06] border border-blue-500/15' : 'bg-blue-500/10 border border-blue-500/20')
                            : (isLight ? 'bg-rose-500/[0.06] border border-rose-500/15' : 'bg-rose-500/10 border border-rose-500/20')
                    }`}>
                        <p className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${
                            netBalance >= 0 ? (isLight ? 'text-blue-800' : 'text-blue-300') : (isLight ? 'text-rose-800' : 'text-rose-300')
                        }`}>Net Balance</p>
                        <p className={`text-lg font-black font-mono ${
                            netBalance >= 0 ? (isLight ? 'text-blue-700' : 'text-blue-400') : (isLight ? 'text-rose-700' : 'text-rose-400')
                        }`}>{formatCurrency(netBalance)}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
