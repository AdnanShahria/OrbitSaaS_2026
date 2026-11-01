import { useRef, useState } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { ImageWithSkeleton } from './ImageWithSkeleton';
import { ArrowUpRight, Award, Calendar, Sparkles, Trophy } from 'lucide-react';
import { WaveDivider } from '@/components/ui/WaveDivider';
import { fallbackAchievements, AchievementItem } from '@/data/achievements';
import { Link } from 'react-router-dom';
import { useLang } from '@/contexts/LanguageContext';

function cleanDescription(text?: string): string {
    if (!text) return '';
    return text
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/\s+/g, ' ')
        .trim();
}

function CompactAchievementCard({ item, i, lang }: { item: AchievementItem; i: number; lang: string }) {
    const coverImage = item.images?.[0] || item.image || '/placeholder.webp';
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, amount: 0.15 });
    const cleanedDesc = cleanDescription(item.desc);

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 35, scale: 0.98 }}
            animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
            transition={{ duration: 0.5, delay: (i % 3) * 0.08, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -4, transition: { type: "spring", stiffness: 400, damping: 25 } }}
            className="group relative h-full flex flex-col"
        >
            <Link 
                to={`/achievement/${item.id}`}
                className="w-full flex-1 flex flex-col overflow-hidden text-left rounded-2xl bg-white border border-zinc-200/90 transition-all duration-300 hover:border-emerald-500/40 hover:shadow-[0_16px_36px_rgba(16,185,129,0.08)] shadow-[0_4px_20px_rgba(0,0,0,0.03)] cursor-pointer"
            >
                {/* Compact Media Header with Badges */}
                <div className="relative aspect-[16/10] overflow-hidden bg-zinc-100">
                    <motion.div className="w-full h-full relative group-hover:scale-105 transition-transform duration-500 ease-out">
                        <ImageWithSkeleton
                            src={coverImage}
                            alt={item.title}
                            width={640}
                            height={400}
                            className="w-full h-full object-cover no-browser-trigger"
                        />
                    </motion.div>

                    {/* Floating Frosted Category Tag */}
                    {item.category && (
                        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-950/80 backdrop-blur-md border border-white/15 text-white text-[10px] font-bold uppercase tracking-wider shadow-sm select-none">
                            <Award size={12} className="text-emerald-400" />
                            <span>{item.category}</span>
                        </div>
                    )}

                    {/* Floating Frosted Date Tag */}
                    {item.date && (
                        <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-zinc-200 text-[10px] font-medium tracking-wide shadow-sm select-none">
                            <Calendar size={11} className="text-amber-400" />
                            <span>{item.date}</span>
                        </div>
                    )}

                    {/* Subtle Shimmer Light Sweep */}
                    <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform [transition-duration:1.2s] ease-in-out bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                    </div>

                    {/* Soft Bottom Shadow Scrim */}
                    <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/25 to-transparent pointer-events-none" />
                </div>

                {/* Compact Content Body */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between bg-white">
                    <div>
                        <h3 className="text-base sm:text-lg font-bold text-zinc-950 leading-snug tracking-tight group-hover:text-emerald-600 transition-colors duration-200 line-clamp-2 mb-2">
                            {item.title}
                        </h3>

                        {cleanedDesc && (
                            <p className="text-zinc-600 text-xs sm:text-sm leading-relaxed line-clamp-2 font-normal">
                                {cleanedDesc}
                            </p>
                        )}
                    </div>

                    {/* Dedicated Bottom Action Row */}
                    <div className="mt-4 pt-3 border-t border-zinc-100/90 flex items-center justify-between text-xs font-semibold text-emerald-600 group-hover:text-emerald-700 transition-colors">
                        <span>{lang === 'bn' ? 'বিস্তারিত দেখুন' : 'Explore Milestone'}</span>
                        <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white flex items-center justify-center transition-all duration-300 shadow-2xs">
                            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </div>
                    </div>
                </div>

                {/* Inner Border Glow */}
                <div className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-[inset_0_0_0_1.5px_rgba(16,185,129,0.3)]" />
            </Link>
        </motion.div>
    );
}

