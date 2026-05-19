import { CreditCard, ArrowUpRight, TrendingUp, TrendingDown, Users } from 'lucide-react';

interface RecentMutationsProps {
    recentTransactions: any[];
    onNavigate: () => void;
}

function formatCurrency(amount: number) {
    return `৳${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export default function RecentMutations({ recentTransactions, onNavigate }: RecentMutationsProps) {
    return (
        <div className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-blue-500" />
                    Recent Corporate Mutations
                </h3>
                <button onClick={onNavigate} className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1">
                    View All <ArrowUpRight className="w-3 h-3" />
                </button>
            </div>
            <div className="space-y-2">
                {recentTransactions.length > 0 ? recentTransactions.slice(0, 7).map((t: any) => (
                    <div key={t.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-secondary/30 transition-colors text-xs">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${t.type === 'income' ? 'bg-emerald-500/10' : t.type === 'expense' ? 'bg-rose-500/10' : 'bg-indigo-500/10'}`}>
                                {t.type === 'income' ? <TrendingUp className="w-4 h-4 text-emerald-500" /> : t.type === 'expense' ? <TrendingDown className="w-4 h-4 text-rose-500" /> : <Users className="w-4 h-4 text-indigo-500" />}
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">{t.description}</p>
                                <p className="text-[10px] text-muted-foreground">
                                    {t.type === 'distribution' ? `Recipient: ${t.recipient}` : t.category} · {t.date}
                                </p>
                            </div>
                        </div>
                        <span className={`text-sm font-bold shrink-0 ${t.type === 'income' ? 'text-emerald-400' : t.type === 'expense' ? 'text-rose-400' : 'text-indigo-400'}`}>
                            {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                        </span>
                    </div>
                )) : (
                    <div className="py-8 text-center text-muted-foreground text-sm">No transactions yet</div>
                )}
            </div>
        </div>
    );
}
