import React, { useRef, useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import { useContent } from '@/contexts/ContentContext';
import { useLang } from '@/contexts/LanguageContext';
import { 
  TrendingUp, 
  Globe, 
  Rocket, 
  Brain, 
  Cpu, 
  ShieldCheck, 
  ArrowRight,
  Zap,
  BarChart3,
  Layers,
  Sparkles,
  Headset,
  Bot,
  Smartphone,
  ShoppingCart,
  Code,
  Database,
  Shield,
  Cloud,
  Monitor,
  Wifi,
  Mail,
  Camera,
  Music,
  Heart,
  Star,
  Target,
  Briefcase,
  Award,
  BookOpen,
  Users,
  Settings2,
  Eye,
  Palette,
  Wrench
} from 'lucide-react';
import { RichText } from '@/components/ui/RichText';
import { WaveDivider } from '@/components/ui/WaveDivider';


const ICONS = [BarChart3, Layers, TrendingUp, Brain];
const BENEFIT_ICONS = [Globe, ShieldCheck, Headset];

const ALL_ICONS_MAP: Record<string, any> = {
  TrendingUp, Globe, Rocket, Brain, Cpu, ShieldCheck, Zap, BarChart3, Layers, Sparkles, Headset,
  Bot, Smartphone, ShoppingCart, Code, Database, Shield, Cloud, Monitor, Wifi, Mail, Camera, Music, Heart, Star, Target, Briefcase, Award, BookOpen, Users, Settings2, Eye, Palette, Wrench
};

/* ───────────────── Middle Aura Component (CSS-only for perf) ──────────────── */
const MiddleAura = ({ color = 'var(--accent)', scale = 1 }: { color?: string; scale?: number }) => (
  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0" style={{ transform: `scale(${scale})` }}>
    {[...Array(3)].map((_, i) => (
      <div
        key={i}
        className="absolute rounded-full border border-current aura-ring"
        style={{ color, width: '60px', height: '60px', animationDelay: `${i * 1.3}s` }}
      />
    ))}
  </div>
);


/* ───────────────── Unique Super-Premium Visuals (0-6) ───────────────── */

// 0. ROI Impact — Dynamic Growth Chart with Floating Profit Nodes
const ROIVisual = () => (
  <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-[rgba(255,255,255,0.01)] p-4">
    {/* Background Grid Accent */}
    <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(var(--accent) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
    
    <div className="relative w-full h-[120px] sm:h-[130px] flex items-end justify-between gap-1.5 px-4 max-w-[260px]">
      {[35, 60, 45, 85, 65, 95].map((height, i) => (
        <motion.div
          key={i}
          className="relative flex-1 group/bar"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: `${height}%`, opacity: 1 }}
          transition={{ duration: 1.5, delay: i * 0.1, ease: [0.34, 1.56, 0.64, 1] }}
        >
          {/* Glassmorphic Bar */}
          <div className="absolute inset-x-0 bottom-0 top-0 bg-gradient-to-t from-[var(--accent)]/10 via-[var(--accent)]/40 to-[var(--accent)] rounded-t-[3px] sm:rounded-t-lg shadow-[0_0_20px_rgba(212,160,23,0.1)] border-x border-t border-white/20 backdrop-blur-[2px]" />
          
          {/* Inner Luminescence */}
          <motion.div 
            className="absolute top-0 left-0 right-0 h-[1.5px] bg-white/60 rounded-full blur-[0.5px] z-10"
            animate={{ opacity: [0.3, 0.8, 0.3], scaleX: [0.7, 1, 0.7] }}
            transition={{ duration: 3, repeat: Infinity, delay: i * 0.3 }}
          />

          {/* Floating Data Point */}
          {i === 3 || i === 5 ? (
            <motion.div 
              className="absolute -top-7 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-white/10 backdrop-blur-md rounded-md border border-white/20 text-[7px] font-black text-white shadow-xl whitespace-nowrap"
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
            >
              +{(height/10).toFixed(1)}x
            </motion.div>
          ) : null}
        </motion.div>
      ))}

      {/* Dynamic Connection Curve - Normalized Coordinates */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-20" viewBox="0 0 260 130" preserveAspectRatio="none">
        <defs>
          <linearGradient id="roi-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="transparent" stopOpacity="0" />
            <stop offset="50%" stopColor="var(--accent-luminous)" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="1" />
          </linearGradient>
          <filter id="roi-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        <motion.path
          d="M 25 85 C 50 85, 75 55, 100 75 S 150 20, 180 45 S 230 5, 240 10"
          stroke="url(#roi-gradient)"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          filter="url(#roi-glow)"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 3, delay: 0.8, ease: "easeInOut" }}
        />
        {/* Animated End Node */}
        <motion.circle
          cx="240" cy="10" r="3"
          fill="white"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 3.5, duration: 0.5 }}
          style={{ filter: 'drop-shadow(0 0 8px var(--accent-luminous))' }}
        />
      </svg>
    </div>
  </div>
);

