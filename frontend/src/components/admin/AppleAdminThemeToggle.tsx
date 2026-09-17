import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useAdminTheme } from '@/contexts/AdminThemeContext';

interface AppleAdminThemeToggleProps {
    className?: string;
    variant?: 'segmented' | 'compact';
}

export default function AppleAdminThemeToggle({ className = '', variant = 'segmented' }: AppleAdminThemeToggleProps) {
    const { theme, isLight, setTheme } = useAdminTheme();

    if (variant === 'compact') {
        return (
            <button
                type="button"
                onClick={() => setTheme(isLight ? 'dark' : 'light')}
                title={`Switch to ${isLight ? 'Dark' : 'Light'} appearance`}
                className={`p-2 rounded-xl transition-all flex items-center justify-center cursor-pointer ${
                    isLight
                        ? 'bg-black/[0.05] hover:bg-black/[0.1] text-[#1d1d1f]'
                        : 'bg-white/10 hover:bg-white/15 text-white'
                } ${className}`}
                aria-label={`Toggle Theme (Current: ${theme})`}
            >
                {isLight ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-400" />}
            </button>
        );
    }

    return (
        <div
            className={`w-full p-1 rounded-xl flex items-center gap-1 transition-all ${
                isLight
                    ? 'bg-black/[0.04] border border-black/[0.08]'
                    : 'bg-white/[0.06] border border-white/[0.08]'
            } ${className}`}
        >
            {/* Light Option */}
            <button
                type="button"
                onClick={() => setTheme('light')}
                className={`relative flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    isLight
                        ? 'text-[#1d1d1f]'
                        : 'text-white/60 hover:text-white'
                }`}
                aria-pressed={isLight}
            >
                {isLight && (
                    <motion.div
                        layoutId="admin-sidebar-theme-capsule"
                        className={`absolute inset-0 rounded-lg shadow-sm border ${
                            isLight
                                ? 'bg-white border-black/[0.06]'
                                : 'bg-white/20 border-white/[0.1]'
                        }`}
                        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                )}
                <Sun className={`w-3.5 h-3.5 relative z-10 transition-colors ${isLight ? 'text-amber-500' : 'text-current'}`} />
                <span className="relative z-10">Light</span>
            </button>

            {/* Dark Option */}
            <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`relative flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    !isLight
                        ? 'text-white'
                        : 'text-[#6e6e73] hover:text-[#1d1d1f]'
                }`}
                aria-pressed={!isLight}
            >
                {!isLight && (
                    <motion.div
                        layoutId="admin-sidebar-theme-capsule"
                        className="absolute inset-0 rounded-lg shadow-sm border bg-white/20 border-white/[0.1]"
                        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                )}
                <Moon className={`w-3.5 h-3.5 relative z-10 transition-colors ${!isLight ? 'text-indigo-400' : 'text-current'}`} />
                <span className="relative z-10">Dark</span>
            </button>
        </div>
    );
}
