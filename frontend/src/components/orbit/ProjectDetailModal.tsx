import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, ChevronLeft, ChevronRight, ChevronDown, X, Star } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { useContent } from '@/contexts/ContentContext';
import { useState, useEffect, useRef, useCallback } from 'react';
import { ensureAbsoluteUrl } from '@/lib/utils';
import { ImageWithSkeleton } from '@/components/orbit/ImageWithSkeleton';
import { RichText } from '@/components/ui/RichText';

type MediaItem = { type: 'image'; url: string } | { type: 'video'; url: string };

function ImageGallery({ images, title, videoUrl, onLightboxChange }: { images: string[]; title: string; videoUrl?: string; onLightboxChange?: (open: boolean) => void }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [direction, setDirection] = useState(0);
    const [lightboxOpen, setLightboxOpen] = useState(false);

    // Build mixed media array: images + video at position 1 (2nd slide)
    const media: MediaItem[] = (() => {
        const items: MediaItem[] = images.map(url => ({ type: 'image' as const, url }));
        if (videoUrl) {
            const pos = Math.min(1, items.length); // insert at position 1, or end if only 1 image
            items.splice(pos, 0, { type: 'video' as const, url: videoUrl });
        }
        return items;
    })();

    if (media.length === 0) return null;

    const paginate = (newDirection: number) => {
        setDirection(newDirection);
        setCurrentIndex((prev) => (prev + newDirection + media.length) % media.length);
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
            {/* Main Carousel */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="w-full max-w-5xl mx-auto px-4 sm:px-6 pt-8"
            >
                <div className="relative w-full aspect-video bg-muted/10 rounded-2xl overflow-hidden border border-border group">
                    {/* Main Media */}
                    <div className={`absolute inset-0 ${currentMedia.type === 'image' ? 'cursor-pointer' : ''}`} onClick={currentMedia.type === 'image' ? openLightbox : undefined}>
                        {currentMedia.type === 'video' ? (
                            renderMediaSlide(currentMedia)
                        ) : (
                            <AnimatePresence initial={false} custom={direction}>
                                <motion.img
                                    key={currentIndex}
                                    src={currentMedia.url}
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
                                    className="absolute inset-0 w-full h-full object-contain bg-black/5 touch-pan-y no-browser-trigger"
                                    alt={`${title} - slide ${currentIndex + 1}`}
                                />
                            </AnimatePresence>
                        )}
                    </div>
                </div>

                {/* Navigation */}
                {media.length > 1 && (
                    <div className="flex justify-center items-center gap-2 sm:gap-6 mt-8 relative z-10 px-4">
                        <button
                            onClick={(e) => { e.stopPropagation(); paginate(-1); }}
                            className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-border bg-card text-foreground hover:bg-muted transition-colors shrink-0"
                        >
                            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                        </button>

                        <div className="flex justify-center flex-wrap gap-2.5 max-w-[70%] sm:max-w-none">
                            {media.map((item, idx) => (
                                <motion.button
                                    key={idx}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setDirection(idx > currentIndex ? 1 : -1);
                                        setCurrentIndex(idx);
                                    }}
                                    className={`h-2 sm:h-2.5 rounded-full transition-all duration-300 shrink-0 ${idx === currentIndex
                                        ? 'bg-primary w-8 sm:w-10'
                                        : 'bg-foreground/20 hover:bg-foreground/40 w-2 sm:w-2.5'
                                        }`}
                                    title={item.type === 'video' ? 'Video' : `Image ${idx + 1}`}
                                />
                            ))}
                        </div>

                        <button
                            onClick={(e) => { e.stopPropagation(); paginate(1); }}
                            className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-border bg-card text-foreground hover:bg-muted transition-colors shrink-0"
                        >
                            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
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
                        className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-8"
                        onClick={closeLightbox}
                    >
                        <button
                            onClick={closeLightbox}
                            className="absolute top-6 right-6 z-20 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                        >
                            <X className="w-8 h-8" />
                        </button>

                        {media.length > 1 && (
                            <>
                                <button
                                    onClick={(e) => { e.stopPropagation(); paginate(-1); }}
                                    className="absolute left-4 md:left-8 z-20 p-4 rounded-full border border-border bg-card text-foreground transition-colors hover:bg-muted hidden sm:flex items-center justify-center"
                                >
                                    <ChevronLeft className="w-8 h-8" />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); paginate(1); }}
                                    className="absolute right-4 md:right-8 z-20 p-4 rounded-full border border-border bg-card text-foreground transition-colors hover:bg-muted hidden sm:flex items-center justify-center"
                                >
                                    <ChevronRight className="w-8 h-8" />
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
                                src={currentMedia.url}
                                alt="Fullscreen view"
                                drag="x"
                                dragConstraints={{ left: 0, right: 0 }}
                                dragElastic={1}
                                onDragEnd={handleDragEnd}
                                draggable="false"
                                className="max-w-full max-h-full md:max-w-[85vw] md:max-h-[85vh] object-contain select-none shadow-2xl touch-pan-y no-browser-trigger"
                                onClick={(e) => e.stopPropagation()}
                            />
                        )}

                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 group">
                            <div className="relative p-[1.5px] rounded-full border border-border">
                                <div className="flex items-center gap-4 text-white font-medium bg-[#0A0A0B]/90 px-4 py-2 rounded-full backdrop-blur-xl">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); paginate(-1); }}
                                        className="flex sm:hidden p-2 -ml-1 bg-[#22C55E] hover:bg-[#16A34A] text-white rounded-full transition-colors shadow-sm"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>

                                    <span className="text-base min-w-[3.5rem] text-center tracking-wider tabular-nums font-semibold">
                                        {currentIndex + 1} <span className="text-[#FFD700] mx-0.5">/</span> {media.length}
                                    </span>

                                    <button
                                        onClick={(e) => { e.stopPropagation(); paginate(1); }}
                                        className="flex sm:hidden p-2 -mr-1 bg-[#22C55E] hover:bg-[#16A34A] text-white rounded-full transition-colors shadow-sm"
                                    >
                                        <ChevronRight className="w-5 h-5" />
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
        <div className="space-y-4 sm:space-y-6">
            {blocks.map((block: string, i: number) => {
                const headingMatch = block.match(/^<h3([^>]*)>(.*?)<\/h3>/i);
                const heading = headingMatch ? headingMatch[2].replace(/<[^>]*>/g, '').trim() : '';
                const bodyHtml = headingMatch ? block.replace(/^<h3[^>]*>.*?<\/h3>/i, '').trim() : block;
                const isExpanded = expanded.has(i);

                const label = heading || `Section ${i + 1}`;
                const preview = !heading ? stripHtml(bodyHtml).slice(0, 60) : '';

                return (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 + i * 0.08 }}
                        className="rounded-xl sm:rounded-2xl border border-border bg-card overflow-hidden"
                    >
                        <button
                            type="button"
                            onClick={() => toggle(i)}
                            className={`w-full flex items-center gap-4 px-6 sm:px-8 py-5 sm:py-6 text-left transition-colors duration-300 relative group/toggle ${isExpanded ? 'bg-muted/50' : 'hover:bg-muted/30'
                                }`}
                        >
                            <div className="relative flex-shrink-0 group-hover/toggle:scale-105 transition-transform duration-300">
                                <div
                                    className="relative flex items-center justify-center w-9 h-9 rounded-full border border-border bg-muted"
                                >
                                    <ChevronDown
                                        className={`w-4 h-4 text-primary transition-transform duration-300 ${isExpanded ? '' : '-rotate-90'}`}
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-1 min-w-0">
                                <h3
                                    className="text-lg sm:text-2xl font-bold tracking-tight text-foreground transition-colors duration-300 group-hover/toggle:text-primary"
                                >
                                    {label}
                                </h3>
                                {!isExpanded && preview && (
                                    <span className="text-sm text-muted-foreground/50 truncate font-medium tracking-wide">{preview}…</span>
                                )}
                            </div>
                        </button>
                        <AnimatePresence initial={false}>
                            {isExpanded && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                                    className="overflow-hidden"
                                >
                                    <div
                                        className="px-5 sm:px-8 pb-5 sm:pb-7 pt-2 text-muted-foreground text-base sm:text-lg leading-relaxed space-y-4"
                                    >
                                        <RichText text={stripHtml(bodyHtml)} />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                );
            })}
        </div>
    );
}