// 1. Scalability — Elastic Hive Dynamics (Agent Skills Premium)
const ScalabilityVisual = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let isVisible = true;
    const startTime = Date.now();

    // Pause when off-screen
    const container = containerRef.current || canvas;
    const observer = new IntersectionObserver(
      ([entry]) => { isVisible = entry.isIntersecting; },
      { threshold: 0.1 }
    );
    observer.observe(container);

    // High DPI scaling
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Node configuration
    const accentColor = '#D4A017';
    const accentSecondary = '#A37B10';
    const accentBright = '#F5C542';
    
    const nodes = [
      { id: 'base', x: 40, y: 100, size: 18, complexity: 1 },
      { id: 'mid1', x: 100, y: 100, size: 12, complexity: 0.6 },
      { id: 'branch1', x: 140, y: 70, size: 10, complexity: 0.4 },
      { id: 'branch2', x: 140, y: 130, size: 10, complexity: 0.4 },
      { id: 'final1', x: 180, y: 85, size: 8, complexity: 0.3 },
      { id: 'final2', x: 180, y: 115, size: 8, complexity: 0.3 },
      { id: 'final3', x: 180, y: 55, size: 8, complexity: 0.3 },
      { id: 'final4', x: 180, y: 145, size: 8, complexity: 0.3 },
    ];

    const connections = [
      { from: 'base', to: 'mid1' },
      { from: 'mid1', to: 'branch1' },
      { from: 'mid1', to: 'branch2' },
      { from: 'branch1', to: 'final1' },
      { from: 'branch1', to: 'final3' },
      { from: 'branch2', to: 'final2' },
      { from: 'branch2', to: 'final4' },
    ];

    const particles: any[] = [];
    for (let i = 0; i < 24; i++) {
        const conn = connections[Math.floor(Math.random() * connections.length)];
        particles.push({
            conn,
            t: Math.random(),
            speed: 0.004 + Math.random() * 0.01,
            size: 0.8 + Math.random() * 0.5
        });
    }

    const drawIsoCube = (x: number, y: number, size: number, opacity: number, isBase: boolean = false) => {
      const h = size * 0.5;
      const w = size;

      ctx.save();
      ctx.translate(x, y);
      ctx.globalAlpha = opacity;

      // 1. Shadow (Soft but defined)
      ctx.beginPath();
      ctx.ellipse(0, h * 1.8, w * 0.9, h * 0.4, 0, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 0, 0, ${0.45 * opacity})`;
      ctx.fill();

      // 2. Main Faces with sharper contrast
      // Top Face
      ctx.beginPath();
      ctx.moveTo(0, -h); ctx.lineTo(w, 0); ctx.lineTo(0, h); ctx.lineTo(-w, 0);
      ctx.closePath();
      const topGrad = ctx.createLinearGradient(0, -h, 0, h);
      topGrad.addColorStop(0, isBase ? '#FFF' : accentBright);
      topGrad.addColorStop(1, isBase ? '#CCC' : accentColor);
      ctx.fillStyle = topGrad;
      ctx.fill();

      // Right Face (Deepened)
      ctx.beginPath();
      ctx.moveTo(w, 0); ctx.lineTo(0, h); ctx.lineTo(0, h * 2.4); ctx.lineTo(w, h * 1.4);
      ctx.closePath();
      ctx.fillStyle = '#7d5e0c';
      ctx.fill();

      // Left Face (Middle tone)
      ctx.beginPath();
      ctx.moveTo(-w, 0); ctx.lineTo(0, h); ctx.lineTo(0, h * 2.4); ctx.lineTo(-w, h * 1.4);
      ctx.closePath();
      ctx.fillStyle = accentSecondary;
      ctx.fill();

      // 3. Sharp Technical Details
      // Core glowing dot on top
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.15, 0, Math.PI * 2);
      ctx.fillStyle = isBase ? accentColor : '#FFF';
      ctx.fill();
      if (opacity > 0.8) {
          ctx.shadowBlur = 8;
          ctx.shadowColor = isBase ? accentColor : '#FFF';
          ctx.fill();
          ctx.shadowBlur = 0;
      }

      // 4. Razor Sharp Highlights
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(0, -h); ctx.lineTo(w, 0); ctx.lineTo(0, h);
      ctx.stroke();

      // Left vertical edge highlight
      ctx.beginPath();
      ctx.moveTo(-w, 0); ctx.lineTo(0, h);
      ctx.stroke();

      ctx.restore();
    };

    const render = () => {
      if (!isVisible) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }
      ctx.clearRect(0, 0, rect.width, rect.height);
      const time = (Date.now() - startTime) / 1000;

      // Background accent grid (Static but sharp)
      ctx.strokeStyle = 'rgba(212, 160, 23, 0.04)';
      ctx.lineWidth = 0.5;
      for(let x = 0; x < 200; x += 20) {
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 200); ctx.stroke();
      }
      for(let y = 0; y < 200; y += 20) {
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(200, y); ctx.stroke();
      }

      // 1. Draw Connections (Solid & Pulsing for sharpness)
      connections.forEach(conn => {
        const fromNode = nodes.find(n => n.id === conn.from)!;
        const toNode = nodes.find(n => n.id === conn.to)!;
        
        ctx.beginPath();
        ctx.moveTo(fromNode.x, fromNode.y);
        ctx.lineTo(toNode.x, toNode.y);
        ctx.strokeStyle = `rgba(212, 160, 23, ${0.1 + Math.sin(time*2)*0.05})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // 2. Draw Particles (Plasma style)
      particles.forEach(p => {
          const fromNode = nodes.find(n => n.id === p.conn.from)!;
          const toNode = nodes.find(n => n.id === p.conn.to)!;
          
          p.t += p.speed;
          if (p.t > 1) p.t = 0;

          const px = fromNode.x + (toNode.x - fromNode.x) * p.t;
          const py = fromNode.y + (toNode.y - fromNode.y) * p.t;

          ctx.beginPath();
          ctx.arc(px, py, p.size, 0, Math.PI * 2);
          ctx.fillStyle = '#FFF';
          ctx.shadowBlur = 4;
          ctx.shadowColor = accentColor;
          ctx.fill();
          ctx.shadowBlur = 0;
      });

      // 3. Draw Nodes (In reverse order for depth)
      nodes.slice().reverse().forEach((node, i) => {
        const float = Math.sin(time * 1.5 + i) * 2;
        const pulse = 0.9 + Math.sin(time * 3 + i) * 0.1;
        drawIsoCube(node.x, node.y + float, node.size, pulse, node.id === 'base');
      });

      // 4. Scanning line effect for "sharpened" feel
      const scanY = (time * 40) % 200;
      const scanGrad = ctx.createLinearGradient(0, scanY - 10, 0, scanY + 10);
      scanGrad.addColorStop(0, 'transparent');
      scanGrad.addColorStop(0.5, 'rgba(212, 160, 23, 0.08)');
      scanGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = scanGrad;
      ctx.fillRect(0, scanY - 10, 200, 20);

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => {
      cancelAnimationFrame(animationFrameId);
      observer.disconnect();
    };
  }, []);


  return (
    <div ref={containerRef} className="relative w-full h-full flex items-center justify-center overflow-hidden bg-[rgba(255,255,255,0.01)] group/scalability">
      {/* HUD Accents */}
      <div className="absolute inset-4 border border-white/5 pointer-events-none" />
      <div className="absolute top-4 left-4 w-2 h-2 border-l border-t border-[var(--accent)]/40" />
      <div className="absolute bottom-4 right-4 w-2 h-2 border-r border-b border-[var(--accent)]/40" />

      <div className="absolute inset-x-0 bottom-4 flex justify-between px-8 pointer-events-none opacity-40">
        <span className="text-[6px] text-white font-mono tracking-widest uppercase">Scale: Infinite</span>
        <span className="text-[6px] text-white font-mono tracking-widest uppercase">Node_ID: ORB-292</span>
      </div>
      
      <canvas 
        ref={canvasRef} 
        style={{ width: '100%', height: '100%' }}
        className="transform transition-transform duration-1000 group-hover/scalability:scale-110"
      />

      {/* Floating UI Elements */}
      <motion.div 
        className="absolute top-6 right-6 flex flex-col items-end opacity-60 group-hover/scalability:opacity-100 transition-opacity duration-500"
        initial={{ x: 10, opacity: 0 }}
        animate={{ x: 0, opacity: 0.6 }}
      >
        <div className="flex gap-1 mb-1.5 px-2 py-1 bg-black/40 backdrop-blur-sm rounded-md border border-white/10">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-1 h-3 bg-emerald-500/20 rounded-full overflow-hidden">
                <motion.div 
                  className="w-full h-full bg-emerald-400"
                  animate={{ height: ['30%', '100%', '30%'] }}
                  transition={{ duration: 1.2 + Math.random(), repeat: Infinity }}
                />
            </div>
          ))}
        </div>
        <span className="text-[7px] font-black text-[var(--accent)] uppercase tracking-[0.2em] drop-shadow-md">Verified Secure</span>
      </motion.div>
    </div>
  );
};

