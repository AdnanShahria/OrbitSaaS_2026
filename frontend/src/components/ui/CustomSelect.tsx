import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';
import { createPortal } from 'react-dom';

export interface SelectOption {
    value: string;
    label: string;
    color?: string; // Optional hex color for tags
}

interface CustomSelectProps {
    value: string;
    onChange: (value: string) => void;
    options: SelectOption[];
    placeholder?: string;
    className?: string;
    disabled?: boolean;
    themeMode?: 'light' | 'dark';
}

export function CustomSelect({ value, onChange, options, placeholder = "Select...", className = "", disabled = false, themeMode }: CustomSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
    const containerRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Compute dropdown position relative to viewport (portal-safe)
    const updateDropdownPosition = () => {
        if (!buttonRef.current) return;
        const rect = buttonRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const dropUp = spaceBelow < 260 && rect.top > 260;
        const minWidth = Math.max(rect.width, 180);
        let left = rect.left;
        if (left + minWidth > window.innerWidth - 12) {
            left = window.innerWidth - minWidth - 12;
        }

        setDropdownStyle({
            position: 'fixed',
            left: `${Math.max(8, left)}px`,
            width: `${minWidth}px`,
            zIndex: 999999,
            ...(dropUp
                ? { bottom: `${window.innerHeight - rect.top + 6}px` }
                : { top: `${rect.bottom + 6}px` }),
        });
    };

    // Handle outside click to close
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            const target = event.target as Node;
            if (
                containerRef.current && !containerRef.current.contains(target) &&
                dropdownRef.current && !dropdownRef.current.contains(target)
            ) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Re-align on scroll/resize
    useEffect(() => {
        if (!isOpen) return;
        const handleScrollOrResize = () => {
            updateDropdownPosition();
        };
        window.addEventListener('scroll', handleScrollOrResize, true);
        window.addEventListener('resize', handleScrollOrResize);
        return () => {
            window.removeEventListener('scroll', handleScrollOrResize, true);
            window.removeEventListener('resize', handleScrollOrResize);
        };
    }, [isOpen]);

    const selectedOption = options.find(opt => opt.value === value);
    const isLight = themeMode === 'light';

    const handleOpen = () => {
        if (disabled) return;
        updateDropdownPosition();
        setIsOpen(prev => !prev);
    };

    const dropdown = isOpen && createPortal(
        <AnimatePresence>
            <motion.div
                ref={dropdownRef}
                key="dropdown"
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                style={dropdownStyle}
                className={`rounded-2xl shadow-2xl overflow-hidden backdrop-blur-2xl ${
                    isLight
                        ? 'bg-white/98 border border-black/[0.1] shadow-[0_16px_40px_rgba(0,0,0,0.16)] text-[#1d1d1f]'
                        : 'bg-[#1c1c1e]/98 border border-white/[0.14] shadow-[0_20px_50px_rgba(0,0,0,0.7)] text-foreground'
                }`}
            >
                <div className="max-h-64 overflow-y-auto custom-scrollbar p-1.5 flex flex-col gap-0.5">
                    {options.length === 0 ? (
                        <div className={`px-3 py-3 text-xs text-center ${isLight ? 'text-neutral-400' : 'text-muted-foreground'}`}>No options</div>
                    ) : (
                        options.map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => {
                                    onChange(opt.value);
                                    setIsOpen(false);
                                }}
                                className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-xl transition-colors cursor-pointer text-left ${
                                    value === opt.value
                                        ? (isLight ? 'bg-[#0071e3]/10 text-[#0071e3] font-semibold' : 'bg-primary/10 text-primary font-bold')
                                        : (isLight ? 'text-[#1d1d1f] hover:bg-black/[0.04]' : 'text-neutral-200 hover:bg-white/[0.06]')
                                }`}
                            >
                                <span className="truncate">{opt.label}</span>
                                {value === opt.value && (
                                    <Check className={`w-4 h-4 shrink-0 ml-2 ${isLight ? 'text-[#0071e3]' : 'text-primary'}`} />
                                )}
                            </button>
                        ))
                    )}
                </div>
            </motion.div>
        </AnimatePresence>,
        document.body
    );

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <button
                ref={buttonRef}
                type="button"
                disabled={disabled}
                onClick={handleOpen}
                className={`w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm outline-none transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                    isLight
                        ? `bg-white text-[#1d1d1f] border shadow-xs ${isOpen ? 'border-[#0071e3] ring-2 ring-[#0071e3]/20' : 'border-black/[0.12] hover:border-black/[0.25]'}`
                        : `bg-secondary text-foreground border border-border ${isOpen ? 'ring-2 ring-primary/50 border-primary/50' : 'hover:border-primary/50'}`
                }`}
            >
                <span className={`truncate ${!selectedOption ? (isLight ? 'text-neutral-400' : 'text-muted-foreground') : 'font-medium'}`}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown className={`w-4 h-4 ${isLight ? 'text-neutral-400' : 'text-muted-foreground'}`} />
                </motion.div>
            </button>

            {dropdown}
        </div>
    );
}
