import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import { useContent } from '@/contexts/ContentContext';
import { useLang } from '@/contexts/LanguageContext';
import { useOrchestration } from '@/App';
import React, { useEffect, useRef, useCallback, useState, Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { RichText } from '@/components/ui/RichText';

// Mobile detection hook — prevents heavy components from mounting on touch devices
function useIsMobile() {
  const [isMobile] = useState(() =>
    typeof window !== 'undefined' &&
    (window.matchMedia('(hover: none) and (pointer: coarse)').matches || window.innerWidth < 1024)
  );
  return isMobile;
}

import { NetworkCanvas } from '@/components/orbit/NetworkCanvas';
import { 
  ArrowRight, Cpu, Zap, Activity, Globe, MessageSquare, Shield, Rocket,
  Bot, Smartphone, ShoppingCart, Code, Database, Cloud, Monitor, 
  Wifi, Mail, Camera, Music, Heart, Star, Target, Briefcase, 
  Award, BookOpen, Users, BarChart3, Sparkles, Layers, Settings2, 
  Eye, Palette, Brain, Wrench, LucideIcon
} from 'lucide-react';
import { WaveDivider } from '@/components/ui/WaveDivider';


const BackgroundBlobs = () => (
  <div className="absolute inset-0 overflow-hidden -z-10 pointer-events-none">
    <div 
      className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-indigo-500/20 blur-[120px] rounded-full hero-blob"
      style={{ animationDuration: '15s' }}
    />
    <div 
      className="absolute top-[20%] -right-[5%] w-[45%] h-[45%] bg-indigo-500/20 blur-[100px] rounded-full hero-blob"
      style={{ animationDuration: '18s', animationDelay: '2s' }}
    />
    <div 
      className="absolute -bottom-[5%] left-[15%] w-[40%] h-[40%] bg-violet-600/20 blur-[90px] rounded-full hero-blob"
      style={{ animationDuration: '12s', animationDelay: '4s' }}
    />
  </div>
);

const FloatingParticles = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none -z-5">
    {[...Array(6)].map((_, i) => (
      <div
        key={i}
        className="absolute w-px h-24 bg-gradient-to-b from-transparent via-indigo-500/20 to-transparent floating-particle"
        style={{
          left: `${i * 20}%`,
          animationDuration: `${15 + i * 2}s`,
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
    const startX = Math.random() * w;
    const startY = Math.random() * h * 0.4;
    const points = [{ x: startX, y: startY }];
    
    let curX = startX;
    let curY = startY;
    const segments = 8 + Math.floor(Math.random() * 8);
    
    for (let i = 0; i < segments; i++) {
      curX += (Math.random() - 0.5) * 120;
      curY += Math.random() * 100 + 40;
      points.push({ x: curX, y: curY });
    }

    bolts.current.push({
      points,
      life: 1,
      maxLife: 0.8 + Math.random() * 1.5,
      opacity: 0.6 + Math.random() * 0.4,
      width: 1 + Math.random() * 2,
    });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || prefersReducedMotion) return;

    // Skip thunderbolt canvas entirely on mobile/touch devices
    const isMobile = window.matchMedia('(hover: none) and (pointer: coarse)').matches || window.innerWidth < 1024;
    if (isMobile) return;
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
      
      // Background glow
      ctx.fillStyle = 'rgba(10, 10, 30, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Further reduced spawn rate (0.015 -> 0.008) for very occasional strikes
      if (Math.random() < 0.008) {
        createBolt(canvas.width, canvas.height);
      }

      bolts.current = bolts.current.filter(bolt => {
        // Further reduced decay speed (0.015 -> 0.008) for very slow fade
        bolt.life -= 0.008;
        if (bolt.life <= 0) return false;

        const alpha = (bolt.life / bolt.maxLife) * bolt.opacity;
        
        // Draw glow
        ctx.shadowBlur = 15;
        ctx.shadowColor = `rgba(99, 102, 241, ${alpha})`;
        ctx.strokeStyle = `rgba(99, 102, 241, ${alpha * 0.3})`;
        ctx.lineWidth = bolt.width * 4;
        ctx.beginPath();
        ctx.moveTo(bolt.points[0].x, bolt.points[0].y);
        bolt.points.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.stroke();

        // Draw core
        ctx.shadowBlur = 5;
        ctx.shadowColor = `rgba(255, 255, 255, ${alpha})`;
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
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
   FLASHY CARDS — Premium glassmorphism interactive units
   ═══════════════════════════════════════════════════════════ */
 
const FlashyCard = React.memo(({ children, icon: Icon, title, delay, className = "" }: any) => {
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  // Disable 3D tilt on touch devices — hover doesn't exist
  const isTouch = typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || isTouch) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setMousePos({ x, y });
  };

  const tiltX = !isTouch && isHovered ? (mousePos.y - 0.5) * 20 : 0;
  const tiltY = !isTouch && isHovered ? (mousePos.x - 0.5) * -20 : 0;

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={{ opacity: 0, x: 40, y: 20 }}
      animate={{ 
        opacity: 1, 
        x: 0, 
        y: 0,
        rotateX: tiltX,
        rotateY: tiltY,
        transition: {
          rotateX: { type: "spring", stiffness: 100, damping: 20 },
          rotateY: { type: "spring", stiffness: 100, damping: 20 },
          opacity: { duration: 0.8, delay },
          x: { duration: 0.8, delay, ease: [0.25, 1, 0.5, 1] },
          y: { duration: 0.8, delay, ease: [0.25, 1, 0.5, 1] }
        }
      }}
      whileHover={{ scale: 1.05 }}
      style={{ 
        transformStyle: "preserve-3d",
        boxShadow: isHovered 
          ? '0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 10px rgba(99, 102, 241, 0.1)' 
          : '0 4px 20px 0 rgba(0, 0, 0, 0.25)' 
      }}
      className={`relative group bg-white/[0.02] border border-white/[0.04] backdrop-blur-lg rounded-3xl p-6 overflow-hidden ${className}`}
    >
      {/* Noise Texture */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none brightness-100 contrast-150" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }} />
      
      {/* Dynamic Spotlight */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(600px circle at ${mousePos.x * 100}% ${mousePos.y * 100}%, rgba(99, 102, 241, 0.15), transparent 40%)`
        }}
      />

      <div className="relative z-10" style={{ transform: "translateZ(30px)" }}>
        <div className="flex items-center gap-3 mb-4" style={{ transform: "translateZ(20px)" }}>
          <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Icon size={18} />
          </div>
          <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/40">{title}</h3>
        </div>
        <div style={{ transform: "translateZ(10px)" }}>
          {children}
        </div>
      </div>
      
      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-700" />
    </motion.div>
  );
});

const AIWorkflow = React.memo(({ steps }: { steps: string[] }) => {
  const [activeStep, setActiveStep] = useState(0);
  const displaySteps = steps?.length > 0 ? steps : ['DISCOVERY', 'AGENT_INIT', 'EXECUTION', 'OPTIMIZE'];
  
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep(s => (s + 1) % displaySteps.length);
    }, 1500);
    return () => clearInterval(interval);
  }, [displaySteps.length]);

  return (
    <div className="flex flex-col gap-2">
      {displaySteps.map((step, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className={`w-1.5 h-1.5 rounded-full ${activeStep === i ? 'bg-indigo-400 animate-pulse shadow-[0_0_8px_rgba(129,140,248,0.8)]' : 'bg-white/10'}`} />
          <span className={`text-[10px] font-mono tracking-wider ${activeStep === i ? 'text-indigo-300' : 'text-white/20'}`}>
            {step}
          </span>
          {activeStep === i && (
            <motion.span layoutId="activeTag" className="ml-auto text-[8px] text-indigo-400/50 font-bold uppercase">Active</motion.span>
          )}
        </div>
      ))}
    </div>
  );
});

const ChatBotVisual = React.memo(({ query, response }: { query: string; response: string }) => {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start gap-2">
         <div className="w-6 h-6 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
            <div className="w-2 h-2 rounded-full bg-indigo-400" />
         </div>
         <div className="bg-white/5 rounded-2xl rounded-tl-none p-2 text-[10px] text-white/60 leading-tight">
            {query || "How can I automate my business workflow?"}
         </div>
      </div>
      <div className="flex items-start gap-2 self-end flex-row-reverse">
         <div className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center shrink-0">
            <Zap size={10} className="text-cyan-400" />
         </div>
         <div className="bg-indigo-500/20 border border-indigo-500/10 rounded-2xl rounded-tr-none p-2 text-[10px] text-indigo-100 leading-tight">
            {response || "I can deploy Multi-Agent systems to..."}
         </div>
      </div>
    </div>
  );
});

const PerformanceMetric = React.memo(({ label, value, sub1, sub2 }: { label: string; value: string; sub1: string; sub2: string }) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-end">
         <div className="flex flex-col">
            <span className="text-[10px] text-white/30 uppercase tracking-[0.1em]">{label || "Uptime"}</span>
            <span className="text-2xl font-black text-white">{value || "99.9%"}</span>
         </div>
         <div className="h-8 flex items-end gap-[2px]">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="w-[3px] bg-indigo-500/40 rounded-full" style={{ height: `${20 + Math.random() * 80}%` }} />
            ))}
         </div>
      </div>
      <div className="h-[1px] w-full bg-white/5" />
      <div className="flex justify-between text-[10px] font-mono text-indigo-400/60 uppercase">
         <span>{sub1 || "Latency: 0.8ms"}</span>
         <span>{sub2 || "Global Edge"}</span>
      </div>
    </div>
  );
});

/* ═══════════════════════════════════════════════════════════
   HOME — Electric Left-Aligned Redesign
   ═══════════════════════════════════════════════════════════ */

const phrases = [
  "SCALABLE REALITIES",
  "REAL IMPACT",
  "MEASURABLE GROWTH",
  "POWERFUL SOLUTIONS",
  "INTELLIGENT SYSTEMS"
];

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

  const title = t?.title || 'Building the Future with Agentic Intelligence';
  const tagline = t?.tagline || 'Leading the AI Revolution';
  const subtitle = t?.subtitle || 'From concept to scale, we engineer high-performance software and autonomous AI agents.';
  const cta = t?.cta || 'Get Started';
  const learnMore = t?.learnMore || 'Our Services';

  // Typewriter effect state — only start after phase 1
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [typingSpeed, setTypingSpeed] = useState(150);
  const [showCtaOptions, setShowCtaOptions] = useState(false);

  useEffect(() => {
    // Don't start typewriter until phase 1 (title is visible)
    if (phase < 1) return;

    const handleTyping = () => {
      const currentPhrase = phrases[phraseIndex];
      
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
          setPhraseIndex((prev) => (prev + 1) % phrases.length);
        }
      }
    };

    const timer = setTimeout(handleTyping, typingSpeed);
    return () => clearTimeout(timer);
  }, [displayText, isDeleting, phraseIndex, typingSpeed, phase]);

  useThunderboltCanvas(canvasRef, prefersReducedMotion);

  const titleText = "Turning Ideas into";

  return (
    <section 
      id="home" 
      className="relative min-h-[100svh] flex flex-col items-center pt-24 md:pt-32 lg:pt-36 pb-16 overflow-hidden noise-overlay border-none"
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
      <div className="absolute inset-0 bg-gradient-to-b from-black via-black/95 to-black pointer-events-none" />
      {/* ── Canvas Background — fade in at phase 2 ── */}
      <motion.canvas
        initial={{ opacity: 0 }}
        animate={{ opacity: phase >= 2 ? 0.6 : 0 }}
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
      <div className="w-full max-w-none mx-auto px-4 sm:px-6 relative z-10 pt-8 md:pt-0 pb-12 overflow-x-hidden">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-16 xl:gap-24 2xl:gap-32 items-center relative">
          
          {/* Left Side: Content */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-8">
            {/* Tagline badge — phase 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-indigo-500/20 bg-indigo-500/5 text-indigo-400 text-xs font-bold tracking-[0.2em] uppercase mb-10 md:mb-8">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>
                {tagline}
              </span>

              <h1 
                className="font-black leading-[1.05] tracking-tight mb-8"
                style={{ 
                  fontFamily: 'var(--font-display)'
                }}
              >
                {/* Line 1: Static Title — phase 1, staggered words */}
                <div className="text-[2rem] leading-[1.1] md:text-[5rem] lg:text-[4rem] xl:text-[5.2rem] flex flex-wrap lg:flex-nowrap lg:whitespace-nowrap items-center mb-1">
                  {titleText.split(' ').map((word, i) => (
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
                <div className="text-[2.2rem] md:text-[4rem] lg:text-[3.5rem] xl:text-[4.5rem] relative inline-flex items-center min-h-[1.1em] mt-1 lg:mt-2">
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
              </h1>

              {/* Subtitle, stats bar, and CTA buttons — phase 2 */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              >
                  <p className="text-base md:text-xl text-white/50 max-w-xl leading-relaxed mb-8 md:mb-12">
                   <RichText text={subtitle} />
                 </p>

                <div className="mb-10 md:mb-12 relative">
                  <div className="absolute -inset-4 bg-indigo-500/5 blur-3xl rounded-[3rem] -z-10" />
                  
                  <div className="w-fit grid grid-cols-2 gap-x-4 gap-y-6 md:flex md:flex-wrap md:items-center md:gap-x-8 md:gap-y-4 bg-white/[0.03] border border-white/[0.08] backdrop-blur-3xl rounded-2xl p-4 md:px-8 md:py-5 shadow-2xl relative overflow-hidden group/stats">
                    {/* Premium iridescent scan line */}
                    <motion.div 
                      animate={{ x: ['-200%', '200%'] }}
                      transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.05] to-transparent -skew-x-12 -z-10 pointer-events-none"
                    />
                    
                    {stats.map((stat: any, i: number) => (
                      <div key={i} className="flex items-center gap-8 group/stat">
                        <div className="flex flex-col">
                          <div className="flex items-baseline gap-2">
                            <span className="text-xl md:text-2xl font-black bg-gradient-to-br from-white to-white/70 bg-clip-text text-transparent tabular-nums tracking-tight">
                              {stat.value}{stat.suffix}
                            </span>
                            <motion.div 
                              animate={{ 
                                scale: [1, 1.2, 1],
                                opacity: [0.6, 1, 0.6]
                              }}
                              transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
                              className="w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]" 
                            />
                          </div>
                          <div className="text-[10px] text-white/40 uppercase tracking-[0.15em] font-bold mt-1">
                            {stat.label}
                          </div>
                        </div>
                        
                        {i < stats.length - 1 && (
                          <div className="hidden md:block h-8 w-[1px] bg-gradient-to-b from-transparent via-white/10 to-transparent" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-row items-center gap-3 md:gap-5 h-[52px] md:h-[60px]">
                  <div className="relative h-full flex items-center">
                    <AnimatePresence mode="wait">
                      {!showCtaOptions ? (
                        <motion.button
                          key="mainCta"
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: 'auto' }}
                          exit={{ opacity: 0, width: 0 }}
                          transition={{ duration: 0.3 }}
                          onClick={() => setShowCtaOptions(true)}
                          className="relative overflow-hidden h-full px-5 md:px-8 bg-white text-black text-sm md:text-base font-bold rounded-xl hover:bg-indigo-400 transition-all duration-500 flex items-center justify-center gap-2 group cursor-pointer shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(129,140,248,0.4)] whitespace-nowrap"
                        >
                          <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
                          <span className="relative z-10 flex items-center gap-2">
                            {cta}
                            <Zap className="fill-current transition-transform group-hover:scale-125" size={16} />
                          </span>
                        </motion.button>
                      ) : (
                        <motion.div
                          key="options"
                          initial={{ opacity: 0, scale: 0.95, width: 0 }}
                          animate={{ opacity: 1, scale: 1, width: 'auto' }}
                          exit={{ opacity: 0, scale: 0.95, width: 0 }}
                          transition={{ duration: 0.3 }}
                          className="flex items-center gap-2 md:gap-3 h-full overflow-hidden"
                        >
                          <a
                            href="https://wa.me/8801853452264"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-full px-5 md:px-6 bg-[#25D366] text-white text-sm md:text-base font-bold rounded-xl hover:brightness-110 transition-all duration-300 flex items-center justify-center gap-2 whitespace-nowrap shadow-[0_0_20px_rgba(37,211,102,0.3)]"
                          >
                            WhatsApp
                          </a>
                          <a
                            href="mailto:contact@orbitsaas.com"
                            className="h-full px-5 md:px-6 bg-indigo-500 text-white text-sm md:text-base font-bold rounded-xl hover:bg-indigo-400 transition-all duration-300 flex items-center justify-center gap-2 whitespace-nowrap shadow-[0_0_20px_rgba(99,102,241,0.3)]"
                          >
                            Email
                          </a>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowCtaOptions(false);
                            }}
                            className="h-full px-3 md:px-4 bg-white/10 text-white/60 hover:text-white rounded-xl hover:bg-white/20 transition-all duration-300 flex items-center justify-center"
                            aria-label="Close"
                          >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <button
                    onClick={() => navigate('/services')}
                    className="px-5 py-3 md:px-8 md:py-4 bg-white/5 border border-white/10 text-white text-sm md:text-base font-bold rounded-xl hover:bg-white/10 transition-all duration-300 flex items-center gap-2 group cursor-pointer"
                  >
                    {learnMore}
                    <ArrowRight className="transition-transform group-hover:translate-x-1" size={16} />
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </div>

          {/* Right Side: Flashy Cards — SKIP entirely on mobile & wait for phase 2 */}
          {!isMobile && phase >= 2 && (
            <div className="lg:col-span-5 xl:col-span-4 hidden lg:block">
              <div className="relative h-[620px] w-full">
                {/* Card 1: Agentic AI - Top Right */}
                <div className="absolute top-[2%] right-0 z-10 transition-all duration-500">
                  <FlashyCard icon={ICON_MAP[t?.feature1Icon] || Activity} title={t?.feature1Title || "Agentic AI nodes"} delay={0.2} className="w-[280px]">
                    <AIWorkflow steps={t?.feature1Steps} />
                  </FlashyCard>
                </div>

                {/* Card 2: Conversational AI - Shifted slightly down */}
                <div className="absolute top-[35%] left-[-15%] z-20 transition-all duration-500">
                  <FlashyCard icon={ICON_MAP[t?.feature2Icon] || Cpu} title={t?.feature2Title || "Conversational AI"} delay={0.4} className="w-[300px]">
                    <ChatBotVisual query={t?.feature2Query} response={t?.feature2Response} />
                    <div className="mt-4 flex justify-between items-center text-[10px] text-indigo-400 font-bold uppercase tracking-widest">
                       <span>{t?.feature2FooterLeft || "Custom Trained LLM"}</span>
                       <span className="opacity-50">{t?.feature2FooterRight || "Active"}</span>
                    </div>
                  </FlashyCard>
                </div>

                {/* Card 3: Enterprise Solutions - Pushed further down */}
                <div className="absolute bottom-[-10%] right-[5%] z-10 transition-all duration-500">
                  <FlashyCard icon={ICON_MAP[t?.feature3Icon] || Zap} title={t?.feature3Title || "Enterprise Solutions"} delay={0.6} className="w-[260px]">
                     <PerformanceMetric 
                       label={t?.feature3UptimeLabel} 
                       value={t?.feature3UptimeValue} 
                       sub1={t?.feature3Latency} 
                       sub2={t?.feature3Edge} 
                     />
                  </FlashyCard>
                </div>

                {/* Background Glows shifted for new layout */}
                <div className="absolute top-[45%] left-[-50%] w-96 h-96 bg-indigo-500/10 rounded-full blur-[160px] -z-10" />
                <div className="absolute top-[15%] right-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-[100px] -z-10" />
                
                {/* Neural Network / Data Constellation Canvas Layer */}
                <div 
                  className="absolute z-0 pointer-events-none" 
                  style={{
                    top: '-10%', right: '-10%', bottom: '-10%', left: '-40%',
                    maskImage: 'radial-gradient(ellipse 80% 80% at 60% 50%, black 40%, transparent 100%)',
                    WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 60% 50%, black 40%, transparent 100%)',
                  }}
                >
                  <NetworkCanvas />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <WaveDivider fill="#FAFAFA" />
    </section>
  );
}
