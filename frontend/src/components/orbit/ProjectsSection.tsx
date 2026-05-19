import { useRef, useState, useEffect, useCallback } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ImageWithSkeleton } from './ImageWithSkeleton';
import { useLang } from '@/contexts/LanguageContext';
import { useContent } from '@/contexts/ContentContext';
import { Helmet } from 'react-helmet-async';
import { ArrowUpRight } from 'lucide-react';
import { WaveDivider } from '@/components/ui/WaveDivider';
import { fallbackProjects } from '@/data/projects';

// --- Types ---
interface ProjectItem {
    id: string;
    title: string;
    desc: string;
    images?: string[];
    image?: string;
    category?: string;
    categories?: string[];
    featured?: boolean;
    order?: number;
    _originalIndex: number;
    _id: string;
    tags?: string[];
}

// --- Cinematic Project Card ---
function CinematicCard({ item, i, routeId }: { item: ProjectItem; i: number; routeId: string }) {
    const coverImage = item.images?.[0] || item.image || '/placeholder.png';
    const cats: string[] = item.categories || (item.category ? [item.category] : []);
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, amount: 0.15 });
    const [isHovered, setIsHovered] = useState(false);

    // Hover Cycling Logic
    const hoverImageUrls: string[] = (() => {
        const indices: number[] = (item as any).hoverImages || [];
        if (indices.length > 0) {
            return indices
                .filter((idx: number) => idx < (item.images?.length || 0))
                .map((idx: number) => item.images![idx]);
        }
        return item.images && item.images.length > 1 ? [item.images[1]] : [];
    })();

    const [activeIndex, setActiveIndex] = useState(-1);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const clearCycling = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    useEffect(() => {
        if (isHovered && hoverImageUrls.length > 0) {
            setActiveIndex(0);
            intervalRef.current = setInterval(() => {
                setActiveIndex((prev: number) => (prev + 1) % hoverImageUrls.length);
            }, 2000);
            return () => clearCycling();
        } else {
            clearCycling();
            if (!isHovered) {
                setActiveIndex(-1);
            }
        }
    }, [isHovered, hoverImageUrls.length, clearCycling]);

    const currentImage = activeIndex >= 0 && activeIndex < hoverImageUrls.length
        ? hoverImageUrls[activeIndex]
        : coverImage;

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 60, scale: 0.97 }}
            animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
            transition={{ duration: 0.8, delay: (i % 3) * 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="group relative"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <Link 
                to={`/project/${routeId}`}
                className="w-full block relative h-full flex flex-col overflow-hidden text-left rounded-2xl bg-white border border-[#22C55E]/30 transition-all duration-700 hover:border-[#FACC15]/60 hover:shadow-[0_10px_40px_rgba(34,197,94,0.06)] cursor-pointer"
            >
                {/* Cover Photo */}
                <div className="relative aspect-video overflow-hidden group/img">
                    <AnimatePresence mode="popLayout">
                        <motion.div
                            key={currentImage + "_wrapper"}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.5, ease: "easeInOut" }}
                            className="w-full h-full relative"
                        >
                            <ImageWithSkeleton
                                src={currentImage}
                                alt={item.title}
                                showSkeleton={activeIndex === -1}
                                className="w-full h-full object-cover no-browser-trigger"
                            />
                        </motion.div>
                    </AnimatePresence>

                    {/* Shimmer Light Sweep */}
                    <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform [transition-duration:1.5s] ease-in-out bg-gradient-to-r from-transparent via-white/[0.15] to-transparent" />
                    </div>

                    {/* Bottom Fade */}
                    <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />

                    {/* Featured Badge */}
                    {item.featured && (
                        <div className="absolute top-4 left-4 z-20 px-3 py-1.5 rounded-full bg-[#22C55E]/90 text-white text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm">
                            ✦ Featured
                        </div>
                    )}
                    
                    {/* Hover Arrow */}
                    <div className="absolute bottom-5 right-5 z-20 w-10 h-10 rounded-full bg-white/40 backdrop-blur-md border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:translate-y-0 translate-y-2">
                        <ArrowUpRight className="w-4 h-4 text-gray-900" />
                    </div>
                </div>

                {/* Content Strip */}
                <div className="p-5 sm:p-6 bg-white flex-1 flex flex-col">
                    {/* Category Pills */}
                    <div className="flex flex-wrap gap-2 mb-3">
                        {cats.slice(0, 2).map((cat, ci) => (
                            <span
                                key={ci}
                                className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.15em] text-[#22C55E] border border-[#22C55E]/10 bg-[#22C55E]/5"
                            >
                                {cat}
                            </span>
                        ))}
                    </div>

                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight tracking-tight group-hover:text-[#22C55E] transition-colors duration-500 mb-2">
                        {item.title}
                    </h3>

                    <p className="text-gray-500 text-sm leading-relaxed line-clamp-3">
                        {item.desc?.replace(/<[^>]*>?/gm, '').substring(0, 200)}
                    </p>
                </div>

                {/* Hover Border Glow (Golden) */}
                <div className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700 shadow-[inset_0_0_0_1.5px_#FACC15]" />
            </Link>
        </motion.div>
    );
}

