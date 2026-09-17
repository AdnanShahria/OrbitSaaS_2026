import React, { createContext, useContext, useState, useEffect } from 'react';

export type FinanceTheme = 'light' | 'dark';

interface FinanceThemeContextType {
    theme: FinanceTheme;
    isLight: boolean;
    toggleTheme: () => void;
    setTheme: (theme: FinanceTheme) => void;
}

const FinanceThemeContext = createContext<FinanceThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'orbit_admin_finance_theme';

export function FinanceThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<FinanceTheme>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved === 'light' || saved === 'dark') {
                return saved;
            }
        }
        // Default to 'light' per user's request for white theme
        return 'light';
    });

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, theme);
        } catch (e) {
            console.error('Failed to save finance theme preference:', e);
        }
    }, [theme]);

    const toggleTheme = () => {
        setThemeState(prev => (prev === 'light' ? 'dark' : 'light'));
    };

    const setTheme = (newTheme: FinanceTheme) => {
        setThemeState(newTheme);
    };

    const isLight = theme === 'light';

    return (
        <FinanceThemeContext.Provider value={{ theme, isLight, toggleTheme, setTheme }}>
            {children}
        </FinanceThemeContext.Provider>
    );
}

export function useFinanceTheme() {
    const context = useContext(FinanceThemeContext);
    if (!context) {
        // Fallback for components used outside the provider
        return {
            theme: 'light' as FinanceTheme,
            isLight: true,
            toggleTheme: () => {},
            setTheme: () => {},
        };
    }
    return context;
}
