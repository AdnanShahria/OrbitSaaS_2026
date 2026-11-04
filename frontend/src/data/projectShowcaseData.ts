import { 
    Brain, GraduationCap, Vote, ShoppingCart, Leaf, BookOpen, 
    Users, FileText, Target, Smartphone, Layers, LucideIcon 
} from 'lucide-react';

export interface ShowcaseProjectItem {
    id: string;
    name: string;
    title: string;
    type: 'in-house' | 'client';
    typeLabel: string;
    tagline: string;
    icon: LucideIcon;
    iconName: string;
    gradient: string;
    borderAccent: string;
    badgeBg: string;
    badgeColor: string;
    link?: string;
    image?: string;
    category: string;
    featured?: boolean;
}

// Static baseline metadata map for known projects
export const BASELINE_SHOWCASE_METADATA: Record<string, {
    name: string;
    type: 'in-house' | 'client';
    typeLabelEn: string;
    typeLabelBn: string;
    taglineEn: string;
    taglineBn: string;
    icon: LucideIcon;
    iconName: string;
    gradient: string;
    borderAccent: string;
    badgeBg: string;
    badgeColor: string;
    categoryEn: string;
    categoryBn: string;
    defaultLink?: string;
}> = {
    'lifesolver': {
        name: 'LifeSolver',
        type: 'in-house',
        typeLabelEn: 'Orbit In-House',
        typeLabelBn: 'অরবিট ইন-হাউস',
        taglineEn: 'AI Life Command Centre & Personal OS',
        taglineBn: 'এআই লাইফ কমান্ড সেন্টার ও পার্সোনাল ওএস',
        icon: Brain,
        iconName: 'Brain',
        gradient: 'from-indigo-600 via-indigo-500 to-sky-400',
        borderAccent: 'rgba(99,102,241,0.4)',
        badgeBg: 'rgba(99,102,241,0.12)',
        badgeColor: '#818cf8',
        categoryEn: 'AI Life OS',
        categoryBn: 'এআই লাইফ ওএস',
        defaultLink: 'https://lifesolver.pages.dev',
    },
    'unimind': {
        name: 'UniMind',
        type: 'in-house',
        typeLabelEn: 'Orbit In-House',
        typeLabelBn: 'অরবিট ইন-হাউস',
        taglineEn: 'Academic OS for University Students',
        taglineBn: 'বিশ্ববিদ্যালয় শিক্ষার্থীদের একাডেমিক ওএস',
        icon: GraduationCap,
        iconName: 'GraduationCap',
        gradient: 'from-sky-500 via-blue-500 to-indigo-600',
        borderAccent: 'rgba(56,189,248,0.4)',
        badgeBg: 'rgba(56,189,248,0.12)',
        badgeColor: '#38bdf8',
        categoryEn: 'EdTech SaaS',
        categoryBn: 'এডটেক স্যাস',
        defaultLink: 'https://uni-mind.pages.dev/',
    },
    'amarballot': {
        name: 'Amar Ballot',
        type: 'client',
        typeLabelEn: 'Client Project',
        typeLabelBn: 'ক্লায়েন্ট প্রজেক্ট',
        taglineEn: 'RealTime Election Analytics & News Hub',
        taglineBn: 'রিয়েল-টাইম নির্বাচন ডেটা ও সংবাদ হাব',
        icon: Vote,
        iconName: 'Vote',
        gradient: 'from-emerald-500 via-teal-500 to-cyan-500',
        borderAccent: 'rgba(16,185,129,0.4)',
        badgeBg: 'rgba(16,185,129,0.12)',
        badgeColor: '#34d399',
        categoryEn: 'Real-Time Analytics',
        categoryBn: 'রিয়েল-টাইম অ্যানালিটিক্স',
        defaultLink: 'https://amarballot.app',
    },
    'e-commerce': {
        name: 'PlayPen House',
        type: 'client',
        typeLabelEn: 'Client Project',
        typeLabelBn: 'ক্লায়েন্ট প্রজেক্ট',
        taglineEn: 'Premium Baby Products & Playpens',
        taglineBn: 'প্রিমিয়াম বেবি প্লে-পেন ও এক্সেসরিজ',
        icon: ShoppingCart,
        iconName: 'ShoppingCart',
        gradient: 'from-amber-500 via-orange-500 to-rose-500',
        borderAccent: 'rgba(245,158,11,0.4)',
        badgeBg: 'rgba(245,158,11,0.12)',
        badgeColor: '#fbbf24',
        categoryEn: 'E-Commerce Store',
        categoryBn: 'ই-কমার্স প্ল্যাটফর্ম',
    },
    'ecohaat': {
        name: 'Eco Haat',
        type: 'client',
        typeLabelEn: 'Client Project',
        typeLabelBn: 'ক্লায়েন্ট প্রজেক্ট',
        taglineEn: 'Marketplace for Eco-Friendly Products',
        taglineBn: 'পরিবেশবান্ধব পণ্যের মাল্টি-ভেন্ডর মার্কেট',
        icon: Leaf,
        iconName: 'Leaf',
        gradient: 'from-emerald-600 via-green-500 to-teal-400',
        borderAccent: 'rgba(52,211,153,0.4)',
        badgeBg: 'rgba(52,211,153,0.12)',
        badgeColor: '#10b981',
        categoryEn: 'Sustainable Commerce',
        categoryBn: 'সাসটেইনেবল কমার্স',
        defaultLink: 'https://eco-haat-bd.vercel.app/',
    },
    'trackstudy': {
        name: 'TrackStudy',
        type: 'client',
        typeLabelEn: 'Client Project',
        typeLabelBn: 'ক্লায়েন্ট প্রজেক্ট',
        taglineEn: 'AI-Powered Study Management Dashboard',
        taglineBn: 'এআই স্টাডি ট্র্যাকিং ও প্রগ্রেস ড্যাশবোর্ড',
        icon: Target,
        iconName: 'Target',
        gradient: 'from-cyan-500 via-blue-500 to-indigo-500',
        borderAccent: 'rgba(6,182,212,0.4)',
        badgeBg: 'rgba(6,182,212,0.12)',
        badgeColor: '#22d3ee',
        categoryEn: 'Study OS',
        categoryBn: 'স্টাডি ওএস',
    },
    'ruetpay': {
        name: 'RuetPay',
        type: 'client',
        typeLabelEn: 'Client Project',
        typeLabelBn: 'ক্লায়েন্ট প্রজেক্ট',
        taglineEn: 'Smart Campus Mobile Payment System',
        taglineBn: 'স্মার্ট ক্যাম্পাস মোবাইল পেমেন্ট সিস্টেম',
        icon: Smartphone,
        iconName: 'Smartphone',
        gradient: 'from-blue-600 via-indigo-600 to-violet-500',
        borderAccent: 'rgba(59,130,246,0.4)',
        badgeBg: 'rgba(59,130,246,0.12)',
        badgeColor: '#60a5fa',
        categoryEn: 'FinTech App',
        categoryBn: 'ফিনটেক অ্যাপ',
    },
    'freemium-resume': {
        name: 'FreeMium Resume',
        type: 'in-house',
        typeLabelEn: 'Orbit In-House',
        typeLabelBn: 'অরবিট ইন-হাউস',
        taglineEn: 'AI-Powered Resume & Career Architect',
        taglineBn: 'এআই রেজুমি বিল্ডার ও ক্যারিয়ার স্যুট',
        icon: FileText,
        iconName: 'FileText',
        gradient: 'from-purple-600 via-fuchsia-500 to-pink-500',
        borderAccent: 'rgba(192,132,252,0.4)',
        badgeBg: 'rgba(192,132,252,0.12)',
        badgeColor: '#c084fc',
        categoryEn: 'Career SaaS',
        categoryBn: 'ক্যারিয়ার স্যাস',
    },
    'book-summery-1': {
        name: 'Focus On Matters',
        type: 'in-house',
        typeLabelEn: 'Orbit In-House',
        typeLabelBn: 'অরবিট ইন-হাউস',
        taglineEn: 'Interactive Mindset & Book Summary App',
        taglineBn: 'ইন্টারেক্টিভ বুক সামারি ও মাইন্ডসেট ওয়েব অ্যাপ',
        icon: BookOpen,
        iconName: 'BookOpen',
        gradient: 'from-amber-600 via-yellow-500 to-orange-400',
        borderAccent: 'rgba(245,158,11,0.4)',
        badgeBg: 'rgba(245,158,11,0.12)',
        badgeColor: '#fbbf24',
        categoryEn: 'Knowledge Web',
        categoryBn: 'নলেজ অ্যাপ',
        defaultLink: 'https://focus-on-what-matters.vercel.app/',
    },
    'tsme': {
        name: 'TSME Coaching',
        type: 'client',
        typeLabelEn: 'Client Project',
        typeLabelBn: 'ক্লায়েন্ট প্রজেক্ট',
        taglineEn: 'Teacher & Student Management Ecosystem',
        taglineBn: 'টিচার অ্যান্ড স্টুডেন্ট ম্যানেজমেন্ট ইকোসিস্টেম',
        icon: Users,
        iconName: 'Users',
        gradient: 'from-teal-600 via-cyan-600 to-blue-500',
        borderAccent: 'rgba(20,184,166,0.4)',
        badgeBg: 'rgba(20,184,166,0.12)',
        badgeColor: '#2dd4bf',
        categoryEn: 'Institutional ERP',
        categoryBn: 'ইনস্টিটিউট ইআরপি',
    },
    'demo': {
        name: 'Orbit SaaS Core',
        type: 'in-house',
        typeLabelEn: 'Orbit In-House',
        typeLabelBn: 'অরবিট ইন-হাউস',
        taglineEn: 'Multi-Tenant Cloud SaaS Platform Demo',
        taglineBn: 'মাল্টি-টেন্যান্ট ক্লাউড স্যাস প্ল্যাটফর্ম ডেমো',
        icon: Layers,
        iconName: 'Layers',
        gradient: 'from-indigo-600 via-purple-600 to-pink-500',
        borderAccent: 'rgba(99,102,241,0.4)',
        badgeBg: 'rgba(99,102,241,0.12)',
        badgeColor: '#a5b4fc',
        categoryEn: 'Cloud Platform',
        categoryBn: 'ক্লাউড প্ল্যাটফর্ম',
    },
};

