import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { useContent } from '@/contexts/ContentContext';
import { useLang } from '@/contexts/LanguageContext';
import { useState, useEffect, useRef, useMemo } from 'react';
import { Sparkles, Search, PenTool, Code, CheckCircle2, Truck } from 'lucide-react';
import { WaveDivider } from '@/components/ui/WaveDivider';


function ProcessCard({ card, icon: Icon, isPeak, node, isDelivery }: any) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const desktopOffset = isDelivery ? 0 : (isPeak ? -170 : 170);

  return (
    <motion.div
      initial={{
        opacity: 0, scale: 0.8, x: '-50%', y: '-50%',
        left: node.x, top: `calc(${node.y} + ${desktopOffset}px)`
      }}
      animate={{
        opacity: 1, scale: 1,
        left: node.x, top: `calc(${node.y} + ${desktopOffset}px)`,
        x: '-50%', y: '-50%'
      }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ type: "spring", stiffness: 140, damping: 28 }}
      className="absolute z-30 w-64 perspective-[1000px]"
      style={{ willChange: 'transform' }}
    >
      {/* Connection Beam (Pulser) - Perfectly hits the tip of the diamond node */}
      {!isDelivery && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none overflow-visible -z-10">
          <svg className="overflow-visible" width="1" height="1">
            <motion.line
              x1="0" y1="0"
              x2="0" y2={-desktopOffset + (isPeak ? -9 : 9)}
              stroke="rgba(0, 255, 128, 0.5)"
              strokeWidth="1.5"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
            />
            <motion.circle
              r="2"
              fill="#00ff80"
              animate={{ cy: [0, -desktopOffset + (isPeak ? -9 : 9)], opacity: [0, 1, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
            <motion.circle
              r="6"
              fill="#00ff80"
              filter="blur(4px)"
              animate={{ cy: [0, -desktopOffset + (isPeak ? -9 : 9)], opacity: [0, 0.5, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear", delay: 0.2 }}
            />
          </svg>
        </div>
      )}

      <motion.div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="relative group p-[1px] rounded-[1.5rem] bg-gradient-to-br from-[#00ff80]/40 via-white/5 to-transparent hover:from-[#00ff80] transition-all duration-500 overflow-hidden shadow-[0_0_30px_rgba(0,255,128,0.1)] hover:shadow-[0_0_50px_rgba(0,255,128,0.2)]"
      >
        <div className="relative bg-[#05100a]/90 backdrop-blur-3xl rounded-[1.45rem] p-5 overflow-hidden border border-white/5">
          <div className="absolute -top-1 -right-1 w-10 h-10 bg-[#00ff80]/15 rounded-bl-2xl flex items-center justify-center border-l border-b border-[#00ff80]/30 text-[#00ff80] font-display font-black text-base italic shadow-[0_0_15px_rgba(0,255,128,0.1)]">{card.id}</div>
          <div className="relative z-10 flex flex-col gap-3" style={{ transform: "translateZ(30px)" }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 shrink-0 rounded-lg bg-[#00ff80]/15 flex items-center justify-center border border-[#00ff80]/30 text-[#00ff80] transition-all duration-500 shadow-[inset_0_0_10px_rgba(0,255,128,0.1)]">
                <Icon size={20} />
              </div>
              <h3 className="text-lg font-black text-white tracking-tight leading-tight uppercase">
                {card.title}
              </h3>
            </div>
            <div>
              <p className="text-[12px] font-medium opacity-70" style={{ color: 'var(--text-secondary)' }}>
                {card.desc}
              </p>
            </div>
          </div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,255,128,0.15),transparent)] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Web Audio API Wind Swoosh ─── */
let swooshAudioCtx: AudioContext | null = null;
let swooshUnlocked = false;

function initSwooshAudio() {
  if (swooshAudioCtx) return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    swooshAudioCtx = new AudioContextClass();
    swooshUnlocked = true;
  } catch (e) {
    // AudioContext not available
  }
}

function playWindSwoosh() {
  if (!swooshUnlocked || !swooshAudioCtx || swooshAudioCtx.state !== 'running') return;

  const t = swooshAudioCtx.currentTime;
  const duration = 0.25; // Quick 0.25s woosh

  const bufferSize = swooshAudioCtx.sampleRate * duration;
  const buffer = swooshAudioCtx.createBuffer(1, bufferSize, swooshAudioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1; // White noise
  }
  
  const noiseSource = swooshAudioCtx.createBufferSource();
  noiseSource.buffer = buffer;
  
  // Bandpass filter to shape the noise into wind
  const filter = swooshAudioCtx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.Q.value = 1.2;
  filter.frequency.setValueAtTime(200, t);
  // frequency sweep creates the "movement" feeling
  filter.frequency.exponentialRampToValueAtTime(1200, t + duration * 0.4);
  filter.frequency.exponentialRampToValueAtTime(200, t + duration);
  
  // Volume amplitude envelope
  const gainNode = swooshAudioCtx.createGain();
  gainNode.gain.setValueAtTime(0, t);
  gainNode.gain.linearRampToValueAtTime(0.3, t + duration * 0.2); // Peak volume
  gainNode.gain.linearRampToValueAtTime(0, t + duration);
  
  noiseSource.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(swooshAudioCtx.destination);
  
  noiseSource.start(t);
  noiseSource.stop(t + duration);
}

export function ProcessSection() {
  const { content } = useContent();
  const { lang } = useLang();
  const t = (content[lang] as any)?.process;

  const sortedSteps = useMemo(() => {
    return [...(t?.steps || [])].sort((a: any, b: any) =>
      String(a.id).localeCompare(String(b.id), undefined, { numeric: true })
    );
  }, [t?.steps]);

  const sectionRef = useRef<HTMLDivElement>(null);
  const stepRef = useRef(0);
  const [step, setStep] = useState(0);
  const [hasMounted, setHasMounted] = useState(false);
  const [isFullyVisible, setIsFullyVisible] = useState(false);
  const mountTime = useRef(Date.now());
  const lastStepTime = useRef(0);

  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const checkSize = () => setIsDesktop(window.innerWidth >= 1024);
    checkSize();
    window.addEventListener('resize', checkSize);
    return () => window.removeEventListener('resize', checkSize);
  }, []);

  // IntersectionObserver: trigger animation when section is somewhat visible
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsFullyVisible(entry.isIntersecting);
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Unlock AudioContext on user interaction — only create after gesture
  useEffect(() => {
    const unlockAudio = async () => {
      initSwooshAudio();
      if (swooshAudioCtx && swooshAudioCtx.state === 'suspended') {
        await swooshAudioCtx.resume();
      }
      // Clean up after first valid interaction
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
    window.addEventListener('click', unlockAudio, { once: true });
    window.addEventListener('touchstart', unlockAudio, { once: true });
    window.addEventListener('keydown', unlockAudio, { once: true });
    return () => {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
  }, []);

  // Trigger sound effect on step changes (arriving or disappearing)
  const isFirstMount = useRef(true);
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    // Only play sound when section is actually visible — prevents sound
    // firing when scrolling OUT causes step to reset to 0
    if (isFullyVisible && step >= 0 && step <= sortedSteps.length) {
      playWindSwoosh();
    }
  }, [step, sortedSteps.length, isFullyVisible]);

  // Trigger animation when the section becomes visible
  useEffect(() => {
    if (!isDesktop) return;
    
    if (isFullyVisible) {
      setHasMounted(true);
      setStep(sortedSteps.length); // Load all instantly when scrolled into view
      mountTime.current = Date.now();
    } else {
      setStep(0); // Disappear instantly when scrolled out of view
    }
  }, [isFullyVisible, sortedSteps.length, isDesktop]);

  // Sync ref with state
  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  const icons = [Search, PenTool, Code, CheckCircle2, Truck];

  // Distinct & Even Desktop Node Positions (20% Interval Symmetry)
  const nodes = [
    { x: '10%', y: '44%' },
    { x: '30%', y: '56%' },
    { x: '50%', y: '44%' },
    { x: '70%', y: '56%' },
    { x: '92%', y: '50%' }, // Position for Delivery card — offset right, clear of the arrow
  ];



  return (
    <section
      ref={sectionRef}
      id="process"
      className="section-dark relative overflow-hidden flex flex-col items-center justify-center pt-2 lg:pt-0 lg:min-h-[100dvh]"
    >
      <div className="absolute top-0 left-1/4 w-full h-1/2 bg-[#00ff80]/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-[#00ff80]/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="section-container relative z-10 w-full flex flex-col justify-center items-center px-4 h-full" style={{ paddingTop: '24px', paddingBottom: '16px' }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center mb-2 lg:mb-16 lg:-mt-16 text-center shrink-0"
        >
          <h2 className="section-heading text-white max-w-5xl tracking-tighter leading-[1] text-[clamp(2rem,4vw,3.5rem)]">
            {t?.title || 'How We Transform Your Vision'}
          </h2>
        </motion.div>

        {/* Desktop Layout (lg+) */}
        <div className="hidden lg:block relative w-full h-[45vh] max-h-[420px] max-w-7xl shrink-0 mt-4 mb-2">
          <div className="absolute inset-0 pointer-events-none overflow-visible">
            <svg viewBox="0 0 1000 400" preserveAspectRatio="none" className="w-full h-full" fill="none">
              <defs>
                <linearGradient id="pathFade" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="white" stopOpacity="0" />
                  <stop offset="10%" stopColor="white" stopOpacity="1" />
                  <stop offset="90%" stopColor="white" stopOpacity="1" />
                  <stop offset="100%" stopColor="white" stopOpacity="0" />
                </linearGradient>
                <mask id="pathMask">
                  <rect width="100%" height="100%" fill="url(#pathFade)" />
                </mask>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
                  <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
                <filter id="goldGlow">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                  <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
                <filter id="arrowGlow">
                  <feGaussianBlur stdDeviation="1.5" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>

                {/* Premium Arrow Gradient — Golden */}
                <linearGradient id="premiumArrowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#00ff80" stopOpacity="1" />
                  <stop offset="40%" stopColor="#a3c44e" stopOpacity="1" />
                  <stop offset="100%" stopColor="#FFD700" stopOpacity="1" />
                </linearGradient>
                <linearGradient id="arrowheadFill" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#c8a84e" stopOpacity="1" />
                  <stop offset="100%" stopColor="#FFD700" stopOpacity="1" />
                </linearGradient>
                <filter id="node3D" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#000000" floodOpacity="0.8" />
                  <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#00ff80" floodOpacity="0.3" />
                </filter>

                {/* Lightning flash glow filter */}
                <filter id="lightningGlow" x="-100%" y="-100%" width="300%" height="300%">
                  <feGaussianBlur stdDeviation="4" result="flash" />
                  <feMerge>
                    <feMergeNode in="flash" />
                    <feMergeNode in="flash" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>

                {/* SVG Marker — auto-rotates to match path tangent */}
                <marker
                  id="goldenArrowMarker"
                  viewBox="0 0 14 10"
                  refX="7"
                  refY="5"
                  markerWidth="28"
                  markerHeight="20"
                  orient="auto-start-reverse"
                  markerUnits="userSpaceOnUse"
                >
                  <polygon points="0,0 14,5 0,10 3,5" fill="url(#arrowheadFill)" />
                </marker>
              </defs>
              <motion.path
                d="M0,200 C40,200 50,176 100,176 C200,176 200,224 300,224 C400,224 400,176 500,176 C600,176 600,224 700,224"
                fill="none" stroke="#00ff80" strokeWidth="3.5" filter="url(#glow)"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: hasMounted ? ([0, 0.145, 0.43, 0.715, 1.0, 1.0][step] || 0) : 0 }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                mask="url(#pathMask)"
              />

              {/* Lightning Strike — electric flash streaking along the green path */}
              {step > 0 && step <= 4 && (
                <motion.g
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {/* Bright core flash */}
                  <motion.circle
                    r="3"
                    fill="#ffffff"
                    filter="url(#lightningGlow)"
                    opacity={0.9}
                  >
                    <animateMotion
                      path="M0,200 C40,200 50,176 100,176 C200,176 200,224 300,224 C400,224 400,176 500,176 C600,176 600,224 700,224"
                      keyPoints={`${[0, 0.145, 0.43, 0.715, 1.0][step] || 0};${[0, 0.145, 0.43, 0.715, 1.0][step] || 0}`}
                      keyTimes="0;1"
                      dur="0.8s"
                      fill="freeze"
                      calcMode="linear"
                    />
                  </motion.circle>
                  {/* Trailing electric spark */}
                  <motion.circle
                    r="6"
                    fill="#00ff80"
                    filter="url(#lightningGlow)"
                    opacity={0.3}
                  >
                    <animateMotion
                      path="M0,200 C40,200 50,176 100,176 C200,176 200,224 300,224 C400,224 400,176 500,176 C600,176 600,224 700,224"
                      keyPoints={`${[0, 0.145, 0.43, 0.715, 1.0][step] || 0};${[0, 0.145, 0.43, 0.715, 1.0][step] || 0}`}
                      keyTimes="0;1"
                      dur="0.8s"
                      fill="freeze"
                      calcMode="linear"
                    />
                  </motion.circle>
                </motion.g>
              )}

              {/* Final Premium Arrow — Using SVG marker for perfect alignment */}
              <AnimatePresence>
                {step >= 5 && (
                  <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    {/* Subtle ambient glow */}
                    <motion.path
                      d="M700,224 C740,224 760,210 790,200"
                      fill="none" stroke="#FFD700" strokeWidth="6" strokeLinecap="round"
                      filter="url(#goldGlow)"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: [0.04, 0.1, 0.04] }}
                      transition={{
                        pathLength: { duration: 0.8, ease: "easeOut" },
                        opacity: { duration: 3, repeat: Infinity, ease: "easeInOut" }
                      }}
                    />
                    {/* Main arrow stroke with auto-aligned marker arrowhead */}
                    <motion.path
                      d="M700,224 C740,224 760,210 790,200"
                      fill="none" stroke="url(#premiumArrowGradient)" strokeWidth="3.5"
                      strokeLinecap="butt"
                      markerEnd="url(#goldenArrowMarker)"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 1, ease: "circOut" }}
                    />
                    {/* Traveling energy pulse */}
                    <motion.circle
                      r="2"
                      fill="#FFD700"
                      opacity={0.6}
                    >
                      <animateMotion
                        path="M700,224 C740,224 760,210 790,200"
                        dur="2.5s"
                        repeatCount="indefinite"
                      />
                    </motion.circle>
                  </motion.g>
                )}
              </AnimatePresence>

              {nodes.slice(0, 4).map((_, i) => {
                const nodeX = [100, 300, 500, 700][i];
                const nodeY = [176, 224, 176, 224][i];
                const size = 12; // slightly larger for presence
                return (
                  <motion.g key={i}>
                    {/* Clean Diamond Node — Sharp corners, opaque fill */}
                    <motion.rect
                      x={nodeX - size / 2}
                      y={nodeY - size / 2}
                      width={size}
                      height={size}
                      rx="0"
                      ry="0"
                      transform={`rotate(45 ${nodeX} ${nodeY})`}
                      fill={step > i ? "#05150a" : "#020503"}
                      stroke={step > i ? "#00ff80" : "#334455"}
                      animate={{
                        opacity: step > i ? 1 : 0,
                        strokeWidth: step > i ? 2 : 1,
                      }}
                    />
                    {/* Inner glowing dot for active state representing energy source */}
                    <motion.circle
                      cx={nodeX}
                      cy={nodeY}
                      r="2.5"
                      fill="#FFD700"
                      animate={{
                        opacity: step > i ? 1 : 0,
                        scale: step > i ? 1 : 0,
                      }}
                    />
                  </motion.g>
                );
              })}
            </svg>
          </div>

          <AnimatePresence mode="popLayout">
            {sortedSteps.map((card: any, cardIdx: number) => {
              // Stable reveal logic: card[i] is permanently bound to nodes[i]
              if (step <= cardIdx) return null;
              const node = nodes[cardIdx];
              const Icon = icons[cardIdx] || icons[0];
              const isPeak = (cardIdx + 1) % 2 !== 0;

              return (
                <ProcessCard
                  key={card.id}
                  card={card}
                  icon={Icon}
                  isPeak={isPeak}
                  node={node}
                  isDelivery={cardIdx === 4}
                />
              );
            })}
          </AnimatePresence>
        </div>

        {/* ═══ Mobile Vertical Timeline (lg-) ═══ */}
        <div className="lg:hidden relative w-full px-4 mt-6 pb-8">
          {/* Timeline steps */}
          {sortedSteps.map((card: any, idx: number) => {
            const Icon = icons[idx] || icons[0];
            const isLast = idx === sortedSteps.length - 1;

            return (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className={`relative flex items-start gap-4 ${isLast ? '' : 'mb-6'}`}
              >
                {/* Connecting Line to next node */}
                {!isLast && (
                  <div className="absolute left-[21px] top-[22px] bottom-[-46px] w-[2px] -z-10">
                    {/* Base line */}
                    <div className="absolute inset-0 bg-gradient-to-b from-[#00ff80]/20 via-[#00ff80]/15 to-[#00ff80]/20" />
                    {/* Animated glow pulse */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-b from-[#00ff80]/60 via-[#00ff80]/30 to-[#00ff80]/60"
                      animate={{ opacity: [0.3, 0.8, 0.3] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    />
                  </div>
                )}

                {/* Step node */}
                <div className="relative z-10 flex-shrink-0">
                  {/* Glow behind node */}
                  <motion.div
                    className="absolute inset-[-4px] rounded-full bg-[#00ff80]/20 blur-md"
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                  />
                  <div className="relative w-[44px] h-[44px] rounded-full bg-[#050f0a] border-2 border-[#00ff80]/50 flex items-center justify-center shadow-[0_0_20px_rgba(0,255,128,0.15)]">
                    <span className="text-[#00ff80] font-black text-sm">{String(idx + 1).padStart(2, '0')}</span>
                  </div>
                </div>

                {/* Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-30px" }}
                  transition={{ duration: 0.5, delay: 0.15 + idx * 0.05 }}
                  className="flex-1 min-w-0"
                >
                  <div className="relative p-[1px] rounded-2xl bg-gradient-to-br from-[#00ff80]/30 via-white/5 to-transparent overflow-hidden">
                    <div className="relative bg-[#05100a]/90 rounded-[calc(1rem-1px)] p-5 border border-white/[0.03]">
                      {/* Ambient corner glow */}
                      <div className="absolute -top-6 -right-6 w-16 h-16 bg-[#00ff80]/8 blur-2xl rounded-full pointer-events-none" />

                      {/* Icon + Title row */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 shrink-0 rounded-xl bg-[#00ff80]/10 flex items-center justify-center text-[#00ff80] border border-[#00ff80]/20">
                          <Icon size={20} />
                        </div>
                        <div>
                          <span className="text-[#00ff80] font-display font-bold text-[9px] tracking-[0.25em] uppercase opacity-60 block leading-none mb-1">
                            Step {card.id}
                          </span>
                          <h3 className="text-base font-black text-white tracking-tight leading-none uppercase">
                            {card.title}
                          </h3>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-[13px] leading-relaxed opacity-60 font-medium" style={{ color: 'var(--text-secondary)' }}>
                        {card.desc}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </div>
      <WaveDivider fill="#060606" />
    </section>
  );
}


export default ProcessSection;
