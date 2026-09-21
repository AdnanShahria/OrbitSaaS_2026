import { useState } from 'react';
import { PieChart as PieChartIcon, Plus } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Sector } from 'recharts';
import { useFinanceTheme } from './FinanceThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface ExpensePieChartProps {
    categoryBreakdown: { category: string; total: number }[];
    totalExpense: number;
    allTimeBreakdown?: { category: string; total: number }[];
    allTimeExpense?: number;
    periodLabel?: string;
    onSelectAllTime?: () => void;
}

// Apple HIG harmonious palette — vibrant & distinct
const APPLE_COLORS = [
    '#30d158', // green
    '#0a84ff', // blue
    '#ff9f0a', // orange
    '#ff453a', // red
    '#bf5af2', // purple
    '#ff375f', // pink
    '#5e5ce6', // indigo
    '#5ac8fa', // teal
    '#ffd60a', // yellow
    '#32d74b', // mint
];

function formatCurrency(amount: number) {
    if (amount >= 100000) return `৳${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `৳${(amount / 1000).toFixed(1)}k`;
    return `৳${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

// Custom active/hover sector with outer ring expansion
const renderActiveShape = (props: any) => {
    const {
        cx, cy, innerRadius, outerRadius, startAngle, endAngle,
        fill, payload, percent
    } = props;

    return (
        <g>
            {/* Expanded outer sector */}
            <Sector
                cx={cx} cy={cy}
                innerRadius={innerRadius - 2}
                outerRadius={outerRadius + 10}
                startAngle={startAngle}
                endAngle={endAngle}
                fill={fill}
                opacity={1}
            />
            {/* Glow ring */}
            <Sector
                cx={cx} cy={cy}
                innerRadius={outerRadius + 12}
                outerRadius={outerRadius + 16}
                startAngle={startAngle}
                endAngle={endAngle}
                fill={fill}
                opacity={0.35}
            />
            {/* Center label */}
            <text x={cx} y={cy - 12} textAnchor="middle" fill={fill} className="font-mono" fontSize={16} fontWeight={800}>
                {formatCurrency(payload.total)}
            </text>
            <text x={cx} y={cy + 8} textAnchor="middle" fill={fill} fontSize={10} fontWeight={600} opacity={0.8}>
                {(percent * 100).toFixed(1)}%
            </text>
            <text x={cx} y={cy + 22} textAnchor="middle" fill={fill} fontSize={9} opacity={0.6} fontWeight={500}>
                {payload.category.length > 18 ? payload.category.slice(0, 17) + '…' : payload.category}
            </text>
        </g>
    );
};

const CustomTooltip = ({ active, payload, isLight }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0];
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.12 }}
            className={`rounded-2xl px-3.5 py-2.5 text-xs ${
                isLight
                    ? 'bg-white border border-black/[0.1] shadow-[0_8px_24px_rgba(0,0,0,0.14)] text-[#1d1d1f]'
                    : 'bg-[#1c1c1e] border border-white/[0.14] shadow-[0_12px_32px_rgba(0,0,0,0.6)] text-white'
            }`}
        >
            <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.payload.fill, boxShadow: `0 0 6px ${d.payload.fill}` }} />
                <span className={`font-semibold ${isLight ? 'text-[#1d1d1f]' : 'text-white'}`}>{d.payload.category}</span>
            </div>
            <p className="font-mono font-black" style={{ color: d.payload.fill }}>{formatCurrency(d.value)}</p>
            <p className={`${isLight ? 'text-[#86868b]' : 'text-[#636366]'}`}>{(d.payload.percent * 100).toFixed(1)}% of expenses</p>
        </motion.div>
    );
};

