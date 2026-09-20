import { useState, useRef, useEffect } from 'react';
import { BarChart3, TrendingUp } from 'lucide-react';
import {
    ComposedChart, AreaChart, Area, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, ReferenceLine, Legend
} from 'recharts';
import { useFinanceTheme } from './FinanceThemeContext';
import { motion } from 'framer-motion';

interface CorporateChartsProps {
    monthlyData: { month: string; income: number; expense: number; distribution: number; net: number }[];
}

function formatCurrency(amount: number) {
    if (amount >= 100000) return `৳${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `৳${(amount / 1000).toFixed(0)}k`;
    return `৳${amount.toLocaleString()}`;
}

function formatMonth(m: string) {
    if (!m) return '';
    const [y, mo] = m.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[parseInt(mo) - 1]} '${y.slice(2)}`;
}

const CustomTooltip = ({ active, payload, label, isLight }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.15 }}
            className={`backdrop-blur-xl rounded-2xl px-4 py-3.5 min-w-[170px] ${
                isLight
                    ? 'bg-white/98 border border-black/[0.08] shadow-[0_12px_32px_rgba(0,0,0,0.14)]'
                    : 'bg-[#1c1c1e]/98 border border-white/[0.14] shadow-[0_16px_40px_rgba(0,0,0,0.6)]'
            }`}
        >
            <p className={`text-[11px] font-bold mb-2.5 tracking-wide uppercase ${isLight ? 'text-[#6e6e73]' : 'text-[#86868b]'}`}>
                {formatMonth(label)}
            </p>
            <div className="space-y-1.5">
                {payload.map((p: any, i: number) => (
                    <div key={i} className="text-xs font-semibold flex items-center justify-between gap-5">
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: p.color, boxShadow: `0 0 6px ${p.color}88` }} />
                            <span className={isLight ? 'text-[#3a3a3c]' : 'text-neutral-300'}>{p.name}</span>
                        </div>
                        <span className="font-mono font-bold tabular-nums" style={{ color: p.color }}>
                            {formatCurrency(p.value)}
                        </span>
                    </div>
                ))}
            </div>
            {/* Net line */}
            {payload[0] && (
                <div className={`mt-2.5 pt-2 border-t text-xs flex items-center justify-between ${isLight ? 'border-black/[0.06] text-[#6e6e73]' : 'border-white/[0.08] text-[#636366]'}`}>
                    <span className="font-semibold">Net</span>
                    <span className={`font-mono font-bold tabular-nums ${
                        (payload.find((p: any) => p.dataKey === 'net')?.value ?? 0) >= 0
                            ? (isLight ? 'text-[#28cd41]' : 'text-[#30d158]')
                            : (isLight ? 'text-[#ff3b30]' : 'text-[#ff453a]')
                    }`}>
                        {formatCurrency(payload.find((p: any) => p.dataKey === 'net')?.value ?? 0)}
                    </span>
                </div>
            )}
        </motion.div>
    );
};

// Animated dot for active point
const ActiveDot = (props: any) => {
    const { cx, cy, fill } = props;
    return (
        <g>
            <circle cx={cx} cy={cy} r={8} fill={fill} fillOpacity={0.2} />
            <circle cx={cx} cy={cy} r={4.5} fill={fill} stroke="white" strokeWidth={1.5} />
        </g>
    );
};

