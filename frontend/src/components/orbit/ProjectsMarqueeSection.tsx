import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
    ExternalLink, ArrowUpRight, Sparkles, 
    Layers, CheckCircle2, ChevronRight 
} from 'lucide-react';
import { useContent } from '@/contexts/ContentContext';
import { useLang } from '@/contexts/LanguageContext';
import { 
    getShowcaseProjects, 
    openProjectModal, 
    type ShowcaseProjectItem 
} from '@/data/projectShowcaseData';
import { WaveDivider } from '@/components/ui/WaveDivider';

/* ── Individual Clickable Showcase Card ── */
const MarqueeCard = React.memo(({ 
    item, 
    onCardClick 
}: { 
    item: ShowcaseProjectItem; 
    onCardClick: (id: string) => void;
}) => {
    const IconComponent = item.icon;
    const isClient = item.type === 'client';

    return (
        <div
            onClick={() => onCardClick(item.id)}
            className="group relative flex items-center gap-3.5 min-w-[270px] sm:min-w-[310px] max-w-[320px] h-[82px] sm:h-[88px] px-3.5 sm:px-4 py-2.5 rounded-2xl bg-white/95 backdrop-blur-md border border-zinc-200/90 hover:border-emerald-500/50 shadow-[0_4px_18px_-4px_rgba(0,0,0,0.06)] hover:shadow-[0_14px_30px_-6px_rgba(16,185,129,0.18)] transition-all duration-300 hover:-translate-y-1 cursor-pointer select-none overflow-hidden"
            title={`${item.title} — Click to inspect project details`}
        >
            {/* Top specular edge hairline */}
            <div className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-zinc-200 to-transparent pointer-events-none group-hover:via-emerald-400/50 transition-colors" />

            {/* Icon / Avatar box */}
            <div 
                className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br ${item.gradient} text-white shadow-sm transition-transform duration-300 group-hover:scale-105 group-hover:rotate-1 relative overflow-hidden`}
            >
                {/* Specular sheen */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent pointer-events-none" />
                <IconComponent size={21} className="stroke-[2.2] drop-shadow-sm" />
            </div>

            {/* Information middle column */}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
                {/* Top line: Name and Category badge */}
                <div className="flex items-center gap-1.5 mb-1">
                    <h4 className="font-bold text-[13px] sm:text-[14px] text-zinc-900 group-hover:text-emerald-700 transition-colors truncate font-display">
                        {item.name}
                    </h4>
                </div>

                {/* Subtitle / Tagline */}
                <p className="text-[11px] text-zinc-500 group-hover:text-zinc-700 transition-colors truncate font-sans">
                    {item.tagline}
                </p>

                {/* Bottom pill row */}
                <div className="flex items-center gap-1.5 mt-1.5">
                    <span 
                        className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider shrink-0"
                        style={{
                            background: item.badgeBg,
                            color: item.badgeColor,
                        }}
                    >
                        {item.typeLabel}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-medium truncate">
                        • {item.category}
                    </span>
                </div>
            </div>

            {/* Right column: Live beacon & clickable indicator */}
            <div className="flex flex-col items-end justify-between h-full py-1 shrink-0 pl-1">
                {/* Pulsing Live Beacon */}
                <div className="flex items-center gap-1 text-[9px] font-semibold text-emerald-600 tracking-wider">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inset-0 rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative rounded-full h-full w-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
                    </span>
                    <span className="hidden sm:inline uppercase text-[8.5px] font-mono">Live</span>
                </div>

                {/* Quick inspect arrow */}
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-zinc-400 group-hover:text-emerald-600 group-hover:bg-emerald-50 transition-all">
                    <ArrowUpRight size={13} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
            </div>

            {/* Subtle bottom hover highlight */}
            <div 
                className="absolute inset-x-0 bottom-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{
                    background: isClient 
                        ? 'linear-gradient(90deg, transparent, #10b981, transparent)' 
                        : 'linear-gradient(90deg, transparent, #818cf8, transparent)'
                }}
            />
        </div>
    );
});

export function ProjectsMarqueeSection({ onSelectProject }: { onSelectProject?: (id: string) => void }) {
    const { content } = useContent();
    const { lang } = useLang();
    const isBn = lang === 'bn';

    const [activeFilter, setActiveFilter] = useState<'all' | 'in-house' | 'client'>('all');

    // Ingest all projects dynamically from site_content
    const rawProjects = (content[lang] as any)?.projects?.items || (content.en as any)?.projects?.items || [];
    const allItems = useMemo(() => getShowcaseProjects(rawProjects, lang), [rawProjects, lang]);

    // Handle project card click
    const handleCardClick = (id: string) => {
        if (onSelectProject) {
            onSelectProject(id);
        } else {
            openProjectModal(id);
        }
    };

    // Filter items based on active tab
    const inHouseItems = useMemo(() => allItems.filter(p => p.type === 'in-house'), [allItems]);
    const clientItems = useMemo(() => allItems.filter(p => p.type === 'client'), [allItems]);

    // Construct tracks:
    // When 'all': Track 1 is In-House, Track 2 is Client Projects
    // When filtered: Both tracks rotate items from that category
    const track1Items = useMemo(() => {
        if (activeFilter === 'in-house') return inHouseItems;
        if (activeFilter === 'client') return clientItems;
        return inHouseItems.length > 0 ? inHouseItems : allItems;
    }, [activeFilter, inHouseItems, clientItems, allItems]);

    const track2Items = useMemo(() => {
        if (activeFilter === 'in-house') return [...inHouseItems].reverse();
        if (activeFilter === 'client') return [...clientItems].reverse();
        return clientItems.length > 0 ? clientItems : [...allItems].reverse();
    }, [activeFilter, inHouseItems, clientItems, allItems]);

    // Duplicate arrays for infinite, uninterrupted CSS marquee loop
    const track1Duplicated = useMemo(() => [...track1Items, ...track1Items, ...track1Items, ...track1Items], [track1Items]);
    const track2Duplicated = useMemo(() => [...track2Items, ...track2Items, ...track2Items, ...track2Items], [track2Items]);

    return (
        <section 
            id="live-ecosystem" 
            className="relative py-12 sm:py-16 bg-[#FDFBF7] text-zinc-900 overflow-hidden select-none border-t border-zinc-200/60"
        >
            {/* Ambient background glows */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden select-none" aria-hidden="true">
                <div className="absolute top-[20%] left-[-8%] w-[500px] h-[500px] bg-emerald-500/[0.03] blur-[120px] rounded-full" />
                <div className="absolute bottom-[10%] right-[-8%] w-[500px] h-[500px] bg-indigo-500/[0.03] blur-[120px] rounded-full" />
            </div>

            <div className="max-w-[1400px] mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
                {/* ── Section Header ── */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-7 sm:mb-9">
                    <div className="max-w-2xl">
                        {/* Eyebrow badge */}
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.35 }}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-zinc-200/90 shadow-2xs mb-2.5"
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-800">
                                {isBn ? '✦ লাইভ ও ক্লায়েন্ট প্ল্যাটফর্ম ইকোসিস্টেম' : '✦ DEPLOYED ECOSYSTEM & LIVE PRODUCTS'}
                            </span>
                        </motion.div>

                        {/* Title */}
                        <motion.h2
                            initial={{ opacity: 0, y: 12 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.4, delay: 0.05 }}
                            className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-zinc-900 font-display leading-[1.15]"
                        >
                            {isBn ? 'আমাদের লাইভ প্রোডাক্টস ও ক্লায়েন্ট ডেপ্লয়মেন্ট' : 'In-House Flagships & Client Deployments'}
                        </motion.h2>

                        {/* Subtitle */}
                        <motion.p
                            initial={{ opacity: 0, y: 12 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.4, delay: 0.1 }}
                            className="text-xs sm:text-sm text-zinc-500 mt-2 font-sans max-w-xl"
                        >
                            {isBn 
                                ? 'যেকোনো কার্ডে ক্লিক করে লাইভ আর্কিটেকচার, টেক-স্ট্যাক ও ফুল কেস স্টাডি এক্সপ্লোর করুন।'
                                : 'Click any card to inspect the production architecture, technology stack, and interactive case study.'}
                        </motion.p>
                    </div>

                    {/* Filter Pills Toggle */}
                    <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-100/90 border border-zinc-200/80 self-start sm:self-end">
                        <button
                            onClick={() => setActiveFilter('all')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                activeFilter === 'all'
                                    ? 'bg-white text-zinc-900 shadow-2xs'
                                    : 'text-zinc-500 hover:text-zinc-800'
                            }`}
                        >
                            {isBn ? 'সবগুলো' : 'All'} ({allItems.length})
                        </button>
                        <button
                            onClick={() => setActiveFilter('in-house')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                activeFilter === 'in-house'
                                    ? 'bg-white text-indigo-600 shadow-2xs'
                                    : 'text-zinc-500 hover:text-zinc-800'
                            }`}
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                            {isBn ? 'ইন-হাউস' : 'In-House'} ({inHouseItems.length})
                        </button>
                        <button
                            onClick={() => setActiveFilter('client')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                activeFilter === 'client'
                                    ? 'bg-white text-emerald-600 shadow-2xs'
                                    : 'text-zinc-500 hover:text-zinc-800'
                            }`}
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            {isBn ? 'ক্লায়েন্ট' : 'Client'} ({clientItems.length})
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Marquee Showcase Area with Edge Masking ── */}
            <div 
                className="w-full relative py-2 space-y-3.5 group/marquee"
                style={{
                    WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)',
                    maskImage: 'linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)',
                }}
            >
                {/* ── ROW 1: Forward Infinite Marquee (Glides Left) ── */}
                <div className="flex gap-4 w-max marquee-track group-hover/marquee:[animation-play-state:paused]" style={{ '--marquee-speed': '38s' } as any}>
                    {track1Duplicated.map((project, idx) => (
                        <MarqueeCard 
                            key={`t1-${project.id}-${idx}`} 
                            item={project} 
                            onCardClick={handleCardClick} 
                        />
                    ))}
                </div>

                {/* ── ROW 2: Reverse Infinite Marquee (Glides Right) ── */}
                <div className="flex gap-4 w-max marquee-track-reverse group-hover/marquee:[animation-play-state:paused]" style={{ '--marquee-speed': '42s' } as any}>
                    {track2Duplicated.map((project, idx) => (
                        <MarqueeCard 
                            key={`t2-${project.id}-${idx}`} 
                            item={project} 
                            onCardClick={handleCardClick} 
                        />
                    ))}
                </div>
            </div>

            {/* Micro bottom status footnote */}
            <div className="max-w-[1400px] mx-auto px-5 sm:px-6 lg:px-8 mt-6 flex flex-wrap items-center justify-between text-[11px] text-zinc-500 gap-3">
                <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>{isBn ? 'সবগুলো প্রজেক্ট সরাসরি প্রোডাকশন ক্লাউডে সক্রিয়' : 'All platforms active in production with 99.9% uptime'}</span>
                </span>
                <span className="text-zinc-400 font-mono text-[10px]">
                    {isBn ? 'হোভার করে থামান • যেকোনো কার্ডে ক্লিক করে ডিটেইল দেখুন' : 'Hover to pause • Click any card for detailed architecture'}
                </span>
            </div>

            <WaveDivider fill="#FAFAFA" />
        </section>
    );
}

export default ProjectsMarqueeSection;

