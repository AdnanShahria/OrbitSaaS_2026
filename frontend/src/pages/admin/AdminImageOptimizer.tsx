import { useState, useMemo, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useContent } from '@/contexts/ContentContext';
import {
    ImageIcon, Zap, Loader2, CheckCircle2, ChevronDown, CheckSquare,
    Square, RefreshCcw, Layers, Lock, X, LayoutDashboard, Library,
    FlaskConical, GitMerge, Search, Grid3X3, List, ExternalLink,
    AlertCircle, Cloud, ArrowRightLeft, TrendingDown, Database,
    ShieldCheck, FolderOpen, Eye, HardDriveDownload
} from 'lucide-react';
import { uploadImage } from '@/lib/imageUpload';
import imageCompression from 'browser-image-compression';
import { getImageUrl, getFallbackUrl, serializeImageUrl, parseImageUrl } from '@/lib/imageUrl';

// ─── Regex ────────────────────────────────────────────────────────────────────
const BASE_URL_REGEX = `https?:\\/\\/[^\\s"'<>]+\\.(?:jpg|jpeg|png|webp|gif)(?:\\?[^\\s"'<>]+)?|https?:\\/\\/i\\.ibb\\.co\\/[^\\s"'<>]+`;
const URL_REGEX = new RegExp(`(?:${BASE_URL_REGEX})(?:\\|\\|\\|(?:${BASE_URL_REGEX}))?`, 'g');

// ─── Types ────────────────────────────────────────────────────────────────────
type StorageType = 'ImgBB' | 'R2' | 'Dual' | 'Unknown';
type TabId = 'dashboard' | 'library' | 'backup' | 'lab';
type ViewMode = 'grid' | 'list';
type FilterType = 'all' | 'imgbb' | 'r2' | 'dual' | 'uncompressed' | 'compressed';

interface ImageSectionPath { section: string; lang: string; title?: string; }

