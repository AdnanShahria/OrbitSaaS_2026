import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useFinanceTheme } from './FinanceThemeContext';

interface AppleThemeToggleProps {
    className?: string;
    showLabel?: boolean;
}

export default function AppleThemeToggle({ className = '', showLabel = false }: AppleThemeToggleProps) {
    const { theme, isLight, setTheme } = useFinanceTheme();

    return (
        <div
            className={`inline-flex items-center p-1 rounded-full border transition-all duration-300 select-none ${
                isLight
                    ? 'bg-black/[0.04] border-black/[0.08] shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]'
                    : 'bg-white/[0.06] border-white/[0.1] shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)]'
            } ${className}`}
            role="group"
            aria-label="Theme switcher"
        >
            <button
                type="button"
                onClick={() => setTheme('light')}
                className={`relative px-2.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 cursor-pointer ${
                    isLight
                        ? 'text-[#1d1d1f]'
                        : 'text-neutral-400 hover:text-white'
                }`}
                title="Apple White Theme"
            >
                {isLight && (
                    <motion.div
                        layoutId="apple-theme-pill"
                        className="absolute inset-0 rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.08)] border border-black/[0.04]"
                        transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                    />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                    <Sun className={`w-3.5 h-3.5 transition-transform duration-300 ${isLight ? 'text-amber-500 scale-110' : ''}`} />
                    {showLabel && <span>Light</span>}
                </span>
            </button>

            <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`relative px-2.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 cursor-pointer ${
                    !isLight
                        ? 'text-white'
                        : 'text-neutral-500 hover:text-black'
                }`}
                title="Apple Dark Theme"
            >
                {!isLight && (
                    <motion.div
                        layoutId="apple-theme-pill"
                        className="absolute inset-0 rounded-full bg-[#2c2c2e] shadow-[0_2px_8px_rgba(0,0,0,0.5)] border border-white/[0.1]"
                        transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                    />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                    <Moon className={`w-3.5 h-3.5 transition-transform duration-300 ${!isLight ? 'text-indigo-400 scale-110' : ''}`} />
                    {showLabel && <span>Dark</span>}
                </span>
            </button>
        </div>
    );
}
