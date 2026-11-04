import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Search, X, ArrowRight, CornerDownLeft, FileText, ShoppingCart,
    FolderOpen, Users, Trophy, Phone, Shield, Sparkles, Receipt,
    Wallet, Database, Cpu, Lightbulb, Star, BarChart3, MessageCircle,
    Globe, Sun, Moon, CheckCircle2, ChevronRight, Hash, Compass,
    ExternalLink
} from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { useAdminTheme } from '@/contexts/AdminThemeContext';

export interface SearchItem {
    id: string;
    title: string;
    subtitle?: string;
    category: 'Pages' | 'Services' | 'Projects' | 'Actions' | 'Finance' | 'Settings';
    icon: React.ComponentType<{ className?: string }>;
    path?: string;
    action?: () => void;
    keywords?: string[];
    badge?: string;
}

interface UniversalSearchModalProps {
    open: boolean;
    onClose: () => void;
    mode: 'visitor' | 'admin';
}

export function UniversalSearchModal({ open, onClose, mode }: UniversalSearchModalProps) {
    const navigate = useNavigate();
    const { lang, toggleLang } = useLang();
    const { isLight, toggleTheme } = useAdminTheme();
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    // Focus input whenever opened
    useEffect(() => {
        if (open) {
            setQuery('');
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [open]);

    // Build Search Items based on mode
    const searchItems: SearchItem[] = useMemo(() => {
        if (mode === 'admin') {
            return [
                // Quick Admin Actions
                {
                    id: 'act-invoice',
                    title: 'Create Customer Invoice',
                    subtitle: 'Draft a new branded invoice with itemized services',
                    category: 'Actions',
                    icon: Receipt,
                    badge: 'Billing',
                    path: '/admin/invoices',
                    keywords: ['new', 'invoice', 'create', 'bill', 'customer'],
                },
                {
                    id: 'act-finance',
                    title: 'View Finance Suite',
                    subtitle: 'Live revenue, operational expenses, and distributions',
                    category: 'Actions',
                    icon: Wallet,
                    badge: 'Finance',
                    path: '/admin/finance',
                    keywords: ['money', 'revenue', 'expense', 'profit', 'charts'],
                },
                {
                    id: 'act-leads',
                    title: 'Manage CRM Leads',
                    subtitle: 'Review incoming contact submissions and proposals',
                    category: 'Actions',
                    icon: BarChart3,
                    badge: 'CRM',
                    path: '/admin/leads',
                    keywords: ['leads', 'contacts', 'inbox', 'messages', 'proposals'],
                },
                {
                    id: 'act-theme',
                    title: isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode',
                    subtitle: 'Toggle admin panel appearance',
                    category: 'Actions',
                    icon: isLight ? Moon : Sun,
                    badge: 'Theme',
                    action: () => toggleTheme(),
                    keywords: ['dark', 'light', 'mode', 'theme', 'color', 'appearance'],
                },
                {
                    id: 'act-audit',
                    title: 'View Security Audit Logs',
                    subtitle: 'Inspect timestamped admin actions and mutations',
                    category: 'Actions',
                    icon: Shield,
                    badge: 'Security',
                    path: '/admin/audit',
                    keywords: ['audit', 'logs', 'history', 'security', 'who'],
                },
                {
                    id: 'act-backup',
                    title: 'Cloud Database Backup',
                    subtitle: 'Create manual snapshot or restore database',
                    category: 'Actions',
                    icon: Database,
                    badge: 'Backup',
                    path: '/admin/backup',
                    keywords: ['backup', 'database', 'restore', 'snapshot', 'sql'],
                },

                // Admin Modules & Navigation
                {
                    id: 'mod-invoices',
                    title: 'Invoices & Billing Hub',
                    subtitle: 'Full invoicing ledger, PDF generation, email dispatch',
                    category: 'Finance',
                    icon: Receipt,
                    path: '/admin/invoices',
                    keywords: ['invoice', 'pdf', 'paid', 'sent', 'overdue'],
                },
                {
                    id: 'mod-finance',
                    title: 'Corporate Finance Dashboard',
                    subtitle: 'Transactions, category breakdowns, savings goals',
                    category: 'Finance',
                    icon: Wallet,
                    path: '/admin/finance',
                    keywords: ['finance', 'transactions', 'bank', 'cash', 'ledger'],
                },
                {
                    id: 'mod-projects',
                    title: 'Portfolio Projects',
                    subtitle: 'Add, update, or reorder showcase projects',
                    category: 'Pages',
                    icon: FolderOpen,
                    path: '/admin/project',
                    keywords: ['project', 'portfolio', 'case study', 'work', 'client'],
                },
                {
                    id: 'mod-services',
                    title: 'Services & Offerings',
                    subtitle: 'Edit service cards, features, and capabilities',
                    category: 'Pages',
                    icon: ShoppingCart,
                    path: '/admin/services',
                    keywords: ['services', 'solutions', 'offerings', 'web', 'mobile'],
                },
                {
                    id: 'mod-hero',
                    title: 'Hero Section Editor',
                    subtitle: 'Headline, tagline, primary call-to-actions',
                    category: 'Pages',
                    icon: FileText,
                    path: '/admin/hero',
                    keywords: ['hero', 'title', 'headline', 'landing', 'intro'],
                },
                {
                    id: 'mod-tech',
                    title: 'Tech Stack & Architecture',
                    subtitle: 'Manage technologies, cloud engines, and frameworks',
                    category: 'Pages',
                    icon: Cpu,
                    path: '/admin/tech-stack',
                    keywords: ['tech', 'stack', 'react', 'cloudflare', 'python'],
                },
                {
                    id: 'mod-whyus',
                    title: 'Why Us Value Props',
                    subtitle: 'Competitive advantages and core pillars',
                    category: 'Pages',
                    icon: Lightbulb,
                    path: '/admin/why-us',
                    keywords: ['why us', 'benefits', 'advantages', 'pillars'],
                },
                {
                    id: 'mod-leadership',
                    title: 'Leadership & Team',
                    subtitle: 'Executive team, engineering leads, bios',
                    category: 'Pages',
                    icon: Users,
                    path: '/admin/leadership',
                    keywords: ['team', 'leadership', 'members', 'founders', 'staff'],
                },
                {
                    id: 'mod-reviews',
                    title: 'Client Reviews & Testimonials',
                    subtitle: 'Manage client endorsements and ratings',
                    category: 'Pages',
                    icon: Star,
                    path: '/admin/reviews',
                    keywords: ['reviews', 'testimonials', 'ratings', 'feedback'],
                },
                {
                    id: 'mod-achieve',
                    title: 'Achievements & Milestones',
                    subtitle: 'Track company awards, growth, and records',
                    category: 'Pages',
                    icon: Trophy,
                    path: '/admin/achievements',
                    keywords: ['achievements', 'awards', 'milestones', 'growth'],
                },
                {
                    id: 'mod-seo',
                    title: 'SEO Engine & Structured Data',
                    subtitle: 'Meta tags, OpenGraph, sitemap configuration',
                    category: 'Settings',
                    icon: Globe,
                    path: '/admin/seo',
                    keywords: ['seo', 'meta', 'google', 'search', 'sitemap'],
                },
                {
                    id: 'mod-chatbot',
                    title: 'AI Chatbot Knowledge & Prompts',
                    subtitle: 'Configure automated assistant system responses',
                    category: 'Settings',
                    icon: MessageCircle,
                    path: '/admin/chatbot',
                    keywords: ['ai', 'chat', 'bot', 'gemini', 'assistant'],
                },
                {
                    id: 'mod-optimizer',
                    title: 'Image OS & CDN Optimizer',
                    subtitle: 'Optimize asset sizes and Cloudflare R2 images',
                    category: 'Settings',
                    icon: Sparkles,
                    path: '/admin/optimizer',
                    keywords: ['images', 'r2', 'photos', 'cdn', 'optimizer'],
                },
            ];
        }

        // Visitor Mode Items
        return [
            // Core Navigation Pages
            {
                id: 'vis-home',
                title: lang === 'bn' ? 'হোম পেজ' : 'Home',
                subtitle: 'Digital product engineering & enterprise software',
                category: 'Pages',
                icon: Compass,
                path: '/',
                keywords: ['home', 'main', 'landing', 'start', 'orbit'],
            },
            {
                id: 'vis-services',
                title: lang === 'bn' ? 'আমাদের সেবাসমূহ' : 'Services & Solutions',
                subtitle: 'Full-stack web, mobile apps, AI automation, and cloud systems',
                category: 'Pages',
                icon: ShoppingCart,
                path: '/services',
                keywords: ['services', 'software', 'apps', 'development', 'solutions'],
            },
            {
                id: 'vis-projects',
                title: lang === 'bn' ? 'প্রোজেক্ট পোর্টফোলিও' : 'Featured Projects',
                subtitle: 'Explore our latest client deliverables and case studies',
                category: 'Pages',
                icon: FolderOpen,
                path: '/proj',
                keywords: ['projects', 'portfolio', 'work', 'case studies', 'apps'],
            },
            {
                id: 'vis-leadership',
                title: lang === 'bn' ? 'টিম ও লিডারশিপ' : 'Leadership & Engineering Team',
                subtitle: 'Meet the architects, developers, and founders behind Orbit SaaS',
                category: 'Pages',
                icon: Users,
                path: '/leadership',
                keywords: ['team', 'leadership', 'engineers', 'founders', 'people'],
            },
            {
                id: 'vis-achievements',
                title: lang === 'bn' ? 'অর্জন ও মাইলস্টোন' : 'Achievements & Milestones',
                subtitle: 'Company records, growth milestones, and global recognition',
                category: 'Pages',
                icon: Trophy,
                path: '/achievements',
                keywords: ['achievements', 'awards', 'milestones', 'growth'],
            },
            {
                id: 'vis-contact',
                title: lang === 'bn' ? 'যোগাযোগ ও কনসাল্টেশন' : 'Contact & Free Consultation',
                subtitle: 'Discuss your project vision with our technical team',
                category: 'Pages',
                icon: Phone,
                path: '/contact',
                keywords: ['contact', 'hire', 'quote', 'meeting', 'consultation'],
            },

            // Specialized Services
            {
                id: 'srv-web',
                title: 'Full-Stack Web Development',
                subtitle: 'Next.js, React, Node, and Cloudflare Pages high-speed architectures',
                category: 'Services',
                icon: Globe,
                badge: 'Core',
                path: '/services',
                keywords: ['web', 'website', 'react', 'nextjs', 'frontend', 'backend'],
            },
            {
                id: 'srv-mobile',
                title: 'Mobile App Engineering',
                subtitle: 'Cross-platform iOS and Android apps crafted in Flutter',
                category: 'Services',
                icon: Cpu,
                badge: 'iOS/Android',
                path: '/services',
                keywords: ['mobile', 'app', 'flutter', 'ios', 'android', 'native'],
            },
            {
                id: 'srv-ai',
                title: 'Agentic AI & Custom Chatbots',
                subtitle: 'Intelligent business automation, RAG, and custom LLM workflows',
                category: 'Services',
                icon: Sparkles,
                badge: 'AI',
                path: '/services',
                keywords: ['ai', 'agent', 'bot', 'gemini', 'automation', 'chat'],
            },
            {
                id: 'srv-cloud',
                title: 'Cloud DevOps & Edge Hosting',
                subtitle: 'Global Cloudflare, AWS, Docker serverless deployment pipelines',
                category: 'Services',
                icon: Database,
                badge: 'DevOps',
                path: '/services',
                keywords: ['cloud', 'devops', 'aws', 'cloudflare', 'hosting', 'server'],
            },

            // Quick Visitor Actions
            {
                id: 'act-quote',
                title: lang === 'bn' ? 'ফ্রি কোটেশন রিকোয়েস্ট করুন' : 'Request a Project Proposal',
                subtitle: 'Get a clear estimate and delivery timeline within 24 hours',
                category: 'Actions',
                icon: CornerDownLeft,
                path: '/contact',
                keywords: ['quote', 'price', 'cost', 'estimate', 'proposal'],
            },
            {
                id: 'act-lang',
                title: lang === 'en' ? 'বাংলা ভাষায় দেখুন (Switch to Bangla)' : 'View in English (Switch to English)',
                subtitle: 'Change interface language',
                category: 'Actions',
                icon: Globe,
                badge: lang === 'en' ? 'BN' : 'EN',
                action: () => toggleLang(),
                keywords: ['language', 'bangla', 'english', 'translate', 'locale'],
            },
            {
                id: 'act-chat',
                title: 'Chat with Orbit AI Assistant',
                subtitle: 'Instant answers to your questions about pricing, stack, and process',
                category: 'Actions',
                icon: MessageCircle,
                badge: 'Live',
                action: () => {
                    window.dispatchEvent(new CustomEvent('orbit-open-chatbot'));
                },
                keywords: ['chat', 'help', 'ai', 'support', 'question'],
            },
        ];
    }, [mode, isLight, lang, toggleTheme, toggleLang]);

    // Fuzzy filtering
    const filteredItems = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return searchItems.slice(0, 8);

        return searchItems.filter((item) => {
            const matchTitle = item.title.toLowerCase().includes(q);
            const matchSubtitle = item.subtitle?.toLowerCase().includes(q);
            const matchCategory = item.category.toLowerCase().includes(q);
            const matchKeywords = item.keywords?.some((k) => k.toLowerCase().includes(q));
            return matchTitle || matchSubtitle || matchCategory || matchKeywords;
        });
    }, [searchItems, query]);

    // Handle Keyboard Navigation (Arrows + Enter)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!open) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
            } else if (e.key === 'Enter') {
                e.preventDefault();
                const item = filteredItems[selectedIndex];
                if (item) handleSelect(item);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [open, filteredItems, selectedIndex]);

    const handleSelect = (item: SearchItem) => {
        onClose();
        if (item.action) {
            item.action();
        } else if (item.path) {
            navigate(item.path);
        }
    };

    return (
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-[500] flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/75 backdrop-blur-md overflow-y-auto">
                    {/* Backdrop dismiss */}
                    <div className="fixed inset-0 -z-10" onClick={onClose} />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: -10 }}
                        transition={{ duration: 0.18, ease: 'easeOut' }}
                        className={`w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border transition-colors ${
                            mode === 'admin' && isLight
                                ? 'bg-white border-zinc-200 text-zinc-900 shadow-zinc-300/60'
                                : 'bg-[#0f0f16]/95 border-white/10 text-white shadow-black/90'
                        } backdrop-blur-2xl`}
                    >
                        {/* Search Input Bar */}
                        <div className={`flex items-center gap-3 px-4 py-3.5 border-b ${
                            mode === 'admin' && isLight ? 'border-zinc-200 bg-zinc-50/80' : 'border-white/10 bg-white/[0.02]'
                        }`}>
                            <Search className={`w-5 h-5 shrink-0 ${
                                mode === 'admin' && isLight ? 'text-zinc-500' : 'text-primary'
                            }`} />
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={(e) => {
                                    setQuery(e.target.value);
                                    setSelectedIndex(0);
                                }}
                                placeholder={
                                    mode === 'admin'
                                        ? 'Search invoices, leads, modules, or actions... (e.g. "invoice", "finance")'
                                        : (lang === 'bn' ? 'সার্ভিস, প্রোজেক্ট বা পেইজ সার্চ করুন...' : 'Search services, projects, team, or actions...')
                                }
                                className={`flex-1 bg-transparent border-0 outline-none text-sm sm:text-base font-medium placeholder:text-muted-foreground/60 ${
                                    mode === 'admin' && isLight ? 'text-zinc-900' : 'text-white'
                                }`}
                            />
                            {query && (
                                <button
                                    onClick={() => setQuery('')}
                                    className="p-1 rounded-md text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                            <kbd className={`hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${
                                mode === 'admin' && isLight
                                    ? 'bg-zinc-100 text-zinc-600 border-zinc-300'
                                    : 'bg-white/10 text-white/70 border-white/15'
                            }`}>
                                ESC
                            </kbd>
                        </div>

                        {/* Search Results List */}
                        <div className="max-h-[60vh] overflow-y-auto p-2 space-y-1">
                            {filteredItems.length === 0 ? (
                                <div className="py-12 text-center text-muted-foreground">
                                    <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                    <p className="text-sm font-semibold">No results found for "{query}"</p>
                                    <p className="text-xs opacity-75 mt-0.5">Try searching for keywords like "invoices", "services", "team", or "quote"</p>
                                </div>
                            ) : (
                                filteredItems.map((item, idx) => {
                                    const Icon = item.icon;
                                    const isSelected = idx === selectedIndex;
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => handleSelect(item)}
                                            onMouseEnter={() => setSelectedIndex(idx)}
                                            className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                                                isSelected
                                                    ? (mode === 'admin' && isLight
                                                        ? 'bg-indigo-50 border border-indigo-200/80 text-zinc-900'
                                                        : 'bg-primary/15 border border-primary/30 text-white')
                                                    : 'border border-transparent hover:bg-black/5 dark:hover:bg-white/5'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className={`p-2 rounded-lg shrink-0 ${
                                                    isSelected
                                                        ? (mode === 'admin' && isLight ? 'bg-indigo-600 text-white' : 'bg-primary text-primary-foreground')
                                                        : (mode === 'admin' && isLight ? 'bg-zinc-100 text-zinc-600' : 'bg-white/5 text-muted-foreground')
                                                }`}>
                                                    <Icon className="w-4 h-4" />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-sm truncate">{item.title}</span>
                                                        {item.badge && (
                                                            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                                                                mode === 'admin' && isLight
                                                                    ? 'bg-zinc-200/80 text-zinc-700'
                                                                    : 'bg-white/10 text-white/80'
                                                            }`}>
                                                                {item.badge}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {item.subtitle && (
                                                        <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 shrink-0">
                                                <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                                                    mode === 'admin' && isLight
                                                        ? 'bg-zinc-100 text-zinc-600'
                                                        : 'bg-white/5 text-white/60'
                                                }`}>
                                                    {item.category}
                                                </span>
                                                {isSelected && (
                                                    <CornerDownLeft className="w-3.5 h-3.5 text-muted-foreground hidden sm:block" />
                                                )}
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>

                        {/* Footer Tips */}
                        <div className={`px-4 py-2.5 border-t flex items-center justify-between text-xs text-muted-foreground ${
                            mode === 'admin' && isLight ? 'border-zinc-200 bg-zinc-50/90' : 'border-white/10 bg-white/[0.02]'
                        }`}>
                            <div className="flex items-center gap-3">
                                <span className="flex items-center gap-1">
                                    <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-[10px]">↑</kbd>
                                    <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-[10px]">↓</kbd>
                                    <span>Navigate</span>
                                </span>
                                <span className="flex items-center gap-1">
                                    <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-[10px]">↵</kbd>
                                    <span>Select</span>
                                </span>
                            </div>
                            <span className="text-[11px] font-medium hidden sm:inline">
                                {mode === 'admin' ? 'Orbit SaaS Admin Command Palette' : 'ORBIT SaaS Global Search'}
                            </span>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
