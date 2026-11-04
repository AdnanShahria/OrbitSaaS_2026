import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ChevronLeft, ChevronRight, ArrowUpRight, 
    ExternalLink, Sparkles 
} from 'lucide-react';
import { useContent } from '@/contexts/ContentContext';
import { useLang } from '@/contexts/LanguageContext';
import { 
    getShowcaseProjects, 
    openProjectModal, 
    type ShowcaseProjectItem 
} from '@/data/projectShowcaseData';

export function HeroLiveSpotlight({ onSelectProject }: { onSelectProject?: (id: string) => void }) {
    const { content } = useContent();
    const { lang } = useLang();
    const isBn = lang === 'bn';

    const rawProjects = (content[lang] as any)?.projects?.items || (content.en as any)?.projects?.items || [];
    const items = React.useMemo(() => getShowcaseProjects(rawProjects, lang), [rawProjects, lang]);

    const [activeIndex, setActiveIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const progressTimerRef = useRef<NodeJS.Timeout | null>(null);
    const [progress, setProgress] = useState(0);

    const ROTATE_INTERVAL = 4000; // 4 seconds per project

    // Next / Prev slide
    const handleNext = useCallback((e?: React.MouseEvent) => {
        e?.stopPropagation();
        setProgress(0);
        setActiveIndex((prev) => (prev + 1) % items.length);
    }, [items.length]);

    const handlePrev = useCallback((e?: React.MouseEvent) => {
        e?.stopPropagation();
        setProgress(0);
        setActiveIndex((prev) => (prev - 1 + items.length) % items.length);
    }, [items.length]);

    // Timer & Progress logic
    useEffect(() => {
        if (isHovered || items.length <= 1) return;

        const start = Date.now();
        const tick = () => {
            const elapsed = Date.now() - start;
            const pct = Math.min(100, (elapsed / ROTATE_INTERVAL) * 100);
            setProgress(pct);

            if (elapsed >= ROTATE_INTERVAL) {
                handleNext();
            } else {
                progressTimerRef.current = setTimeout(tick, 50);
            }
        };

        progressTimerRef.current = setTimeout(tick, 50);

        return () => {
            if (progressTimerRef.current) clearTimeout(progressTimerRef.current);
        };
    }, [activeIndex, isHovered, items.length, handleNext]);

    if (!items || items.length === 0) return null;

    const current: ShowcaseProjectItem = items[activeIndex] || items[0];
    const IconComponent = current.icon;
    const isClient = current.type === 'client';

    const handleCardClick = () => {
        if (onSelectProject) {
            onSelectProject(current.id);
        } else {
            openProjectModal(current.id);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.85, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={handleCardClick}
            className="relative group w-full max-w-[360px] rounded-2xl p-4 cursor-pointer select-none overflow-hidden transition-all duration-300 hover:scale-[1.015]"
            style={{
                background: 'rgba(10, 14, 26, 0.76)',
                backdropFilter: 'blur(30px) saturate(170%)',
                WebkitBackdropFilter: 'blur(30px) saturate(170%)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                boxShadow: '0 24px 60px -12px rgba(0, 0, 0, 0.85), inset 0 1px 0 rgba(255, 255, 255, 0.14)',
            }}
            title={`${current.title} — Click to inspect architecture`}
        >
            {/* Top specular hairline highlight */}
            <div
                className="absolute inset-x-6 top-0 h-px pointer-events-none rounded-full"
                style={{ background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.28), transparent)' }}
            />

            {/* Hover subtle radial glow */}
            <div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                    background: isClient
                        ? 'radial-gradient(300px circle at 70% 30%, rgba(16,185,129,0.14), transparent 70%)'
                        : 'radial-gradient(300px circle at 70% 30%, rgba(129,140,248,0.14), transparent 70%)'
                }}
            />

            {/* Header: Live status & item index */}
            <div className="relative z-10 flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inset-0 rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative rounded-full h-full w-full bg-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-400 font-mono">
                        {isBn ? 'লাইভ প্ল্যাটফর্ম রোটেটর' : 'LIVE ECOSYSTEM RADAR'}
                    </span>
                </div>

                <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-white/45 font-mono">
                        {activeIndex + 1}/{items.length}
                    </span>
                    <span 
                        className="px-1.5 py-0.5 rounded text-[8.5px] font-bold uppercase tracking-wider"
                        style={{
                            background: isClient ? 'rgba(16,185,129,0.18)' : 'rgba(99,102,241,0.20)',
                            color: isClient ? '#34d399' : '#a5b4fc',
                            border: `1px solid ${isClient ? 'rgba(16,185,129,0.3)' : 'rgba(99,102,241,0.3)'}`
                        }}
                    >
                        {current.typeLabel}
                    </span>
                </div>
            </div>

            {/* Rotating Project Content */}
            <div className="relative z-10 min-h-[70px]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={current.id}
                        initial={{ opacity: 0, x: 12, filter: 'blur(4px)' }}
                        animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, x: -12, filter: 'blur(4px)' }}
                        transition={{ duration: 0.28, ease: 'easeInOut' }}
                        className="flex items-center gap-3.5"
                    >
                        {/* Project Icon Squircle */}
                        <div 
                            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br ${current.gradient} text-white shadow-[0_4px_16px_rgba(0,0,0,0.4)] relative overflow-hidden`}
                        >
                            <div className="absolute inset-0 bg-gradient-to-tr from-white/25 to-transparent pointer-events-none" />
                            <IconComponent size={23} className="stroke-[2.2] drop-shadow-sm" />
                        </div>

                        {/* Title & Tagline */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <h4 className="text-white font-bold text-sm sm:text-[15px] truncate font-display group-hover:text-emerald-300 transition-colors">
                                    {current.name}
                                </h4>
                                <ArrowUpRight size={13} className="text-white/40 group-hover:text-emerald-300 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 shrink-0" />
                            </div>
                            <p className="text-[11px] text-zinc-400 truncate mt-0.5 font-sans">
                                {current.tagline}
                            </p>
                            <div className="flex items-center gap-1.5 mt-1.5">
                                <span className="text-[9.5px] font-semibold text-white/55 bg-white/[0.06] px-2 py-0.5 rounded-full border border-white/[0.08] truncate">
                                    {current.category}
                                </span>
                                {current.link && (
                                    <span className="text-[9.5px] font-mono text-emerald-400/90 truncate">
                                        ● Production URL
                                    </span>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Interactive Footer & Controls */}
            <div className="relative z-10 flex items-center justify-between pt-3 mt-3 border-t border-white/[0.08]">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-white/40 font-medium">
                        {isBn ? 'ক্লিক করে ডিটেইল দেখুন' : 'Click to inspect'}
                    </span>
                    <span className="text-[10px] text-white/20">•</span>
                    <span className="text-[10px] text-emerald-400/80 font-mono">
                        {isHovered ? (isBn ? 'থেমেছে' : 'Paused') : (isBn ? 'ঘুরছে' : 'Auto-Rotating')}
                    </span>
                </div>

                {/* Manual Next / Prev Chevrons */}
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={handlePrev}
                        className="w-6 h-6 rounded-lg bg-white/[0.06] hover:bg-white/[0.14] border border-white/[0.08] flex items-center justify-center text-white/70 hover:text-white transition-all cursor-pointer active:scale-95"
                        aria-label="Previous project"
                    >
                        <ChevronLeft size={13} />
                    </button>
                    <button
                        type="button"
                        onClick={handleNext}
                        className="w-6 h-6 rounded-lg bg-white/[0.06] hover:bg-white/[0.14] border border-white/[0.08] flex items-center justify-center text-white/70 hover:text-white transition-all cursor-pointer active:scale-95"
                        aria-label="Next project"
                    >
                        <ChevronRight size={13} />
                    </button>
                </div>
            </div>

            {/* Auto-rotation dynamic progress bar */}
            <div className="absolute inset-x-0 bottom-0 h-[2px] bg-white/[0.06]">
                <div 
                    className="h-full transition-all duration-75 ease-linear"
                    style={{
                        width: `${progress}%`,
                        background: isClient 
                            ? 'linear-gradient(90deg, #10b981, #34d399)' 
                            : 'linear-gradient(90deg, #6366f1, #38bdf8)',
                        boxShadow: isClient 
                            ? '0 0 8px rgba(16,185,129,0.8)' 
                            : '0 0 8px rgba(99,102,241,0.8)'
                    }}
                />
            </div>
        </motion.div>
    );
}

export default HeroLiveSpotlight;

