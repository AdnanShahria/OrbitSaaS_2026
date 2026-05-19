import { motion } from 'framer-motion';
import { useContent } from '@/contexts/ContentContext';
import { useLang } from '@/contexts/LanguageContext';
import { useEffect, useRef, useState } from 'react';

function CountUp({ target, suffix = '' }: { target: number; suffix?: string }) {
    const [count, setCount] = useState(0);
    const ref = useRef<HTMLSpanElement>(null);
    const animated = useRef(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !animated.current) {
                    animated.current = true;
                    const duration = 1500;
                    const steps = 60;
                    const increment = target / steps;
                    let current = 0;
                    const interval = setInterval(() => {
                        current += increment;
                        if (current >= target) {
                            setCount(target);
                            clearInterval(interval);
                        } else {
                            setCount(Math.floor(current));
                        }
                    }, duration / steps);
                }
            },
            { threshold: 0.3 }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [target]);

    return (
        <span ref={ref}>
            {count}{suffix}
        </span>
    );
}

export function StatsSection() {
    const { content } = useContent();
    const { lang } = useLang();
    const t = (content[lang] as any)?.stats;
    const items = t?.items || [];

    if (!items.length) return null;

    return (
        <section className="section-dark border-t border-b" style={{ borderColor: 'var(--card-border)' }}>
            <div className="section-container !py-16 md:!py-20">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4">
                    {items.map((item: any, i: number) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-50px' }}
                            transition={{ duration: 0.4, delay: i * 0.1 }}
                            className="text-center"
                        >
                            <div
                                className="text-4xl md:text-5xl font-bold mb-2"
                                style={{ color: 'var(--accent)' }}
                            >
                                <CountUp target={item.value} suffix={item.suffix || ''} />
                            </div>
                            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                {item.label}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default StatsSection;