interface DiscoveredImage {
    url: string;
    sections: ImageSectionPath[];
    isCompressed: boolean;
    serialNumber?: number;
    storageType: StorageType;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function detectStorageType(key: string): StorageType {
    if (key.includes('|||') || key.startsWith('{"primary"')) return 'Dual';
    if (key.includes('/api/r2/image/')) return 'R2';
    if (key.includes('i.ibb.co') || key.includes('imgbb.com')) return 'ImgBB';
    return 'Unknown';
}

// ─── Storage Badge Component ──────────────────────────────────────────────────
function StorageBadge({ type, small = false }: { type: StorageType; small?: boolean }) {
    const base = `inline-flex items-center gap-1 rounded-full font-semibold border ${small ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1'}`;
    if (type === 'ImgBB') return <span className={`${base} bg-pink-500/10 text-pink-400 border-pink-500/20`}><ImageIcon className={small ? 'w-2.5 h-2.5' : 'w-3 h-3'} />ImgBB</span>;
    if (type === 'R2') return <span className={`${base} bg-orange-500/10 text-orange-400 border-orange-500/20`}><Cloud className={small ? 'w-2.5 h-2.5' : 'w-3 h-3'} />R2</span>;
    if (type === 'Dual') return <span className={`${base} bg-violet-500/10 text-violet-400 border-violet-500/20`}><ShieldCheck className={small ? 'w-2.5 h-2.5' : 'w-3 h-3'} />R2 + ImgBB</span>;
    return <span className={`${base} bg-secondary text-muted-foreground border-border`}><AlertCircle className={small ? 'w-2.5 h-2.5' : 'w-3 h-3'} />Unknown</span>;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminImageOptimizer() {
    const { content, updateSection, refreshContent } = useContent();

    // ── Core state ──
    const [activeTab, setActiveTab] = useState<TabId>('dashboard');
    const [imageSizes, setImageSizes] = useState<Record<string, number>>({});
    const [newImageSizes, setNewImageSizes] = useState<Record<string, number>>({});
    const [fetchingSizes, setFetchingSizes] = useState(false);
    const [hasLoadedImages, setHasLoadedImages] = useState(false);

    // ── Library state ──
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<FilterType>('all');
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
    const [lightboxImage, setLightboxImage] = useState<DiscoveredImage | null>(null);

    // ── Backup state ──
    const [isCompressing, setIsCompressing] = useState(false);
    const [progress, setProgress] = useState({ done: 0, total: 0 });
    const [results, setResults] = useState<{ url: string; newUrl?: string; error?: string }[]>([]);
    const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());
    const [expandedSegments, setExpandedSegments] = useState<Set<string>>(new Set());

    // ── OTP state ──
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [otpInput, setOtpInput] = useState('');
    const [isSendingOtp, setIsSendingOtp] = useState(false);
    const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
    const [isSandboxFlow, setIsSandboxFlow] = useState(false);

    // ── Lab state ──
    const [sandboxFile, setSandboxFile] = useState<File | null>(null);
    const [sandboxPreview, setSandboxPreview] = useState<string | null>(null);
    const [sandboxCompressedBlob, setSandboxCompressedBlob] = useState<Blob | null>(null);
    const [sandboxCompressing, setSandboxCompressing] = useState(false);
    const [sandboxResultUrl, setSandboxResultUrl] = useState<any | null>(null);

    // ─── Image Scanner ────────────────────────────────────────────────────────
    const discoveredImages = useMemo(() => {
        const imageMap = new Map<string, DiscoveredImage>();

        const scanLang = (langData: Record<string, any>, lang: string) => {
            for (const [sectionKey, sectionData] of Object.entries(langData)) {
                if (!sectionData) continue;
                const registerUrl = (rawUrl: string, sectionTitle?: string) => {
                    let displayUrl = rawUrl;
                    try {
                        const parsed = JSON.parse(rawUrl);
                        if (parsed && typeof parsed === 'object' && parsed.primary) displayUrl = parsed.primary;
                    } catch { /* not JSON */ }
                    displayUrl = displayUrl.replace(/["']$/, '').replace(/\]$/, '');
                    if (!displayUrl || displayUrl.endsWith('.svg')) return;
                    const key = rawUrl.replace(/["']$/, '').replace(/\]$/, '');
                    const isCompressed = displayUrl.toLowerCase().includes('.webp') || key.includes('|||') || key.startsWith('{"primary"');
                    const storageType = detectStorageType(key);
                    if (!imageMap.has(key)) imageMap.set(key, { url: key, sections: [], isCompressed, storageType });
                    const img = imageMap.get(key)!;
                    const path = { section: sectionKey, lang, ...(sectionTitle ? { title: sectionTitle } : {}) };
                    if (!img.sections.some(s => s.section === path.section && s.lang === path.lang && s.title === path.title)) img.sections.push(path);
                };
                if (sectionData.items && Array.isArray(sectionData.items)) {
                    sectionData.items.forEach((item: any, idx: number) => {
                        const itemTitle = item.en?.title || item.title || item.name || `Item #${idx + 1}`;
                        const jsonStr = JSON.stringify(item);
                        (jsonStr.match(URL_REGEX) || []).forEach(url => registerUrl(url, itemTitle));
                    });
                    const { items, ...rest } = sectionData;
                    (JSON.stringify(rest).match(URL_REGEX) || []).forEach(url => registerUrl(url, 'Section Settings'));
                } else {
                    (JSON.stringify(sectionData).match(URL_REGEX) || []).forEach(url => registerUrl(url));
                }
            }
        };

        if (content?.en) scanLang(content.en, 'en');
        if (content?.bn) scanLang(content.bn, 'bn');

        const images = Array.from(imageMap.values());
        images.forEach((img, index) => { img.serialNumber = index + 1; });

        const initialSelected = new Set<string>();
        images.forEach(img => { if (!img.isCompressed) initialSelected.add(img.url); });
        setSelectedUrls(initialSelected);
        return images;
    }, [content]);

    // ─── Segments for backup tab ──────────────────────────────────────────────
    const segments = useMemo(() => {
        const map: Record<string, Record<string, DiscoveredImage[]>> = {};
        discoveredImages.forEach(img => {
            const primarySection = img.sections[0];
            const secName = primarySection ? primarySection.section.toUpperCase() : 'OTHER';
            const subName = primarySection?.title ?? 'General Settings';
            if (!map[secName]) map[secName] = {};
            if (!map[secName][subName]) map[secName][subName] = [];
            map[secName][subName].push(img);
        });
        return map;
    }, [discoveredImages]);

    // ─── Dashboard stats ──────────────────────────────────────────────────────
    const stats = useMemo(() => {
        const total = discoveredImages.length;
        const r2Count = discoveredImages.filter(i => i.storageType === 'R2').length;
        const imgbbCount = discoveredImages.filter(i => i.storageType === 'ImgBB').length;
        const dualCount = discoveredImages.filter(i => i.storageType === 'Dual').length;
        const unknownCount = discoveredImages.filter(i => i.storageType === 'Unknown').length;
        const compressedCount = discoveredImages.filter(i => i.isCompressed).length;
        const healthScore = total > 0 ? Math.round(((r2Count + dualCount) / total) * 100) : 0;
        const totalOriginalBytes = Object.values(imageSizes).reduce((a, b) => a + b, 0);
        const totalNewBytes = Object.values(newImageSizes).reduce((a, b) => a + b, 0);
        const savedBytes = totalOriginalBytes - totalNewBytes;
        return { total, r2Count, imgbbCount, dualCount, unknownCount, compressedCount, healthScore, totalOriginalBytes, savedBytes };
    }, [discoveredImages, imageSizes, newImageSizes]);

    // ─── Library filtered images ──────────────────────────────────────────────
    const filteredLibraryImages = useMemo(() => {
        return discoveredImages.filter(img => {
            const matchesSearch = !searchQuery ||
                img.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
                img.sections.some(s => s.section.toLowerCase().includes(searchQuery.toLowerCase()) || (s.title || '').toLowerCase().includes(searchQuery.toLowerCase()));
            const matchesFilter = filterType === 'all' ||
                (filterType === 'imgbb' && img.storageType === 'ImgBB') ||
                (filterType === 'r2' && img.storageType === 'R2') ||
                (filterType === 'dual' && img.storageType === 'Dual') ||
                (filterType === 'uncompressed' && !img.isCompressed) ||
                (filterType === 'compressed' && img.isCompressed);
            return matchesSearch && matchesFilter;
        });
    }, [discoveredImages, searchQuery, filterType]);

    // ─── Size Fetching ────────────────────────────────────────────────────────
    const fetchSizes = async () => {
        setFetchingSizes(true);
        const API_BASE = import.meta.env.VITE_API_URL || '';
        const batchSize = 5;
        for (let i = 0; i < discoveredImages.length; i += batchSize) {
            const batch = discoveredImages.slice(i, i + batchSize);
            await Promise.all(batch.map(async (img) => {
                if (imageSizes[img.url]) return;
                try {
                    const primaryUrl = getImageUrl(img.url);
                    const res = await fetch(`${API_BASE}/api/img-proxy?url=${encodeURIComponent(primaryUrl)}`, { method: 'HEAD' });
                    const size = res.headers.get('content-length');
                    if (size) setImageSizes(prev => ({ ...prev, [img.url]: parseInt(size, 10) }));
                } catch { /* ignore */ }
            }));
            await new Promise(r => setTimeout(r, 200));
        }
        setFetchingSizes(false);
    };

    useEffect(() => {
        if (hasLoadedImages && discoveredImages.length > 0 && Object.keys(imageSizes).length === 0 && !fetchingSizes) fetchSizes();
    }, [discoveredImages, hasLoadedImages, fetchingSizes]); // eslint-disable-line

    // ─── Format helpers ───────────────────────────────────────────────────────
    const formatSize = (bytes?: number) => {
        if (bytes === undefined || bytes === null) return '—';
        if (bytes === 0) return '0 B';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    };

    // ─── Backup: Selection Controls ───────────────────────────────────────────
    const selectAll = () => setSelectedUrls(new Set(discoveredImages.map(i => i.url)));
    const deselectAll = () => setSelectedUrls(new Set());
    const selectByStorage = (type: StorageType) => setSelectedUrls(new Set(discoveredImages.filter(i => i.storageType === type).map(i => i.url)));
    const selectUncompressed = () => setSelectedUrls(new Set(discoveredImages.filter(i => !i.isCompressed).map(i => i.url)));

    const toggleSegment = (secName: string) => {
        setExpandedSegments(prev => {
            const next = new Set(prev);
            if (next.has(secName)) next.delete(secName); else next.add(secName);
            return next;
        });
    };

    // ─── OTP Logic ────────────────────────────────────────────────────────────
    const sendOtp = async () => {
        const token = localStorage.getItem('admin_token');
        const API_BASE = import.meta.env.VITE_API_URL || '';
        const res = await fetch(`${API_BASE}/api/otp?action=send`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || 'Failed to send OTP'); }
    };

    const triggerBackupOtp = async () => {
        if (selectedUrls.size === 0) return;
        setIsSandboxFlow(false);
        setShowOtpModal(true);
        setIsSendingOtp(true);
        try { await sendOtp(); toast.success('OTP sent to your email.'); }
        catch (err: any) { toast.error(err.message || 'Failed to send OTP.'); setShowOtpModal(false); }
        finally { setIsSendingOtp(false); }
    };

    const triggerSandboxOTP = async () => {
        if (!sandboxCompressedBlob) return;
        setIsSandboxFlow(true);
        setShowOtpModal(true);
        setIsSendingOtp(true);
        try { await sendOtp(); toast.success('OTP sent to your email.'); }
        catch (err: any) { toast.error(err.message || 'Failed to send OTP.'); setShowOtpModal(false); }
        finally { setIsSendingOtp(false); }
    };

    const handleVerifyOtp = async () => {
        if (!otpInput) { toast.error('Please enter the OTP.'); return; }
        setIsVerifyingOtp(true);
        try {
            const token = localStorage.getItem('admin_token');
            const API_BASE = import.meta.env.VITE_API_URL || '';
            const res = await fetch(`${API_BASE}/api/otp?action=verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ code: otpInput })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                toast.success('OTP verified!');
                setShowOtpModal(false);
                setOtpInput('');
                if (isSandboxFlow) runSandboxUpload(); else runCompression();
            } else { toast.error(data.error || 'Invalid OTP'); }
        } catch { toast.error('Failed to verify OTP.'); }
        finally { setIsVerifyingOtp(false); }
    };

    // ─── Compression / Backup Process ─────────────────────────────────────────
    const runCompression = async () => {
        const imagesToProcess = discoveredImages.filter(img => selectedUrls.has(img.url));
        if (imagesToProcess.length === 0) return;
        setIsCompressing(true);
        setProgress({ done: 0, total: imagesToProcess.length });
        setResults([]);
        const toastId = toast.loading('Backing up images to R2...');
        let successCount = 0, failCount = 0;
        const urlReplacements = new Map<string, string>();
        const localResults: typeof results = [];

        for (let i = 0; i < imagesToProcess.length; i++) {
            const img = imagesToProcess[i];
            const primaryUrl = getImageUrl(img.url);
            try {
                const API_BASE = import.meta.env.VITE_API_URL || '';
                const res = await fetch(`${API_BASE}/api/img-proxy?url=${encodeURIComponent(primaryUrl)}`);
                if (!res.ok) throw new Error(`Proxy fetch failed (${res.status})`);
                const blob = await res.blob();
                const filename = primaryUrl.split('/').pop() || 'image.jpg';
                const file = new File([blob], filename, { type: blob.type });
                const folder = img.sections[0]?.section || 'uploads';
                const newImageUrl = await uploadImage(file, folder);
                const newUrlSerialized = serializeImageUrl(newImageUrl);
                try {
                    const newPrimary = getImageUrl(newImageUrl);
                    const newRes = await fetch(`${API_BASE}/api/img-proxy?url=${encodeURIComponent(newPrimary)}`, { method: 'HEAD' });
                    const newSize = newRes.headers.get('content-length');
                    if (newSize) setNewImageSizes(prev => ({ ...prev, [img.url]: parseInt(newSize, 10) }));
                } catch { /* ignore size fetch */ }
                urlReplacements.set(img.url, newUrlSerialized);
                successCount++;
                localResults.push({ url: img.url, newUrl: newUrlSerialized });
            } catch (err: any) {
                failCount++;
                localResults.push({ url: img.url, error: err.message });
            }
            setProgress({ done: i + 1, total: imagesToProcess.length });
            setResults([...localResults]);
        }

        if (urlReplacements.size > 0) {
            toast.loading('Saving to database...', { id: toastId });
            const sectionsToUpdate = new Map<string, { section: string, lang: string }>();
            for (const img of discoveredImages) {
                if (urlReplacements.has(img.url)) for (const s of img.sections) sectionsToUpdate.set(`${s.lang}-${s.section}`, s);
            }
            for (const s of Array.from(sectionsToUpdate.values())) {
                const sectionData = content[s.lang as 'en' | 'bn']?.[s.section];
                if (sectionData) {
                    let jsonStr = JSON.stringify(sectionData);
                    for (const [oldUrl, newUrlStr] of urlReplacements.entries()) {
                        const escaped = oldUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                        jsonStr = jsonStr.replace(new RegExp(escaped, 'g'), newUrlStr);
                    }
                    await updateSection(s.section, s.lang, JSON.parse(jsonStr));
                }
            }
            await refreshContent();
            toast.success(`Done! ${successCount} backed up, ${failCount} failed.`, { id: toastId });
        } else {
            toast.error('No images were successfully backed up.', { id: toastId });
        }
        setIsCompressing(false);
    };

    // ─── Lab: Sandbox ─────────────────────────────────────────────────────────
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
            const compressed = await imageCompression(sandboxFile, { maxSizeMB: 0.15, maxWidthOrHeight: 1920, useWebWorker: true, fileType: 'image/webp' });
            setSandboxCompressedBlob(compressed);
            toast.success('Compression successful!');
        } catch { toast.error('Compression failed.'); }
        finally { setSandboxCompressing(false); }
    };

    const runSandboxUpload = async () => {
        if (!sandboxFile || !sandboxCompressedBlob) return;
        const toastId = toast.loading('Uploading to Cloudflare R2...');
        try {
            const fileToUpload = new File([sandboxCompressedBlob], sandboxFile.name.replace(/\.[^/.]+$/, '.webp'), { type: 'image/webp' });
            const newUrl = await uploadImage(fileToUpload, 'sandbox');
            setSandboxResultUrl(newUrl);
            toast.success('Sandbox upload successful!', { id: toastId });
        } catch { toast.error('Sandbox upload failed.', { id: toastId }); }
    };

    // ─── Tab Config ───────────────────────────────────────────────────────────
    const tabs: { id: TabId; label: string; icon: React.ReactNode; badge?: string }[] = [
        { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
        { id: 'library', label: 'Library', icon: <Library className="w-4 h-4" />, badge: String(discoveredImages.length) },
        { id: 'backup', label: 'Backup', icon: <HardDriveDownload className="w-4 h-4" />, badge: stats.imgbbCount > 0 ? String(stats.imgbbCount) : undefined },
        { id: 'lab', label: 'Lab', icon: <FlaskConical className="w-4 h-4" /> },
    ];

    // ─── Render: OTP Modal ────────────────────────────────────────────────────
    const renderOtpModal = () => showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="bg-card border border-border p-6 rounded-2xl shadow-2xl w-full max-w-sm relative">
                <button onClick={() => setShowOtpModal(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
                <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-12 h-12 bg-violet-500/10 rounded-full flex items-center justify-center border border-violet-500/20">
                        <Lock className="w-6 h-6 text-violet-400" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold">Verification Required</h3>
                        <p className="text-sm text-muted-foreground mt-1">{isSendingOtp ? 'Sending OTP to your email...' : 'Enter the 6-digit OTP sent to your email.'}</p>
                    </div>
                    <input type="text" maxLength={6} placeholder="000000" value={otpInput} onChange={(e) => setOtpInput(e.target.value)}
                        className="w-full text-center text-2xl tracking-widest font-mono p-3 bg-secondary border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                        disabled={isSendingOtp || isVerifyingOtp} />
                    <button onClick={handleVerifyOtp} disabled={isSendingOtp || isVerifyingOtp || otpInput.length < 6}
                        className="w-full py-3 bg-violet-600 text-white rounded-xl font-semibold hover:bg-violet-700 disabled:opacity-50 flex justify-center items-center gap-2 transition-colors">
                        {isVerifyingOtp ? <><Loader2 className="w-4 h-4 animate-spin" />Verifying...</> : 'Verify & Proceed'}
                    </button>
                </div>
            </div>
        </div>
    );

    // ─── Render: Dashboard Tab ────────────────────────────────────────────────
    const renderDashboard = () => {
        const healthColor = stats.healthScore >= 80 ? 'text-emerald-400' : stats.healthScore >= 50 ? 'text-amber-400' : 'text-red-400';
        return (
            <div className="space-y-6">
                {/* Health Banner */}
                <div className="relative overflow-hidden bg-gradient-to-br from-violet-600/20 via-card to-blue-600/10 border border-violet-500/20 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6">
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 to-transparent pointer-events-none" />
                    {/* Ring */}
                    <div className="relative flex-shrink-0 w-32 h-32">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="8" className="text-border" />
                            <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="8"
                                strokeDasharray={`${2 * Math.PI * 40}`}
                                strokeDashoffset={`${2 * Math.PI * 40 * (1 - stats.healthScore / 100)}`}
                                strokeLinecap="round"
                                className={stats.healthScore >= 80 ? 'text-emerald-400' : stats.healthScore >= 50 ? 'text-amber-400' : 'text-red-400'}
                                style={{ transition: 'stroke-dashoffset 1s ease' }} />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className={`text-2xl font-black ${healthColor}`}>{stats.healthScore}%</span>
                            <span className="text-[10px] text-muted-foreground font-medium">R2 Health</span>
                        </div>
                    </div>
                    {/* Summary */}
                    <div className="flex-1 space-y-2 text-center md:text-left">
                        <h2 className="text-xl font-bold text-foreground">Storage Health Overview</h2>
                        <p className="text-sm text-muted-foreground">
                            {stats.healthScore >= 80 ? '✅ Excellent! Most images are securely backed up on Cloudflare R2 edge storage.' :
                             stats.healthScore >= 50 ? '⚠️ Good progress. Backup remaining ImgBB images for best reliability.' :
                             '🚨 Many images still only on ImgBB. Run a backup to safeguard and speed up your site.'}
                        </p>
                        <div className="flex flex-wrap gap-2 justify-center md:justify-start mt-3">
                            <button onClick={() => { setHasLoadedImages(true); setActiveTab('backup'); selectByStorage('ImgBB'); }}
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-violet-600 text-white text-xs font-semibold rounded-lg hover:bg-violet-700 transition-colors">
                                <HardDriveDownload className="w-3.5 h-3.5" /> Backup ImgBB Images
                            </button>
                            <button onClick={() => { setHasLoadedImages(true); fetchSizes(); }} disabled={fetchingSizes}
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-secondary border border-border text-foreground text-xs font-semibold rounded-lg hover:bg-secondary/80 transition-colors disabled:opacity-50">
                                <RefreshCcw className={`w-3.5 h-3.5 ${fetchingSizes ? 'animate-spin' : ''}`} /> {fetchingSizes ? 'Fetching...' : 'Refresh Sizes'}
                            </button>
                        </div>
                    </div>
                    {/* Health bar */}
                    <div className="hidden md:block w-px h-20 bg-border/50" />
                    <div className="flex flex-col gap-1.5 text-sm flex-shrink-0">
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-orange-400" /><span className="text-muted-foreground">R2 only:</span><span className="font-bold">{stats.r2Count}</span></div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-violet-400" /><span className="text-muted-foreground">R2 + ImgBB:</span><span className="font-bold">{stats.dualCount}</span></div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-pink-400" /><span className="text-muted-foreground">ImgBB only:</span><span className="font-bold">{stats.imgbbCount}</span></div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-muted-foreground" /><span className="text-muted-foreground">Unknown:</span><span className="font-bold">{stats.unknownCount}</span></div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Images', value: stats.total, icon: <ImageIcon className="w-5 h-5" />, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
                        { label: 'Backed up to R2', value: stats.r2Count + stats.dualCount, icon: <Cloud className="w-5 h-5" />, color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
                        { label: 'ImgBB Only', value: stats.imgbbCount, icon: <AlertCircle className="w-5 h-5" />, color: 'text-pink-400 bg-pink-500/10 border-pink-500/20' },
                        { label: 'Compressed', value: stats.compressedCount, icon: <TrendingDown className="w-5 h-5" />, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
                    ].map(card => (
                        <div key={card.label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${card.color}`}>{card.icon}</div>
                            <div>
                                <p className="text-2xl font-black text-foreground">{card.value}</p>
                                <p className="text-xs text-muted-foreground">{card.label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Storage Progress Bar */}
                <div className="bg-card border border-border rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2"><Database className="w-4 h-4 text-primary" />Storage Distribution</h3>
                    <div className="flex h-4 rounded-full overflow-hidden gap-0.5">
                        {stats.r2Count > 0 && <div className="bg-orange-400 transition-all" style={{ width: `${(stats.r2Count / stats.total) * 100}%` }} title={`R2: ${stats.r2Count}`} />}
                        {stats.dualCount > 0 && <div className="bg-violet-400 transition-all" style={{ width: `${(stats.dualCount / stats.total) * 100}%` }} title={`Dual: ${stats.dualCount}`} />}
                        {stats.imgbbCount > 0 && <div className="bg-pink-400 transition-all" style={{ width: `${(stats.imgbbCount / stats.total) * 100}%` }} title={`ImgBB: ${stats.imgbbCount}`} />}
                        {stats.unknownCount > 0 && <div className="bg-muted transition-all" style={{ width: `${(stats.unknownCount / stats.total) * 100}%` }} title={`Unknown: ${stats.unknownCount}`} />}
                    </div>
                    <div className="flex flex-wrap gap-4 mt-3 text-xs text-muted-foreground">
                        <span><span className="inline-block w-2.5 h-2.5 rounded-sm bg-orange-400 mr-1.5" />R2 ({stats.total > 0 ? Math.round(stats.r2Count / stats.total * 100) : 0}%)</span>
                        <span><span className="inline-block w-2.5 h-2.5 rounded-sm bg-violet-400 mr-1.5" />Dual ({stats.total > 0 ? Math.round(stats.dualCount / stats.total * 100) : 0}%)</span>
                        <span><span className="inline-block w-2.5 h-2.5 rounded-sm bg-pink-400 mr-1.5" />ImgBB ({stats.total > 0 ? Math.round(stats.imgbbCount / stats.total * 100) : 0}%)</span>
                    </div>
                </div>

                {/* Quick actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                        { label: 'Browse All Images', desc: 'View, search, and filter your media library', icon: <Library className="w-5 h-5" />, action: () => setActiveTab('library'), color: 'hover:border-blue-500/40 hover:bg-blue-500/5' },
                        { label: 'Run Image Backup', desc: `${stats.imgbbCount} images still on ImgBB`, icon: <HardDriveDownload className="w-5 h-5" />, action: () => { setHasLoadedImages(true); setActiveTab('backup'); }, color: 'hover:border-violet-500/40 hover:bg-violet-500/5' },
                        { label: 'Test Upload Lab', desc: 'Test compression & R2 upload pipeline', icon: <FlaskConical className="w-5 h-5" />, action: () => setActiveTab('lab'), color: 'hover:border-emerald-500/40 hover:bg-emerald-500/5' },
                    ].map(a => (
                        <button key={a.label} onClick={a.action} className={`bg-card border border-border rounded-xl p-4 text-left flex items-center gap-3 transition-all cursor-pointer ${a.color}`}>
                            <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0 text-primary">{a.icon}</div>
                            <div>
                                <p className="text-sm font-semibold text-foreground">{a.label}</p>
                                <p className="text-xs text-muted-foreground">{a.desc}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        );
    };

    // ─── Render: Library Tab ──────────────────────────────────────────────────
    const renderLibrary = () => {
        const filterButtons: { id: FilterType; label: string; count: number }[] = [
            { id: 'all', label: 'All', count: discoveredImages.length },
            { id: 'imgbb', label: 'ImgBB', count: stats.imgbbCount },
            { id: 'r2', label: 'R2', count: stats.r2Count },
            { id: 'dual', label: 'Dual', count: stats.dualCount },
            { id: 'compressed', label: 'Compressed', count: stats.compressedCount },
            { id: 'uncompressed', label: 'Uncompressed', count: discoveredImages.length - stats.compressedCount },
        ];
        return (
            <div className="space-y-4">
                {/* Toolbar */}
                <div className="flex flex-col md:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input type="text" placeholder="Search by URL, section name..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground" />
                        {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>}
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setViewMode('grid')} className={`p-2.5 rounded-lg border transition-colors ${viewMode === 'grid' ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary border-border text-muted-foreground hover:text-foreground'}`}><Grid3X3 className="w-4 h-4" /></button>
                        <button onClick={() => setViewMode('list')} className={`p-2.5 rounded-lg border transition-colors ${viewMode === 'list' ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary border-border text-muted-foreground hover:text-foreground'}`}><List className="w-4 h-4" /></button>
                    </div>
                </div>

                {/* Filter Pills */}
                <div className="flex flex-wrap gap-2">
                    {filterButtons.map(f => (
                        <button key={f.id} onClick={() => setFilterType(f.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${filterType === f.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary text-muted-foreground border-border hover:text-foreground hover:border-border/80'}`}>
                            {f.label} <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${filterType === f.id ? 'bg-white/20' : 'bg-border'}`}>{f.count}</span>
                        </button>
                    ))}
                    <span className="ml-auto text-xs text-muted-foreground self-center">{filteredLibraryImages.length} shown</span>
                </div>

                {/* Grid View */}
                {viewMode === 'grid' && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {filteredLibraryImages.map((img, i) => {
                            const primaryUrl = getImageUrl(img.url);
                            return (
                                <div key={i} className="group relative bg-card border border-border rounded-xl overflow-hidden hover:border-primary/40 transition-all cursor-pointer"
                                    onClick={() => { setLightboxUrl(primaryUrl); setLightboxImage(img); }}>
                                    <div className="aspect-square bg-secondary">
                                        <img src={primaryUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                                    </div>
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Eye className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="p-2 space-y-1">
                                        <StorageBadge type={img.storageType} small />
                                        <p className="text-[10px] text-muted-foreground truncate">{img.sections[0]?.section?.toUpperCase()}</p>
                                        {imageSizes[img.url] && <p className="text-[10px] text-muted-foreground">{formatSize(imageSizes[img.url])}</p>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* List View */}
                {viewMode === 'list' && (
                    <div className="space-y-2">
                        {filteredLibraryImages.map((img, i) => {
                            const primaryUrl = getImageUrl(img.url);
                            const fallback = getFallbackUrl(img.url);
                            return (
                                <div key={i} className="bg-card border border-border rounded-xl p-3 flex items-center gap-3 hover:border-primary/30 transition-colors">
                                    <div className="w-12 h-12 rounded-lg overflow-hidden border border-border/50 flex-shrink-0 bg-secondary cursor-pointer"
                                        onClick={() => { setLightboxUrl(primaryUrl); setLightboxImage(img); }}>
                                        <img src={primaryUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-black text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">#{img.serialNumber}</span>
                                            <StorageBadge type={img.storageType} small />
                                            {img.isCompressed && <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">WebP</span>}
                                        </div>
                                        <p className="text-xs text-muted-foreground truncate" title={primaryUrl}>{primaryUrl}</p>
                                        {fallback && <p className="text-[10px] text-muted-foreground/50 truncate mt-0.5">Fallback: {fallback}</p>}
                                    </div>
                                    <div className="flex-shrink-0 text-right space-y-1">
                                        <p className="text-xs text-muted-foreground">{formatSize(imageSizes[img.url])}</p>
                                        <p className="text-[10px] text-muted-foreground">{img.sections[0]?.section?.toUpperCase()}</p>
                                    </div>
                                    <a href={primaryUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground flex-shrink-0 ml-1">
                                        <ExternalLink className="w-4 h-4" />
                                    </a>
                                </div>
                            );
                        })}
                    </div>
                )}

                {filteredLibraryImages.length === 0 && (
                    <div className="text-center py-20 text-muted-foreground">
                        <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">No images match your filters.</p>
                    </div>
                )}

                {/* Lightbox */}
                {lightboxUrl && lightboxImage && (
                    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => { setLightboxUrl(null); setLightboxImage(null); }}>
                        <div className="relative max-w-3xl w-full" onClick={e => e.stopPropagation()}>
                            <button onClick={() => { setLightboxUrl(null); setLightboxImage(null); }} className="absolute -top-10 right-0 text-white/70 hover:text-white"><X className="w-6 h-6" /></button>
                            <img src={lightboxUrl} alt="" className="w-full max-h-[70vh] object-contain rounded-xl" />
                            <div className="mt-3 p-3 bg-card/80 backdrop-blur rounded-xl border border-border flex flex-wrap items-center gap-3">
                                <StorageBadge type={lightboxImage.storageType} />
                                {lightboxImage.isCompressed && <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded-full font-medium">WebP</span>}
                                <span className="text-xs text-muted-foreground">{lightboxImage.sections.map(s => s.section).join(', ')}</span>
                                {imageSizes[lightboxImage.url] && <span className="text-xs text-muted-foreground ml-auto">{formatSize(imageSizes[lightboxImage.url])}</span>}
                                <a href={lightboxUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs flex items-center gap-1"><ExternalLink className="w-3 h-3" />Open</a>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // ─── Render: Backup Tab ───────────────────────────────────────────────────
    const renderBackup = () => {
        if (!hasLoadedImages) {
            return (
                <div className="relative overflow-hidden bg-gradient-to-br from-violet-500/5 via-secondary/20 to-blue-500/5 border border-border/80 rounded-2xl p-8 md:p-12 text-center shadow-xl">
                    <div className="absolute -right-20 -top-20 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="max-w-md mx-auto space-y-6 relative z-10">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-violet-500/10 border border-violet-500/20">
                            <HardDriveDownload className="w-10 h-10 text-violet-400 animate-pulse" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-bold text-foreground">Start R2 Backup</h3>
                            <p className="text-sm text-muted-foreground">{discoveredImages.length} images found. <span className="text-pink-400 font-semibold">{stats.imgbbCount} on ImgBB</span> waiting to be backed up to Cloudflare R2.</p>
                        </div>
                        <button onClick={() => setHasLoadedImages(true)}
                            className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]">
                            <HardDriveDownload className="w-4 h-4" /> Load & Start Backup
                        </button>
                    </div>
                </div>
            );
        }

        return (
            <div className="space-y-4">
                {/* Controls */}
                <div className="bg-card border border-border rounded-xl p-4">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className="text-sm font-semibold text-foreground">{selectedUrls.size} selected</span>
                        {isCompressing && (
                            <div className="flex-1 ml-2">
                                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                    <div className="h-full bg-violet-500 transition-all rounded-full" style={{ width: `${progress.total > 0 ? (progress.done / progress.total) * 100 : 0}%` }} />
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">{progress.done}/{progress.total} images backed up</p>
                            </div>
                        )}
                        <div className="flex items-center gap-1.5 ml-auto">
                            <button onClick={fetchSizes} disabled={fetchingSizes} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-foreground text-xs font-medium hover:bg-secondary/80 border border-border transition-colors disabled:opacity-50">
                                <RefreshCcw className={`w-3.5 h-3.5 ${fetchingSizes ? 'animate-spin' : ''}`} />{fetchingSizes ? 'Fetching...' : 'Refresh Sizes'}
                            </button>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button onClick={selectAll} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-foreground text-xs font-medium hover:bg-secondary/80 border border-border transition-colors"><CheckSquare className="w-3.5 h-3.5" />All</button>
                        <button onClick={deselectAll} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-foreground text-xs font-medium hover:bg-secondary/80 border border-border transition-colors"><Square className="w-3.5 h-3.5" />None</button>
                        <button onClick={selectUncompressed} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-500 text-xs font-medium hover:bg-amber-500/20 border border-amber-500/20 transition-colors">Uncompressed</button>
                        <button onClick={() => selectByStorage('ImgBB')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pink-500/10 text-pink-400 text-xs font-medium hover:bg-pink-500/20 border border-pink-500/20 transition-colors"><ImageIcon className="w-3.5 h-3.5" />ImgBB Only</button>
                        <button onClick={() => selectByStorage('R2')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/10 text-orange-400 text-xs font-medium hover:bg-orange-500/20 border border-orange-500/20 transition-colors"><Cloud className="w-3.5 h-3.5" />R2 Only</button>
                        <button onClick={triggerBackupOtp} disabled={isCompressing || selectedUrls.size === 0}
                            className="ml-auto inline-flex items-center gap-2 px-5 py-2 rounded-xl font-semibold text-sm bg-violet-600 text-white hover:bg-violet-700 transition-colors shadow-lg shadow-violet-500/20 disabled:opacity-50 disabled:cursor-not-allowed">
                            {isCompressing ? <><Loader2 className="w-4 h-4 animate-spin" />Backing up {progress.done}/{progress.total}</> : <><HardDriveDownload className="w-4 h-4" />Backup {selectedUrls.size} Images to R2</>}
                        </button>
                    </div>
                </div>

                {/* Accordion */}
                <div className="space-y-3">
                    {Object.entries(segments).map(([secName, subItems], idx) => {
                        const isExpanded = expandedSegments.has(secName) || idx === 0;
                        let totalSecImages = 0;
                        Object.values(subItems).forEach(imgs => totalSecImages += imgs.length);
                        return (
                            <div key={secName} className="bg-card rounded-xl border border-border overflow-hidden">
                                <button onClick={() => toggleSegment(secName)} className="w-full flex items-center justify-between p-4 bg-secondary/30 hover:bg-secondary/50 transition-colors border-b border-border/50">
                                    <div className="flex items-center gap-3">
                                        <Layers className="w-4 h-4 text-primary" />
                                        <h4 className="font-bold text-foreground text-sm tracking-wide">{secName}</h4>
                                        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">{totalSecImages}</span>
                                    </div>
                                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                                </button>
                                {isExpanded && (
                                    <div className="divide-y divide-border/50">
                                        {Object.entries(subItems).map(([subName, imgs]) => (
                                            <div key={subName} className="p-4 bg-background/50">
                                                <h5 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">{subName}</h5>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {imgs.map((img, i) => {
                                                        const result = results.find(r => r.url === img.url);
                                                        const isSelected = selectedUrls.has(img.url);
                                                        return (
                                                            <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${isSelected ? 'border-violet-500/30 bg-violet-500/5' : 'border-border/50 bg-secondary/20 hover:border-border'}`}>
                                                                <input type="checkbox" className="w-4 h-4 mt-1 rounded border-border bg-background text-violet-600 cursor-pointer"
                                                                    checked={isSelected} disabled={isCompressing || (result?.newUrl !== undefined)}
                                                                    onChange={(e) => { const s = new Set(selectedUrls); if (e.target.checked) s.add(img.url); else s.delete(img.url); setSelectedUrls(s); }} />
                                                                <div className="w-14 h-14 rounded-lg overflow-hidden border border-border/50 flex-shrink-0 bg-background cursor-pointer"
                                                                    onClick={() => { setLightboxUrl(getImageUrl(img.url)); setLightboxImage(img); }}>
                                                                    <img src={getImageUrl(img.url)} alt="" className="w-full h-full object-cover" loading="lazy" />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                                                                        <span className="text-[10px] font-black text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">#{img.serialNumber}</span>
                                                                        <StorageBadge type={result?.newUrl ? 'Dual' : img.storageType} small />
                                                                        {img.isCompressed && !result?.newUrl && <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">WebP</span>}
                                                                        {!img.isCompressed && !result?.newUrl && <span className="text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded-full font-medium">Raw</span>}
                                                                    </div>
                                                                    <p className="text-[10px] text-muted-foreground truncate" title={img.url}>{getImageUrl(img.url)}</p>
                                                                    <div className="flex items-center gap-2 mt-1">
                                                                        {imageSizes[img.url] && <span className="text-[10px] text-muted-foreground">{formatSize(imageSizes[img.url])}</span>}
                                                                        {newImageSizes[img.url] && <><span className="text-[10px] text-muted-foreground">→</span><span className="text-[10px] text-emerald-400 font-semibold">{formatSize(newImageSizes[img.url])}</span></>}
                                                                    </div>
                                                                    {result && (
                                                                        <div className="mt-1.5">
                                                                            {result.newUrl ? (
                                                                                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md flex items-center gap-1 w-max"><CheckCircle2 className="w-3 h-3" />Backed up to R2</span>
                                                                            ) : (
                                                                                <span className="text-[10px] text-red-400 bg-red-500/10 px-2 py-0.5 rounded-md">Failed: {result.error}</span>
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
    };

    // ─── Render: Lab Tab ──────────────────────────────────────────────────────
    const renderLab = () => (
        <div className="space-y-6 max-w-2xl">
            <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="font-semibold text-lg mb-1 flex items-center gap-2"><FlaskConical className="w-5 h-5 text-emerald-400" />Upload & Compression Lab</h3>
                <p className="text-sm text-muted-foreground mb-5">Test the full pipeline — compress, OTP-verify, and upload to the <code className="bg-secondary px-1 rounded text-xs">sandbox/</code> R2 folder — without touching any live data.</p>
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">1. Choose a file</label>
                        <input type="file" accept="image/*" onChange={handleSandboxFileChange}
                            className="block w-full text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer" />
                    </div>
                    {sandboxFile && (
                        <div className="bg-secondary/50 border border-border rounded-xl p-4 grid grid-cols-2 gap-4">
                            {/* Original */}
                            <div className="space-y-2">
                                <p className="text-xs font-semibold text-muted-foreground uppercase">Original</p>
                                <img src={sandboxPreview || ''} alt="original" className="w-full aspect-video object-cover rounded-lg border border-border" />
                                <p className="text-xs text-muted-foreground text-center">{formatSize(sandboxFile.size)}</p>
                            </div>
                            {/* Compressed */}
                            <div className="space-y-2">
                                <p className="text-xs font-semibold text-muted-foreground uppercase">Compressed (WebP)</p>
                                <div className="w-full aspect-video rounded-lg border border-border bg-background flex items-center justify-center overflow-hidden">
                                    {sandboxCompressedBlob ? <img src={URL.createObjectURL(sandboxCompressedBlob)} alt="compressed" className="w-full h-full object-cover" /> : <p className="text-xs text-muted-foreground">Not yet compressed</p>}
                                </div>
                                <p className={`text-xs text-center font-semibold ${sandboxCompressedBlob ? 'text-emerald-400' : 'text-muted-foreground'}`}>{sandboxCompressedBlob ? formatSize(sandboxCompressedBlob.size) : '—'}</p>
                            </div>
                        </div>
                    )}
                    <div className="flex flex-wrap gap-3">
                        <button onClick={handleSandboxCompress} disabled={!sandboxFile || sandboxCompressing}
                            className="flex items-center gap-2 px-4 py-2.5 bg-blue-500/10 text-blue-400 rounded-xl text-sm font-semibold hover:bg-blue-500/20 transition-colors disabled:opacity-50 border border-blue-500/20">
                            {sandboxCompressing ? <><Loader2 className="w-4 h-4 animate-spin" />Compressing...</> : <><Zap className="w-4 h-4" />2. Compress to WebP</>}
                        </button>
                        <button onClick={triggerSandboxOTP} disabled={!sandboxCompressedBlob}
                            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl text-sm font-semibold hover:bg-emerald-500/20 transition-colors disabled:opacity-50 border border-emerald-500/20">
                            <Cloud className="w-4 h-4" />3. Upload to R2
                        </button>
                    </div>
                    {sandboxResultUrl && (
                        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                            <p className="text-sm text-emerald-400 font-semibold mb-2 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" />Upload Successful!</p>
                            <a href={getImageUrl(sandboxResultUrl)} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline break-all flex items-start gap-1">
                                <ExternalLink className="w-3 h-3 mt-0.5 flex-shrink-0" />{getImageUrl(sandboxResultUrl)}
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    // ─── ROOT RENDER ──────────────────────────────────────────────────────────
    return (
        <div className="space-y-6 relative">
            {renderOtpModal()}

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
                        <span className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center"><ImageIcon className="w-5 h-5 text-violet-400" /></span>
                        Image OS
                    </h1>
                    <p className="text-sm text-muted-foreground mt-0.5">Command center for all site images — browse, analyze, and backup.</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-card border border-border px-3 py-2 rounded-xl">
                    <Database className="w-3.5 h-3.5" />
                    <span><strong className="text-foreground">{discoveredImages.length}</strong> images in database</span>
                </div>
            </div>

            {/* Tab Bar */}
            <div className="flex gap-1 bg-secondary/50 p-1 rounded-xl border border-border w-fit">
                {tabs.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === tab.id ? 'bg-card text-foreground shadow border border-border' : 'text-muted-foreground hover:text-foreground'}`}>
                        {tab.icon}
                        {tab.label}
                        {tab.badge && (
                            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${activeTab === tab.id ? 'bg-primary/10 text-primary' : 'bg-border text-muted-foreground'}`}>{tab.badge}</span>
                        )}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div>
                {activeTab === 'dashboard' && renderDashboard()}
                {activeTab === 'library' && renderLibrary()}
                {activeTab === 'backup' && renderBackup()}
                {activeTab === 'lab' && renderLab()}
            </div>
        </div>
    );
}
