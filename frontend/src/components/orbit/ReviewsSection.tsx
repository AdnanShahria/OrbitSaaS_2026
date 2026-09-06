import { useState } from 'react';
import { motion } from 'framer-motion';
import { useContent } from '@/contexts/ContentContext';
import { useLang } from '@/contexts/LanguageContext';
import { 
    Star, Quote, User, Twitter, Instagram, Facebook, Linkedin, 
    Mail, ArrowUpRight, Github, Briefcase, Globe, AtSign, 
    CheckCircle2, ShieldCheck, ChevronDown, ChevronUp
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { WaveDivider } from '@/components/ui/WaveDivider';
import { getImageUrl, getFallbackUrl } from '@/lib/imageUrl';
import { ensureAbsoluteUrl } from '@/lib/utils';

// ── WhatsApp Icon Component (Synced with Navbar & Leadership) ──
const WhatsAppIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} width="13" height="13">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
);

const SocialIcon = ({ type }: { type: string }) => {
    const icons: Record<string, any> = {
        google: Mail,
        whatsapp: WhatsAppIcon,
        instagram: Instagram,
        facebook: Facebook,
        threads: AtSign,
        twitter: Twitter,
        fiverr: Briefcase,
        upwork: Globe,
        linkedin: Linkedin,
        github: Github
    };
    const Icon = icons[type.toLowerCase()] || Mail;
    return <Icon className="w-3 h-3" />;
};

const getSocialHref = (type: string, val: any) => {
    const rawUrl = typeof val === 'string' ? val.trim() : (val?.url || '').trim();
    if (!rawUrl) return '#';
    if (type.toLowerCase() === 'whatsapp') {
        if (/^\+?[0-9\s-]+$/.test(rawUrl)) {
            const clean = rawUrl.replace(/[^0-9]/g, '');
            return `https://wa.me/${clean}`;
        }
    }
    if (type.toLowerCase() === 'google' || type.toLowerCase() === 'mail' || type.toLowerCase() === 'email') {
        return `mailto:${rawUrl.replace(/^mailto:/i, '')}`;
    }
    return ensureAbsoluteUrl(rawUrl);
};

