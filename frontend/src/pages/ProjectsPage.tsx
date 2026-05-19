import { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useInView } from 'framer-motion';
import { useLang } from '@/contexts/LanguageContext';
import { useContent } from '@/contexts/ContentContext';
import { ImageWithSkeleton } from '@/components/orbit/ImageWithSkeleton';
import { Navbar } from '@/components/orbit/Navbar';
import { OrbitFooter } from '@/components/orbit/OrbitFooter';
import { Chatbot } from '@/components/orbit/chatbot';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowUpRight, FolderOpen } from 'lucide-react';

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

// --- Cinematic Archive Card ---
function ArchiveCard({ item, i }: { item: ProjectItem; i: number }) {
    const routeId = item._id || item._originalIndex;
    const coverImage = item.images?.[0] || item.image || '/placeholder.png';
    const cats: string[] = item.categories || (item.category ? [item.category] : []);
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, amount: 0.1 });

    const [isHovered, setIsHovered] = useState(false);

    // Ported Hover Cycling Logic
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
            initial={{ opacity: 0, scale: 0.95, y: 40 }}
            animate={isInView ? { opacity: 1, scale: 1, y: 0 } : {}}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.7, delay: (i % 3) * 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="group relative"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <Link 
                to={`/project/${routeId}`} 
                className="block relative h-full flex flex-col overflow-hidden rounded-2xl bg-white border border-[#22C55E]/30 transition-all duration-700 hover:border-[#FACC15]/60 hover:shadow-[0_10px_40px_rgba(34,197,94,0.06)]"
            >
                
                {/* Cover Photo */}
                <div className="relative aspect-video overflow-hidden">
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

                    {/* Shimmer */}
                    <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform [transition-duration:1.5s] ease-in-out bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
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
                    <div className="absolute bottom-5 right-5 z-20 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:translate-y-0 translate-y-2">
                        <ArrowUpRight className="w-4 h-4 text-white" />
                    </div>
                </div>

                {/* Content */}
                <div className="p-5 sm:p-6 flex-1 flex flex-col">
                    <div className="flex flex-wrap gap-2 mb-3">
                        {cats.slice(0, 2).map((cat, ci) => (
                            <span key={ci} className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.15em] text-[#22C55E] border border-[#22C55E]/20 bg-[#22C55E]/5">
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

                    {item.tags && item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-auto pt-4">
                            {item.tags.slice(0, 4).map((tag: string) => (
                                <span key={tag} className="text-[10px] text-gray-400 font-medium">
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Hover Border Glow (Golden) */}
                <div className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700 shadow-[inset_0_0_0_1.5px_#FACC15]" />
            </Link>
        </motion.div>
    );
}

// --- Main Page ---
const DEFAULT_CATEGORIES = ['SaaS', 'eCommerce', 'Enterprise', 'Education', 'Portfolio'];

export default function ProjectsPage() {
    const { lang } = useLang();
    const { content } = useContent();
    const containerRef = useRef<HTMLDivElement>(null);
    const [activeCategory, setActiveCategory] = useState('All');

    const enData = (content.en as any).projects || {};
    const bnData = (content.bn as any).projects || {};
    const enItems: any[] = Array.isArray(enData.items) ? enData.items : [];
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

    const ALL_CATEGORIES = ['All', ...(enData.categories || DEFAULT_CATEGORIES)];

    return (
        <div ref={containerRef} className="min-h-screen bg-[#FDFBF7] text-gray-900 selection:bg-[#22C55E]/10 overflow-x-hidden">
            <Helmet>
                <title>Project Archive | ORBIT SaaS</title>
                <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
            </Helmet>
            <Navbar />
            <main className="relative pt-32 sm:pt-40 pb-32">
                {/* Ambient Background */}
                <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                    <div className="absolute inset-0 opacity-[0.03]" style={{
                        backgroundImage: 'linear-gradient(rgba(0,0,0,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,.05) 1px, transparent 1px)',
                        backgroundSize: '80px 80px'
                    }} />
                    <div className="absolute top-0 left-1/3 w-[600px] h-[400px] bg-[#22C55E]/[0.05] rounded-full blur-[120px]" />
                    <div className="absolute bottom-1/4 right-0 w-[500px] h-[300px] bg-[#FACC15]/[0.05] rounded-full blur-[100px]" />
                </div>

                <div className="max-w-7xl mx-auto px-5 sm:px-8 relative z-10">
                    {/* Header */}
                    <header className="mb-16 sm:mb-20">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            className="flex items-center gap-3 mb-6"
                        >
                            <div className="w-8 h-[2px] bg-[#22C55E]" />
                            <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#22C55E]">
                                Complete Archive
                            </span>
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                            className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05] text-gray-900 mb-10"
                            style={{ fontFamily: "'Outfit', sans-serif" }}
                        >
                            All <span className="text-gray-300">Projects</span>
                        </motion.h1>

                        {/* Category Filter */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="flex flex-wrap gap-2 pt-8 border-t border-white/[0.06]"
                        >
                            {ALL_CATEGORIES.map((cat) => {
                                const isActive = activeCategory === cat;
                                return (
                                    <button
                                        key={cat}
                                        onClick={() => setActiveCategory(cat)}
                                        className={`relative px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-[0.2em] transition-all duration-300 border ${
                                            isActive
                                                ? 'bg-white/[0.08] border-white/[0.15] text-white'
                                                : 'bg-transparent border-white/[0.06] text-white/30 hover:text-white/60 hover:border-white/[0.1]'
                                        }`}
                                    >
                                        {cat}
                                        {isActive && (
                                            <motion.div
                                                layoutId="active-cat-pill"
                                                className="absolute inset-0 rounded-full bg-white/[0.06] -z-10"
                                            />
                                        )}
                                    </button>
                                );
                            })}
                        </motion.div>
                    </header>

                    {/* Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 lg:gap-8">
                        <AnimatePresence>
                            {items.map((item, i) => (
                                <ArchiveCard key={item._id || item._originalIndex} item={item} i={i} />
                            ))}
                        </AnimatePresence>
                    </div>

                    {/* Empty State */}
                    {items.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-40 text-center">
                            <span className="text-6xl font-extrabold tracking-tight text-white/5" style={{ fontFamily: "'Outfit', sans-serif" }}>
                                No Projects
                            </span>
                            <p className="text-sm text-white/20 mt-4">No projects found in this category.</p>
                        </div>
                    )}
                </div>
            </main>
            <OrbitFooter />
            <Chatbot />
        </div>
    );
}