export function AchievementsSection() {
    const { t, lang } = useLang();
    const [visibleCount, setVisibleCount] = useState(3);

    const achievementsData = t.achievements || {};
    const sectionTitle = achievementsData.title || 'Our Achievements';
    const sectionSubtitle = achievementsData.subtitle || 'Milestones & Appreciations';
    const items: AchievementItem[] = Array.isArray(achievementsData.items) ? achievementsData.items : fallbackAchievements;

    const visibleItems = items.slice(0, visibleCount);

    return (
        <section id="achievements" className="py-14 sm:py-20 bg-[#FDFBF7] relative overflow-hidden text-zinc-900 selection:bg-zinc-900 selection:text-white" style={{ overflowAnchor: 'none' }}>
            {/* Ambient Apple Lighting Effect */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
                <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-gradient-to-br from-emerald-100/35 via-zinc-50/15 to-transparent rounded-full blur-[130px] -translate-y-1/2" />
                <div className="absolute bottom-0 left-1/4 w-[650px] h-[650px] bg-gradient-to-tr from-amber-100/30 via-zinc-50/15 to-transparent rounded-full blur-[140px] translate-y-1/2" />
            </div>

            <div className="max-w-[1400px] mx-auto px-6 lg:px-8 w-full relative z-10">
                {/* Compact Section Header */}
                <div className="mb-10 sm:mb-12">
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4 }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50/90 border border-emerald-200/80 text-[11px] font-semibold tracking-wider text-emerald-800 uppercase shadow-xs mb-3"
                    >
                        <Trophy size={13} className="text-emerald-600" />
                        <span>{sectionSubtitle}</span>
                    </motion.div>

                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                        <div>
                            <motion.h2
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: 0.1 }}
                                className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-none text-zinc-950"
                                style={{ fontFamily: "var(--font-display)" }}
                            >
                                {sectionTitle.includes(' ') ? (
                                    <>
                                        {sectionTitle.substring(0, sectionTitle.lastIndexOf(' '))}{' '}
                                        <span className="text-emerald-600">
                                            {sectionTitle.substring(sectionTitle.lastIndexOf(' ') + 1)}
                                        </span>
                                    </>
                                ) : (
                                    <span>{sectionTitle}</span>
                                )}
                            </motion.h2>
                            <motion.p
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.4, delay: 0.15 }}
                                className="text-xs sm:text-sm text-zinc-500 mt-2 max-w-xl font-normal"
                            >
                                {lang === 'bn' 
                                    ? 'আমাদের দলের উদ্ভাবন, হ্যাকাথন বিজয় ও প্রযুক্তিগত মাইলফলকের বিশেষ স্বীকৃতি।'
                                    : 'Recognitions, national hackathon honors, and venture pre-seed milestones powering our innovation journey.'
                                }
                            </motion.p>
                        </div>

                        {/* Milestone Counter Chip */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.4, delay: 0.2 }}
                            className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-50 border border-zinc-200/80 text-xs font-semibold text-zinc-700 shadow-2xs self-start sm:self-auto"
                        >
                            <Sparkles size={14} className="text-amber-500" />
                            <span>{items.length} {lang === 'bn' ? 'মাইলফলক রেকর্ডকৃত' : 'Milestones Honored'}</span>
                        </motion.div>
                    </div>
                </div>

                {/* Adaptive Compact Grid */}
                <div className={
                    visibleItems.length === 2 
                        ? "grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto" 
                        : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7"
                }>
                    <AnimatePresence>
                        {visibleItems.map((item, i) => (
                            <motion.div
                                key={item.id || i}
                                initial={{ opacity: 0, scale: 0.96, y: 25 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.4, delay: i >= visibleCount - 3 ? (i % 3) * 0.08 : 0 }}
                                className="h-full"
                            >
                                <CompactAchievementCard 
                                    item={item} 
                                    i={i} 
                                    lang={lang}
                                />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {visibleCount < items.length && (
                    <div className="mt-10 flex justify-center w-full">
                        <button
                            onClick={() => setVisibleCount(prev => prev + 3)}
                            className="group relative px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold rounded-xl border border-zinc-800 transition-all duration-300 shadow-sm hover:shadow-md active:scale-95 overflow-hidden cursor-pointer"
                            style={{ fontFamily: "var(--font-body)" }}
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                {lang === 'bn' ? 'আরও অর্জন দেখুন' : 'Explore More Achievements'}
                                <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                            </span>
                            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-0 bg-white/10 transition-transform duration-500 ease-out" />
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
}
