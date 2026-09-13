import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import { useContent } from '@/contexts/ContentContext';
import { useLang } from '@/contexts/LanguageContext';
import { useOrchestration } from '@/App';
import React, { useEffect, useRef, useCallback, useState, Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { RichText } from '@/components/ui/RichText';

// Mobile detection hook — prevents heavy components from mounting on touch devices
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' &&
    (window.matchMedia('(hover: none) and (pointer: coarse)').matches || window.innerWidth < 1024)
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(
        window.matchMedia('(hover: none) and (pointer: coarse)').matches || window.innerWidth < 1024
      );
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile;
}

import { NetworkCanvas } from '@/components/orbit/NetworkCanvas';
import { 
  ArrowRight, Cpu, Zap, Activity, Globe, MessageSquare, Shield, Rocket, X,
  Bot, Smartphone, ShoppingCart, Code, Database, Cloud, Monitor, 
  Wifi, Mail, Camera, Music, Heart, Star, Target, Briefcase, 
  Award, BookOpen, Users, BarChart3, Sparkles, Layers, Settings2, 
  Eye, Palette, Brain, Wrench, LucideIcon
} from 'lucide-react';
import { WaveDivider } from '@/components/ui/WaveDivider';


const BackgroundBlobs = () => (
  <div className="absolute inset-0 overflow-hidden -z-10 pointer-events-none">
    {/* Emerald luminous aura top-left / center */}
    <div 
      className="absolute -top-[10%] -left-[10%] w-[55%] h-[55%] bg-emerald-500/20 blur-[130px] rounded-full hero-blob"
      style={{ animationDuration: '15s' }}
    />
    {/* Teal/mint glowing cloud top-right */}
    <div 
      className="absolute top-[10%] -right-[10%] w-[50%] h-[50%] bg-teal-500/18 blur-[110px] rounded-full hero-blob"
      style={{ animationDuration: '18s', animationDelay: '2s' }}
    />
    {/* Neon green / emerald radiant aura bottom-center */}
    <div 
      className="absolute -bottom-[10%] left-[20%] w-[50%] h-[50%] bg-emerald-600/16 blur-[110px] rounded-full hero-blob"
      style={{ animationDuration: '13s', animationDelay: '4s' }}
    />
    {/* Deep cyan subtle balance */}
    <div 
      className="absolute top-[40%] left-[10%] w-[35%] h-[35%] bg-cyan-600/12 blur-[100px] rounded-full hero-blob"
      style={{ animationDuration: '16s', animationDelay: '3s' }}
    />
  </div>
);

const FloatingParticles = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none -z-5">
    {[...Array(6)].map((_, i) => (
      <div
        key={i}
        className="absolute w-px h-28 bg-gradient-to-b from-transparent via-emerald-400/30 to-transparent floating-particle"
        style={{
          left: `${i * 18 + 5}%`,
          animationDuration: `${14 + i * 2}s`,
          animationDelay: `${i * 1.5}s`
        }}
      />
    ))}
  </div>
);

/* ═══════════════════════════════════════════════════════════
   THUNDERBOLT CANVAS — High-intensity electric arc system
   ═══════════════════════════════════════════════════════════ */

interface Bolt {
  points: { x: number; y: number }[];
  life: number;
  maxLife: number;
  opacity: number;
  width: number;
}

