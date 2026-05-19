import { useState, useEffect } from 'react';
import { SectionHeader, SaveButton, TextField, ErrorAlert, useSectionEditor, JsonPanel } from '@/components/admin/EditorComponents';

export default function AdminSEO() {
    const { lang, saving, saved, error, getData, save } = useSectionEditor('seo');
    const [seoTitle, setSeoTitle] = useState('');
    const [seoDesc, setSeoDesc] = useState('');
    const [seoKeywords, setSeoKeywords] = useState('');

    useEffect(() => {
        const d = getData();
        if (d) {
            setSeoTitle(d.title || '');
            setSeoDesc(d.description || '');
            setSeoKeywords(d.keywords || '');
        }
    }, [getData]);

    return (
        <div className="space-y-6">
            <SectionHeader title="SEO Settings" description="Manage search engine optimization metadata" />
            <ErrorAlert message={error} />
            <div className="space-y-4 bg-card rounded-xl p-4 md:p-6 border border-border">
                <TextField label="Page Title" value={seoTitle} onChange={setSeoTitle} lang="en" />
                <TextField label="Meta Description" value={seoDesc} onChange={setSeoDesc} multiline lang="en" />
                <TextField label="Keywords (comma-separated)" value={seoKeywords} onChange={setSeoKeywords} lang="en" />
            </div>
            <SaveButton onClick={() => save({ title: seoTitle, description: seoDesc, keywords: seoKeywords })} saving={saving} saved={saved} />

            <div className="mt-8 pt-8 border-t border-border">
                <JsonPanel
                    title={`SEO JSON (${lang.toUpperCase()})`}
                    data={{ title: seoTitle, description: seoDesc, keywords: seoKeywords }}
                    onImport={(parsed) => {
                        setSeoTitle(parsed.title || '');
                        setSeoDesc(parsed.description || '');
                        setSeoKeywords(parsed.keywords || '');
                    }}
                />
            </div>
        </div>
    );
}
