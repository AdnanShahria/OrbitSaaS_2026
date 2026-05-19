import { PieChart as PieChartIcon } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

interface ExpensePieChartProps {
    categoryBreakdown: { category: string; total: number }[];
}

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#6366F1'];

function formatCurrency(amount: number) {
    return `৳${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export default function ExpensePieChart({ categoryBreakdown }: ExpensePieChartProps) {
    return (
        <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-4">
                <PieChartIcon className="w-4 h-4 text-amber-500" />
                Expense Categories
            </h3>
            {categoryBreakdown.length > 0 ? (
                <>
                    <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                            <Pie
                                data={categoryBreakdown}
                                dataKey="total"
                                nameKey="category"
                                cx="50%" cy="50%"
                                innerRadius={50} outerRadius={75}
                                paddingAngle={2}
                                strokeWidth={0}
                            >
                                {categoryBreakdown.map((_, i) => (
                                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ background: '#0f1419', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }} />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-1.5 mt-2 max-h-[120px] overflow-y-auto custom-scrollbar">
                        {categoryBreakdown.slice(0, 6).map((c, i) => (
                            <div key={c.category} className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                    <span className="text-muted-foreground truncate max-w-[120px]">{c.category}</span>
                                </div>
                                <span className="font-semibold text-foreground">{formatCurrency(c.total)}</span>
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">No expenses yet</div>
            )}
        </div>
    );
}
