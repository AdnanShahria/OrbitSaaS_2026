import { motion, AnimatePresence } from 'framer-motion';
import { useContent } from '@/contexts/ContentContext';
import { useLang } from '@/contexts/LanguageContext';
import { useOrchestration } from '@/App';
import React, { useEffect, useState, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { RichText } from '@/components/ui/RichText';
import { getImageUrl } from '@/lib/imageUrl';
import {
  ArrowRight, Cpu, Zap, Activity, Globe, MessageSquare, Shield, Rocket, X,
  Bot, Smartphone, ShoppingCart, Code, Database, Cloud, Monitor,
  Wifi, Mail, Camera, Music, Heart, Star, Target, Briefcase,
  Award, BookOpen, Users, BarChart3, Sparkles, Layers, Settings2,
  Eye, Palette, Brain, Wrench, LucideIcon
} from 'lucide-react';
import { WaveDivider } from '@/components/ui/WaveDivider';

/* ─── Mobile detection ────────────────────────────────────────── */
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' &&
    (window.matchMedia('(hover: none) and (pointer: coarse)').matches || window.innerWidth < 1024)
  );
  useEffect(() => {
    const handle = () =>
      setIsMobile(
        window.matchMedia('(hover: none) and (pointer: coarse)').matches || window.innerWidth < 1024
      );
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
  }, []);
  return isMobile;
}

/* ─── Icon map ────────────────────────────────────────────────── */
const ICON_MAP: Record<string, LucideIcon | any> = {
  Globe, Bot, Zap, Smartphone, ShoppingCart, Rocket, Code, Database, Shield, Cloud,
  Cpu, Monitor, Wifi, Mail, Camera, Music, Heart, Star, Target, Briefcase,
  Award, BookOpen, Users, BarChart3, Sparkles, Layers, Settings2, Eye, Palette, Brain, Wrench,
  Activity,
};

/* ═══════════════════════════════════════════════════════════════
   LIQUID GLASS CARD — HIG-compliant functional layer surface
   Follows liquid-glass.md: backdrop blur only on functional layer,
   monochrome on glass, accent only for primary action
   ═══════════════════════════════════════════════════════════════ */

const GlassCard = React.memo(({ children, icon: Icon, title, delay, className = '' }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 28 }}
    animate={{ opacity: 1, y: 0, transition: { duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] } }}
    whileHover={{ y: -5, transition: { duration: 0.22, ease: 'easeOut' } }}
    className={`relative group rounded-2xl p-4 ${className}`}
    style={{
      background: 'rgba(10,14,26,0.72)',
      backdropFilter: 'blur(28px) saturate(160%)',
      WebkitBackdropFilter: 'blur(28px) saturate(160%)',
      border: '1px solid rgba(255,255,255,0.09)',
      boxShadow: '0 24px 56px -12px rgba(0,0,0,0.75), inset 0 1px 0 rgba(255,255,255,0.10)',
    }}
  >
    {/* Specular top edge highlight */}
    <div
      className="absolute inset-x-6 top-0 h-px pointer-events-none rounded-full"
      style={{ background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.22), transparent)' }}
    />
    {/* Hover radial lift */}
    <div
      className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none"
      style={{ background: 'radial-gradient(320px circle at 50% 0%, rgba(129,140,248,0.10), transparent 68%)' }}
    />

    {/* Header */}
    <div className="relative z-10 flex items-center gap-2 mb-3">
      {Icon && (
        <div
          className="w-6 h-6 rounded-[8px] flex items-center justify-center shrink-0"
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.11)' }}
        >
          <Icon size={13} className="text-white/70 stroke-[2.2]" />
        </div>
      )}
      <h3 className="text-[10px] font-semibold tracking-widest uppercase text-white/55 truncate font-sans">
        {title}
      </h3>
    </div>

    <div className="relative z-10">{children}</div>
  </motion.div>
));