function useThunderboltCanvas(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  prefersReducedMotion: boolean | null
) {
  const bolts = useRef<Bolt[]>([]);
  const animRef = useRef<number>(0);

  const createBolt = useCallback((w: number, h: number) => {
    const isSmall = w < 768;
    const startX = Math.random() * w;
    const startY = Math.random() * (h * 0.35);
    const points = [{ x: startX, y: startY }];
    
    let curX = startX;
    let curY = startY;
    const segments = isSmall ? (6 + Math.floor(Math.random() * 5)) : (8 + Math.floor(Math.random() * 7));
    const spreadX = isSmall ? 55 : 110;
    
    for (let i = 0; i < segments; i++) {
      curX += (Math.random() - 0.5) * spreadX;
      curY += Math.random() * (isSmall ? 65 : 90) + 30;
      points.push({ x: curX, y: curY });
    }

    bolts.current.push({
      points,
      life: 1,
      maxLife: 0.9 + Math.random() * 1.4,
      opacity: 0.7 + Math.random() * 0.3,
      width: isSmall ? (1 + Math.random() * 1.5) : (1.2 + Math.random() * 2),
    });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || prefersReducedMotion) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isVisible = true;

    // Pause canvas when hero is scrolled out of view
    const observer = new IntersectionObserver(
      ([entry]) => { isVisible = entry.isIntersecting; },
      { threshold: 0.05 }
    );
    observer.observe(canvas);

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const loop = () => {
      if (!isVisible) {
        animRef.current = requestAnimationFrame(loop);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Occasional lightning strikes (balanced for subtle, dramatic effect)
      if (Math.random() < 0.01) {
        createBolt(canvas.width, canvas.height);
      }

      bolts.current = bolts.current.filter(bolt => {
        bolt.life -= 0.009;
        if (bolt.life <= 0) return false;

        const alpha = (bolt.life / bolt.maxLife) * bolt.opacity;
        
        // Subtle ambient emerald light flash across hero background
        ctx.fillStyle = `rgba(16, 185, 129, ${alpha * 0.035})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw electric emerald outer aura
        ctx.shadowBlur = 18;
        ctx.shadowColor = `rgba(16, 185, 129, ${alpha * 0.95})`;
        ctx.strokeStyle = `rgba(52, 211, 153, ${alpha * 0.55})`;
        ctx.lineWidth = bolt.width * 3.8;
        ctx.beginPath();
        ctx.moveTo(bolt.points[0].x, bolt.points[0].y);
        bolt.points.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.stroke();

        // Draw luminous mint-white core
        ctx.shadowBlur = 6;
        ctx.shadowColor = `rgba(167, 243, 208, ${alpha})`;
        ctx.strokeStyle = `rgba(236, 253, 245, ${alpha})`;
        ctx.lineWidth = bolt.width;
        ctx.beginPath();
        ctx.moveTo(bolt.points[0].x, bolt.points[0].y);
        bolt.points.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.stroke();

        return true;
      });

      animRef.current = requestAnimationFrame(loop);
    };

    if (!prefersReducedMotion) {
      animRef.current = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
      observer.disconnect();
    };
  }, [canvasRef, createBolt, prefersReducedMotion]);
}

const ICON_MAP: Record<string, LucideIcon | any> = {
    Globe, Bot, Zap, Smartphone, ShoppingCart, Rocket, Code, Database, Shield, Cloud,
    Cpu, Monitor, Wifi, Mail, Camera, Music, Heart, Star, Target, Briefcase,
    Award, BookOpen, Users, BarChart3, Sparkles, Layers, Settings2, Eye, Palette, Brain, Wrench,
    Activity
};

/* ═══════════════════════════════════════════════════════════
   APPLE LIQUID GLASS CARDS — HIG Frosted Surface Units
   ═══════════════════════════════════════════════════════════ */

const FlashyCard = React.memo(({ children, icon: Icon, title, delay, className = "" }: any) => {
  const cardRef = useRef<HTMLDivElement>(null);

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 24 }}
      animate={{ 
        opacity: 1, 
        y: 0,
        transition: {
          duration: 0.8,
          delay,
          ease: [0.16, 1, 0.3, 1] // Apple fluid spring curve
        }
      }}
      whileHover={{ 
        y: -4,
        transition: { duration: 0.25, ease: "easeOut" }
      }}
      style={{
        boxShadow: '0 20px 48px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.1), inset 0 1px 0 0 rgba(255, 255, 255, 0.22)'
      }}
      className={`relative group rounded-[20px] p-3.5 sm:p-4 backdrop-blur-2xl backdrop-saturate-150 transition-all duration-300 ${className}`}
    >
      {/* Apple Liquid Glass Layering: Multi-surface reflection & deep dark glass */}
      <div className="absolute inset-0 rounded-[20px] bg-gradient-to-b from-white/[0.08] via-white/[0.03] to-white/[0.01] pointer-events-none" />
      <div className="absolute inset-0 rounded-[20px] bg-[#0c0d14]/85 pointer-events-none" />

      {/* Apple Specular Top Highlight Catch */}
      <div className="absolute inset-x-5 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />

      {/* Subtle hover top spotlight */}
      <div 
        className="absolute inset-0 rounded-[20px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: 'radial-gradient(350px circle at 50% 0%, rgba(129, 140, 248, 0.15), transparent 70%)'
        }}
      />

      {/* Card Header — Apple HIG Style */}
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2.5">
          {Icon && (
            <div className="w-6 h-6 rounded-[8px] bg-white/[0.08] border border-white/[0.12] flex items-center justify-center text-white/90 shadow-sm transition-transform duration-300 group-hover:scale-105 shrink-0">
              <Icon size={13} className="stroke-[2.2]" />
            </div>
          )}
          <h3 className="text-[10.5px] font-semibold tracking-wider text-white/70 uppercase font-sans truncate">
            {title}
          </h3>
        </div>

        {/* Card Body */}
        <div>
          {children}
        </div>
      </div>
    </motion.div>
  );
});

const AIWorkflow = React.memo(({ steps }: { steps: string[] }) => {
  const [activeStep, setActiveStep] = useState(0);
  const displaySteps = steps?.length > 0 ? steps : ['DISCOVERY', 'AGENT_INIT', 'EXECUTION', 'OPTIMIZE'];
  
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep(s => (s + 1) % displaySteps.length);
    }, 1800);
    return () => clearInterval(interval);
  }, [displaySteps.length]);

  return (
    <div className="relative pl-1">
      {/* Sleek vertical connecting track */}
      <div className="absolute left-[7px] top-2 bottom-2 w-[1.5px] bg-white/[0.08]" />

      <div className="flex flex-col gap-2.5 relative">
        {displaySteps.map((step, i) => {
          const isActive = activeStep === i;
          return (
            <div key={i} className="flex items-center gap-3 group/step">
              {/* Apple-style status indicator */}
              <div className="relative flex items-center justify-center w-3.5 h-3.5 shrink-0">
                {isActive ? (
                  <>
                    <motion.span 
                      layoutId="pulseRing"
                      className="absolute inset-0 rounded-full bg-indigo-500/30 animate-ping" 
                    />
                    <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-indigo-400 to-cyan-300 shadow-[0_0_10px_rgba(99,102,241,0.8)]" />
                  </>
                ) : (
                  <div className="w-2 h-2 rounded-full border border-white/25 bg-[#14151e]" />
                )}
              </div>

              {/* Step Label */}
              <span className={`text-[11px] tracking-wider font-mono transition-colors duration-300 truncate ${isActive ? 'text-white font-semibold' : 'text-white/40 font-normal'}`}>
                {step}
              </span>

              {/* Active Badge */}
              {isActive && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="ml-auto text-[8px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-[0_0_8px_rgba(99,102,241,0.2)] shrink-0"
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

const ChatBotVisual = React.memo(({ 
  query, 
  response,
  footerLeft,
  footerRight
}: { 
  query: string; 
  response: string;
  footerLeft?: string;
  footerRight?: string;
}) => {
  return (
    <div className="flex flex-col gap-2.5">
      {/* User Bubble */}
      <div className="flex items-end gap-2 max-w-[92%]">
        <div className="w-5 h-5 rounded-full bg-white/[0.08] border border-white/[0.1] flex items-center justify-center text-[9px] text-white/70 shrink-0 font-medium">
          U
        </div>
        <div className="bg-white/[0.06] border border-white/[0.08] backdrop-blur-md rounded-2xl rounded-bl-sm px-3 py-2 text-[11px] text-white/85 leading-snug shadow-sm">
          {query || "How can I automate my business workflow?"}
        </div>
      </div>

      {/* AI Response Bubble */}
      <div className="flex items-end gap-2 self-end flex-row-reverse max-w-[94%]">
        <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-cyan-400 p-[1px] shadow-[0_0_8px_rgba(99,102,241,0.4)] shrink-0">
          <div className="w-full h-full rounded-full bg-[#0d0e15] flex items-center justify-center">
            <Sparkles size={9} className="text-cyan-300" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-indigo-500/15 via-purple-500/10 to-blue-500/10 border border-indigo-400/25 backdrop-blur-md rounded-2xl rounded-br-sm px-3 py-2 text-[11px] text-indigo-100 leading-snug shadow-sm">
          {response || "I can deploy Multi-Agent systems to..."}
        </div>
      </div>

      {/* Apple-Style Metadata Footer */}
      <div className="pt-2.5 border-t border-white/[0.06] flex items-center justify-between mt-1">
        <span className="text-[10px] font-medium tracking-wide text-white/45 truncate">
          {footerLeft || "Custom Trained LLM"}
        </span>
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-semibold tracking-wide shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          {footerRight || "Active"}
        </span>
      </div>
    </div>
  );
});

const PerformanceMetric = React.memo(({ 
  label, 
  value, 
  sub1, 
  sub2 
}: { 
  label: string; 
  value: string; 
  sub1: string; 
  sub2: string;
}) => {
  const barHeights = [45, 75, 55, 95, 70, 85, 60, 90];

  return (
    <div className="space-y-3.5">
      <div className="flex justify-between items-end">
        <div className="flex flex-col">
          <span className="text-[10px] font-semibold text-white/45 uppercase tracking-wider font-sans">
            {label || "Uptime"}
          </span>
          <span className="text-2xl sm:text-3xl font-bold tracking-tight text-white tabular-nums">
            {value || "99.9%"}
          </span>
        </div>

        {/* Apple Activity / Audio EQ Visualizer */}
        <div className="h-8 flex items-end gap-[3px] px-1.5 py-1 bg-white/[0.03] border border-white/[0.06] rounded-lg">
          {barHeights.map((h, i) => (
            <motion.div
              key={i}
              className="w-[3px] rounded-full bg-gradient-to-t from-indigo-500 to-cyan-300 shadow-[0_0_6px_rgba(99,102,241,0.3)]"
              animate={{ 
                height: [`${h * 0.4}%`, `${h}%`, `${Math.max(25, h * 0.7)}%`],
                opacity: [0.7, 1, 0.8]
              }}
              transition={{
                duration: 1.2 + (i % 3) * 0.3,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut",
                delay: i * 0.1
              }}
            />
          ))}
        </div>
      </div>

      {/* Hairline Divider */}
      <div className="h-[1px] w-full bg-white/[0.06]" />

      {/* Apple Status Footer */}
      <div className="flex justify-between items-center text-[10px] tracking-wide text-indigo-300/80 font-mono">
        <span className="flex items-center gap-1.5 truncate">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)] shrink-0" />
          {sub1 || "Latency: 0.8ms"}
        </span>
        <span className="px-1.5 py-0.5 rounded bg-white/[0.05] border border-white/[0.08] text-white/60 text-[9px] uppercase font-medium shrink-0">
          {sub2 || "Global Edge"}
        </span>
      </div>
    </div>
  );
});

/* ═══════════════════════════════════════════════════════════
   HOME — Electric Left-Aligned Redesign
   ═══════════════════════════════════════════════════════════ */

const DEFAULT_PHRASES = [
  "SCALABLE REALITIES",
  "REAL IMPACT",
  "MEASURABLE GROWTH",
  "POWERFUL SOLUTIONS",
  "INTELLIGENT SYSTEMS"
];

/* Memoized typewriter subcomponent: keeps typing re-renders (every 50-150ms)
   isolated so the entire Home component, cards, and canvas do NOT re-render */
const HeroTypewriter = React.memo(({ phrases, phase }: { phrases: string[]; phase: number }) => {
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [typingSpeed, setTypingSpeed] = useState(150);

  const activePhrases = phrases && phrases.length > 0 ? phrases : DEFAULT_PHRASES;

  useEffect(() => {
    if (phase < 1) return;

    const handleTyping = () => {
      const currentPhrase = activePhrases[phraseIndex % activePhrases.length];
      
      if (!isDeleting) {
        setDisplayText(currentPhrase.substring(0, displayText.length + 1));
        setTypingSpeed(100 + Math.random() * 50);
        
        if (displayText === currentPhrase) {
          setTimeout(() => setIsDeleting(true), 2000);
        }
      } else {
        setDisplayText(currentPhrase.substring(0, displayText.length - 1));
        setTypingSpeed(50);
        
        if (displayText === "") {
          setIsDeleting(false);
          setPhraseIndex((prev) => (prev + 1) % activePhrases.length);
        }
      }
    };

    const timer = setTimeout(handleTyping, typingSpeed);
    return () => clearTimeout(timer);
  }, [displayText, isDeleting, phraseIndex, typingSpeed, phase, activePhrases]);

  return (
    <div className="text-[1.9rem] xs:text-[2.3rem] sm:text-[2.8rem] md:text-[4rem] lg:text-[3.5rem] xl:text-[4.5rem] relative inline-flex items-center min-h-[1.15em] mt-1 lg:mt-2 whitespace-nowrap overflow-visible">
      <span
        className="leading-none"
        style={{
          background: 'linear-gradient(to right, #F59E0B, #A855F7, #EC4899)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          color: 'transparent',
          display: 'inline-block',
          paddingRight: '0.05em'
        }}
      >
        {displayText}
      </span>
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
        className="inline-block w-[2px] md:w-[4px] h-[0.9em] bg-violet-400 ml-2"
      />
    </div>
  );
});

export function Home() {
  const { content } = useContent();
  const { lang } = useLang();
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);
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
  const contactEmail = t?.contactEmail || 'contact@orbitsaas.com';

  const [showCtaOptions, setShowCtaOptions] = useState(false);


  useThunderboltCanvas(canvasRef, prefersReducedMotion);

  return (
    <section 
      id="home" 
      className="relative min-h-[100svh] flex flex-col justify-between items-center pt-14 xs:pt-16 sm:pt-20 md:pt-28 lg:pt-32 pb-12 sm:pb-16 md:pb-16 overflow-hidden noise-overlay border-none"
      style={{ 
        // Prevent FOUC: entire section invisible until phase 1
        opacity: phase >= 1 ? 1 : 0,
        transition: 'opacity 0.1s ease'
      }}
    >
      {/* Background effects — fade in at phase 2 */}
      <Suspense fallback={null}>
        <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: phase >= 2 ? 1 : 0 }}
           transition={{ duration: 1.5 }}
        >
          <BackgroundBlobs />
          <FloatingParticles />
        </motion.div>
      </Suspense>

      {/* ── Cyber Tech Mesh Grid Overlay ── */}
      <div 
        className="absolute inset-0 pointer-events-none -z-5 opacity-25"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(16, 185, 129, 0.08) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(16, 185, 129, 0.08) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse 80% 80% at 50% 45%, black 25%, transparent 92%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 50% 45%, black 25%, transparent 92%)',
        }}
      />

      {/* ── Global Mesh Structure Canvas Layer — visible on both mobile and laptop ── */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: phase >= 2 ? 0.85 : 0 }}
        transition={{ duration: 2 }}
        className="absolute inset-0 z-0 pointer-events-none overflow-hidden"
        style={{
          maskImage: 'radial-gradient(ellipse 90% 85% at 50% 45%, black 35%, transparent 95%)',
          WebkitMaskImage: 'radial-gradient(ellipse 90% 85% at 50% 45%, black 35%, transparent 95%)',
        }}
      >
        <NetworkCanvas />
      </motion.div>

      {/* Soft dark vignette so content stands out with crystal clear contrast */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/75 pointer-events-none z-0" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent_35%,rgba(3,7,6,0.85)_100%)] pointer-events-none z-0" />

      {/* ── Thunderbolt Canvas Background — electric arcs fade in at phase 2 ── */}
      <motion.canvas
        initial={{ opacity: 0 }}
        animate={{ opacity: phase >= 2 ? 0.75 : 0 }}
        transition={{ duration: 2 }}
        ref={canvasRef}
        data-idm-ignore="true"
        idm-ignore="true"
        disable-idm="true"
        aria-hidden="true"
        role="presentation"
        onContextMenu={(e) => e.preventDefault()}
        className="absolute inset-0 z-0 pointer-events-none"
      />

      {/* ── Grid Layout ── */}
      <div className="w-full max-w-[1400px] mx-auto px-5 sm:px-6 lg:px-8 relative z-10 flex-1 flex flex-col justify-between py-2 md:py-0">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 xl:gap-16 items-center relative my-auto">
          
          {/* Left Side: Content */}
          <div className="lg:col-span-7 xl:col-span-7 space-y-7 sm:space-y-8 md:space-y-8 flex flex-col justify-between">
            {/* Tagline badge — phase 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.6 }}
            >
              {/* Gap 1 (Blue Box 1): Badge to Heading */}
              <div className="flex w-full mb-8 xs:mb-9 sm:mb-8 md:mb-9">
                <span className="relative inline-flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-[10px] sm:text-xs font-black tracking-widest uppercase shadow-[0_0_15px_rgba(99,102,241,0.2)] whitespace-nowrap overflow-hidden group">
                  {/* Shiny sweep animation */}
                  <motion.span 
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12" 
                  />
                  <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-indigo-500"></span>
                  </span>
                  <motion.span
                    animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                    className="bg-gradient-to-r from-indigo-300 via-fuchsia-300 to-indigo-300 bg-[length:200%_auto] bg-clip-text text-transparent"
                  >
                    {tagline}
                  </motion.span>
                </span>
              </div>

              {/* Gap 2 (Blue Box 2): Heading to Subtitle */}
              <h1 
                className="font-black leading-[1.05] tracking-tight mb-9 xs:mb-11 sm:mb-9 md:mb-11"
                style={{ 
                  fontFamily: 'var(--font-display)'
                }}
              >
                {/* Line 1: Static Title — phase 1, staggered words */}
                <div className="text-[2.4rem] xs:text-[2.85rem] sm:text-[3.5rem] leading-[1.08] md:text-[5rem] lg:text-[4rem] xl:text-[5.2rem] flex flex-wrap lg:flex-nowrap lg:whitespace-nowrap items-center mb-1">
                  {titlePrefix.split(' ').map((word: string, i: number) => (
                    <motion.span
                      key={i}
                      className="inline-block mr-[0.25em]"
                      initial={{ opacity: 0, y: 20 }}
                      animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                      transition={{ delay: i * 0.15, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                      style={{ color: 'white' }}
                    >
                      {word}
                    </motion.span>
                  ))}
                </div>
                
                {/* Line 2: Dynamic Phrases — visible with phase 1, typewriter starts at phase 1 */}
                <HeroTypewriter phrases={phrases} phase={phase} />
              </h1>

              {/* Subtitle, stats bar, and CTA buttons — phase 2 */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              >
                {/* Gap 3 (Blue Box 3): Subtitle to Stats Bar */}
                <p className="text-base xs:text-[17px] sm:text-base md:text-xl text-white/60 max-w-xl leading-relaxed mb-10 xs:mb-12 sm:mb-10 md:mb-12">
                  <RichText text={subtitle} />
                </p>

                {/* Gap 4 (Blue Box 4): Stats Bar to CTA Buttons */}
                <div className="mb-9 xs:mb-11 sm:mb-9 md:mb-11 relative">
                  <div className="absolute -inset-1.5 bg-emerald-500/10 blur-xl rounded-full -z-10" />
                  
                  <div className="w-full sm:max-w-[560px] bg-white/[0.035] sm:bg-white/[0.04] border border-white/[0.09] sm:border-white/[0.1] backdrop-blur-2xl rounded-full py-2 px-1.5 xs:px-2.5 sm:py-2.5 sm:px-5 shadow-[0_8px_28px_-6px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.18)] relative overflow-hidden group/stats">
                    {/* Top specular hairline highlight */}
                    <div className="absolute inset-x-6 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/35 to-transparent pointer-events-none" />

                    <div className="grid grid-cols-4 divide-x divide-white/[0.08] items-center">
                      {stats.map((stat: any, i: number) => (
                        <div key={i} className="flex flex-col items-center justify-center text-center px-1 xs:px-1.5 sm:px-3 min-w-0 group/stat">
                          <div className="flex items-baseline justify-center gap-1">
                            <span className="text-[13px] xs:text-[14px] sm:text-[15px] font-bold text-white tabular-nums tracking-tight whitespace-nowrap">
                              {stat.value}{stat.suffix}
                            </span>
                            <motion.div 
                              animate={{ 
                                scale: [1, 1.3, 1],
                                opacity: [0.5, 1, 0.5]
                              }}
                              transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.35 }}
                              className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)] shrink-0" 
                            />
                          </div>
                          <div className="text-[7.5px] xs:text-[8px] sm:text-[8.5px] text-white/50 uppercase tracking-wider font-semibold leading-tight mt-0.5 line-clamp-2 text-center" title={stat.label}>
                            {stat.label}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-row items-center gap-3 md:gap-4 h-[50px] xs:h-[54px] pt-1.5 sm:pt-1">
                  <div className="relative h-full flex items-center">
                    <AnimatePresence mode="wait">
                      {!showCtaOptions ? (
                        <motion.button
                          key="mainCta"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.25 }}
                          onClick={() => setShowCtaOptions(true)}
                          className="relative overflow-hidden h-full px-5 md:px-7 bg-white text-black text-sm md:text-base font-semibold rounded-2xl hover:bg-white/90 transition-all duration-300 flex items-center justify-center gap-2 group cursor-pointer shadow-[0_10px_25px_rgba(255,255,255,0.18),inset_0_1px_0_0_rgba(255,255,255,0.8)] whitespace-nowrap"
                        >
                          <span className="relative z-10 flex items-center gap-2">
                            {cta}
                            <Zap className="fill-current text-indigo-600 transition-transform group-hover:scale-110" size={15} />
                          </span>
                        </motion.button>
                      ) : (
                        <motion.div
                          key="options"
                          initial={{ opacity: 0, scale: 0.92, y: 4 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.92, y: 4 }}
                          transition={{ type: "spring", stiffness: 320, damping: 26 }}
                          className="flex items-center gap-1.5 sm:gap-2 h-full p-1 rounded-2xl bg-white/[0.04] border border-white/[0.12] backdrop-blur-2xl shadow-[0_14px_36px_-8px_rgba(0,0,0,0.6),inset_0_1px_0_0_rgba(255,255,255,0.22)] relative overflow-hidden"
                        >
                          {/* Top specular hairline */}
                          <div className="absolute inset-x-3 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />

                          {/* Apple Frosted WhatsApp Action Card */}
                          <a
                            href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group/wa flex items-center gap-2.5 px-3.5 sm:px-4 h-full rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 hover:border-emerald-400/50 text-emerald-300 hover:text-white backdrop-blur-xl shadow-[0_4px_12px_rgba(16,185,129,0.15)] transition-all duration-200 active:scale-[0.98] whitespace-nowrap"
                          >
                            <div className="w-5 h-5 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover/wa:scale-110 transition-transform shrink-0">
                              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766 0-3.18-2.587-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.043.073.043.419-.101.824z" />
                              </svg>
                            </div>
                            <div className="flex flex-col text-left">
                              <span className="text-xs sm:text-[13px] font-bold leading-tight text-white">WhatsApp</span>
                              <span className="text-[8.5px] sm:text-[9px] text-emerald-300/80 leading-none">Direct Chat</span>
                            </div>
                          </a>

                          {/* Apple Frosted Email Action Card */}
                          <a
                            href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(contactEmail)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group/mail flex items-center gap-2.5 px-3.5 sm:px-4 h-full rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-400/30 hover:border-indigo-300/50 text-indigo-200 hover:text-white backdrop-blur-xl shadow-[0_4px_12px_rgba(99,102,241,0.15)] transition-all duration-200 active:scale-[0.98] whitespace-nowrap"
                          >
                            <div className="w-5 h-5 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-300 group-hover/mail:scale-110 transition-transform shrink-0">
                              <Mail size={12} className="stroke-[2.4]" />
                            </div>
                            <div className="flex flex-col text-left">
                              <span className="text-xs sm:text-[13px] font-bold leading-tight text-white">Email</span>
                              <span className="text-[8.5px] sm:text-[9px] text-indigo-300/80 leading-none">Inquiry Desk</span>
                            </div>
                          </a>

                          {/* Apple Close Pill */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowCtaOptions(false);
                            }}
                            className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-white/[0.06] hover:bg-white/[0.14] border border-white/[0.1] text-white/60 hover:text-white backdrop-blur-xl flex items-center justify-center transition-all duration-200 active:scale-95 cursor-pointer ml-0.5 shrink-0"
                            aria-label="Close options"
                          >
                            <X size={14} />
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <button
                    onClick={() => navigate('/services')}
                    className={`px-4.5 py-2.5 md:px-6 md:py-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.09] backdrop-blur-xl text-white text-xs md:text-sm font-semibold transition-all duration-300 flex items-center gap-2 group cursor-pointer ${showCtaOptions ? 'hidden sm:flex' : 'flex'}`}
                  >
                    <span>{learnMore}</span>
                    <ArrowRight className="transition-transform group-hover:translate-x-1 text-white/65 group-hover:text-white" size={15} />
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </div>

          {/* Right Side: Apple Frosted Glass Showcase — Expanded height and generous vertical breathing space */}
          {!isMobile && (
            <div className={`lg:col-span-5 xl:col-span-5 hidden lg:block transition-opacity duration-1000 ${phase >= 2 ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
              <div className="relative h-[700px] w-full max-w-[460px] ml-auto">
                {/* Card 1: Agentic AI - Top Right (Ends ~y=150px) */}
                <div className="absolute top-0 right-2 sm:right-4 z-10 transition-all duration-500">
                  <FlashyCard icon={ICON_MAP[t?.feature1Icon] || Activity} title={t?.feature1Title || "Agentic AI nodes"} delay={0.2} className="w-[270px]">
                    <AIWorkflow steps={t?.feature1Steps} />
                  </FlashyCard>
                </div>

                {/* Card 2: Conversational AI - Middle Overlap (Starts at y=225px, giving ~65-75px clear space below Card 1) */}
                <div className="absolute top-[225px] left-0 xl:left-[-10px] z-20 transition-all duration-500">
                  <FlashyCard icon={ICON_MAP[t?.feature2Icon] || Cpu} title={t?.feature2Title || "Conversational AI"} delay={0.4} className="w-[295px]">
                    <ChatBotVisual 
                      query={t?.feature2Query} 
                      response={t?.feature2Response} 
                      footerLeft={t?.feature2FooterLeft}
                      footerRight={t?.feature2FooterRight}
                    />
                  </FlashyCard>
                </div>

                {/* Card 3: Enterprise Solutions - Bottom Right (Starts at y=465px, giving ~65-75px clear space below Card 2) */}
                <div className="absolute top-[465px] right-2 sm:right-4 z-10 transition-all duration-500">
                  <FlashyCard icon={ICON_MAP[t?.feature3Icon] || Zap} title={t?.feature3Title || "Enterprise Solutions"} delay={0.6} className="w-[265px]">
                     <PerformanceMetric 
                       label={t?.feature3UptimeLabel} 
                       value={t?.feature3UptimeValue} 
                       sub1={t?.feature3Latency} 
                       sub2={t?.feature3Edge} 
                     />
                  </FlashyCard>
                </div>

                {/* Apple Ambient Soft Background Glows */}
                <div className="absolute top-[20%] left-[-20%] w-72 h-72 bg-emerald-500/12 rounded-full blur-[120px] -z-10 pointer-events-none" />
                <div className="absolute bottom-[8%] right-[-10%] w-60 h-60 bg-teal-500/12 rounded-full blur-[100px] -z-10 pointer-events-none" />
              </div>
            </div>
          )}
        </div>
      </div>

      <WaveDivider fill="#FAFAFA" />
    </section>
  );
}