export default function ExpensePieChart({
    categoryBreakdown,
    totalExpense,
    allTimeBreakdown,
    allTimeExpense,
    periodLabel,
    onSelectAllTime
}: ExpensePieChartProps) {
    const { isLight } = useFinanceTheme();
    const navigate = useNavigate();
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const [viewMode, setViewMode] = useState<'period' | 'all_time'>('period');

    const hasPeriodData = Boolean(categoryBreakdown && categoryBreakdown.length > 0);
    const hasAllTimeData = Boolean(allTimeBreakdown && allTimeBreakdown.length > 0);

    // Auto fallback to all-time if current period has 0 expenses but all-time has data
    const isShowingAllTime = (viewMode === 'all_time') || (!hasPeriodData && hasAllTimeData);

    const activeCategories = isShowingAllTime ? (allTimeBreakdown || []) : categoryBreakdown;
    const activeTotal = isShowingAllTime ? (allTimeExpense ?? totalExpense) : totalExpense;

    // Add color and percent to data for tooltip
    const enrichedData = activeCategories.map((c, i) => ({
        ...c,
        fill: APPLE_COLORS[i % APPLE_COLORS.length],
        percent: activeTotal > 0 ? c.total / activeTotal : 0,
    }));

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
            className={`rounded-3xl p-5 sm:p-6 flex flex-col transition-all duration-300 ${
                isLight
                    ? 'bg-white/85 backdrop-blur-xl border border-black/[0.06] shadow-[0_4px_24px_rgba(0,0,0,0.03)]'
                    : 'bg-[#1c1c1e]/80 backdrop-blur-xl border border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.4)]'
            }`}
        >
            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${isLight ? 'bg-amber-500/10 text-amber-600' : 'bg-amber-500/15 text-amber-400'}`}>
                        <PieChartIcon className="w-4 h-4" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className={`text-sm font-bold ${isLight ? 'text-[#1d1d1f]' : 'text-white'}`}>
                                Expense Categories
                            </h3>
                            {isShowingAllTime && !hasPeriodData && hasAllTimeData && (
                                <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full ${
                                    isLight ? 'bg-amber-500/10 text-amber-700' : 'bg-amber-500/20 text-amber-300'
                                }`}>
                                    All-Time
                                </span>
                            )}
                        </div>
                        <p className={`text-[11px] ${isLight ? 'text-[#6e6e73]' : 'text-[#86868b]'}`}>
                            Funding Allocation Split
                        </p>
                    </div>
                </div>

                {/* Right controls: Scope toggle (if both available) + Total badge */}
                <div className="flex items-center gap-2 shrink-0">
                    {hasPeriodData && hasAllTimeData && (
                        <div className={`flex items-center p-0.5 rounded-xl border text-[10px] font-semibold ${
                            isLight ? 'bg-black/[0.04] border-black/[0.08]' : 'bg-white/[0.06] border-white/[0.1]'
                        }`}>
                            <button
                                type="button"
                                onClick={() => setViewMode('period')}
                                className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                                    viewMode === 'period'
                                        ? (isLight ? 'bg-white text-black shadow-xs font-bold' : 'bg-white/20 text-white font-bold')
                                        : (isLight ? 'text-neutral-500 hover:text-black' : 'text-neutral-400 hover:text-white')
                                }`}
                            >
                                Period
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('all_time')}
                                className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                                    viewMode === 'all_time'
                                        ? (isLight ? 'bg-white text-black shadow-xs font-bold' : 'bg-white/20 text-white font-bold')
                                        : (isLight ? 'text-neutral-500 hover:text-black' : 'text-neutral-400 hover:text-white')
                                }`}
                            >
                                All-Time
                            </button>
                        </div>
                    )}

                    {/* Total badge */}
                    <div className={`px-2.5 py-1 rounded-xl text-[11px] font-black font-mono ${
                        isLight ? 'bg-rose-500/[0.07] text-rose-700' : 'bg-rose-500/15 text-rose-400'
                    }`}>
                        {formatCurrency(activeTotal)}
                    </div>
                </div>
            </div>

            {/* Context notification if auto-showing all-time because current period has 0 expenses */}
            {isShowingAllTime && !hasPeriodData && hasAllTimeData && (
                <div className={`flex items-center justify-between px-3 py-1.5 rounded-xl mb-2 text-[11px] font-medium ${
                    isLight ? 'bg-amber-500/[0.08] text-amber-900 border border-amber-500/20' : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                }`}>
                    <span>No expenses in <strong>{periodLabel || 'selected period'}</strong>. Showing all-time breakdown.</span>
                    {onSelectAllTime && (
                        <button
                            type="button"
                            onClick={onSelectAllTime}
                            className="underline font-bold ml-2 shrink-0 cursor-pointer hover:opacity-80"
                        >
                            Sync Dashboard
                        </button>
                    )}
                </div>
            )}

            {activeCategories.length > 0 ? (
                <>
                    {/* Donut with animated segments */}
                    <div className="relative py-1">
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie
                                    data={enrichedData}
                                    dataKey="total"
                                    nameKey="category"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={58}
                                    outerRadius={82}
                                    paddingAngle={2.5}
                                    strokeWidth={0}
                                    activeIndex={activeIndex ?? undefined}
                                    activeShape={renderActiveShape}
                                    onMouseEnter={(_, index) => setActiveIndex(index)}
                                    onMouseLeave={() => setActiveIndex(null)}
                                    isAnimationActive={true}
                                    animationBegin={100}
                                    animationDuration={1000}
                                    animationEasing="ease-out"
                                >
                                    {enrichedData.map((entry, i) => (
                                        <Cell
                                            key={i}
                                            fill={entry.fill}
                                            opacity={activeIndex === null || activeIndex === i ? 1 : 0.45}
                                            style={{ transition: 'opacity 0.2s', cursor: 'pointer', filter: activeIndex === i ? `drop-shadow(0 0 6px ${entry.fill}88)` : 'none' }}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip isLight={isLight} />} />
                            </PieChart>
                        </ResponsiveContainer>

                        {/* Center label when nothing is hovered */}
                        <AnimatePresence>
                            {activeIndex === null && (
                                <motion.div
                                    key="center"
                                    initial={{ opacity: 0, scale: 0.85 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.85 }}
                                    transition={{ duration: 0.2 }}
                                    className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
                                >
                                    <p className={`text-[10px] font-semibold uppercase tracking-wider ${isLight ? 'text-[#86868b]' : 'text-[#636366]'}`}>
                                        {isShowingAllTime ? 'All-Time' : 'Total'}
                                    </p>
                                    <p className={`text-base font-black font-mono tabular-nums ${isLight ? 'text-[#1d1d1f]' : 'text-white'}`}>
                                        {formatCurrency(activeTotal)}
                                    </p>
                                    <p className={`text-[10px] font-medium ${isLight ? 'text-[#86868b]' : 'text-[#636366]'}`}>
                                        {activeCategories.length} categor{activeCategories.length === 1 ? 'y' : 'ies'}
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Category list */}
                    <div className="space-y-1 mt-1 flex-1 overflow-y-auto" style={{ maxHeight: 160 }}>
                        {enrichedData.slice(0, 7).map((c, i) => (
                            <motion.div
                                key={c.category}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 + 0.3, duration: 0.3 }}
                                onMouseEnter={() => setActiveIndex(i)}
                                onMouseLeave={() => setActiveIndex(null)}
                                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-xl cursor-pointer transition-all duration-150 ${
                                    activeIndex === i
                                        ? (isLight ? 'bg-black/[0.05]' : 'bg-white/[0.07]')
                                        : (isLight ? 'hover:bg-black/[0.03]' : 'hover:bg-white/[0.04]')
                                }`}
                            >
                                {/* Color swatch with glow */}
                                <div
                                    className="w-2.5 h-2.5 rounded-full shrink-0 transition-all duration-200"
                                    style={{
                                        backgroundColor: c.fill,
                                        boxShadow: activeIndex === i ? `0 0 8px ${c.fill}` : `0 0 3px ${c.fill}66`,
                                        transform: activeIndex === i ? 'scale(1.4)' : 'scale(1)',
                                    }}
                                />
                                {/* Category name + mini bar */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between text-xs mb-0.5">
                                        <span className={`truncate font-semibold ${isLight ? 'text-[#1d1d1f]' : 'text-neutral-200'}`}>
                                            {c.category}
                                        </span>
                                        <span className="font-mono font-bold ml-2 shrink-0" style={{ color: c.fill }}>
                                            {formatCurrency(c.total)}
                                        </span>
                                    </div>
                                    {/* Progress bar */}
                                    <div className={`h-1 w-full rounded-full overflow-hidden ${isLight ? 'bg-black/[0.06]' : 'bg-white/[0.07]'}`}>
                                        <motion.div
                                            className="h-full rounded-full"
                                            style={{ backgroundColor: c.fill }}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${c.percent * 100}%` }}
                                            transition={{ delay: i * 0.05 + 0.5, duration: 0.6, ease: 'easeOut' }}
                                        />
                                    </div>
                                </div>
                                {/* Percentage */}
                                <span className={`text-[10px] font-bold w-8 text-right shrink-0 ${isLight ? 'text-[#6e6e73]' : 'text-[#86868b]'}`}>
                                    {(c.percent * 100).toFixed(0)}%
                                </span>
                            </motion.div>
                        ))}
                        {enrichedData.length > 7 && (
                            <p className={`text-center text-[10px] py-1 ${isLight ? 'text-[#86868b]' : 'text-[#636366]'}`}>
                                +{enrichedData.length - 7} more categories
                            </p>
                        )}
                    </div>
                </>
            ) : (
                <div className={`flex-1 flex flex-col items-center justify-center gap-3 py-8 ${isLight ? 'text-[#86868b]' : 'text-neutral-500'}`}>
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isLight ? 'bg-black/[0.04]' : 'bg-white/[0.05]'}`}>
                        <PieChartIcon className="w-7 h-7 opacity-40" />
                    </div>
                    <div className="text-center space-y-1">
                        <p className="text-sm font-semibold">No recorded expenses</p>
                        <p className="text-xs opacity-60">Record an expense mutation to see breakdown here</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => navigate('/admin/finance/transactions')}
                        className={`mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                            isLight
                                ? 'bg-white hover:bg-black/[0.04] text-[#1d1d1f] border-black/[0.1] shadow-xs'
                                : 'bg-white/[0.06] hover:bg-white/[0.1] text-white border-white/[0.1]'
                        }`}
                    >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Record Expense</span>
                    </button>
                </div>
            )}
        </motion.div>
    );
}