function SuggestedProjectCard({ item, onClick }: { item: any, onClick: () => void }) {
    const coverImage = item.images?.[0] || item.image || '/placeholder.png';
    const itemCats: string[] = item.categories || (item.category ? [item.category] : []);
    
    const [isHovered, setIsHovered] = useState(false);

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
        <button
            onClick={onClick}
            className="group flex w-full text-left gap-3 rounded-xl overflow-hidden border border-[#22C55E]/20 bg-background transition-all duration-500 hover:border-[#FACC15]/60 hover:bg-muted/50 hover:shadow-[0_10px_20px_rgba(34,197,94,0.03)] p-2"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="relative w-28 sm:w-36 flex-shrink-0 aspect-video rounded-lg overflow-hidden bg-muted">
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
                <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
            </div>
            <div className="flex flex-col justify-center py-0.5 min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#22C55E] mb-1 line-clamp-1">
                    {itemCats.slice(0, 2).join(' · ')}
                </span>
                <h3 className="font-display text-xs sm:text-sm font-bold text-foreground group-hover:text-[#22C55E] transition-colors line-clamp-2 leading-snug">
                    {item.title}
                </h3>
            </div>
            <div className="absolute inset-0 rounded-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700 shadow-[inset_0_0_0_1.5px_#FACC15]" />
        </button>
    );
}

