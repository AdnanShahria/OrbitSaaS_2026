import React, { createContext, useContext } from 'react';
import { useAdminTheme } from '@/contexts/AdminThemeContext';

export type FinanceTheme = 'light' | 'dark';

interface FinanceThemeContextType {
    theme: FinanceTheme;
    isLight: boolean;
    toggleTheme: () => void;
    setTheme: (theme: FinanceTheme) => void;
}

const FinanceThemeContext = createContext<FinanceThemeContextType | undefined>(undefined);

export function FinanceThemeProvider({ children }: { children: React.ReactNode }) {
    const adminTheme = useAdminTheme();

    return (
        <FinanceThemeContext.Provider
            value={{
                theme: adminTheme.theme as FinanceTheme,
                isLight: adminTheme.isLight,
                toggleTheme: adminTheme.toggleTheme,
                setTheme: adminTheme.setTheme,
            }}
        >
            {children}
        </FinanceThemeContext.Provider>
    );
}

export function useFinanceTheme() {
    const context = useContext(FinanceThemeContext);
    if (!context) {
        return {
            theme: 'light' as FinanceTheme,
            isLight: true,
            toggleTheme: () => {},
            setTheme: () => {},
        };
    }
    return context;
}
