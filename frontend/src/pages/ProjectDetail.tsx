import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ExternalLink, ChevronLeft, ChevronRight, ChevronDown, X, ArrowRight, Star, ArrowUpRight, Share2, Check, Maximize2, Lock, Play } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { useContent } from '@/contexts/ContentContext';
import { Navbar } from '@/components/orbit/Navbar';
import { OrbitFooter } from '@/components/orbit/OrbitFooter';
import { MobileFooter } from '@/components/orbit/MobileFooter';
import { Chatbot } from '@/components/orbit/chatbot';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { ensureAbsoluteUrl } from '@/lib/utils';
import DOMPurify from 'dompurify';
import { ImageWithSkeleton } from '@/components/orbit/ImageWithSkeleton';
import { RichText } from '@/components/ui/RichText';
import { toast } from 'sonner';
import { getImageUrl, getFallbackUrl } from '@/lib/imageUrl';

type MediaItem = { type: 'image'; url: string } | { type: 'video'; url: string };

function ImageGallery({ images, title, videoUrl, onLightboxChange }: { images: string[]; title: string; videoUrl?: string; onLightboxChange?: (open: boolean) => void }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [direction, setDirection] = useState(0);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [autoPlayKey, setAutoPlayKey] = useState(0);
    const [isInView, setIsInView] = useState(true);
    const thumbnailContainerRef = useRef<HTMLDivElement>(null);
    const galleryRef = useRef<HTMLDivElement>(null);

    // Build mixed media array: images + video at position 1 (2nd slide)
    const media: MediaItem[] = (() => {
        const items: MediaItem[] = images.map(url => ({ type: 'image' as const, url }));
        if (videoUrl) {
            const pos = Math.min(1, items.length); // insert at position 1, or end if only 1 image
            items.splice(pos, 0, { type: 'video' as const, url: videoUrl });
        }
        return items;
    })();

    // Only autoplay when gallery is actively visible and user hasn't scrolled down the page
    useEffect(() => {
        const el = galleryRef.current;
        if (!el || typeof IntersectionObserver === 'undefined') return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                // Gallery must be at least 25% visible in viewport to consider in-view
                setIsInView(entry.isIntersecting);
            },
            { threshold: 0.25 }
        );
        observer.observe(el);

        // Also stop autoplay if user has scrolled down into the project content
        const handleScroll = () => {
            if (window.scrollY > 180) {
                setIsInView(false);
            }
        };
        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            observer.disconnect();
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    useEffect(() => {
        if (media.length <= 1 || lightboxOpen || !isInView) return;
        const timer = setInterval(() => {
            setDirection(1);
            setCurrentIndex((prev) => (prev + 1) % media.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [media.length, lightboxOpen, isInView, autoPlayKey]);

    // Keep active thumbnail centered within the filmstrip only, without touching the window scroll
    useEffect(() => {
        if (thumbnailContainerRef.current) {
            const container = thumbnailContainerRef.current;
            const activeBtn = container.children[currentIndex] as HTMLElement;
            if (activeBtn) {
                const scrollTarget = activeBtn.offsetLeft - (container.clientWidth / 2) + (activeBtn.clientWidth / 2);
                container.scrollTo({ left: Math.max(0, scrollTarget), behavior: 'smooth' });
            }
        }
    }, [currentIndex]);

    // Lock body and html scroll when lightbox is active to prevent page scrolling underneath
    useEffect(() => {
        if (lightboxOpen) {
            const originalBodyOverflow = document.body.style.overflow;
            const originalHtmlOverflow = document.documentElement.style.overflow;
            document.body.style.overflow = 'hidden';
            document.documentElement.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = originalBodyOverflow;
                document.documentElement.style.overflow = originalHtmlOverflow;
            };
        }
    }, [lightboxOpen]);

    if (media.length === 0) return null;

    const paginate = (newDirection: number) => {
        setDirection(newDirection);
        setCurrentIndex((prev) => (prev + newDirection + media.length) % media.length);
        setAutoPlayKey(prev => prev + 1);
    };

    const openLightbox = () => { setLightboxOpen(true); onLightboxChange?.(true); };
    const closeLightbox = () => { setLightboxOpen(false); onLightboxChange?.(false); };

    const swipePower = (offset: number, velocity: number) => {
        return Math.abs(offset) * velocity;
    };

    const handleDragEnd = (e: any, { offset, velocity }: any) => {
        const swipe = swipePower(offset.x, velocity.x);

        if (swipe < -10000) {
            paginate(1);
        } else if (swipe > 10000) {
            paginate(-1);
        }
    };

    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? '100%' : '-100%',
            opacity: 0,
            zIndex: 0
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? '100%' : '-100%',
            opacity: 0
        })
    };

    const currentMedia = media[currentIndex];
    const ytId = currentMedia.type === 'video' ? extractYouTubeId(currentMedia.url) : null;

    const renderMediaSlide = (item: MediaItem, isLightbox = false) => {
        if (item.type === 'video') {
            const vid = extractYouTubeId(item.url);
            if (vid) {
                return (
                    <iframe
                        src={`https://www.youtube-nocookie.com/embed/${vid}?rel=0&modestbranding=1`}
                        title={title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        className={isLightbox ? "w-full h-full" : "absolute inset-0 w-full h-full"}
                        loading="lazy"
                    />
                );
            }
            return (
                <video
                    src={item.url}
                    controls
                    playsInline
                    className={isLightbox ? "max-w-full max-h-full object-contain" : "absolute inset-0 w-full h-full object-contain bg-black"}
                />
            );
        }
        return null; // images handled by motion.img
    };

    return (
        <>
            {/* Main Apple Studio Showcase */}
            <motion.div
                ref={galleryRef}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="w-full max-w-5xl mx-auto px-3 sm:px-6 pt-5 sm:pt-8 relative"
            >
                {/* Dynamic Ambient Backlight Glow (Apple TV / Studio Style) */}
                <div className="absolute inset-0 sm:-inset-6 bg-gradient-to-r from-emerald-500/15 via-teal-400/10 to-indigo-500/15 rounded-3xl blur-xl sm:blur-3xl opacity-60 pointer-events-none -z-10" />
                {currentMedia.type === 'image' && (
                    <div className="absolute inset-0 sm:-inset-4 rounded-3xl blur-xl opacity-30 pointer-events-none -z-10 hidden sm:block overflow-hidden transition-all duration-700">
                        <img
                            src={getImageUrl(currentMedia.url)}
                            alt=""
                            className="w-full h-full object-cover scale-105 blur-lg"
                            aria-hidden="true"
                        />
                    </div>
                )}

                {/* Apple Studio / macOS Window Display Container */}
                <div className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden border border-zinc-200/90 bg-white/95 backdrop-blur-xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.09)] group">
                    {/* macOS Studio Window Chrome Header */}
                    <div className="flex items-center justify-between px-3 sm:px-6 py-2.5 sm:py-3 border-b border-zinc-200/80 bg-zinc-50/90 backdrop-blur-md select-none gap-2">
                        {/* Traffic light window controls */}
                        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                            <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#FF5F56] border border-[#E0443E]/40 inline-block shadow-xs" />
                            <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]/40 inline-block shadow-xs" />
                            <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#27C93F] border border-[#1AAB29]/40 inline-block shadow-xs" />
                        </div>

                        {/* Centered Apple-Style Project Name Pill (Shows ONLY Project Name) */}
                        <div className="flex items-center gap-1.5 px-3 py-0.5 sm:py-1 rounded-full bg-white/95 border border-zinc-200/90 text-zinc-800 text-[11px] sm:text-xs font-semibold max-w-[160px] sm:max-w-xs md:max-w-md truncate shadow-2xs">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
                            <span className="truncate">{title}</span>
                        </div>

                        {/* Right side: Counter & Zoom */}
                        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
                            <span className="text-[10px] sm:text-[11px] font-bold text-zinc-500 tabular-nums px-2 sm:px-2.5 py-0.5 rounded-full bg-zinc-200/70">
                                {currentIndex + 1} / {media.length}
                            </span>
                            {currentMedia.type === 'image' && (
                                <button
                                    onClick={openLightbox}
                                    className="flex items-center justify-center p-1 sm:p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/70 transition-all cursor-pointer active:scale-95"
                                    title="Open Fullscreen Album View"
                                    aria-label="Expand image"
                                >
                                    <Maximize2 className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Main Media Stage */}
                    <div className="relative w-full aspect-video bg-zinc-950/5">
                        <div className={`absolute inset-0 ${currentMedia.type === 'image' ? 'cursor-pointer' : ''}`} onClick={currentMedia.type === 'image' ? openLightbox : undefined}>
                            {currentMedia.type === 'video' ? (
                                renderMediaSlide(currentMedia)
                            ) : (
                                <AnimatePresence initial={false} custom={direction}>
                                    <motion.img
                                        key={currentIndex}
                                        src={getImageUrl(currentMedia.url)}
                                        custom={direction}
                                        variants={variants}
                                        initial="enter"
                                        animate="center"
                                        exit="exit"
                                        transition={{
                                            x: { type: "spring", stiffness: 300, damping: 30 },
                                            opacity: { duration: 0.2 }
                                        }}
                                        drag="x"
                                        dragConstraints={{ left: 0, right: 0 }}
                                        dragElastic={1}
                                        onDragEnd={handleDragEnd}
                                        draggable="false"
                                        loading="eager"
                                        {...({ fetchpriority: 'high' })}
                                        className="absolute inset-0 w-full h-full object-contain bg-black/5 touch-pan-y no-browser-trigger"
                                        alt={`${title} - slide ${currentIndex + 1}`}
                                        onError={(e) => {
                                            const fb = getFallbackUrl(currentMedia.url);
                                            if (fb && e.currentTarget.src !== fb) e.currentTarget.src = fb;
                                        }}
                                    />
                                </AnimatePresence>
                            )}
                        </div>
                    </div>
                </div>

                {/* Interactive Apple Album Filmstrip / Thumbnail Reel */}
                {media.length > 1 && (
                    <div className="mt-4 sm:mt-5 flex items-center justify-between gap-1.5 sm:gap-3 w-full max-w-full relative z-10 px-0 sm:px-2">
                        {/* Backward Navigation */}
                        <button
                            onClick={(e) => { e.stopPropagation(); paginate(-1); }}
                            className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-zinc-200/90 bg-white text-zinc-700 hover:text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50/60 shadow-xs hover:shadow-md transition-all shrink-0 cursor-pointer active:scale-95"
                            aria-label="Previous slide"
                        >
                            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>

                        {/* Filmstrip Strip Container */}
                        <div
                            ref={thumbnailContainerRef}
                            className="flex-1 min-w-0 flex items-center gap-1.5 sm:gap-2.5 overflow-x-auto py-1.5 px-1 scroll-smooth no-scrollbar"
                            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                        >
                            {media.map((item, idx) => {
                                const isActive = idx === currentIndex;
                                return (
                                    <motion.button
                                        key={idx}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setDirection(idx > currentIndex ? 1 : -1);
                                            setCurrentIndex(idx);
                                            setAutoPlayKey(prev => prev + 1);
                                        }}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className={`relative flex-shrink-0 rounded-lg sm:rounded-xl overflow-hidden transition-all duration-300 cursor-pointer ${
                                            isActive
                                                ? 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-[#FDFBF7] shadow-md scale-105 opacity-100'
                                                : 'opacity-50 hover:opacity-90 border border-zinc-200/80 bg-zinc-100 hover:border-zinc-300'
                                        }`}
                                        style={{
                                            width: '58px',
                                            height: '38px',
                                        }}
                                        title={item.type === 'video' ? 'Video preview' : `Screen ${idx + 1}`}
                                    >
                                        {item.type === 'video' ? (
                                            <div className="w-full h-full bg-zinc-900 flex flex-col items-center justify-center text-white relative">
                                                <Play className="w-3 h-3 text-emerald-400 fill-emerald-400" />
                                                <span className="text-[7px] font-bold uppercase tracking-tighter text-emerald-200">Video</span>
                                            </div>
                                        ) : (
                                            <img
                                                src={getImageUrl(item.url)}
                                                alt={`Thumbnail ${idx + 1}`}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    const fb = getFallbackUrl(item.url);
                                                    if (fb && e.currentTarget.src !== fb) e.currentTarget.src = fb;
                                                }}
                                            />
                                        )}
                                        {/* Slide Number Badge */}
                                        <div className={`absolute bottom-0.5 right-0.5 text-[8px] font-bold px-1 rounded tabular-nums ${
                                            isActive ? 'bg-emerald-600 text-white' : 'bg-black/60 text-white'
                                        }`}>
                                            {idx + 1}
                                        </div>
                                    </motion.button>
                                );
                            })}
                        </div>

                        {/* Forward Navigation */}
                        <button
                            onClick={(e) => { e.stopPropagation(); paginate(1); }}
                            className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-zinc-200/90 bg-white text-zinc-700 hover:text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50/60 shadow-xs hover:shadow-md transition-all shrink-0 cursor-pointer active:scale-95"
                            aria-label="Next slide"
                        >
                            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                    </div>
                )}
            </motion.div>

            {/* Lightbox Overlay */}
            <AnimatePresence>
                {lightboxOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center p-2 sm:p-4 md:p-8 w-screen h-[100dvh] max-w-[100vw] max-h-[100dvh] overflow-hidden touch-none"
                        onClick={closeLightbox}
                    >
                        <button
                            onClick={closeLightbox}
                            className="absolute top-4 sm:top-6 right-4 sm:right-6 z-20 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                        >
                            <X className="w-6 h-6 sm:w-8 sm:h-8" />
                        </button>

                        {media.length > 1 && (
                            <>
                                <button
                                    onClick={(e) => { e.stopPropagation(); paginate(-1); }}
                                    className="absolute left-2 sm:left-4 md:left-8 z-20 p-3 sm:p-4 rounded-full border border-white/15 bg-white/10 text-white transition-colors hover:bg-white/20 hidden sm:flex items-center justify-center cursor-pointer"
                                >
                                    <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); paginate(1); }}
                                    className="absolute right-2 sm:right-4 md:right-8 z-20 p-3 sm:p-4 rounded-full border border-white/15 bg-white/10 text-white transition-colors hover:bg-white/20 hidden sm:flex items-center justify-center cursor-pointer"
                                >
                                    <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
                                </button>
                            </>
                        )}

                        {currentMedia.type === 'video' ? (
                            <div className="w-full max-w-[85vw] aspect-video" onClick={(e) => e.stopPropagation()}>
                                {renderMediaSlide(currentMedia, true)}
                            </div>
                        ) : (
                            <motion.img
                                key={currentIndex}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.3 }}
                                src={getImageUrl(currentMedia.url)}
                                alt="Fullscreen view"
                                drag="x"
                                dragConstraints={{ left: 0, right: 0 }}
                                dragElastic={1}
                                onDragEnd={handleDragEnd}
                                draggable="false"
                                className="max-w-[95vw] max-h-[80vh] md:max-w-[85vw] md:max-h-[85vh] object-contain select-none shadow-2xl touch-pan-y no-browser-trigger"
                                onClick={(e) => e.stopPropagation()}
                                onError={(e) => {
                                    const fb = getFallbackUrl(currentMedia.url);
                                    if (fb && e.currentTarget.src !== fb) e.currentTarget.src = fb;
                                }}
                            />
                        )}

                        <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 group max-w-[92vw] overflow-hidden">
                            {/* Premium Gradient Border Wrapper */}
                            <div className="relative p-[1.5px] rounded-full border border-white/20">
                                <div className="flex items-center gap-3 sm:gap-4 text-white font-medium bg-[#0A0A0B]/90 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full backdrop-blur-xl">
                                    {/* Mobile specific navigation inside indicator row */}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); paginate(-1); }}
                                        className="flex sm:hidden p-1.5 bg-[#22C55E] hover:bg-[#16A34A] text-white rounded-full transition-colors shadow-sm cursor-pointer"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>

                                    <span className="text-xs sm:text-base min-w-[3rem] text-center tracking-wider tabular-nums font-semibold">
                                        {currentIndex + 1} <span className="text-[#FFD700] mx-0.5">/</span> {media.length}
                                    </span>

                                    <button
                                        onClick={(e) => { e.stopPropagation(); paginate(1); }}
                                        className="flex sm:hidden p-1.5 bg-[#22C55E] hover:bg-[#16A34A] text-white rounded-full transition-colors shadow-sm cursor-pointer"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

