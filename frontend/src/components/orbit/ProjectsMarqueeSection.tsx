import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useContent } from '@/contexts/ContentContext';
import { useLang } from '@/contexts/LanguageContext';
import {
    getShowcaseProjects,
    type ShowcaseProjectItem
} from '@/data/projectShowcaseData';
import { WaveDivider } from '@/components/ui/WaveDivider';

/* ─── Ultra-Sleek Modern Animated Brand Badge ─── */
const CompactClientBadge = React.memo(({
    item,
    onCardClick
}: {
    item: ShowcaseProjectItem;
    onCardClick?: (id: string) => void;
}) => {
    const IconComponent = item.icon;
    const isClient = item.type === 'client';

    return (
        <Link
            to={`/project/${item.id}`}
            onClick={(e) => {
                if (onCardClick) {
                    e.preventDefault();
                    onCardClick(item.id);
                }
            }}
            className="group relative flex items-center gap-3 h-[48px] sm:h-[52px] px-3.5 sm:px-4 rounded-full bg-white/95 hover:bg-white backdrop-blur-md border border-zinc-200/90 hover:border-emerald-500/50 shadow-[0_2px_10px_-2px_rgba(0,0,0,0.04)] hover:shadow-[0_10px_24px_-4px_rgba(16,185,129,0.16)] transition-all duration-300 hover:-translate-y-0.5 cursor-pointer select-none shrink-0 overflow-hidden text-inherit no-underline"
            title={`${item.title} — Click to explore project details`}
        >
            {/* Top specular hairline edge */}
            <div className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-zinc-200 to-transparent pointer-events-none group-hover:via-emerald-400/60 transition-colors" />

            {/* Light sweep shimmer effect across badge */}
            <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out bg-gradient-to-r from-transparent via-white/50 to-transparent" />
            </div>

            {/* Brand Logo / Icon Avatar */}
            <div 
                className={`relative w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0 bg-gradient-to-br ${item.gradient} text-white shadow-xs transition-transform duration-300 group-hover:scale-110`}
            >
                {/* Micro glowing ping behind icon */}
                <span className="absolute inset-0 rounded-full bg-white/20 animate-ping opacity-0 group-hover:opacity-60" />
                <IconComponent size={15} className="stroke-[2.4] drop-shadow-xs relative z-10" />
            </div>

            {/* Brand Name & Domain Tag */}
            <div className="flex items-center gap-2 min-w-0">
                <span className="font-bold text-[12.5px] sm:text-[13.5px] text-zinc-800 group-hover:text-emerald-700 transition-colors font-display tracking-tight whitespace-nowrap">
                    {item.name}
                </span>

                <span 
                    className="hidden xs:inline-flex items-center px-2 py-0.5 rounded-full text-[8.5px] sm:text-[9px] font-bold uppercase tracking-wider shrink-0"
                    style={{
                        background: item.badgeBg,
                        color: item.badgeColor,
                    }}
                >
                    {item.typeLabel}
                </span>

                <span className="hidden md:inline text-[10px] text-zinc-600 font-medium whitespace-nowrap">
                    • {item.category}
                </span>
            </div>

            {/* Live pulsing beacon + Arrow icon */}
            <div className="flex items-center gap-1.5 ml-1 shrink-0">
                <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
                    <span className="animate-ping absolute inset-0 rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative rounded-full h-full w-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.9)]" />
                </span>
                <ArrowUpRight size={12} className="text-zinc-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>

            {/* Bottom active color bar */}
            <div 
                className="absolute inset-x-0 bottom-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{
                    background: isClient 
                        ? 'linear-gradient(90deg, transparent, #10b981, transparent)' 
                        : 'linear-gradient(90deg, transparent, #818cf8, transparent)'
                }}
            />
        </Link >
    );
});

