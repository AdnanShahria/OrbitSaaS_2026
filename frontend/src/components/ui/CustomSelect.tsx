import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';

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
    const containerRef = useRef<HTMLDivElement>(null);

    // Handle outside click to close
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedOption = options.find(opt => opt.value === value);
    const isLight = themeMode === 'light';

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <button
                type="button"
                disabled={disabled}
                onClick={() => setIsOpen(!isOpen)}
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

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.98 }}
                        transition={{ duration: 0.15 }}
                        className={`absolute z-[100] w-full mt-1.5 rounded-2xl shadow-xl overflow-hidden backdrop-blur-xl ${
                            isLight
                                ? 'bg-white/95 border border-black/[0.08] shadow-[0_12px_36px_rgba(0,0,0,0.12)] text-[#1d1d1f]'
                                : 'bg-card/95 border border-border/80 shadow-2xl text-foreground'
                        }`}
                    >
                        <div className="max-h-60 overflow-y-auto custom-scrollbar p-1.5 flex flex-col gap-0.5">
                            {options.length === 0 ? (
                                <div className={`px-3 py-3 text-xs text-center ${isLight ? 'text-neutral-400' : 'text-muted-foreground'}`}>No options</div>
                            ) : (
                                options.map((opt) => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => {
                                            onChange(opt.value);
                                            setIsOpen(false);
                                        }}
                                        className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-xl transition-colors cursor-pointer ${
                                            value === opt.value
                                                ? (isLight ? 'bg-[#0071e3]/10 text-[#0071e3] font-semibold' : 'bg-primary/10 text-primary font-bold')
                                                : (isLight ? 'text-[#1d1d1f] hover:bg-black/[0.04]' : 'text-muted-foreground hover:bg-secondary hover:text-foreground')
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
                )}
            </AnimatePresence>
        </div>
    );
}
