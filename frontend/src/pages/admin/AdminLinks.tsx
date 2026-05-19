import { useState, useEffect } from 'react';
import { useContent } from '@/contexts/ContentContext';
import { SectionHeader, LangToggle, SaveButton, TextField, ErrorAlert, useSectionEditor, ItemListEditor, JsonPanel } from '@/components/admin/EditorComponents';

export default function AdminLinks() {
    const { content } = useContent();
    const { lang, setLang, saving, saved, error, getData, save } = useSectionEditor('links');

    const [formData, setFormData] = useState<{ title: string; items: { title: string; link: string }[] }>({
        title: '',
        items: [],
    });

    // Sync with context data when language changes or data is loaded
    useEffect(() => {
        const data = getData();
        if (data) {
            setFormData({
                title: data.title || '',
                items: data.items || [],
            });
        } else {
            setFormData({ title: '', items: [] });
        }
    }, [lang, getData]);

    const handleSave = () => {
        save(formData);
    };

    const handleFieldChange = (field: keyof typeof formData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const emptyItem = { title: '', link: '' };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <SectionHeader title="Links Management" description="Manage links accessible by the AI chatbot." />
            <LangToggle lang={lang} setLang={setLang} />
            <ErrorAlert message={error} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-card rounded-2xl p-6 border border-border shadow-sm space-y-4">
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                            <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">🔗</span>
                            Links Setup
                        </h3>
                        <TextField
                            label="Section Title (Internal)"
                            value={formData.title}
                            onChange={(value) => handleFieldChange('title', value)}
                            lang={lang}
                        />
                    </div>

                    <div className="bg-card rounded-2xl p-6 border border-border shadow-sm space-y-4">
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                            <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">📝</span>
                            Link Items
                        </h3>
                        <p className="text-sm text-muted-foreground pb-2">These links will be provided to the AI chatbot to give to users.</p>

                        <ItemListEditor
                            items={formData.items}
                            setItems={(items) => handleFieldChange('items', items)}
                            newItem={emptyItem}
                            renderItem={(item, index, updateItem) => (
                                <div className="space-y-3">
                                    <TextField
                                        label="Link Title"
                                        value={item.title}
                                        onChange={(value) => updateItem({ ...item, title: value })}
                                        lang={lang}
                                    />
                                    <TextField
                                        label="URL (Link)"
                                        value={item.link}
                                        onChange={(value) => updateItem({ ...item, link: value })}
                                    />
                                </div>
                            )}
                        />
                    </div>

                    <SaveButton onClick={handleSave} saving={saving} saved={saved} />
                </div>

                <div className="lg:col-span-1 space-y-6">
                    <JsonPanel
                        data={formData}
                        onImport={(parsed) => setFormData(parsed)}
                        title={`Raw Data (${lang.toUpperCase()})`}
                    />
                    <JsonPanel
                        data={content[lang]?.links}
                        onImport={() => { }}
                        title={`Current Content (${lang.toUpperCase()})`}
                    />
                </div>
            </div>
        </div>
    );
}
