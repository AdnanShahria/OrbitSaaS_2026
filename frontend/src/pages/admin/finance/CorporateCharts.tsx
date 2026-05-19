import { BarChart3 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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

const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-[#0f1419] border border-white/10 rounded-xl px-4 py-3 shadow-2xl">
            <p className="text-xs font-bold text-muted-foreground mb-2">{formatMonth(label)}</p>
            {payload.map((p: any, i: number) => (
                <p key={i} className="text-sm font-semibold flex items-center gap-2" style={{ color: p.color }}>
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                    {p.name}: {formatCurrency(p.value)}
                </p>
            ))}
        </div>
    );
};

export default function CorporateCharts({ monthlyData }: CorporateChartsProps) {
    return (
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-emerald-500" />
                    Corporate Income vs Expense & Distribution
                </h3>
                <span className="text-xs text-muted-foreground">Historical Breakdown</span>
            </div>
            {monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={monthlyData}>
                        <defs>
                            <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#F43F5E" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="distGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#818CF8" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#818CF8" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                        <XAxis dataKey="month" tickFormatter={formatMonth} tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `৳${(v / 1000).toFixed(0)}k`} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="income" name="Income" stroke="#10B981" fill="url(#incomeGrad)" strokeWidth={2.5} dot={false} />
                        <Area type="monotone" dataKey="expense" name="Expense (Funding)" stroke="#F43F5E" fill="url(#expenseGrad)" strokeWidth={2} dot={false} />
                        <Area type="monotone" dataKey="distribution" name="Distributions" stroke="#818CF8" fill="url(#distGrad)" strokeWidth={2} dot={false} />
                    </AreaChart>
                </ResponsiveContainer>
            ) : (
                <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">No monthly data yet</div>
            )}
        </div>
    );
}