export default function CorporateCharts({ monthlyData }: CorporateChartsProps) {
    const { isLight } = useFinanceTheme();
    const [animated, setAnimated] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Trigger animation on mount via IntersectionObserver
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) { setAnimated(true); observer.disconnect(); } },
            { threshold: 0.2 }
        );
        if (containerRef.current) observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    const incomeColor  = isLight ? '#28cd41' : '#30d158';
    const expenseColor = isLight ? '#ff3b30' : '#ff453a';
    const distColor    = isLight ? '#5856d6' : '#5e5ce6';
    const axisColor    = isLight ? '#86868b' : '#636366';
    const gridColor    = isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)';

    // Pad data so single-point or sparse data still renders meaningful lines
    // If only 1 data point, duplicate it to avoid "dot-only" render
    const chartData = monthlyData.length === 1
        ? [monthlyData[0], { ...monthlyData[0] }]
        : monthlyData;

    const isSinglePoint = monthlyData.length <= 1;

    // Calculate totals for summary badges
    const totalIncome = monthlyData.reduce((s, m) => s + m.income, 0);
    const totalExpense = monthlyData.reduce((s, m) => s + m.expense, 0);
    const totalDist = monthlyData.reduce((s, m) => s + m.distribution, 0);

    return (
        <motion.div
            ref={containerRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            className={`lg:col-span-2 rounded-3xl p-5 sm:p-6 transition-all duration-300 ${
                isLight
                    ? 'bg-white/85 backdrop-blur-xl border border-black/[0.06] shadow-[0_4px_24px_rgba(0,0,0,0.03)]'
                    : 'bg-[#1c1c1e]/80 backdrop-blur-xl border border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.4)]'
            }`}
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isLight ? 'bg-emerald-500/10 text-emerald-600' : 'bg-emerald-500/15 text-emerald-400'}`}>
                        <BarChart3 className="w-4 h-4" />
                    </div>
                    <div>
                        <h3 className={`text-sm font-bold ${isLight ? 'text-[#1d1d1f]' : 'text-white'}`}>
                            Corporate Flow History
                        </h3>
                        <p className={`text-[11px] ${isLight ? 'text-[#6e6e73]' : 'text-[#86868b]'}`}>
                            {monthlyData.length} month{monthlyData.length !== 1 ? 's' : ''} · Income vs Expense &amp; Distributions
                        </p>
                    </div>
                </div>

                {/* Legend pills */}
                <div className="flex flex-wrap gap-1.5 justify-end">
                    {[
                        { color: incomeColor, label: 'Income' },
                        { color: expenseColor, label: 'Expense' },
                        { color: distColor, label: 'Split' },
                    ].map(({ color, label }) => (
                        <div
                            key={label}
                            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                isLight ? 'bg-black/[0.04]' : 'bg-white/[0.06]'
                            }`}
                        >
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 4px ${color}` }} />
                            <span className={isLight ? 'text-[#6e6e73]' : 'text-[#86868b]'}>{label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Summary totals strip */}
            <div className={`flex gap-3 mb-4 p-3 rounded-2xl ${isLight ? 'bg-black/[0.02]' : 'bg-white/[0.03]'}`}>
                {[
                    { label: 'Total Income', value: totalIncome, color: incomeColor },
                    { label: 'Total Expense', value: totalExpense, color: expenseColor },
                    { label: 'Distributions', value: totalDist, color: distColor },
                ].map(({ label, value, color }) => (
                    <div key={label} className="flex-1 text-center">
                        <p className={`text-[10px] font-semibold uppercase tracking-wider mb-0.5 ${isLight ? 'text-[#86868b]' : 'text-[#636366]'}`}>{label}</p>
                        <p className="text-sm font-black font-mono tabular-nums" style={{ color }}>{formatCurrency(value)}</p>
                    </div>
                ))}
            </div>

            {/* Chart */}
            {monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                    <AreaChart
                        data={chartData}
                        margin={{ top: 8, right: 4, left: -24, bottom: 0 }}
                    >
                        <defs>
                            {[
                                { id: 'incomeGrad', color: incomeColor, op: isLight ? 0.4 : 0.45 },
                                { id: 'expenseGrad', color: expenseColor, op: isLight ? 0.3 : 0.35 },
                                { id: 'distGrad', color: distColor, op: isLight ? 0.25 : 0.3 },
                            ].map(({ id, color, op }) => (
                                <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={color} stopOpacity={op} />
                                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                                </linearGradient>
                            ))}
                        </defs>

                        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                        <XAxis
                            dataKey="month"
                            tickFormatter={formatMonth}
                            tick={{ fill: axisColor, fontSize: 10, fontWeight: 600 }}
                            axisLine={false}
                            tickLine={false}
                            interval={isSinglePoint ? 0 : 'preserveStartEnd'}
                        />
                        <YAxis
                            tick={{ fill: axisColor, fontSize: 10 }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={formatCurrency}
                            width={56}
                        />
                        <Tooltip
                            content={<CustomTooltip isLight={isLight} />}
                            cursor={{ stroke: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)', strokeWidth: 1, strokeDasharray: '4 4' }}
                        />

                        {/* Income — topmost, most prominent */}
                        <Area
                            type="monotoneX"
                            dataKey="income"
                            name="Income"
                            stroke={incomeColor}
                            fill="url(#incomeGrad)"
                            strokeWidth={2.5}
                            dot={isSinglePoint ? { r: 5, fill: incomeColor, stroke: 'white', strokeWidth: 2 } : false}
                            activeDot={<ActiveDot fill={incomeColor} />}
                            isAnimationActive={animated}
                            animationDuration={1200}
                            animationEasing="ease-out"
                        />
                        {/* Expense */}
                        <Area
                            type="monotoneX"
                            dataKey="expense"
                            name="Expense"
                            stroke={expenseColor}
                            fill="url(#expenseGrad)"
                            strokeWidth={2}
                            dot={isSinglePoint ? { r: 4, fill: expenseColor, stroke: 'white', strokeWidth: 2 } : false}
                            activeDot={<ActiveDot fill={expenseColor} />}
                            isAnimationActive={animated}
                            animationDuration={1400}
                            animationEasing="ease-out"
                        />
                        {/* Distribution */}
                        <Area
                            type="monotoneX"
                            dataKey="distribution"
                            name="Split"
                            stroke={distColor}
                            fill="url(#distGrad)"
                            strokeWidth={2}
                            strokeDasharray="5 3"
                            dot={isSinglePoint ? { r: 4, fill: distColor, stroke: 'white', strokeWidth: 2 } : false}
                            activeDot={<ActiveDot fill={distColor} />}
                            isAnimationActive={animated}
                            animationDuration={1600}
                            animationEasing="ease-out"
                        />

                        {/* Net zero reference */}
                        <ReferenceLine y={0} stroke={isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'} strokeDasharray="2 4" />
                    </AreaChart>
                </ResponsiveContainer>
            ) : (
                <div className={`h-[240px] flex flex-col items-center justify-center gap-3 ${isLight ? 'text-[#86868b]' : 'text-neutral-500'}`}>
                    <TrendingUp className="w-8 h-8 opacity-30" />
                    <p className="text-sm font-medium">No historical flow data yet</p>
                    <p className="text-xs opacity-70">Record transactions to see your corporate flow history</p>
                </div>
            )}

            {/* Single data point notice */}
            {isSinglePoint && monthlyData.length > 0 && (
                <p className={`text-center text-[10px] mt-2 font-medium ${isLight ? 'text-[#86868b]' : 'text-[#636366]'}`}>
                    Line graph will appear as more months are recorded
                </p>
            )}
        </motion.div>
    );
}
