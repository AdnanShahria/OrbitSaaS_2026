import { useState, useMemo, useEffect } from 'react';
import { toast } from 'sonner';
import { useContent } from '@/contexts/ContentContext';
import { SectionHeader } from '@/components/admin/EditorComponents';
import { ImageIcon, Zap, Loader2, CheckCircle2, ChevronDown, CheckSquare, Square, RefreshCcw, Layers, Lock, X } from 'lucide-react';
import { uploadToImgBB } from '@/lib/imgbb';
import imageCompression from 'browser-image-compression';

// Regex to find image URLs in text (including i.ibb.co)
const URL_REGEX = /https?:\/\/[^\s"'<>]+\.(?:jpg|jpeg|png|webp|gif)(?:\?[^\s"'<>]+)?|https?:\/\/i\.ibb\.co\/[^\s"'<>]+/g;

interface ImageSectionPath {
    section: string;
    lang: string;
    title?: string;
}

interface DiscoveredImage {
    url: string;
    sections: ImageSectionPath[];
    isCompressed: boolean;
    serialNumber?: number;
}

export default function AdminImageOptimizer() {
    const { content, updateSection, refreshContent } = useContent();
    const [isCompressing, setIsCompressing] = useState(false);
    const [progress, setProgress] = useState({ done: 0, total: 0 });
    const [results, setResults] = useState<{ url: string; newUrl?: string; error?: string }[]>([]);
    const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());
    const [imageSizes, setImageSizes] = useState<Record<string, number>>({});
    const [fetchingSizes, setFetchingSizes] = useState(false);
    const [expandedSegments, setExpandedSegments] = useState<Set<string>>(new Set());

    // OTP Modal States
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [otpInput, setOtpInput] = useState('');
    const [isSendingOtp, setIsSendingOtp] = useState(false);
    const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
    const [isSandboxFlow, setIsSandboxFlow] = useState(false);

    // Sandbox States
    const [sandboxFile, setSandboxFile] = useState<File | null>(null);
    const [sandboxPreview, setSandboxPreview] = useState<string | null>(null);
    const [sandboxCompressedBlob, setSandboxCompressedBlob] = useState<Blob | null>(null);
    const [sandboxCompressing, setSandboxCompressing] = useState(false);
    const [sandboxResultUrl, setSandboxResultUrl] = useState<string | null>(null);

    // Store sizes for newly compressed images
    const [newImageSizes, setNewImageSizes] = useState<Record<string, number>>({});

    // 1. Recursive Data Scanner
    const discoveredImages = useMemo(() => {
        const imageMap = new Map<string, DiscoveredImage>();

        const scanLang = (langData: Record<string, any>, lang: string) => {
            for (const [sectionKey, sectionData] of Object.entries(langData)) {
                if (!sectionData) continue;
                
                // Smart extraction for standard OrbitSaaS sections that have `.items`
                if (sectionData.items && Array.isArray(sectionData.items)) {
                    sectionData.items.forEach((item: any, idx: number) => {
                        const itemTitle = item.en?.title || item.title || item.name || `Item #${idx + 1}`;
                        const jsonStr = JSON.stringify(item);
                        const matches = jsonStr.match(URL_REGEX) || [];
                        
                        matches.forEach(url => {
                            const cleanUrl = url.replace(/["']$/, '').replace(/\]$/, '');
                            if (cleanUrl.endsWith('.svg')) return;
                            if (!imageMap.has(cleanUrl)) {
                                imageMap.set(cleanUrl, { url: cleanUrl, sections: [], isCompressed: cleanUrl.toLowerCase().endsWith('.webp') });
                            }
                            const img = imageMap.get(cleanUrl)!;
                            if (!img.sections.some(s => s.section === sectionKey && s.lang === lang && s.title === itemTitle)) {
                                img.sections.push({ section: sectionKey, lang, title: itemTitle });
                            }
                        });
                    });

                    // Also scan the section wrapper (title, subtitle, etc.) excluding items
                    const { items, ...rest } = sectionData;
                    const restStr = JSON.stringify(rest);
                    const restMatches = restStr.match(URL_REGEX) || [];
                    restMatches.forEach(url => {
                        const cleanUrl = url.replace(/["']$/, '').replace(/\]$/, '');
                        if (cleanUrl.endsWith('.svg')) return;
                        if (!imageMap.has(cleanUrl)) {
                            imageMap.set(cleanUrl, { url: cleanUrl, sections: [], isCompressed: cleanUrl.toLowerCase().endsWith('.webp') });
                        }
                        const img = imageMap.get(cleanUrl)!;
                        if (!img.sections.some(s => s.section === sectionKey && s.lang === lang && s.title === 'Section Settings')) {
                            img.sections.push({ section: sectionKey, lang, title: 'Section Settings' });
                        }
                    });
                } else {
                    // Fallback for sections without items
                    const jsonStr = JSON.stringify(sectionData);
                    const matches = jsonStr.match(URL_REGEX) || [];
                    matches.forEach(url => {
                        const cleanUrl = url.replace(/["']$/, '').replace(/\]$/, '');
                        if (cleanUrl.endsWith('.svg')) return;
                        if (!imageMap.has(cleanUrl)) {
                            imageMap.set(cleanUrl, { url: cleanUrl, sections: [], isCompressed: cleanUrl.toLowerCase().endsWith('.webp') });
                        }
                        const img = imageMap.get(cleanUrl)!;
                        if (!img.sections.some(s => s.section === sectionKey && s.lang === lang && !s.title)) {
                            img.sections.push({ section: sectionKey, lang });
                        }
                    });
                }
            }
        };

        if (content?.en) scanLang(content.en, 'en');
        if (content?.bn) scanLang(content.bn, 'bn');

        const images = Array.from(imageMap.values());
        
        // Add serial number
        images.forEach((img, index) => {
            img.serialNumber = index + 1;
        });
        
        // Auto-select images that don't seem to be already compressed (.webp or i.ibb.co with webp)
        const initialSelected = new Set<string>();
        images.forEach(img => {
            if (!img.isCompressed) {
                initialSelected.add(img.url);
            }
        });
        setSelectedUrls(initialSelected);

        return images;
    }, [content]);

    // Group images for segmented UI
    const segments = useMemo(() => {
        const map: Record<string, Record<string, DiscoveredImage[]>> = {};
        discoveredImages.forEach(img => {
            const primarySection = img.sections[0];
            const secName = primarySection ? primarySection.section.toUpperCase() : 'OTHER';
            const subName = primarySection && primarySection.title ? primarySection.title : 'General Settings';
            
            if (!map[secName]) map[secName] = {};
            if (!map[secName][subName]) map[secName][subName] = [];
            map[secName][subName].push(img);
        });
        return map;
    }, [discoveredImages]);

    // 2. Asynchronous Size Fetching
    const fetchSizes = async () => {
        setFetchingSizes(true);
        const API_BASE = import.meta.env.VITE_API_URL || '';
        
        const batchSize = 5;
        for (let i = 0; i < discoveredImages.length; i += batchSize) {
            const batch = discoveredImages.slice(i, i + batchSize);
            await Promise.all(batch.map(async (img) => {
                if (imageSizes[img.url]) return;
                try {
                    const proxyUrl = `${API_BASE}/api/img-proxy?url=${encodeURIComponent(img.url)}`;
                    const res = await fetch(proxyUrl, { method: 'HEAD' });
                    const size = res.headers.get('content-length');
                    if (size) {
                        setImageSizes(prev => ({ ...prev, [img.url]: parseInt(size, 10) }));
                    }
                } catch (e) {
                    console.error('Failed to fetch size for', img.url);
                }
            }));
            
            // Add a small delay between batches to avoid spamming the server
            await new Promise(r => setTimeout(r, 200));
        }
        setFetchingSizes(false);
    };

    useEffect(() => {
        if (discoveredImages.length > 0 && Object.keys(imageSizes).length === 0 && !fetchingSizes) {
            fetchSizes();
        }
    }, [discoveredImages]); // eslint-disable-line react-hooks/exhaustive-deps

    const formatSize = (bytes?: number) => {
        if (!bytes) return 'Loading...';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    };

    // 3. Selection Controls
    const selectAll = () => setSelectedUrls(new Set(discoveredImages.map(i => i.url)));
    const deselectAll = () => setSelectedUrls(new Set());
    const selectUncompressed = () => setSelectedUrls(new Set(discoveredImages.filter(i => !i.isCompressed).map(i => i.url)));
    const selectCompressed = () => setSelectedUrls(new Set(discoveredImages.filter(i => i.isCompressed).map(i => i.url)));

    const toggleSegment = (secName: string) => {
        setExpandedSegments(prev => {
            const next = new Set(prev);
            if (next.has(secName)) next.delete(secName);
            else next.add(secName);
            return next;
        });
    };

    const triggerCompression = async () => {
        const imagesToProcess = discoveredImages.filter(img => selectedUrls.has(img.url));
        if (imagesToProcess.length === 0) return;

        setIsSandboxFlow(false);
        setShowOtpModal(true);
        setIsSendingOtp(true);
        try {
            const token = localStorage.getItem('admin_token');
            const API_BASE = import.meta.env.VITE_API_URL || '';
            const res = await fetch(`${API_BASE}/api/otp?action=send`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to send OTP');
            toast.success('OTP sent to your email.');
        } catch (err: any) {
            console.error('OTP Send error', err);
            toast.error('Failed to send OTP email.');
            setShowOtpModal(false);
        } finally {
            setIsSendingOtp(false);
        }
    };

    const triggerSandboxOTP = async () => {
        if (!sandboxCompressedBlob) return;
        setIsSandboxFlow(true);
        setShowOtpModal(true);
        setIsSendingOtp(true);
        try {
            const token = localStorage.getItem('admin_token');
            const API_BASE = import.meta.env.VITE_API_URL || '';
            const res = await fetch(`${API_BASE}/api/otp?action=send`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to send OTP');
            toast.success('OTP sent to your email.');
        } catch (err: any) {
            console.error('OTP Send error', err);
            toast.error('Failed to send OTP email.');
            setShowOtpModal(false);
        } finally {
            setIsSendingOtp(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!otpInput) {
            toast.error('Please enter the OTP.');
            return;
        }

        setIsVerifyingOtp(true);
        try {
            const token = localStorage.getItem('admin_token');
            const API_BASE = import.meta.env.VITE_API_URL || '';
            const res = await fetch(`${API_BASE}/api/otp?action=verify`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}` 
                },
                body: JSON.stringify({ code: otpInput })
            });
            const data = await res.json();
            
            if (res.ok && data.success) {
                toast.success('OTP verified successfully!');
                setShowOtpModal(false);
                setOtpInput('');
                if (isSandboxFlow) {
                    runSandboxUpload();
                } else {
                    runCompression();
                }
            } else {
                toast.error(data.error || 'Invalid OTP');
            }
        } catch (err: any) {
            console.error('OTP Verify error', err);
            toast.error('Failed to verify OTP.');
        } finally {
            setIsVerifyingOtp(false);
        }
    };

    const runCompression = async () => {
        const imagesToProcess = discoveredImages.filter(img => selectedUrls.has(img.url));
        if (imagesToProcess.length === 0) return;
        
        setIsCompressing(true);
        setProgress({ done: 0, total: imagesToProcess.length });
        setResults([]);
        
        const toastId = toast.loading('Compressing images...');
        let successCount = 0;
        let failCount = 0;
        
        const urlReplacements = new Map<string, string>();

        for (let i = 0; i < imagesToProcess.length; i++) {
            const img = imagesToProcess[i];
            
            try {
                const API_BASE = import.meta.env.VITE_API_URL || '';
                const proxyUrl = `${API_BASE}/api/img-proxy?url=${encodeURIComponent(img.url)}`;
                const res = await fetch(proxyUrl);
                if (!res.ok) throw new Error(`Failed to fetch via proxy (${res.status})`);
                const blob = await res.blob();
                
                const filename = img.url.split('/').pop() || 'image.jpg';
                const file = new File([blob], filename, { type: blob.type });

                const newUrl = await uploadToImgBB(file);
                
                // Fetch the new size to display it
                try {
                    const newRes = await fetch(`${API_BASE}/api/img-proxy?url=${encodeURIComponent(newUrl)}`, { method: 'HEAD' });
                    const newSize = newRes.headers.get('content-length');
                    if (newSize) {
                        setNewImageSizes(prev => ({ ...prev, [img.url]: parseInt(newSize, 10) }));
                    }
                } catch (e) {
                    // Ignore
                }

                urlReplacements.set(img.url, newUrl);
                successCount++;
                results.push({ url: img.url, newUrl }); // modify array in place to avoid lag
            } catch (err: any) {
                console.error(`Error compressing ${img.url}:`, err);
                failCount++;
                results.push({ url: img.url, error: err.message });
            }
            
            setProgress({ done: i + 1, total: imagesToProcess.length });
            setResults([...results]);
        }
        
        // Update all affected sections
        if (urlReplacements.size > 0) {
            toast.loading('Applying new image URLs to database...', { id: toastId });
            
            const sectionsToUpdate = new Map<string, { section: string, lang: string }>();
            
            for (const img of discoveredImages) {
                if (urlReplacements.has(img.url)) {
                    for (const s of img.sections) {
                        sectionsToUpdate.set(`${s.lang}-${s.section}`, s);
                    }
                }
            }
            
            for (const s of Array.from(sectionsToUpdate.values())) {
                const langData = content[s.lang as 'en' | 'bn'];
                const sectionData = langData[s.section];
                
                if (sectionData) {
                    let jsonStr = JSON.stringify(sectionData);
                    for (const [oldUrl, newUrl] of urlReplacements.entries()) {
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

    const handleSandboxFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setSandboxFile(file);
        setSandboxPreview(URL.createObjectURL(file));
        setSandboxCompressedBlob(null);
        setSandboxResultUrl(null);
    };

    const handleSandboxCompress = async () => {
        if (!sandboxFile) return;
        setSandboxCompressing(true);
        try {
            const options = {
                maxSizeMB: 0.15, // 150KB target
                maxWidthOrHeight: 1920,
                useWebWorker: true,
                fileType: 'image/webp'
            };
            const compressed = await imageCompression(sandboxFile, options);
            setSandboxCompressedBlob(compressed);
            toast.success('Local compression successful!');
        } catch (error) {
            console.error(error);
            toast.error('Local compression failed.');
        } finally {
            setSandboxCompressing(false);
        }
    };

    const runSandboxUpload = async () => {
        if (!sandboxFile || !sandboxCompressedBlob) return;
        const toastId = toast.loading('Uploading to ImgBB...');
        try {
            const fileToUpload = new File([sandboxCompressedBlob], sandboxFile.name.replace(/\.[^/.]+$/, ".webp"), {
                type: 'image/webp',
            });
            
            const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY;
            const formData = new FormData();
            formData.append('image', fileToUpload);

            const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) throw new Error('ImgBB upload failed');
            const data = await res.json();
            setSandboxResultUrl(data.data.url);
            toast.success('Sandbox test upload successful!', { id: toastId });
        } catch (error) {
            console.error(error);
            toast.error('Sandbox upload failed', { id: toastId });
        }
    };

    const totalCompressed = discoveredImages.filter(img => img.isCompressed).length;

    return (
        <div className="space-y-8 relative">
            {showOtpModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                    <div className="bg-card border border-border p-6 rounded-2xl shadow-2xl w-full max-w-sm relative">
                        <button 
                            onClick={() => setShowOtpModal(false)}
                            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center">
                                <Lock className="w-6 h-6 text-blue-500" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold">Verification Required</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {isSendingOtp ? 'Sending OTP to your email...' : 'Enter the 6-digit OTP sent to your email to proceed.'}
                                </p>
                            </div>
                            <input 
                                type="text"
                                maxLength={6}
                                placeholder="000000"
                                value={otpInput}
                                onChange={(e) => setOtpInput(e.target.value)}
                                className="w-full text-center text-2xl tracking-widest font-mono p-3 bg-secondary border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                disabled={isSendingOtp || isVerifyingOtp}
                            />
                            <button
                                onClick={handleVerifyOtp}
                                disabled={isSendingOtp || isVerifyingOtp || otpInput.length < 6}
                                className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 flex justify-center items-center gap-2 transition-colors"
                            >
                                {isVerifyingOtp ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</> : 'Verify & Compress'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <SectionHeader
                title="Bulk Image Optimizer"
                description="Scan and compress all existing images in your database to improve website loading speed."
            />

            {/* Test Sandbox Section */}
            <div className="bg-card rounded-xl border border-border p-6 shadow-sm mb-8">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-500" /> Image Compression Sandbox
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                    Upload a file from your computer to test the compression algorithm (target 150KB) and the OTP verification flow without affecting live data.
                </p>
                <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1 space-y-4">
                        <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleSandboxFileChange}
                            className="block w-full text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                        />
                        {sandboxFile && (
                            <div className="text-sm bg-secondary p-3 rounded-lg border border-border">
                                <p><strong>Original Size:</strong> {formatSize(sandboxFile.size)}</p>
                                {sandboxCompressedBlob && (
                                    <p className="text-emerald-500 font-medium mt-1">
                                        <strong>Compressed Size:</strong> {formatSize(sandboxCompressedBlob.size)}
                                    </p>
                                )}
                            </div>
                        )}
                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={handleSandboxCompress}
                                disabled={!sandboxFile || sandboxCompressing}
                                className="px-4 py-2 bg-blue-500/10 text-blue-600 rounded-lg text-sm font-semibold hover:bg-blue-500/20 transition disabled:opacity-50"
                            >
                                {sandboxCompressing ? 'Compressing...' : '1. Test Local Compression'}
                            </button>
                            <button
                                onClick={triggerSandboxOTP}
                                disabled={!sandboxCompressedBlob}
                                className="px-4 py-2 bg-emerald-500/10 text-emerald-600 rounded-lg text-sm font-semibold hover:bg-emerald-500/20 transition disabled:opacity-50"
                            >
                                2. Test OTP & Upload
                            </button>
                        </div>
                        {sandboxResultUrl && (
                            <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                                <p className="text-sm text-emerald-600 font-semibold mb-1">Upload Successful!</p>
                                <a href={sandboxResultUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline break-all">
                                    {sandboxResultUrl}
                                </a>
                            </div>
                        )}
                    </div>
                    {sandboxPreview && (
                        <div className="w-full md:w-64 flex-shrink-0">
                            <img 
                                src={sandboxCompressedBlob ? URL.createObjectURL(sandboxCompressedBlob) : sandboxPreview} 
                                alt="Sandbox Preview" 
                                className="w-full h-auto max-h-48 object-cover rounded-xl border border-border" 
                            />
                            <p className="text-center text-xs text-muted-foreground mt-2">
                                {sandboxCompressedBlob ? 'Compressed Preview' : 'Original Preview'}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
                <div className="flex flex-col md:flex-row items-start gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center flex-shrink-0 border border-blue-500/20">
                        <ImageIcon className="w-8 h-8 text-blue-500" />
                    </div>
                    <div className="flex-1 space-y-5">
                        <div>
                            <div className="flex flex-wrap items-center gap-3">
                                <h3 className="font-semibold text-foreground text-xl flex items-center gap-2">
                                    Found {discoveredImages.length} Images 
                                    <span className="text-sm font-normal text-muted-foreground bg-secondary px-2 py-0.5 rounded-full border border-border ml-2">{selectedUrls.size} selected</span>
                                </h3>
                                <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm font-semibold flex items-center gap-1.5">
                                    <CheckCircle2 className="w-4 h-4" /> Total Compressed: {totalCompressed}
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                                These images are automatically segmented by category. Use the selection tools below to choose which ones to compress.
                            </p>
                        </div>

                        {/* Controls */}
                        <div className="flex flex-wrap gap-2 pt-2">
                            <button onClick={selectAll} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-foreground text-xs font-medium hover:bg-secondary/80 border border-border transition-colors">
                                <CheckSquare className="w-3.5 h-3.5" /> Select All
                            </button>
                            <button onClick={deselectAll} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-foreground text-xs font-medium hover:bg-secondary/80 border border-border transition-colors">
                                <Square className="w-3.5 h-3.5" /> Deselect All
                            </button>
                            <div className="w-px h-6 bg-border mx-1 my-auto hidden sm:block"></div>
                            <button onClick={selectUncompressed} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-500 text-xs font-medium hover:bg-blue-500/20 border border-blue-500/20 transition-colors">
                                Select Uncompressed
                            </button>
                            <button onClick={selectCompressed} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 text-xs font-medium hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors">
                                Select Compressed
                            </button>
                            <button onClick={fetchSizes} disabled={fetchingSizes} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-foreground text-xs font-medium hover:bg-secondary/80 border border-border transition-colors disabled:opacity-50 ml-auto">
                                <RefreshCcw className={`w-3.5 h-3.5 ${fetchingSizes ? 'animate-spin' : ''}`} /> {fetchingSizes ? 'Fetching...' : 'Refresh Sizes'}
                            </button>
                        </div>

                        {discoveredImages.length > 0 && (
                            <div className="pt-2 border-t border-border/50">
                                <button
                                    onClick={triggerCompression}
                                    disabled={isCompressing || selectedUrls.size === 0}
                                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm bg-blue-600 text-white hover:bg-blue-700 transition-colors cursor-pointer shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isCompressing ? (
                                        <><Loader2 className="w-4 h-4 animate-spin" /> Compressing... {progress.done}/{progress.total}</>
                                    ) : (
                                        <><Zap className="w-4 h-4" /> Compress {selectedUrls.size} Selected Images</>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Segmented Results Accordion */}
            <div className="space-y-4">
                {Object.entries(segments).map(([secName, subItems], idx) => {
                    const isExpanded = expandedSegments.has(secName) || idx === 0; // expand first by default
                    
                    // count total images in this section
                    let totalSecImages = 0;
                    Object.values(subItems).forEach(imgs => totalSecImages += imgs.length);

                    return (
                        <div key={secName} className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
                            <button 
                                onClick={() => toggleSegment(secName)}
                                className="w-full flex items-center justify-between p-4 bg-secondary/30 hover:bg-secondary/50 transition-colors border-b border-border/50"
                            >
                                <div className="flex items-center gap-3">
                                    <Layers className="w-4.5 h-4.5 text-primary" />
                                    <h4 className="font-bold text-foreground text-sm tracking-wide">{secName}</h4>
                                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">{totalSecImages} images</span>
                                </div>
                                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                            </button>

                            {isExpanded && (
                                <div className="divide-y divide-border/50">
                                    {Object.entries(subItems).map(([subName, imgs]) => (
                                        <div key={subName} className="p-4 bg-background/50">
                                            <h5 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 ml-1">{subName}</h5>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {imgs.map((img, i) => {
                                                    const result = results.find(r => r.url === img.url);
                                                    const isSelected = selectedUrls.has(img.url);
                                                    const sizeBytes = imageSizes[img.url];
                                                    
                                                    return (
                                                        <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${isSelected ? 'border-primary/30 bg-primary/5' : 'border-border/50 bg-secondary/20 hover:border-border hover:bg-secondary/40'}`}>
                                                            <div className="pt-1">
                                                                <input 
                                                                    type="checkbox" 
                                                                    className="w-4 h-4 rounded border-border bg-background text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                                    checked={isSelected}
                                                                    onChange={(e) => {
                                                                        const newSet = new Set(selectedUrls);
                                                                        if (e.target.checked) newSet.add(img.url);
                                                                        else newSet.delete(img.url);
                                                                        setSelectedUrls(newSet);
                                                                    }}
                                                                    disabled={isCompressing || (result && result.newUrl ? true : false)}
                                                                />
                                                            </div>
                                                            <div className="w-16 h-16 rounded-lg overflow-hidden border border-border/50 flex-shrink-0 bg-background">
                                                                <img src={img.url} alt="Preview" className="w-full h-full object-cover" loading="lazy" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <span className="text-xs font-black text-primary bg-primary/10 px-1.5 py-0.5 rounded-md border border-primary/20">#{img.serialNumber}</span>
                                                                    <p className="text-xs font-medium text-foreground truncate" title={img.url}>{img.url}</p>
                                                                </div>
                                                                
                                                                <div className="flex flex-wrap gap-1.5 mt-2 items-center">
                                                                    <span className="text-[10px] bg-secondary text-muted-foreground px-2 py-0.5 rounded-full font-medium border border-border/50">
                                                                        Original: {formatSize(sizeBytes)}
                                                                    </span>
                                                                    {newImageSizes[img.url] && (
                                                                        <span className="text-[10px] bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full font-bold border border-emerald-500/20 flex items-center gap-1">
                                                                            <CheckCircle2 className="w-3 h-3" />
                                                                            New: {formatSize(newImageSizes[img.url])}
                                                                        </span>
                                                                    )}
                                                                    {img.isCompressed && !result?.newUrl && (
                                                                        <span className="text-[10px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">
                                                                            Already Compressed (WebP)
                                                                        </span>
                                                                    )}
                                                                    {!img.isCompressed && !result?.newUrl && (
                                                                        <span className="text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded-full font-medium">
                                                                            Uncompressed
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                
                                                                {/* Status */}
                                                                {result && (
                                                                    <div className="mt-2 text-xs">
                                                                        {result.newUrl ? (
                                                                            <span className="text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-md flex items-center gap-1 font-medium w-max max-w-full">
                                                                                <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" /> 
                                                                                <span className="truncate">Compressed successfully</span>
                                                                            </span>
                                                                        ) : (
                                                                            <span className="text-red-500 bg-red-500/10 px-2 py-1 rounded-md inline-block font-medium">Failed: {result.error}</span>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