// 2. Growth — Parallax Orbital Rings
const GrowthVisual = () => (
  <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-[rgba(255,255,255,0.01)]">
    <div className="relative w-52 h-52 flex items-center justify-center">
      {/* Central Core with Internal Pulse */}
      <motion.div className="w-14 h-14 relative z-20 flex items-center justify-center group" animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
        <MiddleAura scale={1.2} />
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)] via-[#8a6500] to-[#5a4200] rounded-full shadow-[0_0_50px_rgba(212,160,23,0.4)] border border-white/20" />
        <Zap size={22} className="text-white relative z-10 drop-shadow-[0_0_12px_rgba(255,255,255,0.9)]" />
        
        {/* Core Pulse Ring */}
        <motion.div 
          className="absolute inset-0 rounded-full border border-[var(--accent)]"
          animate={{ scale: [1, 2.5], opacity: [0.6, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </motion.div>

      {/* Orbiting Stardust Rings — reduced from 4 to 2 for performance */}
      {[0, 1].map((i) => (
        <div
          key={i}
          className="absolute rounded-full border border-[var(--accent)]/10 orbit-ring"
          style={{ width: `${90 + i * 90}px`, height: `${90 + i * 90}px`, animationDirection: i % 2 === 0 ? 'normal' : 'reverse', animationDuration: `${15 + i * 10}s` }}
        >
          {/* Planetarium Nodes */}
          <div 
            className="absolute w-2 h-2 rounded-full bg-[var(--accent)] shadow-[0_0_15px_var(--accent)] pulse-scale" 
            style={{ 
              top: '-1px', 
              left: '50%',
              backgroundImage: 'radial-gradient(circle at 30% 30%, white, transparent)',
              animationDuration: `${1 + i * 0.4}s`
            }}
          />
        </div>
      ))}

      {/* Floating Stardust Particles — reduced from 12 to 6 for performance */}
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="absolute w-[2px] h-[2px] bg-white rounded-full stardust-particle"
          style={{ 
            left: `${50 + Math.cos(i*60) * 45}%`, 
            top: `${50 + Math.sin(i*60) * 45}%`,
            animationDuration: `${3 + i * 0.5}s`,
            animationDelay: `${i * 0.4}s`
          }}
        />
      ))}
    </div>
  </div>
);

