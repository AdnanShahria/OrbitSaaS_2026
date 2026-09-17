import { CreditCard, ArrowUpRight, TrendingUp, TrendingDown, Users } from 'lucide-react';
import { useFinanceTheme } from './FinanceThemeContext';

interface RecentMutationsProps {
    recentTransactions: any[];
    onNavigate: () => void;
}

function formatCurrency(amount: number) {
    return `৳${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export default function RecentMutations({ recentTransactions, onNavigate }: RecentMutationsProps) {
    const { isLight } = useFinanceTheme();

    return (
        <div
            className={`rounded-3xl p-5 sm:p-6 transition-all duration-300 ${
                isLight
                    ? 'bg-white/85 backdrop-blur-xl border border-black/[0.06] shadow-[0_4px_24px_rgba(0,0,0,0.03)]'
                    : 'bg-[#1c1c1e]/80 backdrop-blur-xl border border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.4)]'
            }`}
        >
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isLight ? 'bg-blue-500/10 text-blue-600' : 'bg-blue-500/15 text-blue-400'}`}>
                        <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                        <h3 className={`text-sm font-bold ${isLight ? 'text-[#1d1d1f]' : 'text-white'}`}>
                            Recent Mutations
                        </h3>
                        <p className={`text-[11px] ${isLight ? 'text-[#6e6e73]' : 'text-[#86868b]'}`}>
                            Latest Flow Activity
                        </p>
                    </div>
                </div>

                <button
                    onClick={onNavigate}
                    className={`text-xs font-semibold flex items-center gap-1 px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                        isLight
                            ? 'text-[#0071e3] bg-[#0071e3]/10 hover:bg-[#0071e3]/15'
                            : 'text-[#0a84ff] bg-[#0a84ff]/10 hover:bg-[#0a84ff]/20'
                    }`}
                >
                    View All <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
            </div>

            <div className="space-y-1.5">
                {recentTransactions.length > 0 ? (
                    recentTransactions.slice(0, 6).map((t: any) => (
                        <div
                            key={t.id}
                            className={`flex items-center justify-between py-2.5 px-3 rounded-2xl transition-colors cursor-pointer ${
                                isLight ? 'hover:bg-black/[0.03]' : 'hover:bg-white/[0.04]'
                            }`}
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <div
                                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                        t.type === 'income'
                                            ? (isLight ? 'bg-emerald-500/10 text-emerald-600' : 'bg-emerald-500/15 text-emerald-400')
                                            : t.type === 'expense'
                                            ? (isLight ? 'bg-rose-500/10 text-rose-600' : 'bg-rose-500/15 text-rose-400')
                                            : (isLight ? 'bg-indigo-500/10 text-indigo-600' : 'bg-indigo-500/15 text-indigo-400')
                                    }`}
                                >
                                    {t.type === 'income' ? (
                                        <TrendingUp className="w-4 h-4" />
                                    ) : t.type === 'expense' ? (
                                        <TrendingDown className="w-4 h-4" />
                                    ) : (
                                        <Users className="w-4 h-4" />
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <p className={`text-sm font-semibold truncate ${isLight ? 'text-[#1d1d1f]' : 'text-white'}`}>
                                        {t.description}
                                    </p>
                                    <p className={`text-[11px] ${isLight ? 'text-[#6e6e73]' : 'text-[#86868b]'}`}>
                                        {t.type === 'distribution' ? `To: ${t.recipient}` : t.category} · {t.date}
                                    </p>
                                </div>
                            </div>
                            <span
                                className={`text-sm font-bold font-mono shrink-0 ${
                                    t.type === 'income'
                                        ? (isLight ? 'text-emerald-600' : 'text-emerald-400')
                                        : t.type === 'expense'
                                        ? (isLight ? 'text-rose-600' : 'text-rose-400')
                                        : (isLight ? 'text-indigo-600' : 'text-indigo-400')
                                }`}
                            >
                                {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                            </span>
                        </div>
                    ))
                ) : (
                    <div className={`py-10 text-center text-sm font-medium ${isLight ? 'text-[#86868b]' : 'text-neutral-500'}`}>
                        No transactions recorded yet
                    </div>
                )}
            </div>
        </div>
    );
}