/* ─── AI Workflow Steps ─────────────────────────────────────────── */
const AIWorkflow = React.memo(({ steps }: { steps: string[] }) => {
  const [active, setActive] = useState(0);
  const list = steps?.length ? steps : ['DISCOVERY', 'AGENT_INIT', 'EXECUTION', 'OPTIMIZE'];
  useEffect(() => {
    const t = setInterval(() => setActive(s => (s + 1) % list.length), 1800);
    return () => clearInterval(t);
  }, [list.length]);

  return (
    <div className="relative pl-1">
      <div className="absolute left-[7px] top-2 bottom-2 w-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
      <div className="flex flex-col gap-2.5">
        {list.map((step, i) => {
          const isActive = active === i;
          return (
            <div key={i} className="flex items-center gap-3">
              <div className="relative flex items-center justify-center w-3.5 h-3.5 shrink-0">
                {isActive ? (
                  <>
                    <span className="absolute inset-0 rounded-full bg-indigo-400/25 animate-ping" />
                    <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-indigo-400 to-sky-300 shadow-[0_0_8px_rgba(99,102,241,0.7)]" />
                  </>
                ) : (
                  <div className="w-2 h-2 rounded-full" style={{ border: '1px solid rgba(255,255,255,0.2)', background: '#0a0e1a' }} />
                )}
              </div>
              <span className={`text-[11px] tracking-wider font-mono truncate transition-colors duration-300 ${isActive ? 'text-white font-semibold' : 'text-white/35'}`}>
                {step}
              </span>
              {isActive && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="ml-auto text-[8px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0"
                  style={{
                    background: 'rgba(99,102,241,0.15)',
                    border: '1px solid rgba(99,102,241,0.28)',
                    color: '#a5b4fc',
                  }}
                >
                  Active
                </motion.span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});

/* ─── Chatbot Bubble Visual ────────────────────────────────────── */
const ChatBotVisual = React.memo(({
  query, response, footerLeft, footerRight,
}: { query: string; response: string; footerLeft?: string; footerRight?: string }) => (
  <div className="flex flex-col gap-2.5">
    {/* User bubble */}
    <div className="flex items-end gap-2 max-w-[92%]">
      <div
        className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] text-white/65 shrink-0 font-semibold"
        style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.09)' }}
      >U</div>
      <div
        className="rounded-2xl rounded-bl-sm px-3 py-2 text-[11px] text-white/80 leading-snug"
        style={{ background: 'rgba(255,255,255,0.055)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        {query || 'How can I automate my business workflow?'}
      </div>
    </div>

    {/* AI bubble */}
    <div className="flex items-end gap-2 self-end flex-row-reverse max-w-[94%]">
      <div
        className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
        style={{ background: 'linear-gradient(135deg,#6366f1,#38bdf8)', padding: '1px' }}
      >
        <div className="w-full h-full rounded-full flex items-center justify-center" style={{ background: '#0a0e1a' }}>
          <Sparkles size={9} className="text-sky-300" />
        </div>
      </div>
      <div
        className="rounded-2xl rounded-br-sm px-3 py-2 text-[11px] text-indigo-100 leading-snug"
        style={{
          background: 'linear-gradient(135deg,rgba(99,102,241,0.13),rgba(56,189,248,0.09))',
          border: '1px solid rgba(99,102,241,0.22)',
        }}
      >
        {response || 'I can deploy Multi-Agent systems to…'}
      </div>
    </div>

    {/* Footer */}
    <div className="pt-2.5 mt-1 flex items-center justify-between" style={{ borderTop: '1px solid rgba(255,255,255,0.055)' }}>
      <span className="text-[10px] text-white/40 font-medium tracking-wide truncate">{footerLeft || 'Custom Trained LLM'}</span>
      <span
        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-semibold tracking-wide shrink-0"
        style={{ background: 'rgba(52,211,153,0.10)', border: '1px solid rgba(52,211,153,0.18)', color: '#34d399' }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        {footerRight || 'Active'}
      </span>
    </div>
  </div>
));

/* ─── Performance Metric Card Body ─────────────────────────────── */
const PerformanceMetric = React.memo(({ label, value, sub1, sub2 }: { label: string; value: string; sub1: string; sub2: string }) => {
  const bars = [45, 72, 55, 92, 68, 85, 58, 88];
  return (
    <div className="space-y-3.5">
      <div className="flex justify-between items-end">
        <div className="flex flex-col">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40 font-sans">{label || 'Uptime'}</span>
          <span className="text-2xl sm:text-3xl font-bold tracking-tight text-white tabular-nums">{value || '99.9%'}</span>
        </div>
        {/* EQ bars */}
        <div
          className="h-8 flex items-end gap-[3px] px-2 py-1 rounded-lg"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          {bars.map((h, i) => (
            <motion.div
              key={i}
              className="w-[3px] rounded-full"
              style={{ background: 'linear-gradient(to top, #6366f1, #38bdf8)' }}
              animate={{ height: [`${h * 0.38}%`, `${h}%`, `${Math.max(22, h * 0.65)}%`], opacity: [0.65, 1, 0.75] }}
              transition={{ duration: 1.2 + (i % 3) * 0.28, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut', delay: i * 0.1 }}
            />
          ))}
        </div>
      </div>

      <div className="h-px w-full" style={{ background: 'rgba(255,255,255,0.06)' }} />

      <div className="flex justify-between items-center text-[10px] tracking-wide font-mono" style={{ color: 'rgba(129,140,248,0.75)' }}>
        <span className="flex items-center gap-1.5 truncate">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.6)] shrink-0" />
          {sub1 || 'Latency: 0.8ms'}
        </span>
        <span
          className="px-1.5 py-0.5 rounded text-[9px] uppercase font-medium text-white/55 shrink-0"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          {sub2 || 'Global Edge'}
        </span>
      </div>
    </div>
  );
});

/* ═══════════════════════════════════════════════════════════════
   TYPEWRITER — Apple-grade luminous typewriter animation
   Natural typing cadence, pause, delete, and glowing neon cursor
   ═══════════════════════════════════════════════════════════════ */
const DEFAULT_PHRASES = [
  'SCALABLE REALITIES',
  'REAL IMPACT',
  'MEASURABLE GROWTH',
  'POWERFUL SOLUTIONS',
  'INTELLIGENT SYSTEMS',
];

const HeroTypewriter = React.memo(({ phrases, phase }: { phrases: string[]; phase: number }) => {
  const [displayText, setDisplayText] = useState('');
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const active = phrases?.length ? phrases : DEFAULT_PHRASES;

  useEffect(() => {
    if (phase < 1 || !active.length) return;

    const currentPhrase = active[phraseIdx % active.length];
    let timer: NodeJS.Timeout;

    if (!isDeleting) {
      // Typing phase: natural variable delay
      if (displayText.length < currentPhrase.length) {
        timer = setTimeout(() => {
          setDisplayText(currentPhrase.slice(0, displayText.length + 1));
        }, 80 + Math.random() * 40);
      } else {
        // Complete word reached: pause to read
        timer = setTimeout(() => {
          setIsDeleting(true);
        }, 2200);
      }
    } else {
      // Deletion phase: brisk and smooth
      if (displayText.length > 0) {
        timer = setTimeout(() => {
          setDisplayText(currentPhrase.slice(0, displayText.length - 1));
        }, 36);
      } else {
        // Finished deleting: short breath before typing next phrase
        timer = setTimeout(() => {
          setIsDeleting(false);
          setPhraseIdx((prev) => (prev + 1) % active.length);
        }, 320);
      }
    }

    return () => clearTimeout(timer);
  }, [displayText, isDeleting, phraseIdx, phase, active]);

  return (
    <div
      className="relative inline-flex items-center min-h-[1.18em] mt-1 lg:mt-2.5 overflow-visible"
      style={{ fontSize: 'clamp(2.05rem, 6.2vw, 5.0rem)' }}
    >
      <span
        className="font-black tracking-tight whitespace-nowrap"
        style={{
          background: 'linear-gradient(110deg, #60a5fa 0%, #818cf8 35%, #c084fc 70%, #38bdf8 100%)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          color: 'transparent',
          display: 'inline-block',
          lineHeight: 1.05,
          paddingRight: '0.04em',
          filter: 'drop-shadow(0 2px 20px rgba(99,102,241,0.25))',
        }}
      >
        {displayText}
      </span>
      {/* Blinking Apple Neon Cursor */}
      <span
        className="inline-block w-[3px] sm:w-[4px] md:w-[5px] h-[0.82em] ml-1.5 sm:ml-2 rounded-full animate-pulse"
        style={{
          background: 'linear-gradient(to bottom, #38bdf8, #818cf8)',
          boxShadow: '0 0 12px rgba(56,189,248,0.95)',
        }}
      />
    </div>
  );
});

/* ═══════════════════════════════════════════════════════════════
   HOME — Apple Design System Landing Page
   Background: orbital/space cosmos — no blobs, no thunderbolts,
               no NetworkCanvas, no mesh grid
   Typography: Space Grotesk display + system body
   Glass: liquid-glass.md compliant — only on floating cards
   Color: indigo-sky-violet accent triad, monochrome glass labels
   ═══════════════════════════════════════════════════════════════ */

export function Home() {
  const { content } = useContent();
  const { lang } = useLang();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { phase } = useOrchestration();

  const t = (content[lang] as any)?.hero;
  const stats = (content[lang] as any)?.stats?.items || [];

  const titlePrefix = t?.titlePrefix || t?.title || 'Turning Ideas into';
  const rawPhrases = t?.phrases;
  const phrases = Array.isArray(rawPhrases) && rawPhrases.length > 0
    ? rawPhrases
    : typeof rawPhrases === 'string' && rawPhrases.trim()
      ? rawPhrases.split(',').map((s: string) => s.trim()).filter(Boolean)
      : DEFAULT_PHRASES;

  const tagline = t?.tagline || 'Launch at Zero _ Scale to Orbit 🚀';
  const subtitle = t?.subtitle || 'From concept to scale, we engineer high-performance software and autonomous AI agents.';
  const cta = t?.cta || 'Get Started';
  const learnMore = t?.learnMore || 'Our Services';
  const whatsappNumber = t?.whatsappNumber || '8801853452264';
  const contactEmail = t?.contactEmail || 'contact@orbitsaas.cloud';

  const heroBgImage = (t?.heroBgImage && getImageUrl(t.heroBgImage)) || '/images/hero-ai-hand-v3.jpg';
  const [showCtaOptions, setShowCtaOptions] = useState(false);

  return (
    <section
      id="hero"
      className="relative min-h-[100svh] flex flex-col justify-between items-center pt-14 xs:pt-16 sm:pt-20 md:pt-28 lg:pt-32 pb-12 sm:pb-16 overflow-hidden"
      style={{
        opacity: phase >= 1 ? 1 : 0,
        transition: 'opacity 0.12s ease',
        background: '#020408',
      }}
    >
      {/* Anchor for backward compatibility with #home */}
      <span id="home" className="absolute top-0 pointer-events-none opacity-0" aria-hidden="true" />
      {/* ── Full-Bleed Hero Banner Background (Desktop widescreen) ── */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        {/* Responsive Hero Picture: Widescreen 16:9 for desktop/laptop (>=1024px) */}
        <picture className="w-full h-full block">
          <source media="(max-width: 1023px)" srcSet="/images/hero-ai-hand-mobile.jpg" />
          <img
            src={heroBgImage}
            alt=""
            className="w-full h-full object-cover transition-opacity duration-500 object-center lg:object-[72%_center]"
            style={{
              filter: 'brightness(0.88)'
            }}
            loading="eager"
            decoding="async"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/images/hero-ai-hand-v3.jpg';
            }}
          />
        </picture>

        {/* ── Desktop Left-to-Right contrast gradient ── */}
        <div
          className="hidden lg:block absolute inset-0"
          style={{
            background:
              'linear-gradient(90deg, #020408 0%, rgba(2,4,8,0.96) 28%, rgba(2,4,8,0.70) 48%, rgba(2,4,8,0.15) 68%, transparent 85%)',
          }}
        />


        <div
          className="hidden"
          style={{
            background:
              'radial-gradient(circle at 50% 38%, rgba(56,189,248,0.08) 0%, rgba(99,102,241,0.05) 35%, transparent 70%)',
          }}
        />

        {/* ── Top & Bottom ambient gradient masks (Clear transparent window in center for hand connection) ── */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(2,4,8,0.82) 0%, rgba(2,4,8,0.45) 16%, transparent 28%, transparent 68%, rgba(2,4,8,0.72) 84%, #020408 100%)',
          }}
        />
      </div>

      {/* ── Content grid ── */}
      <div className="w-full max-w-[1400px] mx-auto px-4 xs:px-5 sm:px-6 lg:px-10 relative z-10 flex-1 flex flex-col justify-between lg:justify-center py-2 xs:py-3 sm:py-4 md:py-6 lg:py-0 min-h-[calc(100svh-4.5rem)] xs:min-h-[calc(100svh-5rem)] lg:min-h-0">
        <div className="w-full flex-1 flex flex-col justify-between lg:grid lg:grid-cols-12 gap-4 xs:gap-6 lg:gap-14 xl:gap-20 items-stretch lg:items-center my-auto">

          {/* ────────────────── LEFT: copy ────────────────── */}
          <div className="lg:col-span-7 xl:col-span-7 flex-1 flex flex-col justify-between lg:justify-start gap-4 lg:gap-8 pt-0.5 xs:pt-1 sm:pt-3 lg:pt-0 pb-1 xs:pb-2 sm:pb-3 lg:pb-0">

            {/* ── UPPER ZONE: Tagline Capsule & Monumental Title (Yellow Boxed Content: Upper) ── */}
            <div className="flex flex-col gap-3.5 xs:gap-4 sm:gap-5 lg:gap-4 pt-11 xs:pt-13 sm:pt-16 lg:pt-0">
              {/* ── Apple Tagline Capsule: Tinted Glassmorphic Pill ── */}
            <motion.div
              initial={{ opacity: 0, y: -16, scale: 0.94 }}
              animate={phase >= 1 ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: -16, scale: 0.94 }}
              transition={{ type: 'spring', stiffness: 280, damping: 24 }}
            >
              <div
                className="relative inline-flex items-center gap-2.5 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full text-[11px] sm:text-xs font-semibold tracking-[0.16em] uppercase overflow-hidden group cursor-default transition-all duration-300 hover:border-white/30"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(99, 102, 241, 0.16) 0%, rgba(14, 165, 233, 0.12) 50%, rgba(168, 85, 247, 0.14) 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  backdropFilter: 'blur(24px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                  boxShadow:
                    '0 8px 24px -4px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.28)',
                }}
              >
                {/* Top specular hairline edge */}
                <div
                  className="absolute inset-x-4 top-0 h-px pointer-events-none"
                  style={{
                    background:
                      'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.45), transparent)',
                  }}
                />
                {/* Live pulsing celestial beacon */}
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inset-0 rounded-full bg-sky-400 opacity-75" />
                  <span className="relative rounded-full h-full w-full bg-gradient-to-tr from-indigo-500 to-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.85)]" />
                </span>
                <span className="relative font-medium tracking-widest text-zinc-100">
                  {tagline}
                </span>
              </div>
            </motion.div>

            {/* ── Apple Monumental Display Heading ── */}
            <h1
              className="font-black leading-[1.04] tracking-tight mt-4 xs:mt-5 sm:mt-7 lg:mt-0"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {/* Line 1: Staggered Word Reveal */}
              <div
                className="flex flex-wrap lg:flex-nowrap items-center mb-1"
                style={{ fontSize: 'clamp(2.45rem, 6.6vw, 5.4rem)' }}
              >
                {titlePrefix.split(' ').map((word: string, i: number) => (
                  <motion.span
                    key={i}
                    className="inline-block mr-[0.24em] text-white font-black tracking-[-0.035em]"
                    initial={{ opacity: 0, y: 28, filter: 'blur(6px)' }}
                    animate={phase >= 1 ? { opacity: 1, y: 0, filter: 'blur(0px)' } : { opacity: 0, y: 28, filter: 'blur(6px)' }}
                    transition={{
                      delay: i * 0.08,
                      duration: 0.75,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    style={{
                      textShadow: '0 4px 24px rgba(0,0,0,0.6)',
                    }}
                  >
                    {word}
                  </motion.span>
                ))}
              </div>

              {/* Line 2: Apple Luminous Typewriter Animation */}
                <HeroTypewriter phrases={phrases} phase={phase} />
              </h1>
            </div>

            {/* ── CLEAN VISUAL CLEARANCE (Unobstructed view of human & robot hands meeting on background image) ── */}
            <div
              className="lg:hidden h-4 xs:h-6 sm:h-8 pointer-events-none"
              aria-hidden="true"
            />

            {/* ── LOWER ZONE: Subtitle, Stats & CTAs (Red Boxed Content: Downward) ── */}
            <div className="flex flex-col gap-5 xs:gap-6 sm:gap-7 md:gap-8 pb-2 xs:pb-3 sm:pb-4 -mt-8 xs:-mt-12 sm:-mt-16 lg:mt-0">
              {/* Subtitle */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                className="relative -top-8 xs:-top-9 sm:-top-10 lg:top-0 -mt-4 xs:-mt-6 sm:-mt-8 lg:mt-0"
              >
                <p
                  className="text-[14px] xs:text-[15px] sm:text-lg md:text-[1.2rem] leading-[1.72] font-normal max-w-xl text-zinc-300/90 py-0.5"
                  style={{
                    textShadow: '0 2px 12px rgba(0,0,0,0.6)',
                  }}
                >
                  <RichText text={subtitle} />
                </p>
              </motion.div>

              {/* Stats row — Apple Liquid Glass Capsule */}
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={phase >= 2 ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 20, scale: 0.98 }}
                transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1], delay: 0.18 }}
                className="relative -top-4 xs:-top-5 sm:-top-6 lg:top-0 w-full sm:max-w-[580px]"
              >
                <div
                  className="rounded-2xl sm:rounded-full py-3.5 px-2.5 xs:py-4 xs:px-3 sm:py-4.5 sm:px-6 relative overflow-hidden transition-all duration-300 hover:border-white/25"
                  style={{
                    background: 'rgba(255, 255, 255, 0.045)',
                    border: '1px solid rgba(255, 255, 255, 0.14)',
                    backdropFilter: 'blur(28px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(28px) saturate(180%)',
                    boxShadow: '0 20px 48px -10px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.22)',
                  }}
                >
                  {/* Top specular highlight edge */}
                  <div
                    className="absolute inset-x-8 top-0 h-px pointer-events-none"
                    style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.40), transparent)' }}
                  />

                  <div className="grid grid-cols-4 divide-x divide-white/[0.08]">
                    {stats.map((stat: any, i: number) => (
                      <motion.div
                        key={i}
                        whileHover={{ scale: 1.04, y: -1 }}
                        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                        className="flex flex-col items-center justify-center text-center px-1 sm:px-3 min-w-0 group cursor-default"
                      >
                        <div className="flex items-center justify-center gap-1.5">
                          <span className="text-sm xs:text-base sm:text-xl font-black text-white tabular-nums tracking-tight whitespace-nowrap">
                            {stat.value}{stat.suffix}
                          </span>
                          <span
                            className="w-1.5 h-1.5 rounded-full shrink-0 bg-emerald-400 group-hover:scale-125 transition-transform"
                            style={{ boxShadow: '0 0 8px rgba(52,211,153,0.9)' }}
                          />
                        </div>
                        <div
                          className="text-[7.5px] xs:text-[8.5px] sm:text-[9.5px] uppercase tracking-wider font-semibold leading-tight mt-1 line-clamp-2 text-center text-white/65 group-hover:text-white/80 transition-colors"
                        >
                          {stat.label}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* ── CTA Buttons ── */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
                transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1], delay: 0.24 }}
                className="flex flex-row items-center gap-3.5 sm:gap-4 h-[54px] sm:h-[58px] pt-1.5 xs:pt-2 sm:pt-2.5"
              >
                {/* Primary CTA — Apple Prominent White Pill Button */}
                <div className="relative h-full flex items-center">
                  <AnimatePresence mode="wait">
                    {!showCtaOptions ? (
                      <motion.button
                        key="main"
                        initial={{ opacity: 0, scale: 0.94 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.94 }}
                        whileHover={{ scale: 1.025, y: -1 }}
                        whileTap={{ scale: 0.97 }}
                        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                        onClick={() => setShowCtaOptions(true)}
                        className="relative overflow-hidden h-full px-6 sm:px-8 text-sm sm:text-base font-bold rounded-full flex items-center gap-2.5 group cursor-pointer whitespace-nowrap shadow-[0_0_0_1px_rgba(255,255,255,0.3),0_14px_30px_-6px_rgba(255,255,255,0.22),0_6px_16px_rgba(0,0,0,0.5)]"
                        style={{
                          background: '#ffffff',
                          color: '#09090b',
                        }}
                      >
                        {/* Subtle hover specular sheen */}
                        <span className="absolute inset-0 bg-gradient-to-t from-zinc-200/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <span className="relative z-10 flex items-center gap-2 tracking-tight">
                          {cta}
                          <Zap className="fill-current text-indigo-600 transition-transform duration-300 group-hover:scale-125 group-hover:rotate-12" size={15} />
                        </span>
                      </motion.button>
                    ) : (
                      <motion.div
                        key="options"
                        initial={{ opacity: 0, scale: 0.92, y: 6 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92, y: 6 }}
                        transition={{ type: 'spring', stiffness: 350, damping: 26 }}
                        className="flex items-center gap-1.5 sm:gap-2 h-full p-1.5 rounded-full relative overflow-hidden"
                        style={{
                          background: 'rgba(255,255,255,0.06)',
                          border: '1px solid rgba(255,255,255,0.16)',
                          backdropFilter: 'blur(28px) saturate(180%)',
                          WebkitBackdropFilter: 'blur(28px) saturate(180%)',
                          boxShadow: '0 18px 42px -10px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.24)',
                        }}
                      >
                        {/* Specular hairline */}
                        <div className="absolute inset-x-4 top-0 h-px" style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.4),transparent)' }} />

                        {/* WhatsApp */}
                        <motion.a
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}`}
                          target="_blank" rel="noopener noreferrer"
                          className="group/wa flex items-center gap-2.5 px-4 h-full rounded-full transition-all duration-200 whitespace-nowrap"
                          style={{
                            background: 'rgba(52,211,153,0.15)',
                            border: '1px solid rgba(52,211,153,0.30)',
                            color: '#34d399',
                          }}
                        >
                          <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(52,211,153,0.24)' }}>
                            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766 0-3.18-2.587-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.043.073.043.419-.101.824z" />
                            </svg>
                          </div>
                          <span className="text-xs sm:text-[13px] font-bold text-white">WhatsApp</span>
                        </motion.a>

                        {/* Email */}
                        <motion.a
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(contactEmail)}`}
                          target="_blank" rel="noopener noreferrer"
                          className="group/mail flex items-center gap-2.5 px-4 h-full rounded-full transition-all duration-200 whitespace-nowrap"
                          style={{
                            background: 'rgba(99,102,241,0.15)',
                            border: '1px solid rgba(129,140,248,0.30)',
                            color: '#a5b4fc',
                          }}
                        >
                          <Mail size={14} className="stroke-[2.4]" />
                          <span className="text-xs sm:text-[13px] font-bold text-white">Email</span>
                        </motion.a>

                        {/* Close */}
                        <button
                          onClick={e => { e.stopPropagation(); setShowCtaOptions(false); }}
                          className="h-8 w-8 rounded-full flex items-center justify-center transition-all duration-200 hover:bg-white/10 active:scale-95 cursor-pointer ml-0.5 shrink-0 text-white/60 hover:text-white"
                          aria-label="Close options"
                        >
                          <X size={14} />
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Secondary CTA — Apple Frosted Glass Pill */}
                <motion.button
                  whileHover={{ scale: 1.025, y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                  onClick={() => navigate('/services')}
                  className={`px-5 sm:px-7 h-full rounded-full text-sm sm:text-base font-semibold transition-all duration-300 flex items-center gap-2.5 group cursor-pointer ${showCtaOptions ? 'hidden sm:flex' : 'flex'}`}
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.14)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    color: '#ffffff',
                    boxShadow: '0 10px 28px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.16)',
                  }}
                >
                  <span>{learnMore}</span>
                  <ArrowRight className="transition-transform duration-300 group-hover:translate-x-1.5 text-white/60 group-hover:text-white" size={16} />
                </motion.button>
              </motion.div>
            </div>
          </div>

          {/* ────────────────── RIGHT: open visual canvas showcasing hero banner ────────────────── */}
          <div className="lg:col-span-5 xl:col-span-5 hidden lg:flex items-center justify-center min-h-[460px] pointer-events-none" aria-hidden="true">
            {/* Visual spacer allowing the background robot + human hand connection to shine through unobstructed */}
          </div>
        </div>
      </div>

      <WaveDivider fill="#FAFAFA" />
    </section>
  );
}