// 3. AI-First — Neural Mesh with Logic Pulses
const AIVisual = () => (
  <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
    <div className="absolute inset-0 bg-[#0a0a0a]" style={{ backgroundImage: 'linear-gradient(rgba(212,160,23,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(212,160,23,0.05) 1px, transparent 1px)', backgroundSize: '25px 25px' }} />
    <div className="relative w-44 h-44">
      <motion.div className="absolute inset-10 border-2 border-[var(--accent)]/50 rounded-2xl bg-[#0a0a0a]/90 backdrop-blur-xl flex items-center justify-center shadow-[0_0_50px_rgba(212,160,23,0.3)] z-10" animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 3, repeat: Infinity }}>
        <MiddleAura scale={1.5} />
        <Brain size={40} className="text-[var(--accent)] filter drop-shadow-[0_0_15px_var(--accent)]" />
        <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" animate={{ left: ['-100%', '100%'] }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} />
      </motion.div>
    </div>
  </div>
);

// 4. Global Delivery — Atmospheric Orbital Sphere
const MAP_DATA = [
  "       . . . .   . . . . . .",
  "   . . . . . . . . . . . . . .",
  " . . . . . . . . . . . . . . . .",
  " . . . . . . . . . . . . . . . .",
  "   . . . . . . . . . . . . . .",
  "     . . . . . . . . . . . . ",
  "       . . . . . . . . . .",
  "         . . . . . . . .",
  "           . . . . . .",
  "             . . . .",
  "               . .",
].map(s => s.split('')); 

// More realistic continent shapes (Simulated high-res matrix)
const WORLD_MAP = [
  "000011110000000011111100110000",
  "000111111000001111111111111000",
  "011111111100111111111111111110",
  "011111111111111111111111111110",
  "001111111111111111111111111000",
  "000111111001111111111111111000",
  "000011110000111111111111100000",
  "000011100000111111111110000000",
  "000001100000011111111000000000",
  "000001000000001111100000000000",
  "000000000000000111000000000000",
];

