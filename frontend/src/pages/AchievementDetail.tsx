import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ExternalLink, ChevronLeft, ChevronRight, ChevronDown, X, ArrowUpRight, Share2, Check } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { useContent } from '@/contexts/ContentContext';
import { Navbar } from '@/components/orbit/Navbar';
import { OrbitFooter } from '@/components/orbit/OrbitFooter';
import { MobileFooter } from '@/components/orbit/MobileFooter';
import { Chatbot } from '@/components/orbit/chatbot';
import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { ensureAbsoluteUrl } from '@/lib/utils';
import { ImageWithSkeleton } from '@/components/orbit/ImageWithSkeleton';
import { RichText } from '@/components/ui/RichText';
import { toast } from 'sonner';
import { fallbackAchievements, AchievementItem } from '@/data/achievements';

type MediaItem = { type: 'image'; url: string } | { type: 'video'; url: string };

function extractYouTubeId(url: string): string | null {
    if (!url) return null;
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtu\.be\/)([\w-]{11})/,
        /^([\w-]{11})$/,
    ];
    for (const pat of patterns) {
        const m = url.match(pat);
        if (m) return m[1];
    }
    return null;
}

function stripHtml(html: string): string {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
}

function ImageGallery({ images, title, videoUrl, onLightboxChange }: { images: string[]; title: string; videoUrl?: string; onLightboxChange?: (open: boolean) => void }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [direction, setDirection] = useState(0);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [autoPlayKey, setAutoPlayKey] = useState(0);

    const media: MediaItem[] = (() => {
        const items: MediaItem[] = images.map(url => ({ type: 'image' as const, url }));
        if (videoUrl) {
            const pos = Math.min(1, items.length);
            items.splice(pos, 0, { type: 'video' as const, url: videoUrl });
        }
        return items;
    })();

    useEffect(() => {
        if (media.length <= 1 || lightboxOpen) return;
        const timer = setInterval(() => {
            setDirection(1);
            setCurrentIndex((prev) => (prev + 1) % media.length);
        }, 4000);
        return () => clearInterval(timer);
    }, [media.length, lightboxOpen, autoPlayKey]);

    if (media.length === 0) return null;

    const paginate = (newDirection: number) => {
        setDirection(newDirection);
        setCurrentIndex((prev) => (prev + newDirection + media.length) % media.length);
        setAutoPlayKey(prev => prev + 1);
    };

    const openLightbox = () => { setLightboxOpen(true); onLightboxChange?.(true); };
    const closeLightbox = () => { setLightboxOpen(false); onLightboxChange?.(false); };

    const handleDragEnd = (_e: any, { offset, velocity }: any) => {
        const swipe = Math.abs(offset.x) * velocity.x;
        if (swipe < -10000) paginate(1);
        else if (swipe > 10000) paginate(-1);
    };

    const variants = {
        enter: (dir: number) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0, zIndex: 0 }),
        center: { zIndex: 1, x: 0, opacity: 1 },
        exit: (dir: number) => ({ zIndex: 0, x: dir < 0 ? '100%' : '-100%', opacity: 0 })
    };

    const currentMedia = media[currentIndex];
    const ytId = currentMedia.type === 'video' ? extractYouTubeId(currentMedia.url) : null;

    const renderVideo = (item: MediaItem, isLightbox = false) => {
        if (item.type !== 'video') return null;
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
        return <video src={item.url} controls playsInline className={isLightbox ? "max-w-full max-h-full object-contain" : "absolute inset-0 w-full h-full object-contain bg-black"} />;
    };

    return (
        <>
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="w-full max-w-5xl mx-auto px-4 sm:px-6 pt-8">
                <div className="relative w-full aspect-video bg-muted/10 rounded-2xl overflow-hidden border border-border group">
                    <div className={`absolute inset-0 ${currentMedia.type === 'image' ? 'cursor-pointer' : ''}`} onClick={currentMedia.type === 'image' ? openLightbox : undefined}>
                        {currentMedia.type === 'video' ? renderVideo(currentMedia) : (
                            <AnimatePresence initial={false} custom={direction}>
                                <motion.img key={currentIndex} src={currentMedia.url} custom={direction} variants={variants} initial="enter" animate="center" exit="exit"
                                    transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
                                    drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={1} onDragEnd={handleDragEnd} draggable="false"
                                    loading="eager" fetchPriority="high"
                                    className="absolute inset-0 w-full h-full object-contain bg-black/5 touch-pan-y no-browser-trigger"
                                    alt={`${title} - slide ${currentIndex + 1}`}
                                />
                            </AnimatePresence>
                        )}
                    </div>
                </div>
                {media.length > 1 && (
                    <div className="flex justify-center items-center gap-2 sm:gap-6 mt-8 relative z-10 px-4">
                        <button onClick={(e) => { e.stopPropagation(); paginate(-1); }} className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-border bg-card text-foreground hover:bg-muted transition-colors shrink-0">
                            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                        </button>
                        <div className="flex justify-center flex-wrap gap-2.5 max-w-[70%] sm:max-w-none">
                            {media.map((item, idx) => (
                                <motion.button key={idx} onClick={(e) => { e.stopPropagation(); setDirection(idx > currentIndex ? 1 : -1); setCurrentIndex(idx); }}
                                    className={`h-2 sm:h-2.5 rounded-full transition-all duration-300 shrink-0 ${idx === currentIndex ? 'bg-primary w-8 sm:w-10' : 'bg-white/20 hover:bg-white/40 w-2 sm:w-2.5'}`}
                                    title={item.type === 'video' ? 'Video' : `Image ${idx + 1}`}
                                />
                            ))}
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); paginate(1); }} className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-border bg-card text-foreground hover:bg-muted transition-colors shrink-0">
                            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                        </button>
                    </div>
                )}
            </motion.div>

            {/* Lightbox */}
            <AnimatePresence>
                {lightboxOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
                        className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-8" onClick={closeLightbox}>
                        <button onClick={closeLightbox} className="absolute top-6 right-6 z-20 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"><X className="w-8 h-8" /></button>
                        {media.length > 1 && (
                            <>
                                <button onClick={(e) => { e.stopPropagation(); paginate(-1); }} className="absolute left-4 md:left-8 z-20 p-4 rounded-full border border-border bg-card text-foreground transition-colors hover:bg-muted hidden sm:flex items-center justify-center"><ChevronLeft className="w-8 h-8" /></button>
                                <button onClick={(e) => { e.stopPropagation(); paginate(1); }} className="absolute right-4 md:right-8 z-20 p-4 rounded-full border border-border bg-card text-foreground transition-colors hover:bg-muted hidden sm:flex items-center justify-center"><ChevronRight className="w-8 h-8" /></button>
                            </>
                        )}
                        {currentMedia.type === 'video' ? (
                            <div className="w-full max-w-[85vw] aspect-video" onClick={(e) => e.stopPropagation()}>{renderVideo(currentMedia, true)}</div>
                        ) : (
                            <motion.img key={currentIndex} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.3 }}
                                src={currentMedia.url} alt="Fullscreen view" drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={1} onDragEnd={handleDragEnd} draggable="false"
                                className="max-w-full max-h-full md:max-w-[85vw] md:max-h-[85vh] object-contain select-none shadow-2xl touch-pan-y no-browser-trigger" onClick={(e) => e.stopPropagation()}
                            />
                        )}
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
                            <div className="relative p-[1.5px] rounded-full border border-border">
                                <div className="flex items-center gap-4 text-white font-medium bg-[#0A0A0B]/90 px-4 py-2 rounded-full backdrop-blur-xl">
                                    <button onClick={(e) => { e.stopPropagation(); paginate(-1); }} className="flex sm:hidden p-2 -ml-1 bg-[#22C55E] hover:bg-[#16A34A] text-white rounded-full transition-colors shadow-sm"><ChevronLeft className="w-5 h-5" /></button>
                                    <span className="text-base min-w-[3.5rem] text-center tracking-wider tabular-nums font-semibold">{currentIndex + 1} <span className="text-[#FFD700] mx-0.5">/</span> {media.length}</span>
                                    <button onClick={(e) => { e.stopPropagation(); paginate(1); }} className="flex sm:hidden p-2 -mr-1 bg-[#22C55E] hover:bg-[#16A34A] text-white rounded-full transition-colors shadow-sm"><ChevronRight className="w-5 h-5" /></button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

