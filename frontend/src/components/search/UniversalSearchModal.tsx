import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Search, X, CornerDownLeft, FileText, ShoppingCart,
    FolderOpen, Users, Trophy, Phone, Shield, Sparkles, Receipt,
    Wallet, Database, Cpu, Lightbulb, Star, BarChart3, MessageCircle,
    Globe, Sun, Moon, Compass, Brain, Layers, ExternalLink
} from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { useAdminTheme } from '@/contexts/AdminThemeContext';
import { useContent } from '@/contexts/ContentContext';
import { BASELINE_SHOWCASE_METADATA } from '@/data/projectShowcaseData';
import { getImageUrl } from '@/lib/imageUrl';

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
    badgeColor?: string;
    image?: string;
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
    const { content, refreshContent } = useContent();

    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [liveProjects, setLiveProjects] = useState<any[]>([]);
    const [isFetchingRealtime, setIsFetchingRealtime] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Real-time synchronization when modal opens
    useEffect(() => {
        if (open) {
            setQuery('');
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 50);

            // Trigger real-time background refresh from ContentContext
            refreshContent?.().catch(() => {});

            // Direct real-time fetch failsafe to guarantee freshest DB data
            setIsFetchingRealtime(true);
            const API_BASE = import.meta.env.VITE_API_URL || '';
            fetch(`${API_BASE}/api/content?lang=${lang}`)
                .then(res => res.ok ? res.json() : null)
                .then(data => {
                    if (data?.content?.projects?.items && Array.isArray(data.content.projects.items)) {
                        setLiveProjects(data.content.projects.items);
                    }
                })
                .catch(err => console.debug('[Search] Realtime fetch error:', err))
                .finally(() => setIsFetchingRealtime(false));
        }
    }, [open, lang, refreshContent]);

    // Build Search Items based on mode and real-time live content
    const searchItems: SearchItem[] = useMemo(() => {
        const isBn = lang === 'bn';

        // 1. Ingest real-time projects
        const rawContentProjects = 
            liveProjects.length > 0 
                ? liveProjects 
                : ((content[lang] as any)?.projects?.items || (content.en as any)?.projects?.items || []);

        const projectMap = new Map<string, any>();

        // Seed with baseline showcase metadata (guarantees lifesolver, unimind, etc. always exist)
        Object.entries(BASELINE_SHOWCASE_METADATA).forEach(([id, meta]) => {
            projectMap.set(id.toLowerCase(), {
                id,
                title: meta.name,
                name: meta.name,
                subtitle: isBn ? meta.taglineBn : meta.taglineEn,
                category: isBn ? meta.categoryBn : meta.categoryEn,
                type: meta.type,
                typeLabel: isBn ? meta.typeLabelBn : meta.typeLabelEn,
                icon: meta.icon,
                image: '',
                link: meta.defaultLink,
                badgeBg: meta.badgeBg,
                badgeColor: meta.badgeColor,
            });
        });

        // Overlay with live database projects
        if (Array.isArray(rawContentProjects)) {
            rawContentProjects.forEach((proj: any, idx: number) => {
                const id = (proj.id || String(idx)).toLowerCase();
                const existing = projectMap.get(id);
                const title = isBn && proj.bn?.title?.trim() ? proj.bn.title : (proj.title || existing?.title || 'Project');
                const rawDesc = isBn && proj.bn?.description?.trim() 
                    ? proj.bn.description 
                    : (proj.desc || proj.subtitle || existing?.subtitle || '');
                const cleanDesc = rawDesc.replace(/<[^>]*>?/gm, '').slice(0, 95);
                const primaryImage = proj.images?.[0] || proj.image || existing?.image || '';

                projectMap.set(id, {
                    id: proj.id || id,
                    title,
                    name: existing?.name || title.split(/[:—–\-(_]/)[0].trim(),
                    subtitle: cleanDesc || existing?.subtitle || 'Orbit Production-Ready Platform',
                    category: proj.category || existing?.category || (isBn ? 'স্যাস' : 'SaaS'),
                    type: existing?.type || (idx % 2 !== 0 ? 'client' : 'in-house'),
                    typeLabel: existing?.typeLabel || (proj.type === 'in-house' ? (isBn ? 'অরবিট ইন-হাউস' : 'Orbit In-House') : (isBn ? 'ক্লায়েন্ট প্রজেক্ট' : 'Client Project')),
                    icon: existing?.icon || FolderOpen,
                    image: primaryImage,
                    link: proj.link || existing?.link,
                    badgeColor: existing?.badgeColor || '#10b981',
                    tags: Array.isArray(proj.tags) ? proj.tags : [],
                    hidden: !!proj.hidden,
                });
            });
        }

        const projectItems: SearchItem[] = Array.from(projectMap.values())
            .filter(p => !p.hidden)
            .map((p) => {
                const isClient = p.type === 'client';
                return {
                    id: `proj-${p.id}`,
                    title: p.title,
                    subtitle: p.subtitle,
                    category: 'Projects',
                    icon: p.icon || FolderOpen,
                    badge: isClient ? (isBn ? 'ক্লায়েন্ট' : 'Client') : (isBn ? 'ইন-হাউস' : 'In-House'),
                    badgeColor: p.badgeColor,
                    image: p.image,
                    path: mode === 'admin' ? '/admin/project' : `/project/${p.id}`,
                    keywords: [
                        p.id,
                        p.title,
                        p.name || '',
                        p.subtitle || '',
                        p.category || '',
                        ...(p.tags || []),
                        'lifesolver',
                        'project',
                        'portfolio',
                        'case study',
                        'saas',
                        'app',
                    ],
                };
            });

        // 2. Ingest real-time services
        const rawServices = (content[lang] as any)?.services?.items || (content.en as any)?.services?.items || [];
        const liveServiceItems: SearchItem[] = Array.isArray(rawServices) && rawServices.length > 0
            ? rawServices.map((srv: any, idx: number) => ({
                id: `srv-live-${idx}`,
                title: srv.title || (isBn ? 'সার্ভিস' : 'Service'),
                subtitle: srv.desc ? srv.desc.replace(/<[^>]*>?/gm, '').slice(0, 90) : (isBn ? 'অরবিট সফটওয়্যার সেবা' : 'Orbit Software Engineering Service'),
                category: 'Services',
                icon: ShoppingCart,
                badge: srv.badge || (isBn ? 'সার্ভিস' : 'Core Service'),
                path: mode === 'admin' ? '/admin/services' : '/services',
                keywords: [srv.title || '', srv.desc || '', ...(srv.features || []), 'service', 'solution'],
            }))
            : [];

        // 3. Ingest real-time achievements
        const rawAchievements = (content[lang] as any)?.achievements?.items || (content.en as any)?.achievements?.items || [];
        const liveAchievementItems: SearchItem[] = Array.isArray(rawAchievements)
            ? rawAchievements.map((ach: any, idx: number) => ({
                id: `ach-live-${ach.id || idx}`,
                title: ach.title || (isBn ? 'অর্জন ও মাইলস্টোন' : 'Achievement & Milestone'),
                subtitle: ach.desc ? ach.desc.replace(/<[^>]*>?/gm, '').slice(0, 85) : '',
                category: 'Pages',
                icon: Trophy,
                badge: ach.category || (isBn ? 'অর্জন' : 'Award'),
                path: mode === 'admin' ? '/admin/achievements' : (ach.id ? `/achievement/${ach.id}` : '/achievements'),
                keywords: [ach.id || '', ach.title || '', ach.desc || '', 'achievement', 'milestone', 'award', 'trophy'],
            }))
            : [];

        // 4. Ingest real-time leadership members
        const rawLeadership = (content[lang] as any)?.leadership?.members || (content.en as any)?.leadership?.members || [];
        const liveLeadershipItems: SearchItem[] = Array.isArray(rawLeadership)
            ? rawLeadership.map((member: any, idx: number) => ({
                id: `lead-live-${idx}`,
                title: member.name || (isBn ? 'টিম মেম্বার' : 'Team Member'),
                subtitle: `${member.role || 'Leader'} ${member.bio ? '— ' + member.bio.slice(0, 60) : ''}`,
                category: 'Pages',
                icon: Users,
                badge: member.role || (isBn ? 'লিডারশিপ' : 'Leadership'),
                path: mode === 'admin' ? '/admin/leadership' : '/leadership',
                keywords: [member.name || '', member.role || '', 'team', 'founder', 'engineer', 'leader'],
            }))
            : [];

        if (mode === 'admin') {
            const adminActions: SearchItem[] = [
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
                // Admin Modules
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
                    keywords: ['project', 'portfolio', 'case study', 'work', 'client', 'lifesolver'],
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

            return [...adminActions, ...projectItems, ...liveServiceItems];
        }

        // Visitor Mode Items
        const visitorPages: SearchItem[] = [
            {
                id: 'vis-home',
                title: isBn ? 'হোম পেজ' : 'Home',
                subtitle: isBn ? 'ডিজিটাল প্রোডাক্ট ইঞ্জিনিয়ারিং ও এন্টারপ্রাইজ সফটওয়্যার' : 'Digital product engineering & enterprise software',
                category: 'Pages',
                icon: Compass,
                path: '/',
                keywords: ['home', 'main', 'landing', 'start', 'orbit'],
            },
            {
                id: 'vis-services',
                title: isBn ? 'আমাদের সেবাসমূহ' : 'Services & Solutions',
                subtitle: isBn ? 'ফুল-স্ট্যাক ওয়েব, মোবাইল অ্যাপ, এআই অটোমেশন ও ক্লাউড সিস্টেম' : 'Full-stack web, mobile apps, AI automation, and cloud systems',
                category: 'Pages',
                icon: ShoppingCart,
                path: '/services',
                keywords: ['services', 'software', 'apps', 'development', 'solutions'],
            },
            {
                id: 'vis-projects',
                title: isBn ? 'প্রোজেক্ট পোর্টফোলিও' : 'Featured Projects',
                subtitle: isBn ? 'আমাদের ক্লায়েন্ট ডেলিভারেবল ও কেস স্টাডি দেখুন' : 'Explore our latest client deliverables and case studies',
                category: 'Pages',
                icon: FolderOpen,
                path: '/proj',
                keywords: ['projects', 'portfolio', 'work', 'case studies', 'apps'],
            },
            {
                id: 'vis-leadership',
                title: isBn ? 'টিম ও লিডারশিপ' : 'Leadership & Engineering Team',
                subtitle: isBn ? 'অরবিট স্যাস-এর আর্কিটেক্ট, ডেভেলপার ও প্রতিষ্ঠাতাবৃন্দ' : 'Meet the architects, developers, and founders behind Orbit SaaS',
                category: 'Pages',
                icon: Users,
                path: '/leadership',
                keywords: ['team', 'leadership', 'engineers', 'founders', 'people'],
            },
            {
                id: 'vis-achievements',
                title: isBn ? 'অর্জন ও মাইলস্টোন' : 'Achievements & Milestones',
                subtitle: isBn ? 'কোম্পানি রেকর্ড, আন্তর্জাতিক অ্যাওয়ার্ড ও গ্রোথ মাইলস্টোন' : 'Company records, growth milestones, and global recognition',
                category: 'Pages',
                icon: Trophy,
                path: '/achievements',
                keywords: ['achievements', 'awards', 'milestones', 'growth'],
            },
            {
                id: 'vis-contact',
                title: isBn ? 'যোগাযোগ ও কনসাল্টেশন' : 'Contact & Free Consultation',
                subtitle: isBn ? 'আমাদের টেকনিক্যাল টিমের সাথে আপনার প্রজেক্ট নিয়ে আলোচনা করুন' : 'Discuss your project vision with our technical team',
                category: 'Pages',
                icon: Phone,
                path: '/contact',
                keywords: ['contact', 'hire', 'quote', 'meeting', 'consultation'],
            },
            {
                id: 'vis-privacy',
                title: isBn ? 'গোপনীয়তা নীতি' : 'Privacy Policy',
                subtitle: isBn ? 'তথ্য নিরাপত্তা ও ডেটা প্রটেকশন নীতি' : 'Data protection and visitor privacy standards',
                category: 'Pages',
                icon: Shield,
                path: '/privacy',
                keywords: ['privacy', 'policy', 'terms', 'legal', 'data'],
            },
            {
                id: 'vis-terms',
                title: isBn ? 'ব্যবহারের শর্তাবলী' : 'Terms of Service',
                subtitle: isBn ? 'সার্ভিস ব্যবহার ও চুক্তিনামা সম্পর্কিত নিয়ম' : 'Usage guidelines and commercial agreements',
                category: 'Pages',
                icon: FileText,
                path: '/terms',
                keywords: ['terms', 'service', 'legal', 'contract', 'agreement'],
            },
        ];

        const defaultServices: SearchItem[] = [
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
        ];

        const visitorActions: SearchItem[] = [
            {
                id: 'act-quote',
                title: isBn ? 'ফ্রি কোটেশন রিকোয়েস্ট করুন' : 'Request a Project Proposal',
                subtitle: isBn ? '২৪ ঘণ্টার মধ্যে সঠিক বাজেট ও টাইমলাইন প্রপোজাল পান' : 'Get a clear estimate and delivery timeline within 24 hours',
                category: 'Actions',
                icon: CornerDownLeft,
                path: '/contact',
                keywords: ['quote', 'price', 'cost', 'estimate', 'proposal', 'hire'],
            },
            {
                id: 'act-lang',
                title: lang === 'en' ? 'বাংলা ভাষায় দেখুন (Switch to Bangla)' : 'View in English (Switch to English)',
                subtitle: isBn ? 'ওয়েবসাইটের ভাষা পরিবর্তন করুন' : 'Change interface language to Bangla or English',
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

        const servicesToInclude = liveServiceItems.length > 0 ? liveServiceItems : defaultServices;

        // Combine all items: Projects prioritised, followed by Services, Pages, Achievements, and Actions
        return [
            ...projectItems,
            ...servicesToInclude,
            ...visitorPages,
            ...liveAchievementItems,
            ...liveLeadershipItems,
            ...visitorActions,
        ];
    }, [mode, isLight, lang, toggleTheme, toggleLang, content, liveProjects]);

    // Intelligent Search & Scoring
    const filteredItems = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) {
            // When query is empty, show a balanced selection of top items
            return searchItems.slice(0, 10);
        }

        const scored = searchItems.map((item) => {
            const titleLower = item.title.toLowerCase();
            const idLower = item.id.toLowerCase();
            const subLower = (item.subtitle || '').toLowerCase();
            const catLower = item.category.toLowerCase();
            const keywords = item.keywords || [];

            let score = 0;

            // Direct ID match (e.g., 'lifesolver' or 'proj-lifesolver')
            if (idLower === q || idLower === `proj-${q}`) {
                score += 120;
            } else if (idLower.includes(q)) {
                score += 60;
            }

            // Title match
            if (titleLower === q) {
                score += 100;
            } else if (titleLower.startsWith(q)) {
                score += 80;
            } else if (titleLower.includes(q)) {
                score += 50;
            }

            // Keywords match
            if (keywords.some(k => k.toLowerCase() === q)) {
                score += 70;
            } else if (keywords.some(k => k.toLowerCase().includes(q))) {
                score += 35;
            }

            // Subtitle match
            if (subLower.includes(q)) {
                score += 25;
            }

            // Category match
            if (catLower.includes(q)) {
                score += 15;
            }

            return { item, score };
        });

        return scored
            .filter(s => s.score > 0)
            .sort((a, b) => b.score - a.score)
            .map(s => s.item);
    }, [searchItems, query]);

    // Handle Keyboard Navigation (Arrows + Enter + Esc)
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
                <div className="fixed inset-0 z-[500] flex items-start justify-center pt-12 sm:pt-20 px-3 sm:px-4 bg-black/40 backdrop-blur-md overflow-y-auto">
                    {/* Backdrop dismiss */}
                    <div className="fixed inset-0 -z-10" onClick={onClose} />

                    {/* White Glassmorphic Command Palette */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: -12 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: -12 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className="relative w-full max-w-2xl rounded-3xl overflow-hidden transition-all bg-white/90 backdrop-blur-3xl border border-white/80 shadow-[0_30px_90px_rgba(0,0,0,0.22),0_10px_30px_rgba(0,0,0,0.08),inset_0_1px_1px_rgba(255,255,255,1)] text-zinc-900"
                    >
                        {/* Top specular hairline edge for frosted glass effect */}
                        <div className="absolute inset-x-8 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white to-transparent pointer-events-none" />

                        {/* Search Input Bar */}
                        <div className="relative flex items-center gap-3.5 px-5 py-4 border-b border-zinc-200/70 bg-white/60 backdrop-blur-md">
                            <div className="relative flex items-center justify-center">
                                <Search className="w-5 h-5 shrink-0 text-emerald-600 drop-shadow-xs" />
                                {isFetchingRealtime && (
                                    <span className="absolute -top-1 -right-1 flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                                    </span>
                                )}
                            </div>
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
                                        ? 'Search invoices, leads, projects, modules... (e.g. "lifesolver", "invoice")'
                                        : (lang === 'bn' ? 'সার্ভিস, লাইভ প্রোজেক্ট বা পেইজ সার্চ করুন... (যেমন "lifesolver")' : 'Search projects, services, team, or actions... (e.g. "lifesolver")')
                                }
                                className="flex-1 bg-transparent border-0 outline-none text-base sm:text-lg font-medium placeholder:text-zinc-400 text-zinc-900"
                            />
                            {query && (
                                <button
                                    onClick={() => setQuery('')}
                                    className="p-1.5 rounded-full hover:bg-zinc-200/70 text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer"
                                    title="Clear search"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                            <kbd className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-zinc-100/90 text-zinc-600 border border-zinc-300/80 shadow-2xs select-none">
                                ESC
                            </kbd>
                        </div>

                        {/* Search Results List */}
                        <div className="max-h-[62vh] overflow-y-auto p-3 sm:p-3.5 space-y-1.5 scrollbar-thin">
                            {filteredItems.length === 0 ? (
                                <div className="py-14 text-center text-zinc-500">
                                    <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-400 border border-zinc-200/60 shadow-inner">
                                        <Search className="w-6 h-6 opacity-60" />
                                    </div>
                                    <p className="text-base font-bold text-zinc-800">No results found for "{query}"</p>
                                    <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                                        Try searching for projects like "lifesolver", services like "web development", or keywords like "invoices", "team", or "quote"
                                    </p>
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
                                            className={`group w-full flex items-center justify-between gap-3.5 px-4 py-3 rounded-2xl text-left transition-all duration-150 cursor-pointer ${
                                                isSelected
                                                    ? 'bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-transparent border border-emerald-500/40 text-zinc-950 shadow-xs'
                                                    : 'border border-transparent hover:bg-zinc-100/80 hover:border-zinc-200/60 text-zinc-800'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3.5 min-w-0 flex-1">
                                                {/* Thumbnail or Category Icon */}
                                                <div className={`relative w-10 h-10 rounded-xl flex items-center justify-center shrink-0 overflow-hidden transition-all duration-200 ${
                                                    isSelected
                                                        ? 'bg-emerald-600 text-white shadow-xs scale-105'
                                                        : 'bg-zinc-100 text-zinc-600 border border-zinc-200/70'
                                                }`}>
                                                    {item.image ? (
                                                        <img
                                                            src={getImageUrl(item.image)}
                                                            alt={item.title}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                e.currentTarget.style.display = 'none';
                                                            }}
                                                        />
                                                    ) : (
                                                        <Icon className="w-5 h-5 shrink-0" />
                                                    )}
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className={`font-bold text-sm sm:text-[14.5px] truncate ${
                                                            isSelected ? 'text-emerald-950' : 'text-zinc-900'
                                                        }`}>
                                                            {item.title}
                                                        </span>
                                                        {item.badge && (
                                                            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full shrink-0 border ${
                                                                item.category === 'Projects'
                                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                                                                    : item.category === 'Services'
                                                                    ? 'bg-blue-50 text-blue-700 border-blue-200/80'
                                                                    : item.category === 'Finance'
                                                                    ? 'bg-amber-50 text-amber-700 border-amber-200/80'
                                                                    : 'bg-zinc-100 text-zinc-700 border-zinc-200/80'
                                                            }`}>
                                                                {item.badge}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {item.subtitle && (
                                                        <p className="text-xs text-zinc-500 truncate mt-0.5 font-normal">
                                                            {item.subtitle}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 shrink-0">
                                                <span className={`text-[9.5px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                                                    isSelected
                                                        ? 'bg-emerald-100/80 text-emerald-800 border-emerald-200/80'
                                                        : 'bg-zinc-100 text-zinc-500 border-zinc-200/60'
                                                }`}>
                                                    {item.category}
                                                </span>
                                                {isSelected && (
                                                    <CornerDownLeft className="w-4 h-4 text-emerald-700 hidden sm:block animate-pulse" />
                                                )}
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>

                        {/* White Glassmorphic Footer Tips */}
                        <div className="px-5 py-3 border-t border-zinc-200/70 bg-white/70 backdrop-blur-md flex items-center justify-between text-xs text-zinc-500 font-medium">
                            <div className="flex items-center gap-3">
                                <span className="flex items-center gap-1">
                                    <kbd className="px-1.5 py-0.5 rounded-md bg-zinc-100 border border-zinc-200 text-zinc-700 font-mono text-[10px] shadow-3xs">↑</kbd>
                                    <kbd className="px-1.5 py-0.5 rounded-md bg-zinc-100 border border-zinc-200 text-zinc-700 font-mono text-[10px] shadow-3xs">↓</kbd>
                                    <span>Navigate</span>
                                </span>
                                <span className="flex items-center gap-1">
                                    <kbd className="px-1.5 py-0.5 rounded-md bg-zinc-100 border border-zinc-200 text-zinc-700 font-mono text-[10px] shadow-3xs">↵</kbd>
                                    <span>Select</span>
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                                </span>
                                <span className="text-[11px] font-semibold text-zinc-600 hidden sm:inline">
                                    {mode === 'admin' ? 'Orbit SaaS Admin Live Command Palette' : 'ORBIT SaaS Real-Time Global Search'}
                                </span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
