import { Target, BarChart3 } from 'lucide-react';

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
    return (
        <div className="space-y-4">
            {/* Savings Goals */}
            <div className="bg-card border border-border rounded-2xl p-5">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-4">
                    <Target className="w-4 h-4 text-blue-500" />
                    Corporate Savings Goals
                </h3>
                {savingsGoals.length > 0 ? (
                    <div className="space-y-3">
                        {savingsGoals.map((g: any) => {
                            const pct = g.target_amount > 0 ? Math.min(100, (g.current_amount / g.target_amount) * 100) : 0;
                            return (
                                <div key={g.id} className="space-y-1.5">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-sm font-medium text-foreground">{g.name}</span>
                                        <span className="text-xs text-muted-foreground">{pct.toFixed(0)}%</span>
                                    </div>
                                    <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                                        <div
                                            className="h-full rounded-full"
                                            style={{
                                                width: `${pct}%`,
                                                background: pct >= 100 ? 'linear-gradient(90deg, #10B981, #34D399)' : pct >= 60 ? 'linear-gradient(90deg, #3B82F6, #60A5FA)' : 'linear-gradient(90deg, #F59E0B, #FBBF24)',
                                                boxShadow: `0 0 8px ${pct >= 100 ? '#10B98166' : pct >= 60 ? '#3B82F666' : '#F59E0B66'}`
                                            }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-[10px] text-muted-foreground">
                                        <span>{formatCurrency(g.current_amount)}</span>
                                        <span>{formatCurrency(g.target_amount)}</span>
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
                        <p className="text-lg font-black text-emerald-400">{formatCurrency(totalIncome)}</p>
                    </div>
                    <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-3 text-center">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Total Funding Expenses</p>
                        <p className="text-lg font-black text-rose-400">{formatCurrency(totalExpense)}</p>
                    </div>
                    <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-3 text-center">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Total Distributions</p>
                        <p className="text-lg font-black text-indigo-400">{formatCurrency(totalDistribution)}</p>
                    </div>
                    <div className={`${netBalance >= 0 ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-red-500/5 border-red-500/10'} border rounded-xl p-3 text-center`}>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Net Balance</p>
                        <p className={`text-lg font-black ${netBalance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatCurrency(netBalance)}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