const DEFAULT_CATEGORIES = ['SaaS', 'eCommerce', 'Enterprise', 'Education', 'Portfolio'];

export function ProjectsSection() {
    const { lang } = useLang();
    const { content } = useContent();

    const [activeCategory, setActiveCategory] = useState('All');
    const [visibleCount, setVisibleCount] = useState(6);

    useEffect(() => {
        setVisibleCount(6);
    }, [activeCategory]);

    const enData = (content.en as any).projects || {};
    const bnData = (content.bn as any).projects || {};
    const enItems: any[] = Array.isArray(enData.items) && enData.items.length > 0
        ? enData.items
        : fallbackProjects.map((p, i) => ({
            ...p,
            _originalIndex: i,
            _id: p.id,
        }));
    const bnItems: any[] = Array.isArray(bnData.items) ? bnData.items : [];

    const displayItems = enItems.map((enItem, i) => {
        const bnItem = bnItems[i];
        const showBn = lang === 'bn' && bnItem && bnItem.title && bnItem.title.trim() !== '';
        return { ...(showBn ? bnItem : enItem), _originalIndex: i, _id: enItem.id || '' };
    });

    const items = [...displayItems]
        .filter(item => !item.hidden) // Exclude projects hidden from admin panel
        .sort((a, b) => (a.order ?? a._originalIndex) - (b.order ?? b._originalIndex))
        .filter(item => activeCategory === 'All' || (item.categories || [item.category]).includes(activeCategory));

    const visibleItems = items.slice(0, visibleCount);

    const ALL_CATEGORIES = ['All', ...(enData.categories || DEFAULT_CATEGORIES)];

    return (
        <section id="projects" className="py-16 sm:py-20 bg-[#FDFBF7] relative overflow-hidden" style={{ overflowAnchor: 'none' }}>
            <Helmet>
                <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
            </Helmet>

            {/* Ambient Background Elements */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#22C55E]/[0.03] rounded-full blur-[120px] -translate-y-1/2" />
                <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-[#FACC15]/[0.03] rounded-full blur-[140px] translate-y-1/2" />
            </div>

            <div className="max-w-7xl mx-auto px-5 sm:px-8 relative z-10">
                {/* Section Header */}
                <div className="mb-10 sm:mb-14">
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="flex items-center gap-3 mb-4"
                    >
                        <div className="w-8 h-[2px] bg-[#22C55E]" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#22C55E]">
                            Creative Archive
                        </span>
                    </motion.div>

                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                        <motion.h2
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, delay: 0.1 }}
                            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-none text-gray-900"
                            style={{ fontFamily: "'Outfit', sans-serif" }}
                        >
                            All <span className="text-gray-300">Projects</span>
                        </motion.h2>

                        {/* Minimal Filter */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            className="flex flex-wrap gap-2 lg:max-w-md"
                        >
                            {ALL_CATEGORIES.map((cat) => {
                                const isActive = activeCategory === cat;
                                return (
                                    <button
                                        key={cat}
                                        onClick={() => setActiveCategory(cat)}
                                        className={`relative px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-300 border ${
                                            isActive
                                                ? 'bg-[#22C55E]/10 border-[#22C55E]/20 text-[#22C55E]'
                                                : 'bg-white border-gray-200 text-gray-500 hover:text-gray-900 hover:border-gray-300 hover:bg-gray-50'
                                        }`}
                                    >
                                        {cat}
                                    </button>
                                );
                            })}
                        </motion.div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
                    <AnimatePresence>
                        {visibleItems.map((item, i) => (
                            <motion.div
                                key={item._id || item._originalIndex}
                                initial={{ opacity: 0, scale: 0.95, y: 40 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.5, delay: i >= visibleCount - 3 ? (i % 3) * 0.1 : 0 }}
                            >
                                <CinematicCard 
                                    item={item} 
                                    i={i} 
                                    routeId={item._id || String(item._originalIndex)} 
                                />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {visibleCount < items.length && (
                    <div className="mt-12 flex justify-center w-full">
                        <button
                            onClick={() => setVisibleCount(prev => prev + 3)}
                            className="group relative px-8 py-4 bg-white text-gray-900 border border-[#22C55E]/20 font-bold rounded-xl hover:border-[#22C55E]/60 transition-all duration-300 shadow-sm hover:shadow-[0_10px_40px_rgba(34,197,94,0.1)] overflow-hidden"
                            style={{ fontFamily: "'Outfit', sans-serif" }}
                        >
                            <span className="relative z-10">Explore More Projects</span>
                            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-0 bg-[#22C55E]/5 transition-transform duration-500 ease-out" />
                        </button>
                    </div>
                )}
                
                {items.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <span className="text-4xl font-extrabold tracking-tight text-gray-200" style={{ fontFamily: "'Outfit', sans-serif" }}>
                            No Projects
                        </span>
                        <p className="text-sm text-gray-400 mt-2">No projects found in this category.</p>
                    </div>
                )}
            </div>

            <WaveDivider fill="#0A0A0A" />
        </section>
    );
}
