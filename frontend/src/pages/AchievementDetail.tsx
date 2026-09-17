import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ExternalLink, ChevronLeft, ChevronRight, ChevronDown, X, Share2, Check } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { useContent } from '@/contexts/ContentContext';
import { Navbar } from '@/components/orbit/Navbar';
import { OrbitFooter } from '@/components/orbit/OrbitFooter';
import { MobileFooter } from '@/components/orbit/MobileFooter';
import { Chatbot } from '@/components/orbit/chatbot';
import { useState, useEffect } from 'react';
import { getImageUrl, getFallbackUrl } from '@/lib/imageUrl';
import { Helmet } from 'react-helmet-async';
import { ensureAbsoluteUrl } from '@/lib/utils';
import { ImageWithSkeleton } from '@/components/orbit/ImageWithSkeleton';
import { RichText } from '@/components/ui/RichText';
import { toast } from 'sonner';
import DOMPurify from 'dompurify';
import { ZoomableLightbox } from '@/components/orbit/ZoomableLightbox';

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
    return html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

function formatDescriptionHtml(rawText: string): string {
    if (!rawText) return '';

    let text = rawText;

    // 1. Repair collapsed sentence boundaries like "organizations.Our Journey:" or "participants.Our Innovation:"
    text = text.replace(/([.!?])([A-Z][a-zA-Z0-9\s]{2,30}:)/g, '$1\n\n$2');

    // 2. Check if text has rich HTML structure
    const hasHtmlTags = /<(p|div|h[1-6]|ul|ol|li|strong|b|em|i|blockquote|hr|br)[^>]*>/i.test(text);

    if (!hasHtmlTags) {
        // Markdown bold support: **text** -> <strong>text</strong>
        text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        // Split paragraphs by double newlines or single newlines
        const paragraphs = text.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
        
        text = paragraphs.map(p => {
            // Check if paragraph starts with a heading like "Our Journey:"
            const headingMatch = p.match(/^([A-Za-z0-9\s]{2,35}:)\s*(.*)/s);
            if (headingMatch) {
                const heading = headingMatch[1];
                const rest = headingMatch[2];
                return `<div class="mb-5 sm:mb-6"><h4 class="text-base sm:text-lg font-bold text-zinc-950 flex items-center gap-2 mb-2"><span class="w-2 h-2 rounded-full bg-emerald-500 inline-block shrink-0"></span>${heading}</h4><div class="text-zinc-600 text-sm sm:text-base leading-relaxed pl-3.5 sm:pl-4 border-l-2 border-emerald-500/30">${rest.replace(/\n/g, '<br/>')}</div></div>`;
            }
            return `<p class="text-zinc-600 text-sm sm:text-base leading-relaxed mb-4">${p.replace(/\n/g, '<br/>')}</p>`;
        }).join('');
    }

    // 3. Auto-linkify raw URLs (not already inside <a href="...">)
    text = text.replace(/(?<!href=["'])(https?:\/\/[^\s<,)]+)/g, (url) => {
        return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-emerald-600 hover:text-emerald-700 underline font-semibold transition-colors break-all inline-flex items-center gap-1">${url}</a>`;
    });

    // 4. Sanitize with DOMPurify
    return DOMPurify.sanitize(text, {
        ADD_ATTR: ['target', 'rel', 'class'],
        ALLOWED_TAGS: ['p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'strong', 'b', 'em', 'i', 'u', 'blockquote', 'hr', 'br', 'a', 'span']
    });
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
                <div className="relative w-full aspect-video bg-zinc-100 rounded-2xl sm:rounded-3xl overflow-hidden border border-zinc-200/90 shadow-[0_12px_40px_-15px_rgba(0,0,0,0.08)] group">
                    <div className={`absolute inset-0 ${currentMedia.type === 'image' ? 'cursor-pointer' : ''}`} onClick={currentMedia.type === 'image' ? openLightbox : undefined}>
                        {currentMedia.type === 'video' ? renderVideo(currentMedia) : (
                            <AnimatePresence initial={false} custom={direction}>
                                <motion.img key={currentIndex} src={getImageUrl(currentMedia.url)} custom={direction} variants={variants} initial="enter" animate="center" exit="exit"
                                    transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
                                    drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={1} onDragEnd={handleDragEnd} draggable="false"
                                    loading="eager" {...({ fetchpriority: 'high' })}
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
                {media.length > 1 && (
                    <div className="flex justify-center items-center gap-2 sm:gap-6 mt-6 relative z-10 px-4">
                        <button
                            onClick={(e) => { e.stopPropagation(); paginate(-1); }}
                            className="flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full border border-zinc-200/90 bg-white text-zinc-700 hover:text-zinc-950 hover:bg-zinc-50 shadow-xs hover:shadow-md transition-all shrink-0 cursor-pointer active:scale-95"
                            aria-label="Previous image"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <div className="flex justify-center flex-wrap gap-2.5 max-w-[70%] sm:max-w-none">
                            {media.map((item, idx) => (
                                <motion.button key={idx} onClick={(e) => { e.stopPropagation(); setDirection(idx > currentIndex ? 1 : -1); setCurrentIndex(idx); }}
                                    className={`h-2 sm:h-2.5 rounded-full transition-all duration-300 shrink-0 ${idx === currentIndex ? 'bg-emerald-600 w-8 sm:w-10' : 'bg-zinc-300 hover:bg-zinc-400 w-2 sm:w-2.5'}`}
                                    title={item.type === 'video' ? 'Video' : `Image ${idx + 1}`}
                                />
                            ))}
                        </div>
                        <button
                            onClick={(e) => { e.stopPropagation(); paginate(1); }}
                            className="flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full border border-zinc-200/90 bg-white text-zinc-700 hover:text-zinc-950 hover:bg-zinc-50 shadow-xs hover:shadow-md transition-all shrink-0 cursor-pointer active:scale-95"
                            aria-label="Next image"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                )}
            </motion.div>

            {/* Modern Zoomable Lightbox with 2-finger pinch & high z-index */}
            <ZoomableLightbox
                isOpen={lightboxOpen}
                onClose={closeLightbox}
                media={media}
                currentIndex={currentIndex}
                onIndexChange={(idx) => {
                    setDirection(idx > currentIndex ? 1 : -1);
                    setCurrentIndex(idx);
                }}
                title={title}
            />
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
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 + i * 0.08 }}
                        className="rounded-2xl border border-zinc-200/90 bg-white overflow-hidden shadow-2xs hover:shadow-md transition-all duration-300 mb-4"
                    >
                        <button
                            type="button"
                            onClick={() => toggle(i)}
                            className={`w-full flex items-center gap-4 px-6 sm:px-8 py-5 text-left transition-colors duration-200 cursor-pointer ${isExpanded ? 'bg-zinc-50/70' : 'hover:bg-zinc-50/40'}`}
                        >
                            <div className="relative flex-shrink-0 group-hover/toggle:scale-105 transition-transform duration-300">
                                <div className="relative flex items-center justify-center w-9 h-9 rounded-full border border-emerald-500/20 bg-emerald-50 text-emerald-600">
                                    <ChevronDown className={`w-4 h-4 text-emerald-600 transition-transform duration-300 ${isExpanded ? '' : '-rotate-90'}`} />
                                </div>
                            </div>
                            <div className="flex flex-col gap-1 min-w-0">
                                <h3 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-950 transition-colors duration-200" style={{ fontFamily: "var(--font-display)" }}>
                                    {label}
                                </h3>
                                {!isExpanded && preview && <span className="text-sm text-zinc-400 truncate font-normal">{preview}…</span>}
                            </div>
                        </button>
                        <AnimatePresence initial={false}>
                            {isExpanded && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }} className="overflow-hidden border-t border-zinc-100">
                                    <div 
                                        className="px-6 sm:px-8 pb-6 sm:pb-8 pt-4 text-zinc-600 text-sm sm:text-base leading-relaxed space-y-4 achievement-rich-content"
                                        dangerouslySetInnerHTML={{ __html: formatDescriptionHtml(bodyHtml) }}
                                    />
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
    const coverImage = item.images?.[0] || item.image || '/placeholder.webp';
    const itemCats: string[] = item.categories || (item.category ? [item.category] : []);

    return (
        <Link
            to={`/achievement/${routeId}`}
            className="group relative flex gap-3.5 rounded-2xl overflow-hidden border border-zinc-200/80 bg-white p-3 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/40 hover:shadow-[0_12px_28px_rgba(16,185,129,0.08)] shadow-2xs"
        >
            <div className="relative w-28 sm:w-32 flex-shrink-0 aspect-video rounded-xl overflow-hidden bg-zinc-100 border border-zinc-200/60">
                <ImageWithSkeleton src={coverImage} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 no-browser-trigger" />
            </div>
            <div className="flex flex-col justify-center min-w-0 z-10 py-1">
                {itemCats.length > 0 && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 mb-1 line-clamp-1">
                        {itemCats.slice(0, 2).join(' · ')}
                    </span>
                )}
                <h3 className="font-display text-xs sm:text-sm font-bold text-zinc-900 group-hover:text-emerald-700 transition-colors line-clamp-2 leading-snug">
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
            <div className="min-h-[100dvh] bg-[#FDFBF7] text-zinc-900">
                <Navbar />
                <div className="flex flex-col items-center justify-center py-40 px-4">
                    <Helmet><title>Achievement Not Found | Orbit SaaS</title><meta name="robots" content="noindex" /></Helmet>
                    <h1 className="text-3xl font-bold mb-4 font-display">Achievement Not Found</h1>
                    <Link to="/#achievements" className="text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-2">
                        <ArrowLeft className="w-4 h-4" /> Back to Achievements
                    </Link>
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
        <div className="min-h-[100dvh] relative bg-[#FDFBF7] text-zinc-900 selection:bg-zinc-900 selection:text-white">
            {/* Ambient Apple Lighting Effect */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden select-none" aria-hidden="true">
                <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-emerald-100/30 rounded-full blur-[130px] -translate-y-1/2" />
                <div className="absolute top-1/3 left-1/4 w-[600px] h-[600px] bg-amber-100/25 rounded-full blur-[140px]" />
            </div>

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
            <main className="pt-20 relative z-10">
                <ImageGallery images={allImages} title={achievement.title} videoUrl={achievement.videoPreview} onLightboxChange={setLightboxOpen} />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-16 flex flex-col lg:flex-row gap-10">
                    {/* Left: Main Content */}
                    <div className="flex-1 min-w-0">
                        {/* Title Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.05 }}
                            className="rounded-2xl sm:rounded-3xl border border-zinc-200/90 bg-white/95 backdrop-blur-xl px-6 sm:px-10 py-7 sm:py-9 mb-8 relative overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.03)] text-center"
                        >
                            {/* Top row: Breadcrumb + Share Button */}
                            <div className="flex items-center justify-between gap-4 mb-4">
                                <Link
                                    to="/#achievements"
                                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 hover:bg-emerald-50 text-zinc-600 hover:text-emerald-700 border border-zinc-200/80 text-xs font-semibold transition-colors group/back shadow-2xs"
                                >
                                    <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover/back:-translate-x-0.5" />
                                    <span>All Achievements</span>
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
                                    className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-zinc-100 hover:bg-zinc-200/80 text-zinc-700 border border-zinc-200 transition-all duration-200 shadow-2xs active:scale-95 cursor-pointer"
                                >
                                    {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
                                </button>
                            </div>

                            <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight leading-snug text-zinc-950 mb-5 relative z-10 text-center max-w-4xl mx-auto">
                                {achievement.title}
                            </h1>

                            <div className="flex flex-wrap items-center justify-center gap-2 relative z-10">
                                {achievement.category && (
                                    <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] sm:text-xs font-bold uppercase tracking-wider border border-emerald-200/80 shadow-2xs">
                                        {achievement.category}
                                    </span>
                                )}
                                {achievement.date && (
                                    <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-[11px] sm:text-xs font-semibold border border-amber-200/80 shadow-2xs">
                                        {achievement.date}
                                    </span>
                                )}
                                {achievement.tags && Array.isArray(achievement.tags) && achievement.tags.map((tag, j) => (
                                    <span key={`tag-${j}`} className="px-3 py-1 rounded-full bg-zinc-100 text-zinc-700 text-[11px] sm:text-xs font-medium border border-zinc-200/80">
                                        {tag}
                                    </span>
                                ))}
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
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: 0.2 }}
                                    className="rounded-2xl border border-zinc-200/90 bg-white px-6 sm:px-10 py-8 sm:py-10 shadow-2xs mb-6"
                                >
                                    <div 
                                        className="text-zinc-600 text-base sm:text-lg leading-relaxed achievement-rich-content"
                                        dangerouslySetInnerHTML={{ __html: formatDescriptionHtml(html) }}
                                    />
                                </motion.div>
                            );
                        })()}

                        {/* Live Link */}
                        {achievement.link && achievement.link !== '#' && (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }} className="mt-8">
                                <a
                                    href={ensureAbsoluteUrl(achievement.link)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-zinc-950 text-white font-medium hover:bg-zinc-800 transition-all shadow-sm active:scale-95 cursor-pointer"
                                >
                                    <ExternalLink className="w-4 h-4 text-emerald-400" />
                                    <span>View Details / Source</span>
                                </a>
                            </motion.div>
                        )}
                    </div>

                    {/* Right: Sidebar */}
                    {suggested.length > 0 && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.3 }} className="w-full lg:w-[380px] flex-shrink-0">
                            <div className="lg:sticky lg:top-24">
                                <h2 className="font-display text-lg font-bold text-zinc-950 mb-4">More Achievements</h2>
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
