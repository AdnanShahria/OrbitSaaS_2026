import React, { createContext, useContext, useCallback, useMemo } from 'react';
import { translations } from '@/lib/i18n';
import { useQueries, useQueryClient } from '@tanstack/react-query';

type ContentData = Record<string, unknown>;

interface ContentContextValue {
    content: { en: ContentData; bn: ContentData };
    loading: boolean;
    updateSection: (section: string, lang: string, data: unknown) => Promise<boolean>;
    refreshContent: () => Promise<void>;
}

const ContentContext = createContext<ContentContextValue | null>(null);

const API_BASE = import.meta.env.VITE_API_URL || '';

// Deep merge utility to combine defaults with API data
function deepMerge(target: any, source: any) {
    const output = { ...target };
    if (source && typeof source === 'object' && !Array.isArray(source)) {
        Object.keys(source).forEach(key => {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                if (!(key in target)) {
                    Object.assign(output, { [key]: source[key] });
                } else {
                    output[key] = deepMerge(target[key], source[key]);
                }
            } else {
                Object.assign(output, { [key]: source[key] });
            }
        });
    }
    return output;
}

async function fetchContentData(lang: string) {
    const res = await fetch(`${API_BASE}/api/content?lang=${lang}`);
    if (!res.ok) throw new Error('API Error');
    const data = await res.json();
    if (!data.success || Object.keys(data.content).length === 0) {
        throw new Error('No content found');
    }
    return data.content;
}

export function ContentProvider({ children }: { children: React.ReactNode }) {
    const queryClient = useQueryClient();

    const results = useQueries({
        queries: [
            { queryKey: ['content', 'en'], queryFn: () => fetchContentData('en'), staleTime: 30_000, gcTime: 300_000 },
            { queryKey: ['content', 'bn'], queryFn: () => fetchContentData('bn'), staleTime: 30_000, gcTime: 300_000 },
        ],
    });

    const [enQuery, bnQuery] = results;

    // Derived state from queries using deepMerge — memoized to prevent cascading re-renders
    const content = useMemo(() => ({
        en: deepMerge(translations.en, enQuery.data || {}),
        bn: deepMerge(translations.bn, bnQuery.data || {}),
    }), [enQuery.data, bnQuery.data]);

    const loading = enQuery.isLoading || bnQuery.isLoading;

    const refreshContent = useCallback(async () => {
        await queryClient.invalidateQueries({ queryKey: ['content'] });
    }, [queryClient]);

    const updateSection = useCallback(async (section: string, lang: string, data: unknown): Promise<boolean> => {
        const token = localStorage.getItem('admin_token');
        if (!token) return false;

        try {
            const res = await fetch(`${API_BASE}/api/content`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ section, lang, data }),
            });

            if (res.ok) {
                // Update cache immediately for better UX
                queryClient.setQueryData(['content', lang], (old: ContentData | undefined) => ({
                    ...old,
                    [section]: data
                }));
                // Short delay then refetch to ensure server has committed
                setTimeout(() => {
                    queryClient.invalidateQueries({ queryKey: ['content', lang] });
                }, 500);
                return true;
            }

            if (res.status === 401) {
                console.warn('[ContentContext] Unauthorized. Token might be expired.');
                localStorage.removeItem('admin_token');
            }
            return false;
        } catch {
            return false;
        }
    }, [queryClient]);

    return (
        <ContentContext.Provider value={{ content, loading, updateSection, refreshContent }}>
            {children}
        </ContentContext.Provider>
    );
}

export function useContent() {
    const ctx = useContext(ContentContext);
    if (!ctx) throw new Error('useContent must be used within ContentProvider');
    return ctx;
}