export function ProjectsMarqueeSection({ onSelectProject }: { onSelectProject?: (id: string) => void }) {
    const { content } = useContent();
    const { lang } = useLang();
    const isBn = lang === 'bn';

    const [activeFilter, setActiveFilter] = useState<'all' | 'client' | 'in-house'>('all');

    // Ingest all projects dynamically from site_content
    const rawProjects = (content[lang] as any)?.projects?.items || (content.en as any)?.projects?.items || [];
    const allItems = useMemo(() => getShowcaseProjects(rawProjects, lang), [rawProjects, lang]);

    // Handle project card click (only if parent explicitly provides onSelectProject callback)
    const handleCardClick = onSelectProject ? (id: string) => onSelectProject(id) : undefined;

    // Filter items
    const inHouseItems = useMemo(() => allItems.filter(p => p.type === 'in-house'), [allItems]);
    const clientItems = useMemo(() => allItems.filter(p => p.type === 'client'), [allItems]);

    // Construct tracks:
    // When 'all': Track 1 shows Client projects, Track 2 shows In-House projects
    const track1Items = useMemo(() => {
        if (activeFilter === 'client') return clientItems;
        if (activeFilter === 'in-house') return inHouseItems;
        return clientItems.length > 0 ? clientItems : allItems;
    }, [activeFilter, clientItems, inHouseItems, allItems]);

    const track2Items = useMemo(() => {
        if (activeFilter === 'client') return [...clientItems].reverse();
        if (activeFilter === 'in-house') return [...inHouseItems].reverse();
        return inHouseItems.length > 0 ? inHouseItems : [...allItems].reverse();
    }, [activeFilter, clientItems, inHouseItems, allItems]);

    // Duplicate arrays for uninterrupted 60fps infinite CSS marquee looping
    const track1Duplicated = useMemo(() => [...track1Items, ...track1Items, ...track1Items, ...track1Items], [track1Items]);
    const track2Duplicated = useMemo(() => [...track2Items, ...track2Items, ...track2Items, ...track2Items], [track2Items]);

    return (
        <section
            id="live-ecosystem"
            className="relative py-10 sm:py-14 bg-[#FDFBF7] text-zinc-900 overflow-hidden select-none border-t border-zinc-200/50"
        >
            {/* Ambient soft background glows */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden select-none" aria-hidden="true">
                <div className="absolute top-[30%] left-[5%] w-[420px] h-[420px] bg-emerald-500/[0.025] blur-[100px] rounded-full" />
                <div className="absolute bottom-[20%] right-[5%] w-[420px] h-[420px] bg-indigo-500/[0.025] blur-[100px] rounded-full" />
            </div>

            <div className="max-w-[1400px] mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
                {/* ── Section Header (Inspired by Sourcetoad "Some of our marvelous clients", elevated with modern flair) ── */}
                <div className="text-center max-w-2xl mx-auto mb-7 sm:mb-9">
                    {/* Eyebrow Pill */}
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.35 }}
                        className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white border border-zinc-200/90 shadow-2xs mb-2.5"
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[9.5px] font-bold uppercase tracking-[0.2em] text-emerald-800">
                            {isBn ? '✦ লাইভ প্ল্যাটফর্ম ও ক্লায়েন্ট ইকোসিস্টেম' : '✦ SHIPPED PLATFORMS & CLIENTS'}
                        </span>
                    </motion.div>

                    {/* Headline */}
                    <motion.h2
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: 0.05 }}
                        className="text-2xl sm:text-3xl md:text-[2.2rem] font-black tracking-tight text-zinc-900 font-display leading-[1.2]"
                    >
                        {isBn ? 'আমাদের কিছু অসাধারণ ক্লায়েন্ট ও লাইভ প্রোডাক্টস' : 'Some of our marvelous clients & live products'}
                    </motion.h2>

                    {/* Subtitle */}
                    <motion.p
                        initial={{ opacity: 0, y: 8 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: 0.1 }}
                        className="text-xs sm:text-[13px] text-zinc-500 mt-2 font-sans"
                    >
                        {isBn
                            ? 'উৎপাদন-প্রস্তুত প্ল্যাটফর্ম ও এআই সিস্টেম — যেকোনো কার্ডে ক্লিক করে লাইভ প্রিভিউ দেখুন।'
                            : 'Click any client or in-house platform to explore its architecture and live deployment.'}
                    </motion.p>

                    {/* Interactive Filter Pills */}
                    <div className="inline-flex items-center gap-1 p-1 mt-4 rounded-full bg-zinc-100/90 border border-zinc-200/80">
                        <button
                            onClick={() => setActiveFilter('all')}
                            className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${activeFilter === 'all'
                                    ? 'bg-white text-zinc-900 shadow-2xs'
                                    : 'text-zinc-500 hover:text-zinc-800'
                                }`}
                        >
                            {isBn ? 'সবগুলো' : 'All'} ({allItems.length})
                        </button>
                        <button
                            onClick={() => setActiveFilter('client')}
                            className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${activeFilter === 'client'
                                    ? 'bg-white text-emerald-700 shadow-2xs'
                                    : 'text-zinc-500 hover:text-zinc-800'
                                }`}
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            {isBn ? 'ক্লায়েন্ট প্রজেক্টস' : 'Clients'} ({clientItems.length})
                        </button>
                        <button
                            onClick={() => setActiveFilter('in-house')}
                            className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${activeFilter === 'in-house'
                                    ? 'bg-white text-indigo-700 shadow-2xs'
                                    : 'text-zinc-500 hover:text-zinc-800'
                                }`}
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                            {isBn ? 'ইন-হাউস প্রোডাক্টস' : 'In-House'} ({inHouseItems.length})
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Infinite Marquee Stream with Edge Blur Mask ── */}
            <div
                className="w-full relative py-1.5 space-y-3 group/marquee"
                style={{
                    WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%)',
                    maskImage: 'linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%)',
                }}
            >
                {/* ── ROW 1: Forward Track (Glides Left) ── */}
                <div
                    className="flex gap-3 w-max marquee-track group-hover/marquee:[animation-play-state:paused]"
                    style={{ '--marquee-speed': '32s' } as any}
                >
                    {track1Duplicated.map((project, idx) => (
                        <CompactClientBadge
                            key={`row1-${project.id}-${idx}`}
                            item={project}
                            onCardClick={handleCardClick}
                        />
                    ))}
                </div>

                {/* ── ROW 2: Reverse Track (Glides Right) ── */}
                <div
                    className="flex gap-3 w-max marquee-track-reverse group-hover/marquee:[animation-play-state:paused]"
                    style={{ '--marquee-speed': '36s' } as any}
                >
                    {track2Duplicated.map((project, idx) => (
                        <CompactClientBadge
                            key={`row2-${project.id}-${idx}`}
                            item={project}
                            onCardClick={handleCardClick}
                        />
                    ))}
                </div>
            </div>

            {/* Micro bottom status footnote */}
            <div className="max-w-[1400px] mx-auto px-5 sm:px-6 lg:px-8 mt-5 flex items-center justify-center text-[10.5px] text-zinc-600 gap-2 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>
                    {isBn
                        ? 'কার্ডে হোভার করে থামান • ক্লিক করে আর্কিটেকচার ও লাইভ ডেমো দেখুন'
                        : 'Hover to pause • Click any card for interactive live demo & case study'}
                </span>
            </div>

            <WaveDivider fill="#FAFAFA" />
        </section>
    );
}

export default ProjectsMarqueeSection;