function stripHtml(html: string): string {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
}

/** Extract YouTube video ID from various URL formats */
function extractYouTubeId(url: string): string | null {
    if (!url) return null;
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtu\.be\/)([\w-]{11})/,
        /^([\w-]{11})$/,  // bare video ID
    ];
    for (const pat of patterns) {
        const m = url.match(pat);
        if (m) return m[1];
    }
    return null;
}


const CARD_PALETTES = [
    {
        border: 'from-emerald-500 via-teal-400 to-cyan-500',
        borderIdle: 'from-emerald-500/35 via-teal-400/25 to-cyan-500/35',
        accentBg: 'bg-emerald-50 text-emerald-600 border-emerald-200/80',
        line: 'bg-gradient-to-b from-emerald-500 to-teal-400',
        glow: 'shadow-[0_12px_32px_rgba(16,185,129,0.12)]',
    },
    {
        border: 'from-cyan-500 via-blue-500 to-indigo-500',
        borderIdle: 'from-cyan-500/35 via-blue-400/25 to-indigo-500/35',
        accentBg: 'bg-cyan-50 text-cyan-600 border-cyan-200/80',
        line: 'bg-gradient-to-b from-cyan-500 to-indigo-500',
        glow: 'shadow-[0_12px_32px_rgba(6,182,212,0.12)]',
    },
    {
        border: 'from-indigo-500 via-purple-500 to-pink-500',
        borderIdle: 'from-indigo-500/35 via-purple-400/25 to-pink-500/35',
        accentBg: 'bg-indigo-50 text-indigo-600 border-indigo-200/80',
        line: 'bg-gradient-to-b from-indigo-500 to-purple-500',
        glow: 'shadow-[0_12px_32px_rgba(99,102,241,0.12)]',
    },
    {
        border: 'from-teal-500 via-emerald-400 to-amber-500',
        borderIdle: 'from-teal-500/35 via-emerald-400/25 to-amber-500/35',
        accentBg: 'bg-teal-50 text-teal-600 border-teal-200/80',
        line: 'bg-gradient-to-b from-teal-500 to-emerald-400',
        glow: 'shadow-[0_12px_32px_rgba(20,184,166,0.12)]',
    },
];

