import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { useContent } from '@/contexts/ContentContext';
import { SectionHeader, ErrorAlert } from '@/components/admin/EditorComponents';
import {
    Download, Upload, Eye, EyeOff, ChevronDown, ChevronUp,
    AlertTriangle, CheckCircle2, Loader2, FileJson, Shield,
    HardDriveDownload, HardDriveUpload, RefreshCw
} from 'lucide-react';

// All content section keys used by the admin panel
const ALL_SECTIONS = [
    'hero', 'stats', 'services', 'techStack', 'whyUs', 'projects',
    'leadership', 'reviews', 'contact', 'footer', 'chatbot', 'links',
    'nav', 'seo', 'privacy', 'terms'
];

export default function AdminBackup() {
    const { content, updateSection, refreshContent } = useContent();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Preview state
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewLang, setPreviewLang] = useState<'en' | 'bn'>('en');

    // Restore state
    const [uploadedData, setUploadedData] = useState<any>(null);
    const [uploadFileName, setUploadFileName] = useState('');
    const [restorePreviewOpen, setRestorePreviewOpen] = useState(false);
    const [restoring, setRestoring] = useState(false);
    const [restoreProgress, setRestoreProgress] = useState<{ done: number; total: number; current: string } | null>(null);
    const [error, setError] = useState('');

    // ─── Download Backup ───
    const handleDownload = async () => {
        try {
            const backup = {
                _meta: {
                    exportedAt: new Date().toISOString(),
                    version: '1.0',
                    source: 'Orbit SaaS Admin Panel',
                },
                en: content.en,
                bn: content.bn,
            };

            const json = JSON.stringify(backup, null, 2);
            const now = new Date();
            const date = now.toISOString().split('T')[0];
            const time = now.toTimeString().split(' ')[0].replace(/:/g, '-');
            const fileName = `Orbit_SaaS_Backup_${date}_${time}.json`;

            // Use File System Access API for reliable filename
            if ('showSaveFilePicker' in window) {
                try {
                    const handle = await (window as any).showSaveFilePicker({
                        suggestedName: fileName,
                        types: [{
                            description: 'JSON File',
                            accept: { 'application/json': ['.json'] },
                        }],
                    });
                    const writable = await handle.createWritable();
                    await writable.write(json);
                    await writable.close();
                    toast.success('Backup saved successfully!');
                    return;
                } catch (pickerErr: any) {
                    // User cancelled the dialog
                    if (pickerErr?.name === 'AbortError') return;
                }
            }

            // Fallback for browsers without File System Access API
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast.success('Backup downloaded successfully!');
        } catch (err) {
            console.error('Download error:', err);
            toast.error('Failed to generate backup file');
        }
    };

    // ─── Upload File ───
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        setError('');
        setUploadedData(null);
        setUploadFileName('');

        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.name.endsWith('.json')) {
            setError('Please select a .json file');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const parsed = JSON.parse(event.target?.result as string);

                // Validate structure
                if (!parsed.en && !parsed.bn) {
                    setError('Invalid backup file: must contain "en" and/or "bn" content objects.');
                    return;
                }

                setUploadedData(parsed);
                setUploadFileName(file.name);
                setRestorePreviewOpen(true);
                toast.success(`File "${file.name}" loaded — review before restoring.`);
            } catch (err: any) {
                setError(`Invalid JSON file: ${err.message}`);
            }
        };
        reader.onerror = () => setError('Failed to read file');
        reader.readAsText(file);

        // Reset input so re-selecting the same file triggers onchange
        e.target.value = '';
    };

    // ─── Restore ───
    const handleRestore = async () => {
        if (!uploadedData) return;

        setRestoring(true);
        setError('');
        const toastId = toast.loading('Restoring content...');

        const langs = ['en', 'bn'].filter(l => uploadedData[l]);
        const tasks: { section: string; lang: string; data: any }[] = [];

        for (const lang of langs) {
            const langData = uploadedData[lang] as Record<string, unknown>;
            for (const section of ALL_SECTIONS) {
                if (langData[section]) {
                    tasks.push({ section, lang, data: langData[section] });
                }
            }
        }

        let done = 0;
        let failed = 0;

        for (const task of tasks) {
            setRestoreProgress({ done, total: tasks.length, current: `${task.section} (${task.lang.toUpperCase()})` });

            try {
                const ok = await updateSection(task.section, task.lang, task.data);
                if (!ok) {
                    failed++;
                    console.error(`Failed to restore: ${task.section} (${task.lang})`);
                }
            } catch (err) {
                failed++;
                console.error(`Error restoring ${task.section}:`, err);
            }

            done++;
        }

        setRestoreProgress(null);
        setRestoring(false);

        if (failed === 0) {
            toast.success(`All ${tasks.length} sections restored successfully!`, { id: toastId });
            setUploadedData(null);
            setUploadFileName('');
            setRestorePreviewOpen(false);
            // Refresh content to reflect changes
            await refreshContent();
        } else {
            toast.error(`Restored ${done - failed}/${tasks.length} sections. ${failed} failed.`, { id: toastId });
        }
    };

    // Count sections in uploaded data
    const getUploadSummary = () => {
        if (!uploadedData) return null;
        const summary: { lang: string; sections: string[] }[] = [];
        for (const lang of ['en', 'bn']) {
            if (uploadedData[lang]) {
                const sections = ALL_SECTIONS.filter(s => uploadedData[lang][s]);
                if (sections.length > 0) {
                    summary.push({ lang, sections });
                }
            }
        }
        return summary;
    };

    return (
        <div className="space-y-8">
            <SectionHeader
                title="Backup & Restore"
                description="Download a full JSON backup of all page content, or upload a backup to restore."
            />
            <ErrorAlert message={error} />

            {/* ─── Section 1: Current Content Preview ─── */}
            <div className="bg-card rounded-xl border border-border overflow-hidden">
                <button
                    onClick={() => setPreviewOpen(!previewOpen)}
                    className="w-full flex items-center justify-between px-6 py-4 hover:bg-secondary/30 transition-colors cursor-pointer"
                >
                    <div className="flex items-center gap-2.5">
                        {previewOpen ? <EyeOff className="w-5 h-5 text-primary" /> : <Eye className="w-5 h-5 text-primary" />}
                        <span className="font-semibold text-foreground">Current Content Preview</span>
                        <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                            Live Data
                        </span>
                    </div>
                    {previewOpen
                        ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        : <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    }
                </button>

                {previewOpen && (
                    <div className="px-6 pb-6 border-t border-border pt-4 space-y-4">
                        {/* Lang Toggle */}
                        <div className="flex items-center gap-1 bg-secondary rounded-lg p-1 w-fit">
                            {(['en', 'bn'] as const).map(l => (
                                <button
                                    key={l}
                                    onClick={() => setPreviewLang(l)}
                                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${previewLang === l
                                        ? 'bg-primary text-primary-foreground'
                                        : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    {l === 'en' ? 'English' : 'বাংলা'}
                                </button>
                            ))}
                        </div>

                        <div className="max-h-[500px] overflow-auto rounded-lg bg-background border border-border">
                            <pre className="p-4 text-xs font-mono text-foreground whitespace-pre-wrap break-words">
                                {JSON.stringify(content[previewLang], null, 2)}
                            </pre>
                        </div>
                    </div>
                )}
            </div>

            {/* ─── Section 2: Download Backup ─── */}
            <div className="bg-card rounded-xl border border-border p-6">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                        <HardDriveDownload className="w-6 h-6 text-emerald-500" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-semibold text-foreground text-lg flex items-center gap-2">
                            Download Backup
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1 mb-4">
                            Export all content (both English & বাংলা) as a single JSON file. This includes every section: Hero, Stats, Services, Tech Stack, Why Us, Projects, Leadership, Reviews, Contact, Footer, Chatbot, Links, Navbar, and SEO.
                        </p>
                        <button
                            onClick={handleDownload}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm bg-emerald-500 text-white hover:bg-emerald-600 transition-colors cursor-pointer shadow-lg shadow-emerald-500/20"
                        >
                            <Download className="w-4 h-4" />
                            Download Backup (.json)
                        </button>
                    </div>
                </div>
            </div>

            {/* ─── Section 3: Upload & Restore ─── */}
            <div className="bg-card rounded-xl border border-border p-6">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                        <HardDriveUpload className="w-6 h-6 text-amber-500" />
                    </div>
                    <div className="flex-1 space-y-4">
                        <div>
                            <h3 className="font-semibold text-foreground text-lg flex items-center gap-2">
                                Emergency Restore
                                <span className="text-xs font-normal text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3" /> Use with caution
                                </span>
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                Upload a previously downloaded backup file to restore all content. This will <strong className="text-foreground">overwrite</strong> the current content for every section included in the backup.
                            </p>
                        </div>

                        {/* File Input */}
                        <div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".json"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={restoring}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm bg-secondary text-foreground hover:bg-secondary/80 border border-border transition-colors cursor-pointer disabled:opacity-50"
                            >
                                <Upload className="w-4 h-4" />
                                {uploadFileName ? `Selected: ${uploadFileName}` : 'Select Backup File (.json)'}
                            </button>
                        </div>

                        {/* Uploaded Preview */}
                        {uploadedData && (
                            <div className="space-y-4 border-t border-border pt-4">
                                {/* Meta info */}
                                {uploadedData._meta && (
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/50 rounded-lg px-4 py-3">
                                        <FileJson className="w-4 h-4 text-primary" />
                                        <span>
                                            Backup from: <strong className="text-foreground">
                                                {new Date(uploadedData._meta.exportedAt).toLocaleString()}
                                            </strong>
                                        </span>
                                    </div>
                                )}

                                {/* Summary of what will be restored */}
                                <div className="space-y-2">
                                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                        <Shield className="w-4 h-4 text-primary" />
                                        Sections to Restore:
                                    </h4>
                                    {getUploadSummary()?.map(({ lang, sections }) => (
                                        <div key={lang} className="flex flex-wrap items-center gap-2">
                                            <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                                                {lang.toUpperCase()}
                                            </span>
                                            {sections.map(s => (
                                                <span key={s} className="text-xs bg-secondary text-foreground px-2 py-0.5 rounded-full">
                                                    {s}
                                                </span>
                                            ))}
                                        </div>
                                    ))}
                                </div>

                                {/* Collapsible raw JSON preview */}
                                <button
                                    onClick={() => setRestorePreviewOpen(!restorePreviewOpen)}
                                    className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1 cursor-pointer"
                                >
                                    {restorePreviewOpen ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                    {restorePreviewOpen ? 'Hide' : 'Show'} Raw JSON
                                </button>
                                {restorePreviewOpen && (
                                    <div className="max-h-[400px] overflow-auto rounded-lg bg-background border border-border">
                                        <pre className="p-4 text-xs font-mono text-foreground whitespace-pre-wrap break-words">
                                            {JSON.stringify(uploadedData, null, 2)}
                                        </pre>
                                    </div>
                                )}

                                {/* Progress */}
                                {restoreProgress && (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm text-foreground">
                                            <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                                            <span>
                                                Restoring: <strong>{restoreProgress.current}</strong>
                                            </span>
                                            <span className="text-muted-foreground">
                                                ({restoreProgress.done}/{restoreProgress.total})
                                            </span>
                                        </div>
                                        <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary rounded-full transition-all duration-300"
                                                style={{ width: `${(restoreProgress.done / restoreProgress.total) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Restore Button */}
                                <div className="flex items-center gap-3 pt-2">
                                    <button
                                        onClick={handleRestore}
                                        disabled={restoring}
                                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm bg-amber-500 text-white hover:bg-amber-600 transition-colors cursor-pointer shadow-lg shadow-amber-500/20 disabled:opacity-50"
                                    >
                                        {restoring
                                            ? <><Loader2 className="w-4 h-4 animate-spin" /> Restoring...</>
                                            : <><CheckCircle2 className="w-4 h-4" /> Confirm & Restore All</>
                                        }
                                    </button>
                                    {!restoring && (
                                        <button
                                            onClick={() => { setUploadedData(null); setUploadFileName(''); }}
                                            className="px-4 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
                                        >
                                            Cancel
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
