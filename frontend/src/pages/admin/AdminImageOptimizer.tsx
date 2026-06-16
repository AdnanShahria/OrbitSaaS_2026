import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { useContent } from '@/contexts/ContentContext';
import { SectionHeader } from '@/components/admin/EditorComponents';
import { ImageIcon, Zap, Loader2, CheckCircle2 } from 'lucide-react';
import { uploadToImgBB } from '@/lib/imgbb';

// Regex to find image URLs in text (including i.ibb.co)
const URL_REGEX = /https?:\/\/[^\s"'<>]+\.(?:jpg|jpeg|png|webp|gif)(?:\?[^\s"'<>]+)?|https?:\/\/i\.ibb\.co\/[^\s"'<>]+/g;

interface DiscoveredImage {
    url: string;
    sections: { section: string; lang: string }[];
}

export default function AdminImageOptimizer() {
    const { content, updateSection, refreshContent } = useContent();
    const [isScanning, setIsScanning] = useState(false);
    const [isCompressing, setIsCompressing] = useState(false);
    const [progress, setProgress] = useState({ done: 0, total: 0 });
    const [results, setResults] = useState<{ url: string; newUrl?: string; error?: string }[]>([]);

    // Scan for images across all sections
    const discoveredImages = useMemo(() => {
        const imageMap = new Map<string, DiscoveredImage>();

        const scanLang = (langData: Record<string, any>, lang: string) => {
            for (const [sectionKey, sectionData] of Object.entries(langData)) {
                if (!sectionData) continue;
                
                const jsonStr = JSON.stringify(sectionData);
                const matches = jsonStr.match(URL_REGEX) || [];
                
                for (const url of matches) {
                    // Clean up URL if it caught trailing quotes or brackets
                    const cleanUrl = url.replace(/["']$/, '').replace(/\]$/, '');
                    
                    // Skip tiny/icon images (SVG/Icons usually aren't stored via ImgBB, but just in case)
                    if (cleanUrl.endsWith('.svg')) continue;

                    if (!imageMap.has(cleanUrl)) {
                        imageMap.set(cleanUrl, { url: cleanUrl, sections: [] });
                    }
                    
                    const img = imageMap.get(cleanUrl)!;
                    // Only add section if not already present for this image
                    if (!img.sections.some(s => s.section === sectionKey && s.lang === lang)) {
                        img.sections.push({ section: sectionKey, lang });
                    }
                }
            }
        };

        if (content?.en) scanLang(content.en, 'en');
        if (content?.bn) scanLang(content.bn, 'bn');

        return Array.from(imageMap.values());
    }, [content]);

    const handleCompressAll = async () => {
        if (discoveredImages.length === 0) return;
        
        setIsCompressing(true);
        setProgress({ done: 0, total: discoveredImages.length });
        setResults([]);
        
        const toastId = toast.loading('Compressing images...');
        let successCount = 0;
        let failCount = 0;
        
        const newResults: typeof results = [];
        
        // We need to keep track of URL mappings to update the sections later
        const urlReplacements = new Map<string, string>();

        for (let i = 0; i < discoveredImages.length; i++) {
            const img = discoveredImages[i];
            
            try {
                // 1. Fetch image using the proxy to bypass CORS/503 blocks
                const API_BASE = import.meta.env.VITE_API_URL || '';
                const proxyUrl = `${API_BASE}/api/img-proxy?url=${encodeURIComponent(img.url)}`;
                const res = await fetch(proxyUrl);
                if (!res.ok) throw new Error(`Failed to fetch image via proxy (Status: ${res.status})`);
                const blob = await res.blob();
                
                // Construct a File object from the blob
                const filename = img.url.split('/').pop() || 'image.jpg';
                const file = new File([blob], filename, { type: blob.type });

                // 2. Upload (which now includes compression)
                const newUrl = await uploadToImgBB(file);
                
                urlReplacements.set(img.url, newUrl);
                successCount++;
                newResults.push({ url: img.url, newUrl });
            } catch (err: any) {
                console.error(`Error compressing ${img.url}:`, err);
                failCount++;
                newResults.push({ url: img.url, error: err.message });
            }
            
            setProgress({ done: i + 1, total: discoveredImages.length });
            setResults([...newResults]);
        }
        
        // 3. Update all affected sections
        if (urlReplacements.size > 0) {
            toast.loading('Applying new image URLs to database...', { id: toastId });
            
            const sectionsToUpdate = new Map<string, { section: string, lang: string }>();
            
            // Find all sections that need updates
            for (const img of discoveredImages) {
                if (urlReplacements.has(img.url)) {
                    for (const s of img.sections) {
                        sectionsToUpdate.set(`${s.lang}-${s.section}`, s);
                    }
                }
            }
            
            // Update each affected section
            for (const s of Array.from(sectionsToUpdate.values())) {
                const langData = content[s.lang as 'en' | 'bn'];
                const sectionData = langData[s.section];
                
                if (sectionData) {
                    let jsonStr = JSON.stringify(sectionData);
                    
                    // Apply all replacements to this section
                    for (const [oldUrl, newUrl] of urlReplacements.entries()) {
                        // Global replace using split/join to avoid regex escaping issues with URLs
                        jsonStr = jsonStr.split(oldUrl).join(newUrl);
                    }
                    
                    const updatedData = JSON.parse(jsonStr);
                    await updateSection(s.section, s.lang, updatedData);
                }
            }
            
            await refreshContent();
            toast.success(`Compression complete! ${successCount} optimized, ${failCount} failed.`, { id: toastId });
        } else {
            toast.error('No images were successfully compressed.', { id: toastId });
        }
        
        setIsCompressing(false);
    };

    return (
        <div className="space-y-8">
            <SectionHeader
                title="Bulk Image Optimizer"
                description="Scan and compress all existing images in your database to improve website loading speed."
            />

            <div className="bg-card rounded-xl border border-border p-6">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                        <ImageIcon className="w-6 h-6 text-blue-500" />
                    </div>
                    <div className="flex-1 space-y-4">
                        <div>
                            <h3 className="font-semibold text-foreground text-lg flex items-center gap-2">
                                Found {discoveredImages.length} Images
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                These images are currently referenced in your database. Compressing them will download, optimize, and re-upload them to ImgBB, updating your content automatically.
                            </p>
                        </div>

                        {discoveredImages.length > 0 && (
                            <div className="flex items-center gap-3 pt-2">
                                <button
                                    onClick={handleCompressAll}
                                    disabled={isCompressing}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm bg-blue-600 text-white hover:bg-blue-700 transition-colors cursor-pointer shadow-lg shadow-blue-500/20 disabled:opacity-50"
                                >
                                    {isCompressing ? (
                                        <><Loader2 className="w-4 h-4 animate-spin" /> Compressing... {progress.done}/{progress.total}</>
                                    ) : (
                                        <><Zap className="w-4 h-4" /> Compress All Images</>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Results / List */}
            {discoveredImages.length > 0 && (
                <div className="bg-card rounded-xl border border-border overflow-hidden">
                    <div className="p-4 border-b border-border bg-secondary/30">
                        <h4 className="font-semibold text-sm">Image References</h4>
                    </div>
                    <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
                        {discoveredImages.map((img, i) => {
                            const result = results.find(r => r.url === img.url);
                            
                            return (
                                <div key={i} className="p-4 flex items-center gap-4 hover:bg-secondary/20 transition-colors">
                                    <div className="w-16 h-16 rounded-lg overflow-hidden border border-border flex-shrink-0 bg-secondary/50">
                                        <img src={img.url} alt="Preview" className="w-full h-full object-cover" loading="lazy" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-foreground truncate">{img.url}</p>
                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                            {img.sections.map((s, idx) => (
                                                <span key={idx} className="text-[10px] bg-secondary text-muted-foreground px-2 py-0.5 rounded-full">
                                                    {s.lang.toUpperCase()}: {s.section}
                                                </span>
                                            ))}
                                        </div>
                                        
                                        {/* Status */}
                                        {result && (
                                            <div className="mt-2 text-xs">
                                                {result.newUrl ? (
                                                    <span className="text-emerald-500 flex items-center gap-1">
                                                        <CheckCircle2 className="w-3.5 h-3.5" /> Compressed successfully
                                                    </span>
                                                ) : (
                                                    <span className="text-red-500">Failed: {result.error}</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