// Monogram generator for clients without photo
const getInitials = (name: string) => {
    if (!name) return 'CL';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'CL';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export function ReviewsSection() {
    const { content } = useContent();
    const { lang } = useLang();
    const isBn = lang === 'bn';

    const [showAll, setShowAll] = useState(false);
    const INITIAL_COUNT = 6;

    const reviewsData = (content[lang] as any)?.reviews || {};
    const reviews = (Array.isArray(reviewsData) ? reviewsData : (reviewsData.items || [])).filter((r: any) => !r.hidden);
    const showSocials = reviewsData.showSocials !== false;

    // Handle bulk reviews gracefully
    const hasBulk = reviews.length > INITIAL_COUNT;
    const displayedReviews = (hasBulk && !showAll) ? reviews.slice(0, INITIAL_COUNT) : reviews;

    // Show Trust Card when displayed count leaves an incomplete row (e.g. 2 reviews in 3-col grid, or 5 in 3-col)
    const showTrustCard = displayedReviews.length % 3 !== 0;

    return (
        <section id="reviews" className="relative min-h-[auto] bg-[#FAFAFC] overflow-hidden pt-10 sm:pt-14 pb-12 sm:pb-16 flex flex-col justify-center text-zinc-900 selection:bg-zinc-900 selection:text-white">
            {/* Ultra Premium Apple Atmosphere */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden select-none" aria-hidden="true">
                <div className="absolute top-[-10%] left-[-10%] w-[650px] h-[650px] bg-emerald-500/[0.035] blur-[140px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[650px] h-[650px] bg-amber-500/[0.025] blur-[140px] rounded-full" />
                
                {/* Subtle Grid Pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.015)_1px,transparent_1px)] bg-[size:80px_80px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_10%,transparent_100%)]" />
            </div>

            <div className="max-w-[1400px] mx-auto px-5 sm:px-6 lg:px-8 w-full relative z-10">
                {/* Header — Ultra Compact Y-Axis */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 mb-7 sm:mb-9">
                    <div className="max-w-2xl">
                        <motion.div
                            initial={{ opacity: 0, x: -15 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.4 }}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-zinc-200/80 shadow-2xs mb-2.5"
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-800">
                               {reviewsData?.badge || (isBn ? 'বিশ্বস্ততার কণ্ঠস্বর' : 'Voices of Trust')}
                            </span>
                        </motion.div>

                        <motion.h2
                            initial={{ opacity: 0, y: 18 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.05 }}
                            className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold tracking-tight leading-[1.1] text-zinc-950"
                            style={{ fontFamily: "var(--font-display)" }}
                        >
                            Masterpieces{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-950 via-zinc-800 to-emerald-800 relative inline-block">
                                of Collaboration
                                <motion.div 
                                    className="absolute -bottom-1 left-0 h-[2px] bg-gradient-to-r from-emerald-500 via-teal-400 to-transparent w-full rounded-full"
                                    initial={{ scaleX: 0, originX: 0 }}
                                    whileInView={{ scaleX: 1 }}
                                    transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                                />
                            </span>
                        </motion.h2>
                        
                        <motion.p
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="mt-2 text-zinc-600 text-sm sm:text-base leading-relaxed font-normal"
                        >
                            {reviewsData?.subtitle || (isBn ? 'যাদের সাথে কাজ করে আমরা আধুনিক প্রযুক্তির নতুন দিগন্ত উন্মোচন করেছি তাদের বাস্তব অভিজ্ঞতা।' : "Real stories from founders and businesses who partnered with OrbitSaaS to build, scale, and thrive.")}
                        </motion.p>
                    </div>

                    {/* Right: Aggregate Social Proof Badge (Desktop) */}
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.15 }}
                        className="hidden lg:flex items-center gap-4 px-4 py-2.5 rounded-xl bg-white/90 backdrop-blur-md border border-zinc-200/80 shadow-2xs self-end mb-0.5"
                    >
                        <div className="flex flex-col">
                            <div className="flex items-center gap-1">
                                <div className="flex items-center gap-0.5">
                                    {[...Array(5)].map((_, idx) => (
                                        <Star key={idx} size={12.5} fill="#F59E0B" color="#F59E0B" className="opacity-95" />
                                    ))}
                                </div>
                                <span className="text-xs font-bold text-zinc-900 ml-1">5.0 / 5.0</span>
                            </div>
                            <span className="text-[10px] text-zinc-500 font-medium mt-0.5">
                                {isBn ? '১০০% ক্লায়েন্ট সন্তুষ্টি রেটিং' : '100% Client Satisfaction Rate'}
                            </span>
                        </div>
                        <div className="w-px h-6 bg-zinc-200" />
                        <div className="flex items-center gap-2">
                            <div className="w-6.5 h-6.5 rounded-full bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-emerald-700 shrink-0">
                                <ShieldCheck size={14} />
                            </div>
                            <div className="flex flex-col text-left">
                                <span className="text-[10.5px] font-bold text-zinc-900 leading-tight">
                                    {isBn ? 'ভেরিফায়েড রিভিউ' : 'Verified Reviews'}
                                </span>
                                <span className="text-[9.5px] text-emerald-700 font-semibold leading-tight">
                                    {isBn ? 'সরাসরি পার্টনার ফিডব্যাক' : 'Direct Partner Feedback'}
                                </span>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Reviews Bento Grid — Compact Y-Axis Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 items-stretch">
                    {displayedReviews.map((review: any, i: number) => {
                        const initials = getInitials(review.name);
                        return (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: '-30px' }}
                                transition={{ duration: 0.45, delay: (i % 6) * 0.05, ease: [0.23, 1, 0.32, 1] }}
                                whileHover={{ y: -4, transition: { type: "spring", stiffness: 350, damping: 25 } }}
                                className="group relative h-full flex flex-col"
                            >
                                <div className="h-full bg-white/95 backdrop-blur-xl rounded-2xl border border-zinc-200/80 p-5 sm:p-5.5 flex flex-col justify-between transition-all duration-400 hover:border-emerald-500/40 hover:shadow-[0_14px_34px_rgba(16,185,129,0.06)] shadow-[0_2px_16px_rgba(0,0,0,0.02)] relative overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500/50">
                                    {/* Glass reflection gradient sweep */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                                    
                                    {/* Oversized background Quote Icon */}
                                    <Quote size={100} className="absolute -top-3 -right-3 text-zinc-900/[0.025] rotate-12 group-hover:rotate-0 transition-transform duration-500 pointer-events-none" />

                                    <div className="relative z-10 flex flex-col h-full">
                                        {/* Top: Stars & Project Badge */}
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-0.5">
                                                {Array.from({ length: review.rating || 5 }, (_, si) => (
                                                    <Star key={si} size={13} fill="#F59E0B" color="#F59E0B" className="opacity-95" />
                                                ))}
                                            </div>
                                            
                                            {/* Project Badge */}
                                            {review.badgeName && (
                                                <div className="px-2.5 py-0.5 rounded-full bg-emerald-50/90 border border-emerald-200/60 backdrop-blur-md">
                                                    <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-emerald-800">
                                                        {review.badgeName}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Review Quote Text — Compact line-height & fluid fit */}
                                        <p className="text-zinc-700 text-[13.5px] leading-relaxed mb-4 font-normal whitespace-pre-wrap flex-grow">
                                            "{review.text || review.review}"
                                        </p>

                                        {/* Bottom Footer: Unified Single-Row Layout (Super Compact in Y) */}
                                        <div className="mt-auto pt-3.5 border-t border-zinc-100/90 flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                {/* Avatar with Monogram Fallback */}
                                                <div className="relative shrink-0">
                                                    {review.avatar ? (
                                                        <div className="w-8.5 h-8.5 rounded-full overflow-hidden border border-zinc-200 relative z-10 bg-zinc-100">
                                                            <img 
                                                                src={getImageUrl(review.avatar)} 
                                                                alt={review.name} 
                                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-400"
                                                                onError={(e) => {
                                                                    const fallback = getFallbackUrl(review.avatar);
                                                                    if (fallback && e.currentTarget.src !== fallback) e.currentTarget.src = fallback;
                                                                }} 
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="w-8.5 h-8.5 rounded-full bg-gradient-to-br from-emerald-500/10 via-zinc-100 to-indigo-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-900 font-bold text-[11px] tracking-wider shadow-2xs relative z-10">
                                                            {initials}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="min-w-0">
                                                    <div className="text-[13.5px] font-bold text-zinc-950 group-hover:text-emerald-800 transition-colors duration-200 truncate leading-tight">
                                                        {review.name}
                                                    </div>
                                                    <div className="text-[9.5px] font-semibold uppercase tracking-[0.12em] text-zinc-500 mt-0.5 flex items-center gap-1">
                                                        <span className="truncate max-w-[70px] sm:max-w-[85px]">{review.role || 'Owner'}</span>
                                                        <span className="w-0.5 h-0.5 rounded-full bg-zinc-300 shrink-0" />
                                                        <span className="text-emerald-700 font-bold flex items-center gap-0.5 shrink-0">
                                                            <CheckCircle2 size={10} className="text-emerald-600 inline shrink-0" />
                                                            {isBn ? 'ভেরিফায়েড' : 'Verified'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Right Actions: Social + Project Link */}
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                {/* Social Link */}
                                                {showSocials && review.social && (
                                                    <div className="flex items-center gap-1">
                                                        {Object.entries(review.social)
                                                            .filter(([type]) => type.toLowerCase() !== 'facebook')
                                                            .map(([type, val]: [string, any]) => {
                                                                const enabled = typeof val === 'string' ? true : val?.enabled !== false;
                                                                const href = getSocialHref(type, val);
                                                                if (!enabled) return null;
                                                                return (
                                                                    <a
                                                                        key={type}
                                                                        href={href}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        onClick={(e) => e.stopPropagation()}
                                                                        className="w-7 h-7 rounded-full border border-zinc-200/80 bg-zinc-50 hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-700 text-zinc-600 flex items-center justify-center transition-all duration-200 shadow-2xs"
                                                                        title={type}
                                                                        aria-label={`${review.name}'s ${type}`}
                                                                    >
                                                                        <SocialIcon type={type} />
                                                                    </a>
                                                                );
                                                            })}
                                                    </div>
                                                )}

                                                {/* Explore Project Button (Compact) */}
                                                {review.projectId && (
                                                    <Link
                                                        to={`/project/${review.projectId}`}
                                                        className="py-1 px-2.5 rounded-lg bg-zinc-100 hover:bg-emerald-50/90 border border-zinc-200/80 hover:border-emerald-300/80 text-zinc-700 hover:text-emerald-800 text-[10px] font-bold uppercase tracking-[0.12em] flex items-center gap-1 transition-all duration-200 group/link shrink-0"
                                                    >
                                                        <span>{isBn ? 'প্রজেক্ট' : 'Project'}</span>
                                                        <ArrowUpRight size={10.5} className="group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform duration-200 text-zinc-500 group-hover/link:text-emerald-700" />
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}

                    {/* ─── 3rd Slot: Trust Summary & Conversion Bento Card (Compact) ─── */}
                    {showTrustCard && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-30px' }}
                            transition={{ duration: 0.45, delay: (displayedReviews.length % 6) * 0.05, ease: [0.23, 1, 0.32, 1] }}
                            whileHover={{ y: -4, transition: { type: "spring", stiffness: 350, damping: 25 } }}
                            className="group relative h-full flex flex-col"
                        >
                            <div className="h-full rounded-2xl bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 text-white p-5 sm:p-5.5 flex flex-col justify-between border border-zinc-800 shadow-[0_14px_34px_rgba(0,0,0,0.12)] relative overflow-hidden">
                                {/* Ambient Background Glows */}
                                <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none group-hover:bg-emerald-500/25 transition-all duration-500" />
                                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-amber-500/20 transition-all duration-500" />
                                
                                {/* Micro Grid Texture */}
                                <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none opacity-40" />

                                <div className="relative z-10 flex flex-col h-full">
                                    {/* Top Rating & Badge */}
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-1">
                                            <div className="flex items-center gap-0.5">
                                                {[...Array(5)].map((_, idx) => (
                                                    <Star key={idx} size={12.5} fill="#F59E0B" color="#F59E0B" className="opacity-95" />
                                                ))}
                                            </div>
                                            <span className="text-[11px] font-bold text-zinc-300 ml-1">5.0 / 5.0</span>
                                        </div>

                                        <div className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 backdrop-blur-md">
                                            <span className="text-[8.5px] font-bold uppercase tracking-[0.14em] text-emerald-400">
                                                {isBn ? 'ভেরিফায়েড ট্র্যাক রেকর্ড' : 'Verified Track Record'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Catchy Headline & Copy */}
                                    <h3 className="text-base sm:text-lg font-bold tracking-tight text-white mb-1.5 leading-snug">
                                        {isBn ? (
                                            <>
                                                পরবর্তী প্রজেক্ট তৈরি করুন{' '}
                                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200">
                                                    অরবিটের সাথে
                                                </span>
                                            </>
                                        ) : (
                                            <>
                                                Build Your Next{' '}
                                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200">
                                                    Digital Masterpiece
                                                </span>
                                            </>
                                        )}
                                    </h3>
                                    
                                    <p className="text-zinc-400 text-[12.5px] leading-relaxed mb-3 font-normal flex-grow">
                                        {isBn 
                                            ? 'কাস্টম ওয়েব প্ল্যাটফর্ম থেকে স্কেলেবল এআই সলিউশন — আমরা স্বপ্নদর্শী উদ্যোক্তাদের আইডিয়াকে বাস্তবে রূপ দিই।' 
                                            : 'From bespoke SaaS platforms to resilient cloud & AI architectures, we partner with founders to turn vision into scalable production reality.'}
                                    </p>

                                    {/* Value Proof Points — Compact */}
                                    <div className="space-y-1.5 pt-2.5 border-t border-zinc-800/80 mb-3.5">
                                        <div className="flex items-center gap-2 text-[11.5px] text-zinc-300">
                                            <div className="w-4 h-4 rounded-full bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center shrink-0">
                                                <CheckCircle2 size={10} className="text-emerald-400" />
                                            </div>
                                            <span className="font-medium truncate">
                                                {isBn ? '১০০% ক্লায়েন্ট সন্তুষ্টি ও সাপোর্ট' : '100% Client Satisfaction & Support'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-[11.5px] text-zinc-300">
                                            <div className="w-4 h-4 rounded-full bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center shrink-0">
                                                <CheckCircle2 size={10} className="text-emerald-400" />
                                            </div>
                                            <span className="font-medium truncate">
                                                {isBn ? '২৪/৭ সরাসরি ডেভেলপার সাপোর্ট' : 'Direct 24/7 Developer Communication'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Direct CTA Action */}
                                    <div className="pt-1">
                                        <a
                                            href="#contact"
                                            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-bold text-xs transition-all duration-200 shadow-[0_3px_15px_rgba(16,185,129,0.25)] hover:shadow-[0_4px_20px_rgba(16,185,129,0.4)] flex items-center justify-center gap-1.5 group/btn cursor-pointer"
                                        >
                                            <span>{isBn ? 'প্রজেক্ট আলোচনা করুন' : 'Discuss Your Project'}</span>
                                            <ArrowUpRight size={13} className="transition-transform duration-200 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Bulk Reviews: Show All / Show Less Toggle Button */}
                {hasBulk && (
                    <div className="mt-7 sm:mt-9 flex justify-center">
                        <button
                            onClick={() => setShowAll(prev => !prev)}
                            className="px-5 py-2.5 rounded-xl bg-white hover:bg-zinc-50 border border-zinc-200/90 hover:border-zinc-300 text-zinc-800 hover:text-zinc-950 text-xs font-bold uppercase tracking-wider shadow-2xs hover:shadow-xs transition-all flex items-center gap-2 cursor-pointer group"
                        >
                            <span>
                                {showAll 
                                    ? (isBn ? 'কম দেখুন' : 'Show Less') 
                                    : (isBn ? `সবগুলো দেখুন (${reviews.length}টি রিভিউ)` : `View All ${reviews.length} Reviews`)}
                            </span>
                            {showAll ? (
                                <ChevronUp size={14} className="text-zinc-500 group-hover:text-zinc-900 transition-colors" />
                            ) : (
                                <ChevronDown size={14} className="text-zinc-500 group-hover:text-zinc-900 transition-colors" />
                            )}
                        </button>
                    </div>
                )}
            </div>
            <WaveDivider fill="#FAFAFA" />
        </section>
    );
}

export default ReviewsSection;
