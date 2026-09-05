import { motion, AnimatePresence } from 'framer-motion';
import { useContent } from '@/contexts/ContentContext';
import { useLang } from '@/contexts/LanguageContext';
import { Star, Quote, User, Twitter, Instagram, Facebook, Linkedin, Mail, ArrowUpRight, Github, Briefcase, Globe, AtSign } from 'lucide-react';
import { Link } from 'react-router-dom';
import { WaveDivider } from '@/components/ui/WaveDivider';
import { getImageUrl, getFallbackUrl } from '@/lib/imageUrl';

// ── WhatsApp Icon Component (Synced with Navbar) ──
const WhatsAppIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
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

    return (
        <div className="w-8 h-8 rounded-full border border-zinc-200/80 bg-zinc-50 flex items-center justify-center text-zinc-600 hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-700 transition-all duration-300 shadow-xs" title={type}>
            <Icon size={15} className="w-3.5 h-3.5" />
        </div>
    );
};

export function ReviewsSection() {
    const { content } = useContent();
    const { lang } = useLang();
    const reviewsData = (content[lang] as any)?.reviews || {};
    const reviews = (Array.isArray(reviewsData) ? reviewsData : (reviewsData.items || [])).filter((r: any) => !r.hidden);
    const showSocials = reviewsData.showSocials !== false;

    return (
        <section id="reviews" className="relative min-h-[100dvh] bg-[#FAFAFC] overflow-hidden py-20 sm:py-28 flex flex-col justify-center text-zinc-900 selection:bg-zinc-900 selection:text-white">
            {/* Ultra Premium Apple Atmosphere */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
                <div className="absolute top-[-10%] left-[-10%] w-[800px] h-[800px] bg-emerald-500/[0.04] blur-[150px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[800px] h-[800px] bg-amber-500/[0.03] blur-[150px] rounded-full" />
                
                {/* Subtle Apple Grid Pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.015)_1px,transparent_1px)] bg-[size:80px_80px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_10%,transparent_100%)]" />
            </div>

            <div className="max-w-[1400px] mx-auto px-6 lg:px-8 w-full relative z-10">
                {/* Header */}
                <div className="mb-14 sm:mb-18">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-zinc-200/80 shadow-xs mb-6"
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-emerald-800">
                           {reviewsData?.badge || 'Voices of Trust'}
                        </span>
                    </motion.div>

                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                        <motion.h2
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, delay: 0.1 }}
                            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-none text-zinc-950"
                            style={{ fontFamily: "var(--font-display)" }}
                        >
                            Masterpieces <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-950 via-zinc-800 to-zinc-500 ml-[0.2em] relative inline-block">
                                of Collaboration
                                <motion.div 
                                    className="absolute -bottom-2 left-0 h-[2px] bg-gradient-to-r from-emerald-500/60 to-transparent w-full"
                                    initial={{ scaleX: 0, originX: 0 }}
                                    whileInView={{ scaleX: 1 }}
                                    transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
                                />
                            </span>
                        </motion.h2>
                        
                        <motion.p
                            initial={{ opacity: 0, y: 15 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="max-w-md text-zinc-600 text-base leading-relaxed mb-1 font-normal"
                        >
                            {reviewsData?.subtitle || "Hear from the visionaries we've partnered with to redefine digital excellence."}
                        </motion.p>
                    </div>
                </div>

                {/* Reviews Grid */}
                <AnimatePresence mode="popLayout">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                        {reviews.map((review: any, i: number) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 35 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: '-50px' }}
                                transition={{ duration: 0.7, delay: i * 0.08, ease: [0.23, 1, 0.32, 1] }}
                                whileHover={{ y: -6, transition: { type: "spring", stiffness: 400, damping: 25 } }}
                                className="group relative h-full"
                            >
                                <div className="h-full bg-white/90 backdrop-blur-xl rounded-2xl border border-zinc-200/80 p-8 flex flex-col transition-all duration-500 hover:border-emerald-500/40 hover:shadow-[0_20px_48px_rgba(0,0,0,0.07)] shadow-[0_4px_24px_rgba(0,0,0,0.03)] relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-emerald-500/50">
                                    {review.projectId && (
                                        <Link 
                                            to={`/project/${review.projectId}`} 
                                            className="absolute inset-0 z-30" 
                                            aria-label={`View project ${review.projectName}`}
                                        />
                                    )}
                                    
                                    {/* Glass reflection gradient sweep */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                                    
                                    {/* Oversized background Quote Icon */}
                                    <Quote size={180} className="absolute -top-10 -right-10 text-zinc-900/[0.025] rotate-12 group-hover:rotate-0 transition-transform duration-1000 ease-out pointer-events-none" />

                                    <div className="relative z-10 flex flex-col h-full">
                                        <div className="flex items-start justify-between mb-6">
                                            <div className="flex items-center gap-1">
                                                {Array.from({ length: review.rating || 5 }, (_, si) => (
                                                    <Star key={si} size={14} fill="#F59E0B" color="#F59E0B" className="opacity-95" />
                                                ))}
                                            </div>
                                            
                                            {/* Project Badge */}
                                            {review.badgeName && (
                                                <div className="px-3 py-1 rounded-full bg-emerald-50/80 border border-emerald-200/60 backdrop-blur-md">
                                                    <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-emerald-800">
                                                        {review.badgeName}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        <p className="text-zinc-700 text-[15px] leading-relaxed mb-8 font-normal whitespace-pre-wrap">
                                            "{review.text || review.review}"
                                        </p>

                                        <div className="mt-auto pt-6 border-t border-zinc-100 flex flex-col gap-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3.5">
                                                    <div className="relative">
                                                        {/* Avatar Ring */}
                                                        <div className="absolute inset-[-3px] rounded-full border border-emerald-400/40 scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-400" />
                                                        
                                                        {review.avatar ? (
                                                            <div className="w-11 h-11 rounded-full overflow-hidden border border-zinc-200 relative z-10 bg-zinc-100">
                                                                <img src={getImageUrl(review.avatar)} alt={review.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                                    onError={(e) => {
                                                                        const fallback = getFallbackUrl(review.avatar);
                                                                        if (fallback && e.currentTarget.src !== fallback) e.currentTarget.src = fallback;
                                                                    }} />
                                                            </div>
                                                        ) : (
                                                            <div className="w-11 h-11 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-500 relative z-10">
                                                                <User size={18} className="opacity-70 group-hover:opacity-100 transition-opacity" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="text-[16px] font-bold text-zinc-950 group-hover:text-emerald-700 transition-colors duration-300">
                                                            {review.name}
                                                        </div>
                                                        <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-500 mt-0.5 flex items-center gap-2">
                                                            <span>{review.role}</span>
                                                            <span className="w-1 h-1 rounded-full bg-emerald-500/60" />
                                                            <span className="text-emerald-700 font-bold">Verified Client</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Social Links Container */}
                                                {showSocials && review.social && (
                                                    <div className="flex flex-wrap gap-1.5 relative z-20">
                                                        {Object.entries(review.social)
                                                            .filter(([type]) => type.toLowerCase() !== 'facebook')
                                                            .map(([type, val]: [string, any]) => {
                                                                const enabled = typeof val === 'string' ? true : val?.enabled !== false;
                                                                return enabled && <SocialIcon key={type} type={type} />;
                                                            })}
                                                    </div>
                                                )}
                                            </div>

                                            {review.projectId && (
                                                <div className="flex items-center justify-center pt-2">
                                                    <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-all duration-300">
                                                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-700">Explore Project</span>
                                                        <div className="w-5 h-5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center">
                                                            <ArrowUpRight size={11} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300" />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </AnimatePresence>
            </div>
            <WaveDivider fill="#FAFAFA" />
        </section>
    );
}

export default ReviewsSection;