/**
 * Normalizes title into a clean, concise display name (e.g. "LifeSolver : Ai..." -> "LifeSolver")
 */
function extractCleanName(rawTitle: string): string {
    if (!rawTitle) return 'Orbit Project';
    const firstPart = rawTitle.split(/[:—–\-(_]/)[0].trim();
    return firstPart.length > 22 ? firstPart.slice(0, 20) + '…' : firstPart;
}

/**
 * Builds rich showcase items by combining live DB projects with custom showcase metadata.
 */
export function getShowcaseProjects(contentProjects: any[], lang: string = 'en'): ShowcaseProjectItem[] {
    const isBn = lang === 'bn';

    // If no projects loaded from API yet, construct from baseline definitions
    if (!Array.isArray(contentProjects) || contentProjects.length === 0) {
        return Object.entries(BASELINE_SHOWCASE_METADATA).map(([id, meta]) => ({
            id,
            name: meta.name,
            title: meta.name,
            type: meta.type,
            typeLabel: isBn ? meta.typeLabelBn : meta.typeLabelEn,
            tagline: isBn ? meta.taglineBn : meta.taglineEn,
            icon: meta.icon,
            iconName: meta.iconName,
            gradient: meta.gradient,
            borderAccent: meta.borderAccent,
            badgeBg: meta.badgeBg,
            badgeColor: meta.badgeColor,
            link: meta.defaultLink,
            category: isBn ? meta.categoryBn : meta.categoryEn,
            featured: meta.type === 'in-house',
        }));
    }

    return contentProjects
        .filter(p => !p.hidden)
        .map((p, index) => {
            const id = p.id || String(index);
            const meta = BASELINE_SHOWCASE_METADATA[id];

            // Resolve project image (primary cover or placeholder)
            const image = p.images?.[0] || p.image || '';
            const rawTitle = p.title || meta?.name || `Project ${index + 1}`;
            const name = meta?.name || extractCleanName(rawTitle);
            
            // Resolve project type: prioritize metadata or detect from category/tags
            const isClient = meta ? meta.type === 'client' : (index % 2 !== 0);
            const type = isClient ? 'client' : 'in-house';
            
            const typeLabel = isBn
                ? (meta?.typeLabelBn || (isClient ? 'ক্লায়েন্ট প্রজেক্ট' : 'অরবিট ইন-হাউস'))
                : (meta?.typeLabelEn || (isClient ? 'Client Project' : 'Orbit In-House'));

            const tagline = isBn
                ? (meta?.taglineBn || p.subtitle || p.desc?.replace(/<[^>]*>?/gm, '').slice(0, 48) || 'উৎপাদন-প্রস্তুত প্ল্যাটফর্ম')
                : (meta?.taglineEn || p.subtitle || p.desc?.replace(/<[^>]*>?/gm, '').slice(0, 48) || 'Production Ready Platform');

            const category = isBn
                ? (meta?.categoryBn || p.category || 'স্যাস')
                : (meta?.categoryEn || p.category || 'SaaS');

            return {
                id,
                name,
                title: rawTitle,
                type,
                typeLabel,
                tagline,
                icon: meta?.icon || Layers,
                iconName: meta?.iconName || 'Layers',
                gradient: meta?.gradient || (isClient ? 'from-emerald-500 to-teal-600' : 'from-indigo-600 to-sky-500'),
                borderAccent: meta?.borderAccent || (isClient ? 'rgba(16,185,129,0.35)' : 'rgba(99,102,241,0.35)'),
                badgeBg: meta?.badgeBg || (isClient ? 'rgba(16,185,129,0.1)' : 'rgba(99,102,241,0.1)'),
                badgeColor: meta?.badgeColor || (isClient ? '#34d399' : '#818cf8'),
                link: p.link || meta?.defaultLink,
                image,
                category,
                featured: !!p.featured || type === 'in-house',
            };
        });
}

/**
 * Dispatches global event to open the ProjectDetailModal for any project ID.
 */
export function openProjectModal(projectId: string) {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('orbit-open-project-modal', {
            detail: { projectId }
        }));
    }
}

