import { useState, useEffect } from 'react';
import { SectionHeader, LangToggle, SaveButton, TextField, ErrorAlert, useSectionEditor, JsonPanel, ColorField } from '@/components/admin/EditorComponents';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { Reorder } from 'framer-motion';

export type ProcessFloatingTag = {
    id: string;
    text: string;
    color: string;
    position: string;
};

const POSITIONS = [
    { value: 'top-left', label: 'Top Left' },
    { value: 'top-right', label: 'Top Right' },
    { value: 'center-left', label: 'Center Left' },
    { value: 'center-right', label: 'Center Right' },
    { value: 'bottom-left', label: 'Bottom Left' },
    { value: 'bottom-right', label: 'Bottom Right' }
];

export default function AdminProcess() {
    const { lang, setLang, saving, saved, error, getData, save } = useSectionEditor('process');
    const [tags, setTags] = useState<ProcessFloatingTag[]>([]);

    useEffect(() => {
        const d = getData();
        if (d && d.tags) {
            setTags(d.tags);
        } else {
            // Default MZMedia style tags if empty
            setTags([
                { id: '1', text: 'B2B SaaS', color: '#273FB7', position: 'top-right' },
                { id: '2', text: 'AI Automation', color: '#6366f1', position: 'center-right' },
                { id: '3', text: 'E-Commerce', color: '#8b5cf6', position: 'bottom-right' }
            ]);
        }
    }, [getData]);

    const handleAddTag = () => {
        const newTag: ProcessFloatingTag = {
            id: Date.now().toString(),
            text: 'New Tag',
            color: '#10b981',
            position: 'top-left'
        };
        setTags([...tags, newTag]);
    };

    const updateTag = (id: string, field: keyof ProcessFloatingTag, value: any) => {
        setTags(tags.map(t => t.id === id ? { ...t, [field]: value } : t));
    };

    const removeTag = (id: string) => {
        setTags(tags.filter(t => t.id !== id));
    };

    const currentPayload = { tags };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <SectionHeader title="Process Section" description="Manage Step 1 visual floating tags." />
                <LangToggle lang={lang} setLang={setLang} />
            </div>
            <ErrorAlert message={error} />

            <div className="bg-card rounded-xl p-4 md:p-6 border border-border">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-foreground">Step 01: Floating Discovery Tags</h3>
                    <button
                        onClick={handleAddTag}
                        className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 transition-colors rounded-lg text-sm font-medium"
                    >
                        <Plus className="w-4 h-4" /> Add Tag
                    </button>
                </div>

                <div className="space-y-3">
                    <Reorder.Group axis="y" values={tags} onReorder={setTags} className="space-y-3">
                        {tags.map((tag) => (
                            <Reorder.Item
                                key={tag.id}
                                value={tag}
                                className="bg-background border border-border rounded-xl p-4 flex flex-col md:flex-row gap-4 items-start md:items-center relative group"
                            >
                                <div className="cursor-grab active:cursor-grabbing p-2 text-muted-foreground hover:text-foreground">
                                    <GripVertical className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-[200px]">
                                    <label className="text-xs font-medium text-muted-foreground block mb-1">Text</label>
                                    <input
                                        type="text"
                                        value={tag.text}
                                        onChange={(e) => updateTag(tag.id, 'text', e.target.value)}
                                        className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:ring-1 focus:ring-primary outline-none transition-shadow"
                                    />
                                </div>

                                <div className="w-full md:w-32">
                                    <ColorField label="Background Glow" value={tag.color} onChange={(c) => updateTag(tag.id, 'color', c)} />
                                </div>

                                <div className="w-full md:w-48">
                                    <label className="text-xs font-medium text-muted-foreground block mb-1">Position</label>
                                    <select
                                        value={tag.position}
                                        onChange={(e) => updateTag(tag.id, 'position', e.target.value)}
                                        className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:ring-1 focus:ring-primary outline-none"
                                    >
                                        {POSITIONS.map(p => (
                                            <option key={p.value} value={p.value}>{p.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex items-center justify-end w-full md:w-auto">
                                    <button
                                        onClick={() => removeTag(tag.id)}
                                        className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors flex items-center justify-center h-10 w-10 shrink-0"
                                        title="Remove Tag"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </Reorder.Item>
                        ))}
                    </Reorder.Group>
                    {tags.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground text-sm border border-dashed border-border rounded-xl">
                            No floating tags added yet.
                        </div>
                    )}
                </div>
            </div>

            <SaveButton onClick={() => save(currentPayload)} saving={saving} saved={saved} />

            <div className="mt-8 pt-8 border-t border-border">
                <JsonPanel
                    title={`JSON Import / Export (${lang.toUpperCase()})`}
                    data={currentPayload}
                    onImport={(parsed) => {
                        setTags(parsed.tags || []);
                    }}
                />
            </div>
        </div>
    );
}
