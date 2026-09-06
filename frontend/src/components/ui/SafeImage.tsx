import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { parseImageUrl, type ImageUrl } from '@/lib/imageUrl';

interface SafeImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
    src: ImageUrl | string | null | undefined;
    priority?: boolean;
}

/**
 * A highly optimized image component that handles both URL formats:
 *   - Gen 1 legacy: "R2_URL|||IMGBB_URL"
 *   - Gen 2 current: { primary: "R2_URL", fallback: "IMGBB_URL" }
 * - Prioritizes R2
 * - Falls back to ImgBB instantly if R2 fails
 * - Automatically handles parallel preload hints for `priority` covers
 */
export function SafeImage({ src, priority = false, alt, className, ...props }: SafeImageProps) {
    const [urls, setUrls] = useState<string[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (!src) return;
        const parsed = parseImageUrl(src as ImageUrl);
        if (!parsed) { setUrls([]); return; }
        const list = [parsed.primary, ...(parsed.fallback ? [parsed.fallback] : [])];
        setUrls(list);
        setCurrentIndex(0);
    }, [src]);

    const handleError = () => {
        if (currentIndex < urls.length - 1) {
            setCurrentIndex(prev => prev + 1);
        }
    };

    const currentSrc = urls[currentIndex] || '';

    // If it's a high priority image (like a cover), we want to preload it
    // We only preload the first URL (primary source, usually R2)
    const primaryUrl = urls[0] || '';

    return (
        <>
            {priority && primaryUrl && (
                <Helmet>
                    <link rel="preload" as="image" href={primaryUrl} />
                </Helmet>
            )}
            <img
                src={currentSrc}
                alt={alt || ''}
                className={className}
                onError={handleError}
                loading={priority ? 'eager' : 'lazy'}
                fetchPriority={priority ? 'high' : 'auto'}
                {...props}
            />
        </>
    );
}