const GlobalVisual = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let rotation = 0;
    let isVisible = true;

    // Pause when off-screen
    const container = containerRef.current || canvas;
    const observer = new IntersectionObserver(
      ([entry]) => { isVisible = entry.isIntersecting; },
      { threshold: 0.1 }
    );
    observer.observe(container);

    const rows = WORLD_MAP.length;
    const cols = WORLD_MAP[0].length;
    const spacing = 4;
    const dotSize = 1.2;

    const render = () => {
      if (!isVisible) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = 60;

      // ── 1. Sphere Base Shading ──
      const sphereGrad = ctx.createRadialGradient(
        centerX - radius * 0.3, centerY - radius * 0.3, radius * 0.2,
        centerX, centerY, radius
      );
      sphereGrad.addColorStop(0, 'rgba(212, 160, 23, 0.2)');
      sphereGrad.addColorStop(1, '#080808');
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fillStyle = sphereGrad;
      ctx.fill();

      // ── 2. Rotating Dot Map ──
      rotation += 0.005;
      const mapWidth = cols * spacing;
      const offsetX = (rotation * 50) % mapWidth;

      ctx.save();
      // Clipping to sphere
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.clip();

      for (let side = -1; side <= 1; side++) {
        const xStart = centerX - radius/2 + (side * mapWidth) + offsetX;
        
        WORLD_MAP.forEach((row, rIdx) => {
          row.split('').forEach((char, cIdx) => {
            if (char === '0') return;

            const x = xStart + cIdx * spacing - (mapWidth / 2);
            const y = centerY - (rows * spacing / 2) + rIdx * spacing;

            const dx = x - centerX;
            const dy = y - centerY;
            const distSq = dx * dx + dy * dy;
            
            if (distSq < radius * radius) {
              const opacity = Math.pow(1 - distSq / (radius * radius), 0.5);
              ctx.beginPath();
              ctx.arc(x, y, dotSize * opacity, 0, Math.PI * 2);
              ctx.fillStyle = `rgba(212, 160, 23, ${0.4 * opacity})`;
              ctx.fill();
              
              if (opacity > 0.7) {
                ctx.save();
                ctx.shadowBlur = 4;
                ctx.shadowColor = 'rgba(212, 160, 23, 0.5)';
                ctx.fill();
                ctx.restore();
              }
            }
          });
        });
      }
      ctx.restore();

      // ── 3. Connection Arcs ──
      const time = Date.now() / 1000;
      const arcs = [
        { start: { x: centerX - 30, y: centerY }, end: { x: centerX + 30, y: centerY - 20 }, phase: 0 },
        { start: { x: centerX - 20, y: centerY + 20 }, end: { x: centerX + 20, y: centerY + 25 }, phase: 2 },
        { start: { x: centerX - 10, y: centerY - 30 }, end: { x: centerX + 5, y: centerY + 30 }, phase: 4 },
      ];

      arcs.forEach((arc) => {
        const progress = (time + arc.phase) % 4 / 4;
        const cpX = (arc.start.x + arc.end.x) / 2;
        const cpY = Math.min(arc.start.y, arc.end.y) - 30;
        
        ctx.beginPath();
        ctx.moveTo(arc.start.x, arc.start.y);
        ctx.quadraticCurveTo(cpX, cpY, arc.end.x, arc.end.y);
        
        const arcGrad = ctx.createLinearGradient(arc.start.x, arc.start.y, arc.end.x, arc.end.y);
        arcGrad.addColorStop(0, 'rgba(212,160,23,0)');
        arcGrad.addColorStop(progress, 'rgba(212,160,23,0.4)');
        arcGrad.addColorStop(Math.min(progress + 0.1, 1), 'rgba(212,160,23,0)');
        
        ctx.strokeStyle = arcGrad;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Data particle
        const t = progress;
        const px = (1 - t) * (1 - t) * arc.start.x + 2 * (1 - t) * t * cpX + t * t * arc.end.x;
        const py = (1 - t) * (1 - t) * arc.start.y + 2 * (1 - t) * t * cpY + t * t * arc.end.y;
        
        ctx.beginPath();
        ctx.arc(px, py, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.shadowBlur = 8;
        ctx.shadowColor = 'rgba(212, 160, 23, 0.8)';
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // ── 4. Fresnel Glow ──
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      const fresnel = ctx.createRadialGradient(centerX, centerY, radius * 0.8, centerX, centerY, radius);
      fresnel.addColorStop(0, 'rgba(212,160,23,0)');
      fresnel.addColorStop(1, 'rgba(212,160,23,0.3)');
      ctx.fillStyle = fresnel;
      ctx.fill();

      // Border shine
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 1;
      ctx.stroke();

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => {
      cancelAnimationFrame(animationFrameId);
      observer.disconnect();
    };
  }, []);


  return (
    <div ref={containerRef} className="relative w-full h-full flex items-center justify-center py-8 overflow-hidden bg-[rgba(255,255,255,0.01)]">
    <div className="relative w-52 h-52 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_center,rgba(212,160,23,0.1)_0%,transparent_70%)] opacity-50 blur-3xl p-10" />
        <canvas 
          ref={canvasRef} 
          width={200} 
          height={200}
          className="relative z-20 drop-shadow-[0_0_50px_rgba(212,160,23,0.3)]"
        />
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="absolute w-[1px] h-[1px] bg-white/20 rounded-full stardust-particle"
            style={{ 
              left: `${20 + i * 15}%`, 
              top: `${15 + i * 18}%`,
              animationDuration: `${3 + i}s`,
              animationDelay: `${i * 1.2}s`
            }}
          />
        ))}
      </div>
    </div>
  );
};

// 5. Enterprise Security — Advanced Layered Shield Check
const SecurityVisual = () => (
  <div className="relative w-full h-full flex items-center justify-center py-4 overflow-hidden">
    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(45deg, var(--accent) 0px, var(--accent) 1px, transparent 1px, transparent 10px)' }} />
    <div className="relative w-36 h-36 flex items-center justify-center">
      <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 100 100">
        <motion.circle cx="50" cy="50" r="45" stroke="var(--accent)" strokeWidth="0.5" fill="none" strokeDasharray="1 4" animate={{ rotate: 360 }} transition={{ duration: 30, repeat: Infinity, ease: "linear" }} />
      </svg>
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute border-2 border-[var(--accent)]/30"
          style={{ 
            width: `${65 + i * 25}px`, 
            height: `${65 + i * 25}px`, 
            borderRadius: i % 2 === 0 ? '30%' : '15%',
          }}
          animate={{ 
            rotate: i % 2 === 0 ? 45 : -45, 
            opacity: [0.1, 0.4, 0.1],
            scale: [1, 1.05, 1]
          }}
          transition={{ duration: 6, repeat: Infinity, delay: i * 0.8 }}
        />
      ))}
      <motion.div className="relative z-10 w-20 h-20 bg-[#0a0a0a]/90 border-2 border-[var(--accent)] rounded-2xl flex items-center justify-center shadow-[0_0_60px_rgba(212,160,23,0.5)] backdrop-blur-md" animate={{ rotateY: [0, 15, -15, 0] }} transition={{ duration: 5, repeat: Infinity }}>
        <ShieldCheck size={40} className="text-[var(--accent)]" />
        <motion.div className="absolute inset-x-0 h-[2px] bg-[var(--accent-luminous)] blur-sm" animate={{ top: ['0%', '100%'] }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} />
      </motion.div>
    </div>
  </div>
);

