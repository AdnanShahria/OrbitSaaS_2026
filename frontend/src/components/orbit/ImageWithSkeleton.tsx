import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { parseImageUrl, type ImageUrl } from '@/lib/imageUrl';

interface ImageWithSkeletonProps {
    src: ImageUrl | string;
    alt: string;
    className?: string;
    showSkeleton?: boolean;
    priority?: boolean;
}

export function ImageWithSkeleton({ src, alt, className, showSkeleton = true, priority = false }: ImageWithSkeletonProps) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);

    // Fallback logic for `R2|||IMGBB` format
    const [urls, setUrls] = useState<string[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (!src) return;
        const parsed = parseImageUrl(src as ImageUrl);
        if (!parsed) { setUrls([]); return; }
        const list = [parsed.primary, ...(parsed.fallback ? [parsed.fallback] : [])];
        setUrls(list);
        setCurrentIndex(0);
        setIsLoaded(false);
        setHasError(false);
    }, [src]);

    const currentSrc = urls[currentIndex] || '';
    const primaryUrl = urls[0] || '';

    const handleImageError = () => {
        if (currentIndex < urls.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setHasError(false);
            setIsLoaded(false);
        } else {
            setIsLoaded(true);
            setHasError(true);
        }
    };

    // Initial check for cached images
    useLayoutEffect(() => {
        if (imgRef.current?.complete && imgRef.current?.naturalHeight > 0) {
            setIsLoaded(true);
        }
    }, [currentSrc]);

    return (
        <div className={`relative w-full h-full overflow-hidden ${className || ''}`}>
            {/* Priority Preload Hint */}
            {priority && primaryUrl && (
                <Helmet>
                    <link rel="preload" as="image" href={primaryUrl} />
                </Helmet>
            )}

            {/* Shimmer Skeleton & Progress Bar Area */}
            <AnimatePresence>
                {showSkeleton && !isLoaded && !hasError && (
                    <motion.div
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0 z-20"
                    >
                        {/* Shimmer Background */}
                        <div className="absolute inset-0 shimmer-skeleton" />
                        
                        {/* 0-100% Progress Bar Container */}
                        <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-200/20 overflow-hidden">
                            <motion.div
                                initial={{ width: "0%" }}
                                animate={{ width: "95%" }}
                                transition={{ 
                                    duration: 3, 
                                    ease: [0.22, 1, 0.36, 1]
                                }}
                                className="h-full bg-[#22C55E]"
                            />
                        </div>

                        {/* Loading Text/Indicator */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <motion.div 
                                animate={{ opacity: [0.4, 0.8, 0.4] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                                className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#22C55E]/60"
                            >
                                Loading
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Final Progress Completion Sweep */}
            <AnimatePresence>
                {isLoaded && !hasError && (
                    <motion.div
                        initial={{ width: "95%", opacity: 1 }}
                        animate={{ width: "100%", opacity: 0 }}
                        transition={{ duration: 0.4 }}
                        className="absolute bottom-0 left-0 h-1 bg-[#22C55E] z-30 pointer-events-none"
                    />
                )}
            </AnimatePresence>

            {/* Error State */}
            {hasError && (
                <div className="absolute inset-0 z-40 bg-gray-50 flex items-center justify-center text-gray-400 text-[10px] uppercase font-bold">
                    Image failed to load
                </div>
            )}

            {/* The Actual Image */}
            {currentSrc && (
                <img
                    ref={imgRef}
                    src={currentSrc}
                    alt={alt}
                    onLoad={() => setIsLoaded(true)}
                    onError={handleImageError}
                    loading={priority ? 'eager' : 'lazy'}
                    fetchpriority={priority ? 'high' : 'auto'}
                    className={`w-full h-full transition-all duration-700 ${isLoaded && !hasError ? 'opacity-100 scale-100' : 'opacity-0 scale-[1.02]'}`}
                    style={{ objectFit: 'cover', position: 'relative', zIndex: isLoaded ? 30 : 10 }}
                />
            )}
        </div>
    );
}
