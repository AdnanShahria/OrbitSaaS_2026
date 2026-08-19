/**
 * imageUrl.ts — Central Image URL Utility for OrbitSaaS
 *
 * The image URL format has evolved through two generations:
 *
 *   Gen 1 (legacy):  "https://r2.../img.webp|||https://i.ibb.co/img.webp"
 *   Gen 2 (current): { primary: "https://r2.../img.webp", fallback: "https://i.ibb.co/img.webp" }
 *
 * All code must use this module to read/write image URLs so that:
 *   - Both formats are transparently supported (backwards-compatible).
 *   - The R2 primary URL is always used first, with ImgBB as automatic fallback.
 *   - No raw `|||` string manipulation exists anywhere in the codebase.
 */

/**
 * The canonical image URL type stored in the database.
 * Both old strings (Gen 1) and new objects (Gen 2) are valid at runtime.
 */
export type ImageUrl =
    | string
    | { primary: string; fallback?: string };

/**
 * Normalised representation always returned by parseImageUrl().
 */
export interface ParsedImageUrl {
    primary: string;
    fallback: string | null;
}

/**
 * Parse any image URL (Gen 1 string OR Gen 2 object) into a normalised
 * { primary, fallback } form. Returns null if the input is empty/invalid.
 */
export function parseImageUrl(raw: ImageUrl | null | undefined): ParsedImageUrl | null {
    if (!raw) return null;

    // Gen 2: already an object
    if (typeof raw === 'object' && raw !== null) {
        const p = raw.primary?.trim();
        if (!p) return null;
        return { primary: p, fallback: raw.fallback?.trim() || null };
    }

    // Gen 1: "primary|||fallback" string  OR  plain single URL string
    if (typeof raw === 'string') {
        const str = raw.trim();
        if (!str) return null;

        if (str.includes('|||')) {
            const [primary, fallback] = str.split('|||').map(s => s.trim());
            return { primary, fallback: fallback || null };
        }

        // Plain single URL (old ImgBB-only or R2-only)
        return { primary: str, fallback: null };
    }

    return null;
}

/**
 * Get the primary display URL from any image URL format.
 * Returns an empty string if the input is empty/invalid.
 */
export function getImageUrl(raw: ImageUrl | null | undefined): string {
    return parseImageUrl(raw)?.primary ?? '';
}

/**
 * Get the fallback URL from any image URL format.
 * Returns null if there is no fallback.
 */
export function getFallbackUrl(raw: ImageUrl | null | undefined): string | null {
    return parseImageUrl(raw)?.fallback ?? null;
}

/**
 * Build a Gen 2 ImageUrl object from an upload API response.
 * This is what imageUpload.ts should call when constructing the return value.
 *
 * @param primary   Primary R2 URL
 * @param fallback  Optional ImgBB fallback URL
 */
export function buildImageUrl(primary: string, fallback?: string | null): ImageUrl {
    if (fallback) {
        return { primary, fallback };
    }
    return { primary };
}

/**
 * Serialise an ImageUrl to a string safe for storage in JSON blobs.
 * Gen 2 objects are serialised as JSON strings, not the `|||` hack.
 *
 * NOTE: This is only needed when writing raw strings into legacy fields.
 * Prefer storing the object directly in JSON.
 */
export function serializeImageUrl(raw: ImageUrl | null | undefined): string {
    const parsed = parseImageUrl(raw);
    if (!parsed) return '';
    if (parsed.fallback) {
        return JSON.stringify({ primary: parsed.primary, fallback: parsed.fallback });
    }
    return parsed.primary;
}

/**
 * React onError handler factory.
 * Returns an onError callback that switches the image src to the fallback URL.
 *
 * Usage:
 *   <img src={getImageUrl(img)} onError={createFallbackHandler(img, imgRef)} />
 */
export function createFallbackHandler(
    raw: ImageUrl | null | undefined,
    imgRef: React.RefObject<HTMLImageElement>
): React.ReactEventHandler<HTMLImageElement> {
    return () => {
        const fallback = getFallbackUrl(raw);
        if (fallback && imgRef.current && imgRef.current.src !== fallback) {
            imgRef.current.src = fallback;
        }
    };
}