const conversation = [
  { id: 1, type: 'user', text: 'I need a Calling Feature.', delay: 1500 },
  { id: 2, type: 'dev', text: 'I am designing the UI/UX.', delay: 1000 },
  { id: 3, type: 'dev', text: 'After confirmation, we will proceed to development.', delay: 2000 },
  { id: 4, type: 'clear', delay: 1000 },
  { id: 5, type: 'user', text: 'Make that SignUp button smaller.', delay: 1500 },
  { id: 6, type: 'dev', text: 'I am on it.', delay: 2000 },
];

// 6. 24/7 Human Assistance — Interactive Chat Sequence
const HumanAssistanceVisual = () => {
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    let isActive = true;
    const runSequence = async () => {
      if (!isActive) return;
      setMessages([]);
      await new Promise(r => setTimeout(r, 800));
      
      for (let i = 0; i < conversation.length; i++) {
        if (!isActive) break;
        const msg = conversation[i];
        
        if (msg.type === 'clear') {
            await new Promise(r => setTimeout(r, msg.delay));
            setMessages([]);
            continue;
        }

        if (msg.type === 'dev') {
            setMessages(prev => [...prev, { id: `typing-${i}`, type: 'typing' }]);
            await new Promise(r => setTimeout(r, 1500));
            setMessages(prev => prev.filter(m => m.type !== 'typing'));
        }
        
        setMessages(prev => [...prev, msg]);
        await new Promise(r => setTimeout(r, msg.delay));
      }
      
      await new Promise(r => setTimeout(r, 5000));
      if (isActive) runSequence();
    };

    runSequence();
    return () => { isActive = false; };
  }, []);

  return (
    <div className="relative w-full h-full flex flex-col p-5 overflow-hidden bg-[rgba(255,255,255,0.01)] group/assistance select-none">
        {/* Glass Header */}
        <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-2">
            <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                <span className="text-[8px] font-black text-white/40 uppercase tracking-[0.2em]">Support Live</span>
            </div>
            <div className="flex gap-1">
                <div className="w-1 h-1 rounded-full bg-white/20" />
                <div className="w-1 h-1 rounded-full bg-white/20" />
            </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col gap-3 overflow-y-auto no-scrollbar">
            <AnimatePresence mode="popLayout">
                {messages.map((msg, idx) => (
                    <motion.div
                        key={msg.id || `typing-${idx}`}
                        initial={{ opacity: 0, x: msg.type === 'user' ? -12 : 12, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                        layout
                        className={`flex ${msg.type === 'user' ? 'justify-start' : 'justify-end'}`}
                    >
                        {msg.type === 'typing' ? (
                            <div className="bg-white/5 border border-white/10 px-4 py-2.5 rounded-2xl rounded-bl-none flex gap-1.5 items-center">
                                <motion.div className="w-1 h-1 bg-[var(--accent)] rounded-full" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 0.8, repeat: Infinity, delay: 0 }} />
                                <motion.div className="w-1 h-1 bg-[var(--accent)] rounded-full" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }} />
                                <motion.div className="w-1 h-1 bg-[var(--accent)] rounded-full" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }} />
                            </div>
                        ) : (
                            <div className={`max-w-[90%] px-4 py-2.5 rounded-2xl text-[10px] font-medium leading-relaxed shadow-xl border ${
                                msg.type === 'user' 
                                ? 'bg-white/5 border-white/10 text-white/90 rounded-bl-none' 
                                : 'bg-[var(--accent)]/10 border-[var(--accent)]/30 text-[var(--accent)] rounded-br-none'
                            }`}>
                                {msg.text}
                            </div>
                        )}
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>

        {/* Footer HUD */}
        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
            <div className="flex-1 h-5 bg-white/5 rounded-full flex items-center px-3">
                <div className="w-1 h-3 bg-white/10 rounded-full animate-pulse" />
            </div>
            <motion.div 
               className="ml-2 w-5 h-5 rounded-lg bg-[var(--accent)]/20 border border-[var(--accent)]/40 flex items-center justify-center"
               whileHover={{ scale: 1.1 }}
            >
                <div className="w-2 h-2 border-r-2 border-b-2 border-[var(--accent)] rotate-[-45deg] translate-x-[-0.5px]" />
            </motion.div>
        </div>

        {/* Floating Accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent)]/5 blur-[40px] rounded-full pointer-events-none" />
    </div>
  );
};

const ALL_VISUALS = [ROIVisual, ScalabilityVisual, GrowthVisual, AIVisual, GlobalVisual, SecurityVisual, HumanAssistanceVisual];
const MAIN_VISUALS = [ROIVisual, ScalabilityVisual, GrowthVisual, AIVisual];
const BENEFIT_VISUALS = [GlobalVisual, SecurityVisual, HumanAssistanceVisual];

/* ─────────────────────── 3D Tilt Card Component ─────────────────────── */
function TiltCard({ 
  item, 
  index, 
  layout = 'horizontal', // 'horizontal', 'vertical-top', 'vertical-bottom'
  icon: PassedIcon
}: { 
  item: any; 
  index: number; 
  layout?: 'horizontal' | 'vertical-top' | 'vertical-bottom';
  icon?: any;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);

  const rotateX = useSpring(useTransform(y, [0, 1], [10, -10]), { stiffness: 150, damping: 20 });
  const rotateY = useSpring(useTransform(x, [0, 1], [-10, 10]), { stiffness: 150, damping: 20 });

  function handleMouseMove(event: React.MouseEvent) {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    x.set((event.clientX - rect.left) / rect.width);
    y.set((event.clientY - rect.top) / rect.height);
  }

  function handleMouseLeave() {
    x.set(0.5);
    y.set(0.5);
  }

  const Icon = PassedIcon || 
               (item.icon && ALL_ICONS_MAP[item.icon]) || 
               ICONS[index % ICONS.length] || 
               BarChart3;
  const Visual = ALL_VISUALS[index];

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={(e) => {
        handleMouseMove(e);
        const card = cardRef.current;
        if (!card) return;
        const rect = card.getBoundingClientRect();
        const shineX = e.clientX - rect.left;
        const shineY = e.clientY - rect.top;
        const shine = card.querySelector('.card-shine-overlay') as HTMLElement;
        if (shine) {
          shine.style.background = `radial-gradient(circle at ${shineX}px ${shineY}px, rgba(212,160,23,0.15) 0%, transparent 60%)`;
        }
      }}
      onMouseLeave={() => {
        handleMouseLeave();
        const card = cardRef.current;
        if (card) {
          const shine = card.querySelector('.card-shine-overlay') as HTMLElement;
          if (shine) shine.style.background = 'transparent';
        }
      }}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
        isolation: 'isolate',
        willChange: 'transform',
        WebkitBackfaceVisibility: 'hidden',
        backfaceVisibility: 'hidden',
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.6 }}
      className={`group relative bento-card border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] backdrop-blur-xl p-6 rounded-[2rem] flex flex-col transition-all duration-500 hover:border-[rgba(212,160,23,0.35)] hover:bg-[rgba(255,255,255,0.04)] overflow-hidden ${
        layout === 'horizontal' ? 'min-h-[240px]' : 'min-h-[200px]'
      }`}
    >
      {/* Shine overlay */}
      <div className="card-shine-overlay absolute inset-0 pointer-events-none z-20 rounded-[2rem]" style={{ transition: 'background 0.1s ease-out' }} />

      {/* Decorative Glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none rounded-[2rem]" />

      {/* Bottom border accent glow */}
      <div className="absolute bottom-0 left-[10%] right-[10%] h-[2px] bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-0 group-hover:opacity-60 transition-opacity duration-500 z-30" />

      <div className="relative z-10 flex flex-col h-full gap-6" style={{ transform: 'translateZ(30px)' }}>
        
        {/* Upside Visual (for 3rd Row) */}
        {layout === 'vertical-top' && Visual && (
          <div className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-2xl overflow-hidden mb-2" style={{ transform: 'translateZ(40px)' }}>
            <Visual />
          </div>
        )}

        <div className={`flex ${layout === 'horizontal' ? 'flex-col lg:flex-row' : 'flex-col'} gap-6 flex-1`}>
          <div className="flex-1 flex flex-col">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-12 h-12 rounded-xl bg-[rgba(212,160,23,0.12)] flex items-center justify-center text-[var(--accent)] shadow-inner">
                <Icon size={24} />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-white group-hover:text-[var(--accent-luminous)] transition-colors">
                {item.title}
              </h3>
            </div>

            <p className="text-[14px] md:text-[15px] leading-relaxed text-[var(--text-secondary)]">
              <RichText text={item.desc || item.description} />
            </p>

            {item.benefit && layout !== 'vertical-top' && (
              <div className="mt-auto pt-6 border-t border-white/5">
                <div className="flex items-center gap-2 text-[var(--accent)] text-[11px] font-bold uppercase tracking-wider">
                  <TrendingUp size={14} />
                  <span>Impact Metrics</span>
                </div>
                <p className="text-xs text-white/50 mt-1">{item.benefit}</p>
              </div>
            )}
          </div>

          {/* Rightside Visual (for 2nd & 4th Cards) */}
          {layout === 'horizontal' && Visual && (
            <div 
              className="w-full lg:w-[160px] xl:w-[200px] aspect-video lg:aspect-square bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-xl overflow-hidden shrink-0 self-center"
              style={{ transform: 'translateZ(50px)' }}
            >
              <Visual />
            </div>
          )}
        </div>

        {/* Downside Visual (for 1st & 3rd Cards) */}
        {layout === 'vertical-bottom' && Visual && (
          <div className="w-full min-h-[120px] bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-xl overflow-hidden mt-2" style={{ transform: 'translateZ(50px)' }}>
            <Visual />
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ─────────────────────── Final Section ─────────────────────── */
export function WhyUsSection() {
  const { content } = useContent();
  const { lang } = useLang();
  
  // Get raw content from context (could be overridden by DB)
  const t = (content[lang] as any)?.whyUs;
  const items = t?.items || [];
  
  // Force 24/7 Human Assistance branding ONLY if database has stale text
  const rawBenefits = t?.benefits || [];
  const benefits = rawBenefits.map((b: any, i: number) => {
    const isOldTitle = b.title === 'Elite Talent' || b.title === 'অভিজাত প্রতিভা';
    if (i === 2 && isOldTitle) { // 3rd Benefit: previously Elite Talent
      const isBengali = lang === 'bn';
      return {
        ...b,
        title: isBengali ? '২৪/৭ হিউম্যান অ্যাসিস্ট্যান্স' : '24/7 Human Assistance',
        desc: isBengali 
          ? 'আপনার ভিশনকে পরিচালিত করতে এবং জটিল চ্যালেঞ্জগুলো সমাধান করতে সার্বক্ষণিক বিশেষজ্ঞ মানবিক সহায়তা।' 
          : 'Expert human support available around the clock to guide your vision and resolve complex challenges.'
      };
    }
    return b;
  });

  if (!items.length) return null;

  return (
    <section id="why-us" className="section-dark relative overflow-hidden min-h-[100dvh] flex flex-col justify-center py-12 noise-overlay">
      {/* ── Background Glow ── */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[10%] right-[10%] w-[800px] h-[800px] bg-[var(--accent)] opacity-[0.03] blur-[150px]" />
        <div className="absolute bottom-[0%] left-[5%] w-[600px] h-[600px] bg-violet-600/5 blur-[120px]" />
      </div>

      <div className="section-container relative z-10 w-full">
        {/* Header */}
        <div className="max-w-4xl mx-auto text-center mb-20">
          {t?.badge && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, filter: 'blur(10px)' }}
              whileInView={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="mb-8"
            >
              <span className="pill-badge pill-badge-accent uppercase tracking-[0.2em] text-[10px] px-6 py-2">
                {t?.badge}
              </span>
            </motion.div>
          )}
          <motion.h2
            initial={{ opacity: 0, y: 40, filter: 'blur(8px)' }}
            whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="section-heading text-white text-4xl md:text-6xl mb-6 tracking-tighter"
          >
            <span className="text-shimmer-accent">{t?.heading || t?.title}</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20, filter: 'blur(6px)' }}
            whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="section-subheading section-subheading-dark text-lg md:text-2xl mx-auto opacity-70"
          >
            {t?.subtitle}
          </motion.p>
        </div>

        {/* ────── 2-2-3 Grid Structure with Staggered Entrance ────── */}
        <div className="flex flex-col gap-6 max-w-[1240px] mx-auto">
          
          {/* Row 1 & 2: Main Items (2x2) — Staggered cascade */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.15 } }
            }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {items.map((item: any, i: number) => (
              <motion.div
                key={`item-${i}`}
                variants={{
                  hidden: { opacity: 0, y: 60, scale: 0.92, filter: 'blur(12px)' },
                  visible: { 
                    opacity: 1, y: 0, scale: 1, filter: 'blur(0px)',
                    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] }
                  }
                }}
              >
                <TiltCard item={item} index={i} layout="horizontal" />
              </motion.div>
            ))}
          </motion.div>

          {/* Row 3: Benefits (1x3) — Staggered cascade */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } }
            }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {benefits.map((benefit: any, i: number) => {
              // Benefits indices are 4, 5, 6
              const absoluteIndex = 4 + i;
              const layout = i === 1 ? 'vertical-top' : 'vertical-bottom';
              return (
                <motion.div
                  key={`benefit-${i}`}
                  variants={{
                    hidden: { opacity: 0, y: 50, scale: 0.9, filter: 'blur(10px)' },
                    visible: { 
                      opacity: 1, y: 0, scale: 1, filter: 'blur(0px)',
                      transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] }
                    }
                  }}
                >
                  <TiltCard 
                    item={benefit} 
                    index={absoluteIndex} 
                    layout={layout} 
                    icon={benefit.icon ? ALL_ICONS_MAP[benefit.icon] : BENEFIT_ICONS[i % BENEFIT_ICONS.length]} 
                  />
                </motion.div>
              );
            })}
          </motion.div>
        </div>


      </div>
      <WaveDivider fill="#FDFBF7" />
    </section>
  );
}

export default WhyUsSection;
