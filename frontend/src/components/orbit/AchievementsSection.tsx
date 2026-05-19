import { useRef, useState } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { ImageWithSkeleton } from './ImageWithSkeleton';
import { ArrowUpRight } from 'lucide-react';
import { WaveDivider } from '@/components/ui/WaveDivider';
import { fallbackAchievements, AchievementItem } from '@/data/achievements';
import { Link } from 'react-router-dom';
import { useLang } from '@/contexts/LanguageContext';

function CinematicAchievementCard({ item, i }: { item: AchievementItem; i: number }) {
    const coverImage = item.images?.[0] || item.image || '/placeholder.png';
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, amount: 0.15 });

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 60, scale: 0.97 }}
            animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
            transition={{ duration: 0.8, delay: (i % 3) * 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="group relative"
        >
            <Link 
                to={`/achievement/${item.id}`}
                className="w-full block relative h-full flex flex-col overflow-hidden text-left rounded-2xl bg-zinc-950/40 backdrop-blur-md border border-[#22C55E]/20 transition-all duration-700 hover:border-[#FACC15]/80 hover:shadow-[0_10px_45px_rgba(34,197,94,0.12)] shadow-[0_4px_30px_rgba(0,0,0,0.5)] cursor-pointer"
            >
                {/* Cover Photo */}
                <div className="relative aspect-video overflow-hidden group/img">
                    <motion.div className="w-full h-full relative">
                        <ImageWithSkeleton
                            src={coverImage}
                            alt={item.title}
                            className="w-full h-full object-cover no-browser-trigger"
                        />
                    </motion.div>

                    {/* Shimmer Light Sweep */}
                    <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform [transition-duration:1.5s] ease-in-out bg-gradient-to-r from-transparent via-white/[0.15] to-transparent" />
                    </div>

                    {/* Bottom Fade */}
                    <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
                    
                    {/* Hover Arrow */}
                    <div className="absolute bottom-5 right-5 z-20 w-10 h-10 rounded-full bg-[#FACC15] backdrop-blur-md border border-[#FACC15]/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:translate-y-0 translate-y-2 shadow-[0_0_15px_rgba(250,204,21,0.5)]">
                        <ArrowUpRight className="w-4 h-4 text-black" />
                    </div>
                </div>

                {/* Content Strip */}
                <div className="p-5 sm:p-6 bg-[#08100C]/70 backdrop-blur-md flex-1 flex flex-col border-t border-[#22C55E]/10">
                    <div className="flex flex-wrap gap-1.5 mb-2 items-center">
                        {item.category && (
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-[0.1em] text-[#22C55E] border border-[#22C55E]/20 bg-[#22C55E]/5 shadow-sm select-none">
                                {item.category}
                            </span>
                        )}
                        {item.date && (
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-[0.1em] text-[#FACC15] border border-[#FACC15]/15 bg-[#FACC15]/5 select-none">
                                {item.date}
                            </span>
                        )}
                    </div>

                    <h3 className="text-lg sm:text-xl font-bold text-white leading-tight tracking-tight group-hover:text-[#FACC15] transition-colors duration-500 mb-2">
                        {item.title}
                    </h3>

                    <p className="text-zinc-400 text-sm leading-relaxed line-clamp-3">
                        {item.desc?.replace(/<[^>]*>?/gm, '').substring(0, 200)}
                    </p>
                </div>

                <div className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700 shadow-[inset_0_0_0_1.5px_#FACC15]" />
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
        <section id="achievements" className="py-16 sm:py-20 bg-[#040806] relative overflow-hidden" style={{ overflowAnchor: 'none' }}>
            {/* Ambient Background Elements */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
                <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-gradient-to-br from-[#22C55E]/[0.08] to-transparent rounded-full blur-[140px] -translate-y-1/2" />
                <div className="absolute bottom-0 left-1/4 w-[700px] h-[700px] bg-gradient-to-tr from-[#FACC15]/[0.06] to-transparent rounded-full blur-[160px] translate-y-1/2" />
            </div>

            <div className="max-w-7xl mx-auto px-5 sm:px-8 relative z-10">
                {/* Section Header */}
                <div className="mb-10 sm:mb-14">
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="flex items-center gap-3 mb-4"
                    >
                        <div className="w-8 h-[2px] bg-[#FACC15] shadow-[0_0_8px_#FACC15]" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#FACC15] drop-shadow-[0_0_8px_rgba(250,204,21,0.4)]">
                            {sectionSubtitle}
                        </span>
                    </motion.div>

                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                        <motion.h2
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, delay: 0.1 }}
                            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-none text-white"
                            style={{ fontFamily: "'Outfit', sans-serif" }}
                        >
                            {sectionTitle.includes(' ') ? (
                                <>
                                    {sectionTitle.substring(0, sectionTitle.lastIndexOf(' '))} <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#FACC15] via-amber-400 to-[#22C55E] filter drop-shadow-[0_2px_10px_rgba(250,204,21,0.25)]">{sectionTitle.substring(sectionTitle.lastIndexOf(' ') + 1)}</span>
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
                                initial={{ opacity: 0, scale: 0.95, y: 40 }}
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
                    <div className="mt-12 flex justify-center w-full">
                        <button
                            onClick={() => setVisibleCount(prev => prev + 3)}
                            className="group relative px-8 py-4 bg-zinc-950/80 text-white border border-[#22C55E]/20 font-bold rounded-xl hover:border-[#22C55E]/60 transition-all duration-300 shadow-sm hover:shadow-[0_10px_40px_rgba(34,197,94,0.1)] overflow-hidden cursor-pointer"
                            style={{ fontFamily: "'Outfit', sans-serif" }}
                        >
                            <span className="relative z-10">{lang === 'bn' ? 'আরও অর্জন দেখুন' : 'Explore More Achievements'}</span>
                            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-0 bg-[#22C55E]/5 transition-transform duration-500 ease-out" />
                        </button>
                    </div>
                )}
            </div>

            <WaveDivider fill="#0A0A0A" />
        </section>
    );
}