function CollapsibleCards({ blocks }: { blocks: string[] }) {
    // First card expanded, rest collapsed by default
    const [expanded, setExpanded] = useState<Set<number>>(new Set());

    const toggle = (i: number) => {
        setExpanded(prev => {
            const next = new Set(prev);
            if (next.has(i)) next.delete(i);
            else next.add(i);
            return next;
        });
    };

    return (
        <div className="space-y-4 sm:space-y-5">
            {blocks.map((block: string, i: number) => {
                // Extract heading from block if present
                const headingMatch = block.match(/^<h3([^>]*)>(.*?)<\/h3>/i);
                const heading = headingMatch ? headingMatch[2].replace(/<[^>]*>/g, '').trim() : '';
                const bodyHtml = headingMatch ? block.replace(/^<h3[^>]*>.*?<\/h3>/i, '').trim() : block;
                const isExpanded = expanded.has(i);

                // For cards without heading, show a text preview
                const label = heading || `Section ${i + 1}`;
                const preview = !heading ? stripHtml(bodyHtml).slice(0, 60) : '';
                const palette = CARD_PALETTES[i % CARD_PALETTES.length];

                return (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 + i * 0.06 }}
                        className={`p-[1.5px] rounded-2xl sm:rounded-3xl transition-all duration-300 mb-4 sm:mb-5 group/card bg-gradient-to-r ${
                            isExpanded
                                ? `${palette.border} ${palette.glow}`
                                : `${palette.borderIdle} hover:${palette.border} shadow-2xs hover:shadow-md`
                        }`}
                    >
                        <div className="rounded-[calc(1rem-1.5px)] sm:rounded-[calc(1.5rem-1.5px)] bg-white overflow-hidden">
                            {/* Clickable heading bar */}
                            <button
                                type="button"
                                onClick={() => toggle(i)}
                                className={`w-full flex items-center gap-3.5 sm:gap-4 px-5 sm:px-8 py-4.5 sm:py-5 text-left transition-colors duration-200 cursor-pointer ${isExpanded ? 'bg-zinc-50/80' : 'hover:bg-zinc-50/40'}`}
                            >
                                {/* Colorful vertical indicator line */}
                                <div className={`w-1.5 h-7 rounded-full ${palette.line} shrink-0 transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'opacity-40 group-hover/card:opacity-90'}`} />

                                <div className="relative flex-shrink-0 group-hover/card:scale-105 transition-transform duration-300">
                                    <div className={`relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full border ${palette.accentBg}`}>
                                        <ChevronDown
                                            className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? '' : '-rotate-90'}`}
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                                    <h3
                                        className="text-base sm:text-xl font-bold tracking-tight text-zinc-950 transition-colors duration-200"
                                        style={{ fontFamily: "var(--font-display)" }}
                                    >
                                        {label}
                                    </h3>
                                    {!isExpanded && preview && (
                                        <span className="text-xs sm:text-sm text-zinc-400 truncate font-normal">{preview}…</span>
                                    )}
                                </div>
                            </button>
                            {/* Collapsible body */}
                            <AnimatePresence initial={false}>
                                {isExpanded && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                                        className="overflow-hidden border-t border-zinc-100/90"
                                    >
                                        <div
                                            className="px-6 sm:px-8 pb-6 sm:pb-8 pt-4 text-zinc-600 text-sm sm:text-base leading-relaxed space-y-4"
                                        >
                                            <RichText text={stripHtml(bodyHtml)} />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}

// --- Helper Components ---
function SuggestedProjectCard({ item, routeId }: { item: any, routeId: string }) {
    const coverImage = item.images?.[0] || item.image || '/placeholder.webp';
    const itemCats: string[] = item.categories || (item.category ? [item.category] : []);
    
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
    const [isTransitioning, setIsTransitioning] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const clearCycling = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    useEffect(() => {
        if (isHovered && hoverImageUrls.length > 0) {
            setIsTransitioning(true);
            const t1 = setTimeout(() => {
                setActiveIndex(0);
                setIsTransitioning(false);
            }, 50);

            intervalRef.current = setInterval(() => {
                setIsTransitioning(true);
                const t2 = setTimeout(() => {
                    setActiveIndex((prev: number) => (prev + 1) % hoverImageUrls.length);
                    setIsTransitioning(false);
                }, 300);
            }, 2000);

            return () => {
                clearCycling();
                clearTimeout(t1);
            };
        } else {
            clearCycling();
            if (!isHovered) {
                setIsTransitioning(true);
                const t3 = setTimeout(() => {
                    setActiveIndex(-1);
                    setIsTransitioning(false);
                }, 150);
                return () => clearTimeout(t3);
            }
        }
    }, [isHovered, hoverImageUrls.length, clearCycling]);

    const currentImage = activeIndex >= 0 && activeIndex < hoverImageUrls.length
        ? hoverImageUrls[activeIndex]
        : coverImage;

    return (
        <Link
            to={`/project/${routeId}`}
            className="group relative flex rounded-2xl overflow-hidden p-[1.5px] bg-gradient-to-r from-zinc-200/90 via-emerald-300/35 to-zinc-200/90 hover:from-emerald-500/70 hover:via-teal-400/60 hover:to-indigo-500/70 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(16,185,129,0.12)] shadow-2xs"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="flex gap-3.5 w-full bg-white p-3 rounded-[calc(1rem-1.5px)] items-center">
                <div className="relative w-24 sm:w-28 flex-shrink-0 aspect-[16/10] rounded-xl overflow-hidden bg-zinc-100 border border-zinc-200/60">
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
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 no-browser-trigger"
                            />
                        </motion.div>
                    </AnimatePresence>
                </div>
                <div className="flex flex-col justify-center min-w-0 z-10 flex-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 mb-1 line-clamp-1">
                        {itemCats.slice(0, 2).join(' · ')}
                    </span>
                    <h3 className="font-display text-xs sm:text-sm font-bold text-zinc-900 group-hover:text-emerald-700 transition-colors line-clamp-2 leading-snug">
                        {item.title}
                    </h3>
                </div>
            </div>
        </Link>
    );
}

export default function ProjectDetail() {
    const { id } = useParams<{ id: string }>();
    const { lang } = useLang();
    const { content } = useContent();
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [isCopied, setIsCopied] = useState(false);

    // Data with Fallback Logic
    const enData = (content.en as any).projects || {};
    const bnData = (content.bn as any).projects || {};
    const enItems: any[] = Array.isArray(enData.items) ? enData.items : [];
    const bnItems: any[] = Array.isArray(bnData.items) ? bnData.items : [];

    // Try slug-based lookup first, then fall back to numeric index
    let idx = -1;
    const slugIndex = enItems.findIndex((item: any) => item.id && item.id === id);
    if (slugIndex >= 0) {
        idx = slugIndex;
    } else {
        const numericIdx = parseInt(id || '-1', 10);
        if (!isNaN(numericIdx) && numericIdx >= 0 && numericIdx < enItems.length) {
            idx = numericIdx;
        }
    }

    // Get potential projects
    const baseItem = idx >= 0 ? enItems[idx] : undefined;
    const isBn = lang === 'bn';

    const project = baseItem ? {
        ...baseItem,
        title: isBn && baseItem.bn?.title?.trim() ? baseItem.bn.title : baseItem.title || baseItem.en?.title || '',
        desc: isBn && baseItem.bn?.description?.trim() ? baseItem.bn.description : baseItem.desc || baseItem.en?.description || ''
    } : undefined;

    if (!project || idx < 0 || baseItem?.hidden) {
        return (
            <div className="min-h-[100dvh] bg-[#FDFBF7] text-zinc-900">
                <Navbar />
                <div className="flex flex-col items-center justify-center py-40 px-4">
                    <Helmet>
                        <title>Project Not Found | Orbit SaaS</title>
                        <meta name="robots" content="noindex" />
                    </Helmet>
                    <h1 className="text-3xl font-bold mb-4 font-display">Project Not Found</h1>
                    <Link to="/#projects" className="text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-2">
                        <ArrowLeft className="w-4 h-4" /> Back to Projects
                    </Link>
                </div>
                <OrbitFooter />
            </div>
        );
    }

    // Build images array: prefer `images`, fallback to single `image`
    const allImages: string[] =
        project.images && Array.isArray(project.images) && project.images.length > 0
            ? project.images
            : project.image
                ? [project.image]
                : [];

    // SEO Data (Shared)
    // Note: SEO data on the item is shared so it should be available on both EN and BN objects
    const seoTitle = project.seo?.title || `${project.title} | Orbit SaaS Case Study`;
    const plainDesc = stripHtml(project.desc || '');
    const seoDesc = project.seo?.description || (plainDesc.length > 160 ? plainDesc.substring(0, 157) + '...' : plainDesc);
    const seoKeywords = project.seo?.keywords?.join(', ') || project.tags?.join(', ') || 'SaaS, Portfolio, Case Study';
    const ogImage = `https://orbitsaas.cloud/api/og?project=${encodeURIComponent(id || '')}`;
    const currentUrl = `https://orbitsaas.cloud/project/${id}`;



    return (
        <div className="min-h-[100dvh] relative bg-gradient-to-b from-[#F8FAFC] via-[#FDFBF7] to-[#F8FAFC] text-zinc-900 selection:bg-zinc-900 selection:text-white">
            {/* Ambient Apple Studio Canvas Lighting & Micro-Dot Grid */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden select-none" aria-hidden="true">
                {/* Subtle Apple Studio Dot-Matrix Texture to eliminate stark white emptiness */}
                <div
                    className="absolute inset-0 opacity-[0.035]"
                    style={{
                        backgroundImage: 'radial-gradient(circle at 1.5px 1.5px, #000 1px, transparent 0)',
                        backgroundSize: '24px 24px'
                    }}
                />
                {/* Top-Right Emerald & Teal Radiant Glow */}
                <div className="absolute top-0 right-[-10%] w-[750px] h-[750px] bg-gradient-to-bl from-emerald-200/35 via-teal-100/20 to-transparent rounded-full blur-[140px] -translate-y-1/3" />
                {/* Top-Left Indigo & Cyan Radiant Glow */}
                <div className="absolute top-10 left-[-10%] w-[700px] h-[700px] bg-gradient-to-br from-indigo-200/25 via-cyan-100/20 to-transparent rounded-full blur-[150px] -translate-y-1/4" />
                {/* Left & Right Atmospheric Light Cones specifically filling the empty margins */}
                <div className="absolute top-[420px] left-[-8%] w-[550px] h-[550px] bg-emerald-100/35 rounded-full blur-[130px]" />
                <div className="absolute top-[580px] right-[-8%] w-[550px] h-[550px] bg-amber-100/30 rounded-full blur-[140px]" />
            </div>
            <Helmet>
                <title data-rh="true">{seoTitle}</title>
                <meta data-rh="true" name="description" content={seoDesc} />
                <meta data-rh="true" name="keywords" content={seoKeywords} />
                <link data-rh="true" rel="canonical" href={currentUrl} />

                {/* OpenGraph / Facebook */}
                <meta data-rh="true" property="og:type" content="article" />
                <meta data-rh="true" property="og:title" content={seoTitle} />
                <meta data-rh="true" property="og:description" content={seoDesc} />
                <meta data-rh="true" property="og:image" content={ogImage} />
                <meta data-rh="true" property="og:url" content={currentUrl} />
                <meta data-rh="true" property="og:site_name" content="ORBIT SaaS" />

                {/* Twitter */}
                <meta data-rh="true" name="twitter:card" content="summary_large_image" />
                <meta data-rh="true" name="twitter:title" content={seoTitle} />
                <meta data-rh="true" name="twitter:description" content={seoDesc} />
                <meta data-rh="true" name="twitter:image" content={ogImage} />
                <meta data-rh="true" name="twitter:image:alt" content={seoTitle} />
            </Helmet>
            {!lightboxOpen && <Navbar />}
            <main className="pt-20 relative z-10">
                {/* Image + Video Gallery */}
                <ImageGallery images={allImages} title={project.title} videoUrl={project.videoPreview} onLightboxChange={setLightboxOpen} />

                {/* Two-Column Layout: Content + Sidebar */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-16 flex flex-col lg:flex-row gap-10">
                    {/* Left: Main Content */}
                    <div className="flex-1 min-w-0">

                        {/* Project Title Card with Apple Gradient Border */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.05 }}
                            className="relative p-[1.5px] rounded-2xl sm:rounded-3xl bg-gradient-to-r from-emerald-500/50 via-teal-400/40 to-indigo-500/50 shadow-[0_8px_32px_rgba(16,185,129,0.08)] mb-8 overflow-hidden group"
                        >
                            {/* Top iridescent hairline */}
                            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-400 pointer-events-none opacity-80" />

                            <div className="rounded-[calc(1rem-1.5px)] sm:rounded-[calc(1.5rem-1.5px)] bg-white/95 backdrop-blur-xl px-6 sm:px-10 py-7 sm:py-9 relative z-10 text-center">
                                {/* Top row: Breadcrumb + Share Button */}
                                <div className="flex items-center justify-between gap-4 mb-4">
                                    <Link
                                        to="/#projects"
                                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 hover:bg-emerald-50 text-zinc-600 hover:text-emerald-700 border border-zinc-200/80 text-xs font-semibold transition-colors group/back shadow-2xs"
                                    >
                                        <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover/back:-translate-x-0.5" />
                                        <span>All Projects</span>
                                    </Link>

                                    <button 
                                        onClick={async () => {
                                            const url = currentUrl;
                                            if (navigator.share) {
                                                try { await navigator.share({ title: seoTitle, url }); }
                                                catch (e) { console.error('Share error:', e); }
                                            } else {
                                                await navigator.clipboard.writeText(url);
                                                setIsCopied(true);
                                                toast.success("Link copied to clipboard");
                                                setTimeout(() => setIsCopied(false), 2000);
                                            }
                                        }}
                                        title={isCopied ? 'Copied!' : 'Share'}
                                        className="flex items-center justify-center w-8 h-8 rounded-full bg-zinc-100 hover:bg-emerald-50 text-zinc-600 hover:text-emerald-700 border border-zinc-200/80 transition-all shadow-2xs cursor-pointer"
                                        aria-label="Share"
                                    >
                                        {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
                                    </button>
                                </div>

                                {/* Title — Centered */}
                                <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-snug text-zinc-950 mb-4 max-w-4xl mx-auto">
                                    {project.title}
                                </h1>

                                {/* Tags + Categories combined */}
                                <div className="flex flex-wrap items-center justify-center gap-2 relative z-10">
                                    {(project.categories || (project.category ? [project.category] : [])).map((cat: string, ci: number) => (
                                        <span
                                            key={`cat-${ci}`}
                                            className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] sm:text-xs font-bold uppercase tracking-wider border border-emerald-200/80 shadow-2xs"
                                        >
                                            {cat}
                                        </span>
                                    ))}
                                    {project.tags && project.tags.map((tag: string, j: number) => (
                                        <span
                                            key={`tag-${j}`}
                                            className="px-3 py-1 rounded-full bg-zinc-100 text-zinc-700 text-[11px] sm:text-xs font-medium border border-zinc-200/80"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </motion.div>

                        {/* Description — each paragraph section in its own collapsible card */}
                        {(() => {
                            const html = project.desc || '';
                            // Split by <hr> (admin separator), then further by <h3> headings
                            let blocks: string[] = [];
                            const hrParts = html.split(/<hr\s*\/?>/i).filter((b: string) => b.trim());
                            if (hrParts.length > 1) {
                                blocks = hrParts;
                            } else {
                                const h3Parts = html.split(/(?=<h3[^>]*>)/i).filter((b: string) => b.trim());
                                blocks = h3Parts.length > 0 ? h3Parts : [html];
                            }
                            const renderBlocks = blocks.filter((b: string) => b.trim());

                            return <CollapsibleCards blocks={renderBlocks} />;
                        })()}

                        {/* Live Link Button */}
                        {project.link && project.link !== '#' && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.4 }}
                                className="mt-8 flex justify-start"
                            >
                                <a
                                    href={ensureAbsoluteUrl(project.link)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-2xl bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-sm shadow-[0_10px_25px_-5px_rgba(0,0,0,0.2)] hover:shadow-lg transition-all active:scale-95 group"
                                >
                                    <span>Visit Live Project</span>
                                    <ExternalLink className="w-4 h-4 text-emerald-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                </a>
                            </motion.div>
                        )}
                    </div>

                    {/* Right: Suggested Projects Sidebar */}
                    {(() => {
                        const buildItem = (enItem: any, i: number) => {
                            return {
                                ...enItem,
                                _id: enItem.id || '',
                                _originalIndex: i,
                                title: isBn && enItem.bn?.title?.trim() ? enItem.bn.title : enItem.title || enItem.en?.title || '',
                                desc: isBn && enItem.bn?.description?.trim() ? enItem.bn.description : enItem.desc || enItem.en?.description || ''
                            };
                        };

                        const suggested = enItems
                            .map((enItem: any, i: number) => {
                                if (i === idx) return null;
                                if (enItem.hidden) return null; // Exclude hidden projects
                                return buildItem(enItem, i);
                            })
                            .filter(Boolean)
                            .slice(0, 8);

                        if (suggested.length === 0) return null;

                        return (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.6, delay: 0.3 }}
                                className="w-full lg:w-[380px] flex-shrink-0"
                            >
                                <div className="lg:sticky lg:top-24">
                                    {/* Project Reviews — Redesigned with Glassmorphism */}
                                    {(() => {
                                        const reviewsData = (content.en as any).reviews;
                                        const reviewItems: any[] = reviewsData?.items || [];
                                        const projectSlug = baseItem?.id || String(idx);
                                        const projectReviews = reviewItems.filter((r: any) => r.projectId === projectSlug && !r.hidden);
                                        if (projectReviews.length === 0) return null;
                                        return (
                                            <div className="mb-2">
                                                <div className="flex items-center gap-2 mb-4">
                                                    <div className="w-6 h-[2px] bg-emerald-500 rounded-full" />
                                                    <h2 className="font-display text-lg font-bold text-zinc-950">Client Reviews</h2>
                                                </div>
                                                <div className="flex flex-col gap-4">
                                                    {projectReviews.map((review: any, ri: number) => (
                                                        <motion.div 
                                                            key={ri}
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ delay: 0.1 * ri }}
                                                            className="relative group p-[1.5px] rounded-2xl bg-gradient-to-r from-amber-400/35 via-emerald-400/30 to-teal-400/35 hover:from-amber-500/70 hover:via-emerald-500/60 hover:to-teal-500/70 transition-all duration-300 shadow-2xs hover:shadow-md"
                                                        >
                                                            <div className="p-5 rounded-[calc(1rem-1.5px)] bg-white overflow-hidden">
                                                                {/* Top row: Stars */}
                                                                <div className="flex gap-1 mb-3">
                                                                    {Array.from({ length: 5 }).map((_, si) => (
                                                                        <Star key={si} className={`w-3.5 h-3.5 ${si < (review.rating || 5) ? 'text-amber-500 fill-amber-500' : 'text-zinc-200'}`} />
                                                                    ))}
                                                                </div>

                                                                <blockquote className="relative">
                                                                    <p className="text-zinc-600 text-sm leading-relaxed mb-4 italic font-normal">
                                                                        "{review.text}"
                                                                    </p>
                                                                </blockquote>

                                                                <div className="flex items-center gap-3 pt-3.5 border-t border-zinc-100">
                                                                    <div className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-xs flex items-center justify-center">
                                                                        {review.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <span className="font-bold text-zinc-950 text-sm block truncate">{review.name}</span>
                                                                        <span className="text-emerald-700 text-[11px] font-semibold uppercase tracking-wider">{review.role}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })()}
                                    <h2 className="font-display text-lg font-bold text-zinc-950 mb-4 mt-8">More Projects</h2>
                                    <div className="flex flex-col gap-3">
                                        {suggested.map((item: any) => {
                                            const routeId = item._id || item._originalIndex;
                                            const coverImage = item.images?.[0] || item.image || '/placeholder.webp';
                                            const itemCats: string[] = item.categories || (item.category ? [item.category] : []);

                                            return (
                                                <SuggestedProjectCard key={routeId} item={item} routeId={routeId} />
                                            );
                                        })}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })()}
                </div>
            </main>
            <div className="block md:hidden"><MobileFooter /></div>
            <div className="hidden md:block"><OrbitFooter /></div>
            <Chatbot />
        </div>
    );
}
