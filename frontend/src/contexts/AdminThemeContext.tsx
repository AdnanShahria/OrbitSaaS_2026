import React, { createContext, useContext, useState, useEffect } from 'react';

type AdminTheme = 'light' | 'dark';

interface AdminThemeContextType {
    theme: AdminTheme;
    isLight: boolean;
    toggleTheme: () => void;
    setTheme: (theme: AdminTheme) => void;
}

const AdminThemeContext = createContext<AdminThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'orbit_admin_theme';
const FINANCE_STORAGE_KEY = 'orbit_admin_finance_theme';

export function AdminThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<AdminTheme>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(FINANCE_STORAGE_KEY);
            if (saved === 'light' || saved === 'dark') {
                return saved;
            }
        }
        return 'light'; // Default to pristine Apple White theme
    });

    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, theme);
            localStorage.setItem(FINANCE_STORAGE_KEY, theme);
        }
    }, [theme]);

    const toggleTheme = () => {
        setThemeState(prev => (prev === 'light' ? 'dark' : 'light'));
    };

    const setTheme = (newTheme: AdminTheme) => {
        setThemeState(newTheme);
    };

    return (
        <AdminThemeContext.Provider value={{ theme, isLight: theme === 'light', toggleTheme, setTheme }}>
            {children}
        </AdminThemeContext.Provider>
    );
}

export function useAdminTheme() {
    const context = useContext(AdminThemeContext);
    if (!context) {
        // Fallback default if rendered outside provider
        return {
            theme: 'light' as AdminTheme,
            isLight: true,
            toggleTheme: () => {},
            setTheme: () => {},
        };
    }
    return context;
}