function CollapsibleCards({ blocks }: { blocks: string[] }) {
    const [expanded, setExpanded] = useState<Set<number>>(new Set());
    const toggle = (i: number) => { setExpanded(prev => { const next = new Set(prev); if (next.has(i)) next.delete(i); else next.add(i); return next; }); };

    return (
        <div className="space-y-4 sm:space-y-6">
            {blocks.map((block, i) => {
                const headingMatch = block.match(/^<h3([^>]*)>(.*?)<\/h3>/i);
                const heading = headingMatch ? headingMatch[2].replace(/<[^>]*>/g, '').trim() : '';
                const bodyHtml = headingMatch ? block.replace(/^<h3[^>]*>.*?<\/h3>/i, '').trim() : block;
                const isExpanded = expanded.has(i);
                const label = heading || `Section ${i + 1}`;
                const preview = !heading ? stripHtml(bodyHtml).slice(0, 60) : '';

                return (
                    <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 + i * 0.08 }} className="rounded-xl sm:rounded-2xl border border-border bg-card overflow-hidden">
                        <button type="button" onClick={() => toggle(i)} className={`w-full flex items-center gap-4 px-6 sm:px-8 py-5 sm:py-6 text-left transition-colors duration-300 relative group/toggle ${isExpanded ? 'bg-muted/50' : 'hover:bg-muted/30'}`}>
                            <div className="relative flex-shrink-0 group-hover/toggle:scale-105 transition-transform duration-300">
                                <div className="relative flex items-center justify-center w-9 h-9 rounded-full border border-border bg-muted">
                                    <ChevronDown className={`w-4 h-4 text-primary transition-transform duration-300 ${isExpanded ? '' : '-rotate-90'}`} />
                                </div>
                            </div>
                            <div className="flex flex-col gap-1 min-w-0">
                                <h3 className="text-lg sm:text-2xl font-bold tracking-tight text-foreground transition-colors duration-300 group-hover/toggle:text-primary">{label}</h3>
                                {!isExpanded && preview && <span className="text-sm text-muted-foreground/50 truncate font-medium tracking-wide">{preview}…</span>}
                            </div>
                        </button>
                        <AnimatePresence initial={false}>
                            {isExpanded && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }} className="overflow-hidden">
                                    <div className="px-5 sm:px-8 pb-5 sm:pb-7 pt-2 text-muted-foreground text-base sm:text-lg leading-relaxed space-y-4">
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

function SuggestedAchievementCard({ item, routeId }: { item: any, routeId: string }) {
    const coverImage = item.images?.[0] || item.image || '/placeholder.png';
    const itemCats: string[] = item.categories || (item.category ? [item.category] : []);

    return (
        <Link
            to={`/achievement/${routeId}`}
            className="group relative flex gap-4 rounded-2xl overflow-hidden border border-white/[0.05] bg-zinc-950/40 p-3 transition-all duration-500 hover:-translate-y-1 hover:bg-zinc-900/60 hover:border-[#FACC15]/30 hover:shadow-[0_15px_30px_-10px_rgba(250,204,21,0.1)]"
        >
            {/* Premium Glow on Hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#FACC15]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative w-28 sm:w-36 flex-shrink-0 aspect-video rounded-xl overflow-hidden bg-black/20 border border-white/[0.05]">
                <ImageWithSkeleton src={coverImage} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 no-browser-trigger" />
                <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform [transition-duration:1.2s] ease-in-out bg-gradient-to-r from-transparent via-white/[0.1] to-transparent" />
                </div>
            </div>
            <div className="flex flex-col justify-center min-w-0 z-10">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#FACC15] mb-1.5 line-clamp-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    {itemCats.slice(0, 2).join(' · ')}
                </span>
                <h3 className="font-display text-sm font-bold text-white/90 group-hover:text-white transition-colors line-clamp-2 leading-snug">
                    {item.title}
                </h3>
            </div>
        </Link>
    );
}

export default function AchievementDetail() {
    const { id } = useParams<{ id: string }>();
    const { lang } = useLang();
    const { content } = useContent();
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [isCopied, setIsCopied] = useState(false);

    // Try slug-based lookup first
    const enData = (content.en as any).achievements || {};
    const bnData = (content.bn as any).achievements || {};
    const enItems: any[] = Array.isArray(enData.items) ? enData.items : [];
    const bnItems: any[] = Array.isArray(bnData.items) ? bnData.items : [];

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

    const baseItem = idx >= 0 ? enItems[idx] : undefined;
    const isBn = lang === 'bn';

    const achievement = baseItem ? {
        ...baseItem,
        title: isBn && baseItem.bn?.title?.trim() ? baseItem.bn.title : baseItem.title || baseItem.en?.title || '',
        desc: isBn && baseItem.bn?.description?.trim() ? baseItem.bn.description : baseItem.desc || baseItem.en?.description || ''
    } : undefined;

    if (!achievement || idx < 0 || baseItem?.hidden) {
        return (
            <div className="min-h-[100dvh] bg-background text-foreground">
                <Navbar />
                <div className="flex flex-col items-center justify-center py-40 px-4">
                    <Helmet><title>Achievement Not Found | Orbit SaaS</title><meta name="robots" content="noindex" /></Helmet>
                    <h1 className="text-3xl font-bold mb-4">Achievement Not Found</h1>
                    <Link to="/achievements" className="text-primary hover:underline flex items-center gap-2"><ArrowLeft className="w-4 h-4" /> Back to Achievements</Link>
                </div>
                <OrbitFooter />
            </div>
        );
    }

    const allImages: string[] = achievement.images && Array.isArray(achievement.images) && achievement.images.length > 0
        ? achievement.images
        : achievement.image ? [achievement.image] : [];

    // SEO
    const seoTitle = achievement.seo?.title || `${achievement.title} | Orbit SaaS Achievement`;
    const plainDesc = stripHtml(achievement.desc || '');
    const seoDesc = achievement.seo?.description || (plainDesc.length > 160 ? plainDesc.substring(0, 157) + '...' : plainDesc);
    const seoKeywords = achievement.seo?.keywords?.join(', ') || achievement.tags?.join(', ') || 'Achievement, SaaS, Case Study';
    const ogImage = `https://orbitsaas.cloud/api/og?achievement=${encodeURIComponent(id || '')}`;
    const currentUrl = `https://orbitsaas.cloud/achievement/${id}`;

    // Suggested achievements
    const suggested = enItems.map((item, i) => {
        if (i === idx || item.hidden) return null;
        return {
            ...item,
            _id: item.id || '',
            title: isBn && item.bn?.title?.trim() ? item.bn.title : item.title || item.en?.title || '',
            desc: isBn && item.bn?.description?.trim() ? item.bn.description : item.desc || item.en?.description || ''
        };
    }).filter(Boolean).slice(0, 6);

    return (
        <div className="min-h-[100dvh] relative bg-background text-foreground">
            <Helmet>
                <title data-rh="true">{seoTitle}</title>
                <meta data-rh="true" name="description" content={seoDesc} />
                <meta data-rh="true" name="keywords" content={seoKeywords} />
                <link data-rh="true" rel="canonical" href={currentUrl} />
                <meta data-rh="true" property="og:type" content="article" />
                <meta data-rh="true" property="og:title" content={seoTitle} />
                <meta data-rh="true" property="og:description" content={seoDesc} />
                <meta data-rh="true" property="og:image" content={ogImage} />
                <meta data-rh="true" property="og:url" content={currentUrl} />
                <meta data-rh="true" property="og:site_name" content="ORBIT SaaS" />
                <meta data-rh="true" name="twitter:card" content="summary_large_image" />
                <meta data-rh="true" name="twitter:title" content={seoTitle} />
                <meta data-rh="true" name="twitter:description" content={seoDesc} />
                <meta data-rh="true" name="twitter:image" content={ogImage} />
                <meta data-rh="true" name="twitter:image:alt" content={seoTitle} />
            </Helmet>
            {!lightboxOpen && <Navbar />}
            <main className="pt-20 relative z-10">
                <ImageGallery images={allImages} title={achievement.title} videoUrl={achievement.videoPreview} onLightboxChange={setLightboxOpen} />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-16 flex flex-col lg:flex-row gap-10">
                    {/* Left: Main Content */}
                    <div className="flex-1 min-w-0">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.05 }}
                            className="rounded-2xl border border-border bg-card px-6 sm:px-10 py-6 sm:py-8 mb-6 relative overflow-hidden group/title">
                            <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight leading-snug text-foreground mb-5 relative z-10 text-center max-w-4xl mx-auto">{achievement.title}</h1>
                            <div className="flex flex-wrap items-center justify-center gap-2 relative z-10">
                                {achievement.category && (
                                    <span className="px-3 py-1.5 rounded-full bg-[#22C55E]/10 text-[#22C55E] text-[11px] sm:text-xs font-bold uppercase tracking-wider border border-[#22C55E]/20">{achievement.category}</span>
                                )}
                                {achievement.date && (
                                    <span className="px-3 py-1.5 rounded-full bg-[#FACC15]/10 text-[#FACC15] text-[11px] sm:text-xs font-medium border border-[#FACC15]/20">{achievement.date}</span>
                                )}
                                {achievement.tags && Array.isArray(achievement.tags) && achievement.tags.map((tag, j) => (
                                    <span key={`tag-${j}`} className="px-3 py-1.5 rounded-full bg-secondary text-muted-foreground text-[11px] sm:text-xs font-medium border border-border">{tag}</span>
                                ))}
                            </div>
                            
                            <div className="absolute bottom-4 right-4 z-20">
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
                                    className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white border border-blue-500/20 transition-all duration-300 shadow-sm"
                                >
                                    {isCopied ? <Check className="w-4 h-4 sm:w-5 sm:h-5" /> : <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />}
                                </button>
                            </div>
                        </motion.div>

                        {/* Description */}
                        {(() => {
                            const html = achievement.desc || '';
                            let blocks: string[] = [];
                            const hrParts = html.split(/<hr\s*\/?>/i).filter((b: string) => b.trim());
                            if (hrParts.length > 1) { blocks = hrParts; }
                            else {
                                const h3Parts = html.split(/(?=<h3[^>]*>)/i).filter((b: string) => b.trim());
                                blocks = h3Parts.length > 0 ? h3Parts : [html];
                            }
                            const renderBlocks = blocks.filter((b: string) => b.trim());
                            if (renderBlocks.length > 1 || (renderBlocks.length === 1 && renderBlocks[0].match(/<h3/i))) {
                                return <CollapsibleCards blocks={renderBlocks} />;
                            }
                            return (
                                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
                                    className="rounded-2xl border border-border bg-card px-6 sm:px-10 py-8 sm:py-10">
                                    <div className="text-muted-foreground text-base sm:text-lg leading-relaxed"><RichText text={stripHtml(html)} /></div>
                                </motion.div>
                            );
                        })()}

                        {/* Live Link */}
                        {achievement.link && achievement.link !== '#' && (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }} className="mt-10">
                                <a href={ensureAbsoluteUrl(achievement.link)} target="_blank" rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all">
                                    <ExternalLink className="w-4 h-4" /> View Link
                                </a>
                            </motion.div>
                        )}
                    </div>

                    {/* Right: Sidebar */}
                    {suggested.length > 0 && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.3 }} className="w-full lg:w-[380px] flex-shrink-0">
                            <div className="lg:sticky lg:top-24">
                                <h2 className="font-display text-lg font-bold text-foreground mb-4">More Achievements</h2>
                                <div className="flex flex-col gap-3">
                                    {suggested.map((item) => <SuggestedAchievementCard key={item._id} item={item} routeId={item._id} />)}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>
            </main>
            <div className="block md:hidden"><MobileFooter /></div>
            <div className="hidden md:block"><OrbitFooter /></div>
            <Chatbot />
        </div>
    );
}