export function ProjectDetailModal({ projectId, onClose }: { projectId: string | null; onClose: () => void }) {
    const { lang } = useLang();
    const { content } = useContent();
    const [lightboxOpen, setLightboxOpen] = useState(false);
    
    // Prevent background scrolling when modal is open
    useEffect(() => {
        if (projectId) {
            document.body.style.overflow = 'hidden';
            
            // Handle escape key to close modal
            const handleEsc = (e: KeyboardEvent) => {
                if (e.key === 'Escape' && !lightboxOpen) onClose();
            };
            window.addEventListener('keydown', handleEsc);
            return () => {
                document.body.style.overflow = 'auto';
                window.removeEventListener('keydown', handleEsc);
            };
        }
    }, [projectId, lightboxOpen, onClose]);

    if (!projectId) return null;

    const enData = (content.en as any).projects || {};
    const bnData = (content.bn as any).projects || {};
    const enItems: any[] = Array.isArray(enData.items) ? enData.items : [];
    const bnItems: any[] = Array.isArray(bnData.items) ? bnData.items : [];

    let idx = -1;
    const slugIndex = enItems.findIndex((item: any) => item.id && item.id === projectId);
    if (slugIndex >= 0) {
        idx = slugIndex;
    } else {
        const numericIdx = parseInt(projectId || '-1', 10);
        if (!isNaN(numericIdx) && numericIdx >= 0 && numericIdx < enItems.length) {
            idx = numericIdx;
        }
    }

    const projectEn = idx >= 0 ? enItems[idx] : undefined;
    const projectBn = idx >= 0 ? bnItems[idx] : undefined;
    const isBn = lang === 'bn';
    const hasBnContent = projectBn && projectBn.title && projectBn.title.trim() !== '';
    const project = (isBn && hasBnContent) ? projectBn : projectEn;

    if (!project || idx < 0) {
        return null;
    }

    const allImages: string[] =
        project.images && Array.isArray(project.images) && project.images.length > 0
            ? project.images
            : project.image
                ? [project.image]
                : [];

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: "100%" }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed inset-0 z-[150] bg-background/95 backdrop-blur-md overflow-y-auto w-full h-[100dvh]"
            >
                {/* Modal Header / Sticky Close Button */}
                <div className="sticky top-0 z-50 flex items-center justify-between p-4 sm:p-6 bg-background/80 backdrop-blur-md border-b border-border shadow-sm">
                    <h2 className="text-xl sm:text-2xl font-bold font-display tracking-tight text-foreground truncate max-w-[70vw]">{project.title}</h2>
                    <button
                        onClick={onClose}
                        className="p-2 sm:p-3 rounded-full bg-muted/50 hover:bg-muted text-foreground transition-colors absolute right-4 sm:right-6"
                        aria-label="Close Project Detail"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="relative pb-24">
                    {/* Image + Video Gallery */}
                    <ImageGallery images={allImages} title={project.title} videoUrl={project.videoPreview} onLightboxChange={setLightboxOpen} />

                    {/* Two-Column Layout: Content + Sidebar */}
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-16 flex flex-col lg:flex-row gap-10">
                        {/* Left: Main Content */}
                        <div className="flex-1 min-w-0">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.05 }}
                                className="rounded-2xl border border-border bg-card px-6 sm:px-10 py-8 sm:py-10 mb-6 relative overflow-hidden"
                            >
                                <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-foreground mb-6 relative z-10 text-center">
                                    {project.title}
                                </h1>

                                <div className="flex flex-wrap justify-center gap-2 relative z-10">
                                    {(project.categories || (project.category ? [project.category] : [])).map((cat: string, ci: number) => (
                                        <span
                                            key={`cat-${ci}`}
                                            className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-bold uppercase tracking-wider border border-primary/20"
                                        >
                                            {cat}
                                        </span>
                                    ))}
                                    {project.tags && project.tags.map((tag: string, j: number) => (
                                        <span
                                            key={`tag-${j}`}
                                            className="px-3 py-1.5 rounded-full bg-secondary text-muted-foreground text-sm font-medium border border-border"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </motion.div>

                            {(() => {
                                const html = project.desc || '';
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

                            {project.link && project.link !== '#' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: 0.4 }}
                                    className="mt-10"
                                >
                                    <a
                                        href={ensureAbsoluteUrl(project.link)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                        Visit Live Project
                                    </a>
                                </motion.div>
                            )}
                        </div>

                        {/* Right: Suggested Projects Sidebar */}
                        {(() => {
                            const buildItem = (enItem: any, i: number) => {
                                const bnItem = bnItems[i];
                                const showBn = lang === 'bn' && bnItem && bnItem.title && bnItem.title.trim() !== '';
                                const displayItem = showBn ? bnItem : enItem;
                                return { ...displayItem, _id: enItem.id || '', _originalIndex: i };
                            };

                            const suggested = enItems
                                .map((enItem: any, i: number) => {
                                    if (i === idx) return null;
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
                                        {(() => {
                                            const reviewsData = (content.en as any).reviews;
                                            const reviewItems: any[] = reviewsData?.items || [];
                                            const projectSlug = projectEn?.id || String(idx);
                                            const projectReviews = reviewItems.filter((r: any) => r.projectId === projectSlug);
                                            if (projectReviews.length === 0) return null;
                                            return (
                                                <div className="mb-2">
                                                    <div className="flex items-center gap-2 mb-6">
                                                        <div className="w-8 h-1 bg-primary rounded-full" />
                                                        <h2 className="font-display text-xl font-bold text-foreground">Client Reviews</h2>
                                                    </div>
                                                    <div className="flex flex-col gap-4">
                                                        {projectReviews.map((review: any, ri: number) => (
                                                            <motion.div 
                                                                key={ri}
                                                                initial={{ opacity: 0, y: 10 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                transition={{ delay: 0.1 * ri }}
                                                                className="relative group p-5 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md transition-all duration-500 hover:bg-white/[0.06] hover:border-primary/30 overflow-hidden"
                                                            >
                                                                <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                                                <div className="flex gap-1 mb-4">
                                                                    {Array.from({ length: 5 }).map((_, si) => (
                                                                        <Star key={si} className={`w-3.5 h-3.5 ${si < (review.rating || 5) ? 'text-primary fill-primary' : 'text-muted-foreground/30'}`} />
                                                                    ))}
                                                                </div>
                                                                <blockquote className="relative">
                                                                    <p className="text-muted-foreground text-sm leading-relaxed mb-5 italic font-medium">
                                                                        "{review.text}"
                                                                    </p>
                                                                </blockquote>
                                                                <div className="flex items-center gap-3 pt-4 border-t border-border">
                                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                                                                        {review.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <span className="font-bold text-foreground text-sm block truncate">{review.name}</span>
                                                                        <span className="text-primary/70 text-[11px] font-medium uppercase tracking-wider">{review.role}</span>
                                                                    </div>
                                                                </div>
                                                            </motion.div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                        <h2 className="font-display text-lg font-bold text-foreground mb-4 mt-8">More Projects</h2>
                                        <div className="flex flex-col gap-3">
                                            {suggested.map((item: any) => {
                                                const routeId = item._id || item._originalIndex;
                                                return (
                                                    <SuggestedProjectCard 
                                                        key={routeId} 
                                                        item={item} 
                                                        onClick={() => {
                                                            // We close then re-open by updating state, or handled by parent routing state.
                                                            // Let's just dispatch an event or close this and tell parent to open another one.
                                                            // For simplicity of modal, let's just update the URL hash or invoke a callback.
                                                            // But wait, the parent manages `projectId`. If we want to navigate to another project inside the modal,
                                                            // the simplest way is to update `window.location.hash` and let parent listen, OR add `onNavigate` prop.
                                                            // Let's add standard hash-based navigation for projects: `#project-ID`.
                                                            window.location.hash = `#project-${routeId}`;
                                                        }} 
                                                    />
                                                );
                                            })}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })()}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
