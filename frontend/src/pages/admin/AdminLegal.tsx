import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
    SectionHeader,
    SaveButton,
    ErrorAlert,
} from '@/components/admin/EditorComponents';
import { useContent } from '@/contexts/ContentContext';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

// ─── Types ───

interface LegalSection {
    heading: string;
    content: string;
}

interface LegalPageData {
    title: string;
    lastUpdated: string;
    sections: LegalSection[];
}

const EMPTY_PAGE: LegalPageData = {
    title: '',
    lastUpdated: '',
    sections: [],
};

// ─── Main Component ───

export default function AdminLegal() {
    const { content, updateSection, refreshContent, loading: contentLoading } = useContent();

    const [loading, setLoading] = useState(true);
    const [privacy, setPrivacy] = useState<LegalPageData>(EMPTY_PAGE);
    const [terms, setTerms] = useState<LegalPageData>(EMPTY_PAGE);
    const [activeTab, setActiveTab] = useState<'privacy' | 'terms'>('privacy');

    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');

    // ─── Load ───
    useEffect(() => {
        if (contentLoading) return;
        if (!content.en) { setLoading(false); return; }

        const enPrivacy = (content.en as any).privacy || {};
        const enTerms = (content.en as any).terms || {};

        setPrivacy({
            title: enPrivacy.title || 'Privacy Policy',
            lastUpdated: enPrivacy.lastUpdated || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
            sections: enPrivacy.sections || [],
        });
        setTerms({
            title: enTerms.title || 'Terms of Service',
            lastUpdated: enTerms.lastUpdated || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
            sections: enTerms.sections || [],
        });

        setLoading(false);
    }, [content, contentLoading]);

    // ─── Save ───
    const handleSave = async () => {
        setSaving(true);
        setError('');
        setSaved(false);
        const toastId = toast.loading('Saving legal pages...');

        try {
            const pOk = await updateSection('privacy', 'en', privacy);
            const tOk = await updateSection('terms', 'en', terms);

            // Also save to BN (same content, legal pages are typically English-only)
            await updateSection('privacy', 'bn', privacy);
            await updateSection('terms', 'bn', terms);

            if (pOk && tOk) {
                setSaved(true);
                toast.success('Legal pages saved!', { id: toastId });
                await refreshContent();
                setTimeout(() => setSaved(false), 2000);
            } else {
                setError('Error saving legal pages.');
                toast.error('Error saving', { id: toastId });
            }
        } catch (err) {
            console.error(err);
            setError('Failed to save.');
            toast.error('Save failed', { id: toastId });
        } finally {
            setSaving(false);
        }
    };

    // ─── Helpers ───
    const currentData = activeTab === 'privacy' ? privacy : terms;
    const setCurrentData = activeTab === 'privacy' ? setPrivacy : setTerms;

    const addSection = () => {
        setCurrentData({ ...currentData, sections: [...currentData.sections, { heading: '', content: '' }] });
    };
    const removeSection = (idx: number) => {
        setCurrentData({ ...currentData, sections: currentData.sections.filter((_, i) => i !== idx) });
    };
    const updateSectionField = (idx: number, field: keyof LegalSection, value: string) => {
        setCurrentData({
            ...currentData,
            sections: currentData.sections.map((s, i) => (i === idx ? { ...s, [field]: value } : s)),
        });
    };
    const moveSection = (idx: number, dir: -1 | 1) => {
        const arr = [...currentData.sections];
        const target = idx + dir;
        if (target < 0 || target >= arr.length) return;
        [arr[idx], arr[target]] = [arr[target], arr[idx]];
        setCurrentData({ ...currentData, sections: arr });
    };

    if (loading) {
        return <div className="p-8 text-center text-muted-foreground">Loading legal pages...</div>;
    }

    return (
        <div className="space-y-6">
            <SectionHeader
                title="Legal Pages"
                description="Manage Privacy Policy and Terms of Service content."
            />
            <ErrorAlert message={error} />

            {/* Tabs */}
            <div className="flex gap-2">
                {(['privacy', 'terms'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${activeTab === tab
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-secondary text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        {tab === 'privacy' ? '🔒 Privacy Policy' : '📋 Terms of Service'}
                    </button>
                ))}
            </div>

            {/* Page Title & Last Updated */}
            <div className="bg-card rounded-xl p-4 md:p-6 border border-border space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">Page Title</label>
                        <input
                            type="text"
                            value={currentData.title}
                            onChange={(e) => setCurrentData({ ...currentData, title: e.target.value })}
                            className="w-full bg-background rounded-lg px-3 py-2.5 text-sm text-foreground outline-none border border-border"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">Last Updated</label>
                        <input
                            type="text"
                            value={currentData.lastUpdated}
                            onChange={(e) => setCurrentData({ ...currentData, lastUpdated: e.target.value })}
                            placeholder="e.g. March 2, 2026"
                            className="w-full bg-background rounded-lg px-3 py-2.5 text-sm text-foreground outline-none border border-border placeholder:text-muted-foreground/50"
                        />
                    </div>
                </div>
            </div>

            {/* Sections CRUD */}
            <div className="bg-card rounded-xl p-4 md:p-6 border border-border">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="font-semibold text-foreground">
                            Content Sections ({currentData.sections.length})
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">
                            Each section has a heading and body text. Supports plain text.
                        </p>
                    </div>
                    <button
                        onClick={addSection}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity cursor-pointer"
                    >
                        <Plus className="w-3.5 h-3.5" /> Add Section
                    </button>
                </div>

                {currentData.sections.length === 0 ? (
                    <p className="text-sm text-muted-foreground/60 italic py-6 text-center">
                        No sections yet. Click "Add Section" to start building the page.
                    </p>
                ) : (
                    <div className="space-y-3">
                        {currentData.sections.map((section, idx) => (
                            <div
                                key={idx}
                                className="rounded-xl border border-border bg-secondary/30 p-4 space-y-3"
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-xs text-muted-foreground font-mono bg-background px-2 py-0.5 rounded">
                                        #{idx + 1}
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => moveSection(idx, -1)}
                                            disabled={idx === 0}
                                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-background transition-colors disabled:opacity-30 cursor-pointer disabled:cursor-default"
                                            title="Move up"
                                        >
                                            <ChevronUp className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => moveSection(idx, 1)}
                                            disabled={idx === currentData.sections.length - 1}
                                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-background transition-colors disabled:opacity-30 cursor-pointer disabled:cursor-default"
                                            title="Move down"
                                        >
                                            <ChevronDown className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => removeSection(idx)}
                                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                                            title="Remove section"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Section Heading (e.g. 1. Information We Collect)"
                                    value={section.heading}
                                    onChange={(e) => updateSectionField(idx, 'heading', e.target.value)}
                                    className="w-full bg-background rounded-lg px-3 py-2.5 text-sm text-foreground font-medium outline-none border border-border placeholder:text-muted-foreground/50"
                                />
                                <textarea
                                    placeholder="Section content..."
                                    value={section.content}
                                    onChange={(e) => updateSectionField(idx, 'content', e.target.value)}
                                    rows={4}
                                    className="w-full bg-background rounded-lg px-3 py-2.5 text-sm text-foreground outline-none border border-border placeholder:text-muted-foreground/50 resize-y min-h-[80px]"
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <SaveButton onClick={handleSave} saving={saving} saved={saved} />
        </div>
    );
}
