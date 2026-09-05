import { useRef, useState } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { ImageWithSkeleton } from './ImageWithSkeleton';
import { ArrowUpRight } from 'lucide-react';
import { WaveDivider } from '@/components/ui/WaveDivider';
import { fallbackAchievements, AchievementItem } from '@/data/achievements';
import { Link } from 'react-router-dom';
import { useLang } from '@/contexts/LanguageContext';

function CinematicAchievementCard({ item, i }: { item: AchievementItem; i: number }) {
    const coverImage = item.images?.[0] || item.image || '/placeholder.webp';
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, amount: 0.15 });

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 50, scale: 0.98 }}
            animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
            transition={{ duration: 0.7, delay: (i % 3) * 0.1, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -6, transition: { type: "spring", stiffness: 400, damping: 25 } }}
            className="group relative h-full"
        >
            <Link 
                to={`/achievement/${item.id}`}
                className="w-full block relative h-full flex flex-col overflow-hidden text-left rounded-2xl bg-white/90 backdrop-blur-xl border border-zinc-200/80 transition-all duration-500 hover:border-emerald-500/40 hover:shadow-[0_20px_48px_rgba(0,0,0,0.08)] shadow-[0_4px_24px_rgba(0,0,0,0.03)] cursor-pointer"
            >
                {/* Cover Photo */}
                <div className="relative aspect-video overflow-hidden group/img bg-zinc-100">
                    <motion.div className="w-full h-full relative group-hover/img:scale-105 transition-transform duration-700 ease-out">
                        <ImageWithSkeleton
                            src={coverImage}
                            alt={item.title}
                            className="w-full h-full object-cover no-browser-trigger"
                        />
                    </motion.div>

                    {/* Shimmer Light Sweep */}
                    <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform [transition-duration:1.5s] ease-in-out bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                    </div>

                    {/* Bottom Fade */}
                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                    
                    {/* Hover Arrow */}
                    <div className="absolute bottom-4 right-4 z-20 w-10 h-10 rounded-full bg-white/95 backdrop-blur-md border border-zinc-200/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-y-0 translate-y-2 shadow-md group-hover:bg-emerald-600 group-hover:border-emerald-600 group-hover:text-white text-zinc-800">
                        <ArrowUpRight className="w-4 h-4 transition-colors" />
                    </div>
                </div>

                {/* Content Strip */}
                <div className="p-6 bg-white flex-1 flex flex-col border-t border-zinc-100">
                    <div className="flex flex-wrap gap-2 mb-3 items-center">
                        {item.category && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-[0.1em] text-emerald-800 border border-emerald-200/80 bg-emerald-50/80 shadow-xs select-none">
                                {item.category}
                            </span>
                        )}
                        {item.date && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-[0.1em] text-amber-800 border border-amber-200/80 bg-amber-50/80 shadow-xs select-none">
                                {item.date}
                            </span>
                        )}
                    </div>

                    <h3 className="text-lg sm:text-xl font-bold text-zinc-950 leading-snug tracking-tight group-hover:text-emerald-600 transition-colors duration-300 mb-2">
                        {item.title}
                    </h3>

                    <p className="text-zinc-600 text-sm leading-relaxed line-clamp-3 font-normal">
                        {item.desc?.replace(/<[^>]*>?/gm, '').substring(0, 200)}
                    </p>
                </div>

                <div className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 shadow-[inset_0_0_0_1.5px_rgba(16,185,129,0.35)]" />
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
        <section id="achievements" className="py-20 sm:py-28 bg-white relative overflow-hidden text-zinc-900 selection:bg-zinc-900 selection:text-white" style={{ overflowAnchor: 'none' }}>
            {/* Ambient Apple Lighting Effect */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
                <div className="absolute top-0 right-1/4 w-[650px] h-[650px] bg-gradient-to-br from-emerald-100/40 via-zinc-50/20 to-transparent rounded-full blur-[140px] -translate-y-1/2" />
                <div className="absolute bottom-0 left-1/4 w-[750px] h-[750px] bg-gradient-to-tr from-amber-100/40 via-zinc-50/20 to-transparent rounded-full blur-[160px] translate-y-1/2" />
            </div>

            <div className="max-w-[1400px] mx-auto px-6 lg:px-8 w-full relative z-10">
                {/* Section Header */}
                <div className="mb-12 sm:mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-100 border border-zinc-200/80 text-[11px] font-semibold tracking-wider text-zinc-800 uppercase shadow-xs mb-4"
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>{sectionSubtitle}</span>
                    </motion.div>

                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                        <motion.h2
                            initial={{ opacity: 0, y: 25 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.7, delay: 0.1 }}
                            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-none text-zinc-950"
                            style={{ fontFamily: "var(--font-display)" }}
                        >
                            {sectionTitle.includes(' ') ? (
                                <>
                                    {sectionTitle.substring(0, sectionTitle.lastIndexOf(' '))}{' '}
                                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-600 via-amber-500 to-emerald-600">
                                        {sectionTitle.substring(sectionTitle.lastIndexOf(' ') + 1)}
                                    </span>
                                </>
                            ) : (
                                <span>{sectionTitle}</span>
                            )}
                        </motion.h2>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
                    <AnimatePresence>
                        {visibleItems.map((item, i) => (
                            <motion.div
                                key={item.id || i}
                                initial={{ opacity: 0, scale: 0.96, y: 30 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.5, delay: i >= visibleCount - 3 ? (i % 3) * 0.1 : 0 }}
                            >
                                <CinematicAchievementCard 
                                    item={item} 
                                    i={i} 
                                />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {visibleCount < items.length && (
                    <div className="mt-14 flex justify-center w-full">
                        <button
                            onClick={() => setVisibleCount(prev => prev + 3)}
                            className="group relative px-8 py-4 bg-zinc-950 hover:bg-zinc-800 text-white font-bold rounded-xl border border-zinc-800 transition-all duration-300 shadow-sm hover:shadow-lg active:scale-95 overflow-hidden cursor-pointer"
                            style={{ fontFamily: "var(--font-body)" }}
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                {lang === 'bn' ? 'আরও অর্জন দেখুন' : 'Explore More Achievements'}
                                <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                            </span>
                            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-0 bg-white/10 transition-transform duration-500 ease-out" />
                        </button>
                    </div>
                )}
            </div>

            <WaveDivider fill="#FAFAFC" />
        </section>
    );
}
