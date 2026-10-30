import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { getImageUrl, getFallbackUrl } from '@/lib/imageUrl';

export type LightboxMediaItem = { type: 'image'; url: string } | { type: 'video'; url: string };

interface ZoomableLightboxProps {
    isOpen: boolean;
    onClose: () => void;
    media: LightboxMediaItem[];
    currentIndex: number;
    onIndexChange: (index: number) => void;
    title?: string;
}

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

export function ZoomableLightbox({
    isOpen,
    onClose,
    media,
    currentIndex,
    onIndexChange,
    title = 'Image view',
}: ZoomableLightboxProps) {
    const [scale, setScale] = useState(1);
    const [translate, setTranslate] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);

    // Touch gesture refs
    const touchStartDistRef = useRef<number | null>(null);
    const initialScaleRef = useRef<number>(1);
    const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);
    const initialTranslateRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const lastTapTimeRef = useRef<number>(0);
    const isPinchingRef = useRef<boolean>(false);
    const isPanningRef = useRef<boolean>(false);
    const swipeStartXRef = useRef<number | null>(null);
    const imageContainerRef = useRef<HTMLDivElement>(null);

    // Reset zoom when index changes or lightbox opens/closes
    useEffect(() => {
        setScale(1);
        setTranslate({ x: 0, y: 0 });
    }, [currentIndex, isOpen]);

    // Body scroll lock and navbar hiding sync
    useEffect(() => {
        window.dispatchEvent(new CustomEvent('orbit-lightbox-state-change', { detail: { isOpen } }));
        if (isOpen) {
            const origBody = document.body.style.overflow;
            const origHtml = document.documentElement.style.overflow;
            document.body.style.overflow = 'hidden';
            document.documentElement.style.overflow = 'hidden';
            document.body.setAttribute('data-orbit-lightbox', 'open');
            return () => {
                document.body.style.overflow = origBody;
                document.documentElement.style.overflow = origHtml;
                document.body.removeAttribute('data-orbit-lightbox');
                window.dispatchEvent(new CustomEvent('orbit-lightbox-state-change', { detail: { isOpen: false } }));
            };
        } else {
            document.body.removeAttribute('data-orbit-lightbox');
        }
    }, [isOpen]);

    // Keyboard shortcuts
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            } else if (e.key === 'ArrowLeft' && scale === 1) {
                if (media.length > 1) {
                    onIndexChange((currentIndex - 1 + media.length) % media.length);
                }
            } else if (e.key === 'ArrowRight' && scale === 1) {
                if (media.length > 1) {
                    onIndexChange((currentIndex + 1) % media.length);
                }
            } else if (e.key === '+' || e.key === '=') {
                setScale((prev) => Math.min(4, +(prev + 0.5).toFixed(2)));
            } else if (e.key === '-') {
                setScale((prev) => {
                    const next = Math.max(1, +(prev - 0.5).toFixed(2));
                    if (next === 1) setTranslate({ x: 0, y: 0 });
                    return next;
                });
            } else if (e.key === '0') {
                setScale(1);
                setTranslate({ x: 0, y: 0 });
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, scale, currentIndex, media.length, onClose, onIndexChange]);

    const paginate = useCallback(
        (dir: number) => {
            if (media.length <= 1) return;
            setScale(1);
            setTranslate({ x: 0, y: 0 });
            onIndexChange((currentIndex + dir + media.length) % media.length);
        },
        [media.length, currentIndex, onIndexChange]
    );

    const zoomIn = () => {
        setScale((prev) => Math.min(4, +(prev + 0.5).toFixed(2)));
    };

    const zoomOut = () => {
        setScale((prev) => {
            const next = Math.max(1, +(prev - 0.5).toFixed(2));
            if (next === 1) setTranslate({ x: 0, y: 0 });
            return next;
        });
    };

    const resetZoom = () => {
        setScale(1);
        setTranslate({ x: 0, y: 0 });
    };

    // Calculate maximum pan bounds based on scale
    const getBounds = (currentScale: number) => {
        if (currentScale <= 1) return { maxX: 0, maxY: 0 };
        const factor = (currentScale - 1) * 0.5;
        const maxX = window.innerWidth * factor;
        const maxY = window.innerHeight * factor;
        return { maxX, maxY };
    };

    const clampTranslate = (x: number, y: number, currentScale: number) => {
        const { maxX, maxY } = getBounds(currentScale);
        return {
            x: Math.min(maxX, Math.max(-maxX, x)),
            y: Math.min(maxY, Math.max(-maxY, y)),
        };
    };

    // Touch Event Handlers for 2-finger pinch, pan, double-tap & swipe
    const handleTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length === 2) {
            // 2-finger pinch
            const t1 = e.touches[0];
            const t2 = e.touches[1];
            const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
            touchStartDistRef.current = dist;
            initialScaleRef.current = scale;
            isPinchingRef.current = true;
            isPanningRef.current = false;
        } else if (e.touches.length === 1) {
            const t = e.touches[0];
            const now = Date.now();
            const timeSinceLastTap = now - lastTapTimeRef.current;

            // Double tap to toggle 1x and 2.5x
            if (timeSinceLastTap < 300) {
                lastTapTimeRef.current = 0;
                if (scale > 1.05) {
                    resetZoom();
                } else {
                    setScale(2.5);
                    const rect = imageContainerRef.current?.getBoundingClientRect();
                    if (rect) {
                        const midX = rect.left + rect.width / 2;
                        const midY = rect.top + rect.height / 2;
                        const offsetX = (midX - t.clientX) * 1.5;
                        const offsetY = (midY - t.clientY) * 1.5;
                        setTranslate(clampTranslate(offsetX, offsetY, 2.5));
                    }
                }
                return;
            }
            lastTapTimeRef.current = now;

            if (scale > 1.05) {
                // Pan while zoomed
                isPanningRef.current = true;
                touchStartPosRef.current = { x: t.clientX, y: t.clientY };
                initialTranslateRef.current = { ...translate };
            } else {
                // Prepare for swipe pagination
                swipeStartXRef.current = t.clientX;
            }
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (e.touches.length === 2 && isPinchingRef.current && touchStartDistRef.current) {
            const t1 = e.touches[0];
            const t2 = e.touches[1];
            const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
            const ratio = dist / touchStartDistRef.current;
            const newScale = Math.min(4, Math.max(1, +(initialScaleRef.current * ratio).toFixed(2)));
            setScale(newScale);
            setTranslate((prev) => clampTranslate(prev.x, prev.y, newScale));
        } else if (e.touches.length === 1 && isPanningRef.current && touchStartPosRef.current) {
            const t = e.touches[0];
            const dx = t.clientX - touchStartPosRef.current.x;
            const dy = t.clientY - touchStartPosRef.current.y;
            const nextX = initialTranslateRef.current.x + dx;
            const nextY = initialTranslateRef.current.y + dy;
            setTranslate(clampTranslate(nextX, nextY, scale));
        }
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (isPinchingRef.current && e.touches.length < 2) {
            isPinchingRef.current = false;
            touchStartDistRef.current = null;
            if (scale < 1.1) {
                resetZoom();
            }
        }

        if (isPanningRef.current && e.touches.length === 0) {
            isPanningRef.current = false;
            touchStartPosRef.current = null;
        }

        if (scale <= 1.05 && swipeStartXRef.current !== null && e.touches.length === 0) {
            const endX = e.changedTouches[0]?.clientX;
            if (endX !== undefined) {
                const diff = endX - swipeStartXRef.current;
                if (diff > 60) {
                    paginate(-1);
                } else if (diff < -60) {
                    paginate(1);
                }
            }
            swipeStartXRef.current = null;
        }
    };

    // Mouse drag panning on desktop when scale > 1
    const handleMouseDown = (e: React.MouseEvent) => {
        if (scale > 1 && e.button === 0) {
            setIsDragging(true);
            touchStartPosRef.current = { x: e.clientX, y: e.clientY };
            initialTranslateRef.current = { ...translate };
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging && touchStartPosRef.current && scale > 1) {
            const dx = e.clientX - touchStartPosRef.current.x;
            const dy = e.clientY - touchStartPosRef.current.y;
            const nextX = initialTranslateRef.current.x + dx;
            const nextY = initialTranslateRef.current.y + dy;
            setTranslate(clampTranslate(nextX, nextY, scale));
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        touchStartPosRef.current = null;
    };

    const currentMedia = media && media.length > 0 ? media[currentIndex] : null;
    const isVideo = currentMedia?.type === 'video';

    // Native non-passive wheel event listener on desktop to allow e.preventDefault() without console warnings
    useEffect(() => {
        const container = imageContainerRef.current;
        if (!container || !isOpen || isVideo) return;

        const handleNativeWheel = (e: WheelEvent) => {
            e.preventDefault();
            e.stopPropagation();
            const delta = -e.deltaY * 0.0025;
            setScale((prev) => {
                const next = Math.min(4, Math.max(1, +(prev + delta).toFixed(2)));
                if (next === 1) setTranslate({ x: 0, y: 0 });
                else setTranslate((t) => clampTranslate(t.x, t.y, next));
                return next;
            });
        };

        container.addEventListener('wheel', handleNativeWheel, { passive: false });
        return () => {
            container.removeEventListener('wheel', handleNativeWheel);
        };
    }, [isOpen, isVideo]);

    if (!isOpen || media.length === 0 || !currentMedia) return null;
    const ytId = isVideo ? extractYouTubeId(currentMedia.url) : null;

    const content = (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.22 }}
                    className="fixed inset-0 z-[99999] bg-black/95 backdrop-blur-2xl flex items-center justify-center w-screen h-[100dvh] max-w-[100vw] max-h-[100dvh] overflow-hidden select-none"
                    onClick={(e) => {
                        // Click backdrop to close (only when clicked directly on overlay)
                        if (e.target === e.currentTarget) {
                            onClose();
                        }
                    }}
                >
                    {/* ── Top Bar: Title & Prominent Close Button ── */}
                    <div className="absolute top-0 inset-x-0 z-50 flex items-center justify-between p-3 sm:p-5 pointer-events-none">
                        {/* Title pill */}
                        <div className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/50 border border-white/15 backdrop-blur-md max-w-[70vw] truncate text-white/90 text-xs sm:text-sm font-medium shadow-lg">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                            <span className="truncate">{title}</span>
                        </div>

                        {/* High-visibility Close Cross Button (Cannot be overlapped by navbar) */}
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onClose();
                            }}
                            className="pointer-events-auto p-2.5 sm:p-3 rounded-full bg-white/20 hover:bg-white/35 active:scale-95 text-white backdrop-blur-xl border border-white/25 shadow-2xl transition-all duration-200 cursor-pointer flex items-center justify-center shrink-0"
                            aria-label="Close zoom modal"
                            title="Close (Esc)"
                        >
                            <X className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.5]" />
                        </button>
                    </div>

                    {/* ── Left / Right Desktop Pagination Chevrons ── */}
                    {media.length > 1 && (
                        <>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    paginate(-1);
                                }}
                                className="absolute left-3 sm:left-6 z-40 p-3 sm:p-3.5 rounded-full bg-white/15 hover:bg-white/30 text-white backdrop-blur-md border border-white/20 transition-all active:scale-95 cursor-pointer hidden sm:flex items-center justify-center shadow-xl"
                                aria-label="Previous media"
                                title="Previous (←)"
                            >
                                <ChevronLeft className="w-6 h-6 sm:w-7 sm:h-7" />
                            </button>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    paginate(1);
                                }}
                                className="absolute right-3 sm:right-6 z-40 p-3 sm:p-3.5 rounded-full bg-white/15 hover:bg-white/30 text-white backdrop-blur-md border border-white/20 transition-all active:scale-95 cursor-pointer hidden sm:flex items-center justify-center shadow-xl"
                                aria-label="Next media"
                                title="Next (→)"
                            >
                                <ChevronRight className="w-6 h-6 sm:w-7 sm:h-7" />
                            </button>
                        </>
                    )}

                    {/* ── Main Stage (Image or Video) ── */}
                    <div
                        ref={imageContainerRef}
                        className="relative w-full h-full flex items-center justify-center p-2 sm:p-6 overflow-hidden touch-none"
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                    >
                        {isVideo ? (
                            <div className="w-full max-w-5xl aspect-video relative z-30" onClick={(e) => e.stopPropagation()}>
                                {ytId ? (
                                    <iframe
                                        src={`https://www.youtube-nocookie.com/embed/${ytId}?rel=0&autoplay=1&modestbranding=1`}
                                        title={title}
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                        className="w-full h-full rounded-xl sm:rounded-2xl border border-white/15 shadow-2xl"
                                    />
                                ) : (
                                    <video
                                        src={currentMedia.url}
                                        controls
                                        autoPlay
                                        playsInline
                                        className="w-full h-full rounded-xl sm:rounded-2xl object-contain bg-black border border-white/15 shadow-2xl"
                                    />
                                )}
                            </div>
                        ) : (
                            <div
                                className="relative flex items-center justify-center w-full h-full transition-transform duration-75"
                                style={{
                                    transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
                                    transformOrigin: 'center center',
                                    cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in',
                                }}
                                onDoubleClick={(e) => {
                                    e.stopPropagation();
                                    if (scale > 1.05) resetZoom();
                                    else setScale(2.5);
                                }}
                            >
                                <img
                                    src={getImageUrl(currentMedia.url)}
                                    alt={title}
                                    draggable={false}
                                    className="max-w-[92vw] max-h-[80vh] sm:max-w-[85vw] sm:max-h-[82vh] object-contain select-none shadow-[0_25px_60px_rgba(0,0,0,0.8)] rounded-lg sm:rounded-xl pointer-events-auto"
                                    onError={(e) => {
                                        const fb = getFallbackUrl(currentMedia.url);
                                        if (fb && e.currentTarget.src !== fb) e.currentTarget.src = fb;
                                    }}
                                />
                            </div>
                        )}
                    </div>

                    {/* ── Bottom Floating Bar: Slide Counter & Zoom Controls ── */}
                    <div className="absolute bottom-4 sm:bottom-6 inset-x-0 z-50 flex items-center justify-center pointer-events-none px-4">
                        <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-3 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-black/70 border border-white/20 text-white backdrop-blur-xl shadow-2xl">
                            {/* Mobile Previous Button */}
                            {media.length > 1 && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        paginate(-1);
                                    }}
                                    className="flex sm:hidden p-1.5 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white transition-colors cursor-pointer"
                                    aria-label="Previous"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                            )}

                            {/* Slide Counter */}
                            <span className="text-xs sm:text-sm font-semibold tracking-wider tabular-nums px-1 sm:px-2 min-w-[3.5rem] text-center">
                                {currentIndex + 1} <span className="text-emerald-400 mx-0.5">/</span> {media.length}
                            </span>

                            {/* Mobile Next Button */}
                            {media.length > 1 && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        paginate(1);
                                    }}
                                    className="flex sm:hidden p-1.5 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white transition-colors cursor-pointer"
                                    aria-label="Next"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            )}

                            {/* Zoom Controls (Only for images) */}
                            {!isVideo && (
                                <>
                                    <div className="w-px h-4 bg-white/20 mx-0.5 sm:mx-1" />

                                    {/* Zoom Out Button */}
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            zoomOut();
                                        }}
                                        disabled={scale <= 1}
                                        className="p-1.5 sm:p-2 rounded-full bg-white/10 hover:bg-white/25 active:scale-95 text-white transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                        title="Zoom Out (-)"
                                        aria-label="Zoom out"
                                    >
                                        <ZoomOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    </button>

                                    {/* Zoom Level Indicator / Reset */}
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            resetZoom();
                                        }}
                                        className="text-[11px] sm:text-xs font-bold tabular-nums px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 transition-colors cursor-pointer"
                                        title="Reset Zoom (0)"
                                    >
                                        {Math.round(scale * 100)}%
                                    </button>

                                    {/* Zoom In Button */}
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            zoomIn();
                                        }}
                                        disabled={scale >= 4}
                                        className="p-1.5 sm:p-2 rounded-full bg-white/10 hover:bg-white/25 active:scale-95 text-white transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                        title="Zoom In (+)"
                                        aria-label="Zoom in"
                                    >
                                        <ZoomIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    </button>

                                    {scale > 1 && (
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                resetZoom();
                                            }}
                                            className="p-1.5 sm:p-2 rounded-full bg-white/10 hover:bg-white/25 active:scale-95 text-white transition-colors cursor-pointer"
                                            title="Reset to 100%"
                                            aria-label="Reset zoom"
                                        >
                                            <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    if (typeof document === 'undefined') return content;
    return createPortal(content, document.body);
}
