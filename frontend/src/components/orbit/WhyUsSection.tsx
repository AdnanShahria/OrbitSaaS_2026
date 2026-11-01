import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useContent } from '@/contexts/ContentContext';
import { useLang } from '@/contexts/LanguageContext';
import { 
  TrendingUp, 
  Globe, 
  ShieldCheck, 
  Headset, 
  Zap, 
  Layers, 
  Sparkles, 
  Bot, 
  Server, 
  Activity, 
  CheckCircle2, 
  LucideIcon,
  LayoutGrid,
  RefreshCw
} from 'lucide-react';
import { RichText } from '@/components/ui/RichText';
import { WaveDivider } from '@/components/ui/WaveDivider';

/* ─── Precision-Engineered Visual Units ─── */

/**
 * 0. Direct ROI Impact Visual — Apple/Linear Style Algorithmic Yield Engine
 */
const ROIVisual = () => {
  const bars = [
    { height: 32, val: '1.2x' },
    { height: 46, val: '1.8x' },
    { height: 40, val: '2.1x' },
    { height: 70, val: '2.9x' },
    { height: 58, val: '3.1x' },
    { height: 96, val: '3.5x' },
  ];

  return (
    <div className="relative w-full h-full p-2 sm:p-2.5 flex flex-col justify-between overflow-hidden bg-gradient-to-b from-emerald-50/70 via-white to-teal-50/50 select-none">
      {/* Precision Micro Grid */}
      <div 
        className="absolute inset-0 opacity-[0.3] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#059669 0.75px, transparent 0.75px)',
          backgroundSize: '8px 8px'
        }}
      />

      {/* Target Laser Guide Line */}
      <div className="absolute top-[38%] left-0 right-0 h-[1px] border-b border-dashed border-emerald-400/50 pointer-events-none z-0" />
      <div className="absolute top-[34%] right-1.5 px-1 py-0.2 rounded bg-emerald-100/90 text-[6px] font-mono font-bold text-emerald-800 z-10">
        TARGET: 3.5x
      </div>

      {/* Top Header Pill */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="flex h-1.5 w-1.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
          </span>
          <span className="text-[8px] sm:text-[8.5px] font-bold uppercase tracking-wider text-emerald-900 font-mono">
            Yield // 60Hz
          </span>
        </div>
        <div className="flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-emerald-100/90 border border-emerald-300/80 text-[7.5px] sm:text-[8px] font-extrabold text-emerald-800 tabular-nums shadow-2xs">
          <span>+350%</span>
        </div>
      </div>

      {/* Dynamic Animated Bars with Continuous Laser Scan Line */}
      <div className="relative z-10 flex items-end justify-between gap-1 h-10 sm:h-12 pt-1">
        {/* Animated Scanning Beam sweeping across bars */}
        <motion.div 
          animate={{ x: ['-20%', '120%'] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "linear" }}
          className="absolute inset-y-0 w-3 bg-gradient-to-r from-transparent via-emerald-400/25 to-transparent pointer-events-none z-20"
        />

        {bars.map((bar, i) => {
          const isPeak = i === bars.length - 1;
          return (
            <div key={i} className="flex-1 flex flex-col items-center h-full justify-end group/bar relative">
              <motion.div
                initial={{ height: 0 }}
                whileInView={{ height: `${bar.height}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                className={`w-full rounded-t-sm transition-all duration-300 relative flex flex-col justify-between overflow-hidden ${
                  isPeak 
                    ? 'bg-gradient-to-t from-emerald-600 via-emerald-500 to-teal-400 shadow-[0_0_10px_rgba(16,185,129,0.45)]' 
                    : 'bg-zinc-200/90 group-hover/bar:bg-emerald-400/80'
                }`}
              >
                {/* Precision Equalizer Tick marks */}
                <div className="w-full flex flex-col justify-between h-full py-0.5 opacity-40">
                  <div className="w-full h-[0.75px] bg-white/60" />
                  <div className="w-full h-[0.75px] bg-white/60" />
                  <div className="w-full h-[0.75px] bg-white/60" />
                </div>

                {isPeak && (
                  <motion.div 
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="absolute top-0 inset-x-0 h-1 bg-white/80" 
                  />
                )}
              </motion.div>

              {isPeak && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-1 py-0.2 rounded bg-zinc-950 text-[6.5px] font-mono font-bold text-white whitespace-nowrap shadow-xs border border-emerald-500/50 flex items-center gap-0.5">
                  <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                  {bar.val}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Micro Ticker with Telemetry */}
      <div className="relative z-10 flex items-center justify-between text-[7px] sm:text-[7.5px] font-mono text-zinc-600 pt-0.5 border-t border-emerald-200/60">
        <span className="tracking-tight">NET: +350%</span>
        <span className="text-emerald-800 font-bold">3.5x Multiplier</span>
      </div>
    </div>
  );
};

/**
 * 1. Infinite Scalability Visual — Real-Time Edge Packet Highway
 */
const ScalabilityVisual = () => {
  return (
    <div className="relative w-full h-full p-2 sm:p-2.5 flex flex-col justify-between overflow-hidden bg-gradient-to-b from-blue-50/70 via-white to-indigo-50/50 select-none">
      {/* Background Matrix Grid */}
      <div 
        className="absolute inset-0 opacity-[0.25] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#2563eb 0.75px, transparent 0.75px)',
          backgroundSize: '8px 8px'
        }}
      />

      {/* Top Header */}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-1.5">
          <Server className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-blue-600" />
          <span className="text-[8px] sm:text-[8.5px] font-mono font-bold uppercase tracking-wider text-blue-900">
            Node // US-EAST
          </span>
        </div>
        <div className="flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-blue-100/90 border border-blue-300/80 text-[7.5px] sm:text-[8px] font-bold text-blue-900 font-mono shadow-2xs">
          <Activity className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-blue-600 animate-pulse" />
          <span>0.8ms</span>
        </div>
      </div>

      {/* Precision Circuit Topology Simulation */}
      <div className="relative flex items-center justify-center my-auto py-1 z-10">
        <div className="flex items-center justify-between w-full max-w-[130px] sm:max-w-[142px] relative">
          {/* Main Bus Highway Line */}
          <div className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-blue-300/60 via-indigo-400 to-blue-300/60 top-1/2 -translate-y-1/2 z-0" />

          {/* Continuous High-Speed Streaming Laser Packets */}
          <motion.div 
            animate={{ left: ['0%', '100%'], opacity: [0, 1, 1, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-blue-500 blur-[1px] shadow-[0_0_8px_#3b82f6] z-1"
          />
          <motion.div 
            animate={{ left: ['0%', '100%'], opacity: [0, 1, 1, 0] }}
            transition={{ duration: 1.6, delay: 0.8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-indigo-400 blur-[0.5px] shadow-[0_0_6px_#6366f1] z-1"
          />

          {/* Node 1: Ingress */}
          <div className="relative z-10 w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg bg-white border border-blue-300/80 shadow-xs flex items-center justify-center text-blue-700">
            <Zap className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-blue-600" />
            <span className="absolute -bottom-2 text-[5.5px] font-mono text-zinc-500 font-semibold">INGRESS</span>
          </div>

          {/* Node 2: Load Balancer (Center) */}
          <div className="relative z-10 flex flex-col items-center">
            <motion.div 
              animate={{ 
                boxShadow: [
                  '0 0 0 0 rgba(59, 130, 246, 0.4)',
                  '0 0 0 4px rgba(59, 130, 246, 0)',
                  '0 0 0 0 rgba(59, 130, 246, 0)'
                ]
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
              className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg bg-zinc-950 text-white text-[7.5px] sm:text-[8px] font-mono font-bold shadow-xs flex items-center gap-1 border border-blue-500/40"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>10M+ Req/s</span>
            </motion.div>
            <span className="text-[5.5px] font-mono text-blue-700 font-semibold mt-0.5">AUTOSCALE</span>
          </div>

          {/* Node 3: Edge Workers */}
          <div className="relative z-10 w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg bg-white border border-indigo-300/80 shadow-xs flex items-center justify-center text-indigo-700">
            <Globe className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-indigo-600" />
            <span className="absolute -bottom-2 text-[5.5px] font-mono text-zinc-500 font-semibold">EDGE</span>
          </div>
        </div>
      </div>

      {/* Bottom Micro Tickers */}
      <div className="flex items-center justify-between text-[7px] sm:text-[7.5px] font-mono text-zinc-600 pt-0.5 border-t border-blue-200/60 relative z-10">
        <span>280+ POPs</span>
        <span className="text-blue-700 font-bold">99.99% SLA</span>
      </div>
    </div>
  );
};

/**
 * 2. Long-Term Growth Visual — Continuous Modular Stack & Zero-Debt Pipeline
 */
const GrowthVisual = () => {
  return (
    <div className="relative w-full h-full p-2 sm:p-2.5 flex flex-col justify-between overflow-hidden bg-gradient-to-b from-amber-50/70 via-white to-orange-50/50 select-none">
      {/* Background Matrix Grid */}
      <div 
        className="absolute inset-0 opacity-[0.25] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#d97706 0.75px, transparent 0.75px)',
          backgroundSize: '8px 8px'
        }}
      />

      {/* Top Header */}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-1.5">
          <Layers className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-600" />
          <span className="text-[8px] sm:text-[8.5px] font-mono font-bold uppercase tracking-wider text-amber-900">
            Arch // v3.4
          </span>
        </div>
        <span className="px-1.5 py-0.2 rounded-full bg-amber-100/90 border border-amber-300/80 text-[7.5px] sm:text-[8px] font-bold text-amber-900 font-mono shadow-2xs flex items-center gap-1">
          <span className="w-1 h-1 rounded-full bg-emerald-500" />
          Zero Debt
        </span>
      </div>

      {/* Precision Stacked Layer Visualizer with Continuous Verification Beam */}
      <div className="relative flex flex-col gap-1 my-auto max-w-[130px] sm:max-w-[142px] mx-auto w-full z-10">
        {/* Laser Validation Scanner Sweeping vertically */}
        <motion.div 
          animate={{ top: ['-10%', '110%', '-10%'] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-amber-500 to-transparent pointer-events-none z-20 shadow-[0_0_6px_#f59e0b]"
        />

        {/* Layer 1: Microservices */}
        <div className="px-2 py-0.5 sm:py-1 rounded-md bg-white border border-amber-200/90 shadow-xs flex items-center justify-between text-[7.5px] sm:text-[8px] font-semibold text-zinc-800 relative overflow-hidden">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span>Microservices</span>
          </span>
          <div className="flex items-center gap-1">
            <span className="px-1 rounded bg-amber-50 text-[6px] font-mono text-amber-700 font-bold border border-amber-200/60">
              OK
            </span>
            <span className="text-[6.5px] sm:text-[7px] text-zinc-400 font-mono">v3.0</span>
          </div>
        </div>

        {/* Layer 2: Serverless Core */}
        <div className="px-2 py-0.5 sm:py-1 rounded-md bg-zinc-50 border border-zinc-200/80 flex items-center justify-between text-[7.5px] sm:text-[8px] font-medium text-zinc-700 relative overflow-hidden">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Serverless Core</span>
          </span>
          <div className="flex items-center gap-1">
            <span className="px-1 rounded bg-emerald-50 text-[6px] font-mono text-emerald-700 font-bold border border-emerald-200/60">
              CI/CD
            </span>
            <span className="text-[6.5px] sm:text-[7px] text-zinc-400 font-mono">v2.0</span>
          </div>
        </div>
      </div>

      {/* Bottom Status */}
      <div className="flex items-center justify-between text-[7px] sm:text-[7.5px] font-mono text-zinc-600 pt-0.5 border-t border-amber-200/60 relative z-10">
        <span>CI/CD: PASSING</span>
        <span className="text-amber-800 font-bold">PROACTIVE</span>
      </div>
    </div>
  );
};

/**
 * 3. AI-First Architecture Visual — Precision Multi-Agent Radar Reticle
 */
const AIVisual = () => {
  return (
    <div className="relative w-full h-full p-2 sm:p-2.5 flex flex-col justify-between overflow-hidden bg-gradient-to-b from-purple-50/70 via-white to-pink-50/50 select-none">
      {/* Background Matrix Grid */}
      <div 
        className="absolute inset-0 opacity-[0.25] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#9333ea 0.75px, transparent 0.75px)',
          backgroundSize: '8px 8px'
        }}
      />

      {/* Top Header */}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-1.5">
          <Bot className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-purple-600" />
          <span className="text-[8px] sm:text-[8.5px] font-mono font-bold uppercase tracking-wider text-purple-900">
            Agentic Core
          </span>
        </div>
        <span className="px-1.5 py-0.2 rounded-full bg-purple-100/90 border border-purple-300/80 text-[7.5px] sm:text-[8px] font-bold text-purple-900 font-mono shadow-2xs">
          128 tps
        </span>
      </div>

      {/* Precision Neural Dispatch Reticle Center */}
      <div className="relative flex items-center justify-center my-auto z-10">
        <div className="relative w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center">
          {/* Precision Crosshairs */}
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[0.75px] bg-purple-300/40 pointer-events-none" />
          <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[0.75px] bg-purple-300/40 pointer-events-none" />

          {/* Outer Degree Tick Ring */}
          <div className="absolute inset-0 rounded-full border border-purple-300/60" />
          
          {/* Sweeping Precision Radar Beam */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full origin-center pointer-events-none"
            style={{
              background: 'conic-gradient(from 0deg, rgba(168, 85, 247, 0.4) 0deg, transparent 60deg, transparent 360deg)'
            }}
          />

          {/* Orbiting Satellite Micro-Agent 1 (Planner) */}
          <motion.div 
            animate={{ scale: [1, 1.25, 1] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0 }}
            className="absolute -top-0.5 right-1 w-1.5 h-1.5 rounded-full bg-purple-600 shadow-[0_0_4px_#9333ea]"
          />
          {/* Orbiting Satellite Micro-Agent 2 (Executor) */}
          <motion.div 
            animate={{ scale: [1, 1.25, 1] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
            className="absolute -bottom-0.5 right-1 w-1.5 h-1.5 rounded-full bg-pink-500 shadow-[0_0_4px_#ec4899]"
          />
          {/* Orbiting Satellite Micro-Agent 3 (Self-Heal) */}
          <motion.div 
            animate={{ scale: [1, 1.25, 1] }}
            transition={{ duration: 2, repeat: Infinity, delay: 1.2 }}
            className="absolute top-1/2 -translate-y-1/2 -left-0.5 w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_4px_#6366f1]"
          />

          {/* Central Neural Kernel */}
          <div className="relative z-10 w-5 h-5 sm:w-5.5 sm:h-5.5 rounded-full bg-white border border-purple-400 shadow-xs flex items-center justify-center">
            <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-purple-600 animate-pulse" />
          </div>
        </div>
        
        {/* Real-time Agent Telemetry Tags */}
        <div className="ml-2 sm:ml-2.5 flex flex-col gap-0.5 text-[7px] sm:text-[7.5px] font-mono">
          <div className="flex items-center gap-1 font-semibold text-zinc-800">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-ping" />
            <span>Multi-Agent</span>
          </div>
          <div className="flex items-center gap-1 text-zinc-600">
            <span className="w-1.5 h-1.5 rounded-full bg-pink-400" />
            <span>Self-Healing</span>
          </div>
        </div>
      </div>

      {/* Bottom Status */}
      <div className="flex items-center justify-between text-[7px] sm:text-[7.5px] font-mono text-zinc-600 pt-0.5 border-t border-purple-200/60 relative z-10">
        <span>CONSENSUS: 99.4%</span>
        <span className="text-purple-800 font-bold">SMART CORE</span>
      </div>
    </div>
  );
};

/* Visual Components Map */
const BENTO_VISUALS = [ROIVisual, ScalabilityVisual, GrowthVisual, AIVisual];

/* Card Theme Palette matching ServicesSection aesthetics */
const WHY_US_THEMES = [
  {
    // 01 Direct ROI Impact
    icon: TrendingUp,
    text: 'from-emerald-600 to-teal-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200/60',
    iconColor: 'text-emerald-600',
    glow: 'rgba(16, 185, 129, 0.25)',
    accent: '#10b981',
    hoverBorder: 'group-hover:border-emerald-400/60',
    visualBorder: 'border-emerald-300/80',
  },
  {
    // 02 Scalability
    icon: Server,
    text: 'from-blue-600 to-indigo-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200/60',
    iconColor: 'text-blue-600',
    glow: 'rgba(59, 130, 246, 0.25)',
    accent: '#3b82f6',
    hoverBorder: 'group-hover:border-blue-400/60',
    visualBorder: 'border-blue-300/80',
  },
  {
    // 03 Long-term Growth
    icon: Layers,
    text: 'from-amber-600 to-orange-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200/60',
    iconColor: 'text-amber-600',
    glow: 'rgba(245, 158, 11, 0.25)',
    accent: '#f59e0b',
    hoverBorder: 'group-hover:border-amber-400/60',
    visualBorder: 'border-amber-300/80',
  },
  {
    // 04 AI-First Development
    icon: Bot,
    text: 'from-purple-600 to-pink-700',
    bg: 'bg-purple-50',
    border: 'border-purple-200/60',
    iconColor: 'text-purple-600',
    glow: 'rgba(168, 85, 247, 0.25)',
    accent: '#a855f7',
    hoverBorder: 'group-hover:border-purple-400/60',
    visualBorder: 'border-purple-300/80',
  },
];

/* ─── Standard Bento Card (Desktop & Default View) ─── */
function WhyUsCard({ item, index }: { item: any; index: number }) {
  const theme = WHY_US_THEMES[index % WHY_US_THEMES.length];
  const Icon = theme.icon;
  const VisualComponent = BENTO_VISUALS[index % BENTO_VISUALS.length];
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -4;
    const rotateY = ((x - centerX) / centerX) * 4;
    card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-2px)`;

    const shine = card.querySelector('.whyus-card-shine') as HTMLElement;
    if (shine) {
      shine.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(255,255,255,0.2) 0%, transparent 60%)`;
    }
  };

  const handleMouseLeave = () => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) translateY(0px)';
    const shine = card.querySelector('.whyus-card-shine') as HTMLElement;
    if (shine) {
      shine.style.background = 'transparent';
    }
  };

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: [0.25, 1, 0.5, 1] }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`group relative overflow-hidden rounded-2xl lg:rounded-[1.6rem] bg-white/95 backdrop-blur-2xl border-2 border-[#d8d3c7] ${theme.hoverBorder} p-3.5 sm:p-4 md:p-4.5 lg:p-5 md:min-h-[170px] lg:min-h-[185px] flex flex-col justify-between cursor-default shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-[0_16px_45px_-12px_rgba(0,0,0,0.08)]`}
      style={{
        transition: 'transform 0.15s ease-out, border-color 0.4s, box-shadow 0.4s',
        willChange: 'transform',
        '--card-glow': theme.glow,
      } as any}
    >
      {/* Shine overlay — follows cursor */}
      <div 
        className="whyus-card-shine absolute inset-0 pointer-events-none z-20 rounded-2xl lg:rounded-[1.6rem]" 
        style={{ transition: 'background 0.15s ease-out' }} 
      />

      {/* Decorative Glow */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
        style={{ background: `linear-gradient(to bottom right, var(--card-glow), transparent)` }}
      />

      {/* Bottom border accent glow */}
      <div 
        className="absolute bottom-0 left-[10%] right-[10%] h-[2px] opacity-0 group-hover:opacity-60 transition-opacity duration-500"
        style={{ background: `linear-gradient(to right, transparent, ${theme.accent}, transparent)` }}
      />

      {/* Card Content Layout */}
      <div className="flex flex-col relative z-10 h-full">
        {/* Title row - Full width */}
        <div className="flex items-center justify-between gap-2.5 mb-2 sm:mb-2.5">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className={`flex h-7 w-7 md:h-8 md:w-8 shrink-0 items-center justify-center rounded-lg shadow-2xs border ${theme.bg} ${theme.border} ${theme.iconColor} group-hover:shadow-[0_0_10px_var(--card-glow)] transition-shadow duration-500`}>
              <Icon size={15} strokeWidth={2.2} />
            </div>
            <h3 
              className={`text-[14.5px] sm:text-[16px] md:text-[17px] leading-tight font-bold bg-clip-text text-transparent bg-gradient-to-r ${theme.text} truncate transition-all duration-500 group-hover:scale-[1.01] origin-left`} 
              style={{ 
                fontFamily: 'var(--font-display)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              {item.title}
            </h3>
          </div>
          <span className="text-[11px] font-mono font-bold text-zinc-400 px-2 py-0.5 rounded-full bg-zinc-100/90 border border-zinc-200/70 shrink-0">
            0{index + 1}
          </span>
        </div>

        {/* Content row: Left description & benefit, Right animation visual */}
        <div className="grid grid-cols-[1fr_115px] sm:grid-cols-[1fr_145px] md:grid-cols-[1fr_165px] lg:grid-cols-[1fr_175px] gap-2.5 sm:gap-3.5 md:gap-4 items-stretch flex-grow">
          {/* Left Column: Description & Benefit */}
          <div className="flex-grow min-w-0 flex flex-col justify-between h-full gap-2">
            <p className="text-[11.5px] sm:text-[12px] md:text-[12.5px] lg:text-[13px] leading-relaxed text-slate-600 font-normal" style={{ fontFamily: 'var(--font-body)' }}>
              <RichText text={item.desc || item.description} />
            </p>

            {item.benefit && (
              <div className="flex items-center gap-1.5 pt-1.5 sm:pt-2 border-t border-zinc-200/60 mt-auto">
                <CheckCircle2 className={`w-3.5 h-3.5 ${theme.iconColor} shrink-0`} />
                <span className="text-[10.5px] sm:text-[11px] md:text-[11.5px] text-zinc-700 font-medium leading-tight">
                  {item.benefit}
                </span>
              </div>
            )}
          </div>

          {/* Right Column: Animation Container */}
          <div className="shrink-0 w-[115px] sm:w-[145px] md:w-[165px] lg:w-[175px] h-[95px] sm:h-[105px] md:h-[114px]">
            <div 
              className={`w-full h-full bg-white rounded-xl md:rounded-2xl border-2 ${theme.visualBorder} overflow-hidden relative flex items-center justify-center shrink-0 shadow-[0_3px_10px_rgba(0,0,0,0.04),inset_0_0_12px_rgba(0,0,0,0.02)] group-hover:scale-[1.02] group-hover:shadow-[0_8px_20px_var(--card-glow)] transition-all duration-300`}
            >
              <VisualComponent />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Horizontal Marquee Card (Smooth Floating Carousel) ─── */
function WhyUsMarqueeCard({ item, index }: { item: any; index: number }) {
  const theme = WHY_US_THEMES[index % WHY_US_THEMES.length];
  const Icon = theme.icon;
  const VisualComponent = BENTO_VISUALS[index % BENTO_VISUALS.length];

  return (
    <div
      className={`relative w-[300px] sm:w-[340px] min-h-[175px] sm:min-h-[185px] shrink-0 mr-3.5 rounded-2xl bg-white/95 border-2 border-[#d8d3c7] hover:border-zinc-400 p-3.5 sm:p-4 flex flex-col justify-between overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.03)] select-none`}
      style={{
        '--card-glow': theme.glow,
      } as any}
    >
      {/* Subtle bottom accent line */}
      <div 
        className="absolute bottom-0 left-3 right-3 h-[2px] opacity-70"
        style={{ background: `linear-gradient(to right, transparent, ${theme.accent}, transparent)` }}
      />

      {/* Header: Title, Icon & 0X Badge */}
      <div className="flex items-center justify-between gap-2 mb-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className={`flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-md border shadow-2xs ${theme.bg} ${theme.border} ${theme.iconColor}`}>
            <Icon size={13} className="sm:w-3.5 sm:h-3.5" strokeWidth={2.2} />
          </div>
          <h3 
            className={`text-[13px] sm:text-[14.5px] leading-snug font-bold bg-clip-text text-transparent bg-gradient-to-r ${theme.text} truncate`}
            style={{ 
              fontFamily: 'var(--font-display)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            {item.title}
          </h3>
        </div>
        <span className="text-[10px] font-mono font-bold text-zinc-600 px-1.5 py-0.2 rounded-full bg-zinc-100 border border-zinc-200/80 shrink-0">
          0{index + 1}
        </span>
      </div>

      {/* Body: Left description & benefit, Right precision visual */}
      <div className="grid grid-cols-[1fr_115px] sm:grid-cols-[1fr_135px] gap-2.5 items-stretch flex-1 min-h-0">
        <div className="flex flex-col justify-between h-full min-w-0 pr-1">
          <p className="text-[11px] sm:text-[11.5px] leading-relaxed text-slate-600 font-normal line-clamp-3" style={{ fontFamily: 'var(--font-body)' }}>
            <RichText text={item.desc || item.description} />
          </p>
          {item.benefit && (
            <div className="flex items-center gap-1.5 pt-1.5 border-t border-zinc-200/60 mt-auto">
              <CheckCircle2 className={`w-3 h-3 ${theme.iconColor} shrink-0`} />
              <span className="text-[10px] text-zinc-700 font-medium truncate">
                {item.benefit}
              </span>
            </div>
          )}
        </div>
        <div className="shrink-0 w-[115px] sm:w-[135px] h-[92px] sm:h-[98px] self-center">
          <div className={`w-full h-full bg-white rounded-xl border-2 ${theme.visualBorder} overflow-hidden shadow-xs`}>
            <VisualComponent />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * ─── Compact 2x2 Grid Card for Mobile ───
 * High-density vertical stack that fits neatly in 2 columns side-by-side
 */
function WhyUsGrid2x2Card({ item, index }: { item: any; index: number }) {
  const theme = WHY_US_THEMES[index % WHY_US_THEMES.length];
  const Icon = theme.icon;
  const VisualComponent = BENTO_VISUALS[index % BENTO_VISUALS.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className={`relative overflow-hidden rounded-xl bg-white/95 border-2 border-[#d8d3c7] hover:border-zinc-400 p-2.5 flex flex-col justify-between shadow-[0_2px_10px_rgba(0,0,0,0.03)]`}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between gap-1 mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border shadow-2xs ${theme.bg} ${theme.border} ${theme.iconColor}`}>
            <Icon size={12} strokeWidth={2.2} />
          </div>
          <h3 
            className={`text-[11.5px] sm:text-[13px] leading-tight font-bold bg-clip-text text-transparent bg-gradient-to-r ${theme.text} truncate`}
            style={{ 
              fontFamily: 'var(--font-display)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            {item.title}
          </h3>
        </div>
        <span className="text-[9px] font-mono font-bold text-zinc-600 px-1 py-0.2 rounded bg-zinc-100 border border-zinc-200/80 shrink-0">
          0{index + 1}
        </span>
      </div>

      {/* Middle: Precision Visual Unit (full width of the column) */}
      <div className="w-full h-[78px] sm:h-[86px] rounded-lg overflow-hidden border border-zinc-200/90 shadow-2xs my-1 bg-white">
        <VisualComponent />
      </div>

      {/* Bottom: Description & Benefit */}
      <div className="mt-1.5 flex flex-col gap-1">
        <p className="text-[9.5px] sm:text-[10.5px] leading-tight text-slate-600 font-normal line-clamp-2" style={{ fontFamily: 'var(--font-body)' }}>
          <RichText text={item.desc || item.description} />
        </p>
        {item.benefit && (
          <div className="flex items-center gap-1 pt-1 border-t border-zinc-200/50">
            <CheckCircle2 className={`w-2.5 h-2.5 ${theme.iconColor} shrink-0`} />
            <span className="text-[8.5px] sm:text-[9.5px] text-zinc-700 font-medium truncate">
              {item.benefit}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ─── Main WhyUsSection Component ─── */
export function WhyUsSection() {
  const { content } = useContent();
  const { lang } = useLang();
  
  // Layout toggle: 'marquee' (smooth infinite carousel) vs 'grid' (2x2 Bento grid)
  // Default to 2x2 grid on mobile (< 768px), and marquee flow on desktop
  const [layoutMode, setLayoutMode] = useState<'marquee' | 'grid'>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return 'grid';
    }
    return 'marquee';
  });

  // Track if user explicitly clicked a mode selector to prevent automatic resize override
  const userInteractedRef = useRef(false);

  useEffect(() => {
    const handleResize = () => {
      if (!userInteractedRef.current) {
        setLayoutMode(window.innerWidth < 768 ? 'grid' : 'marquee');
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const t = (content[lang] as any)?.whyUs;
  const items = t?.items || [];
  const benefits = t?.benefits || [];

  if (!items.length) return null;

  // Duplicated array for smooth infinite marquee looping
  const marqueeItems = [...items, ...items, ...items, ...items];

  return (
    <section 
      id="why-us" 
      className="relative bg-[#FDFBF7] text-zinc-900 pt-8 sm:pt-10 pb-12 sm:pb-16 overflow-hidden selection:bg-zinc-900 selection:text-white"
    >
      {/* Ambient Lighting Effect */}
      <div className="absolute top-0 inset-x-0 h-96 pointer-events-none overflow-hidden select-none -z-10">
        <div className="absolute top-[-30%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-indigo-50/50 via-zinc-50/20 to-transparent blur-3xl" />
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
        
        {/* ── Section Header (Compact & Tight Spacing) ── */}
        <div className="max-w-3xl mx-auto text-center mb-5 sm:mb-6">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-zinc-100/90 border border-zinc-200/80 text-[11px] font-semibold tracking-wider text-zinc-800 uppercase shadow-2xs mb-3"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {t?.badge || (lang === 'bn' ? 'কেন আমরা সেরা' : 'Why Choose Us')}
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-zinc-950 leading-[1.12] mb-3"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {t?.heading || t?.title || (lang === 'bn' ? 'দ্য অরবিট সুবিধা' : 'The ORBIT Advantage')}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-sm sm:text-base text-zinc-600 leading-relaxed font-normal max-w-2xl mx-auto mb-4"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            {t?.subtitle || (lang === 'bn' 
              ? 'আমরা শুধু সফটওয়্যার বানাই না — আমরা আপনার দীর্ঘমেয়াদী টেকনোলজি পার্টনার।' 
              : "We don't just build products — we become your technology partner, engineering for maximum ROI, global scale, and future-proof innovation.")}
          </motion.p>

          {/* ── View Mode Selector (2/2 Grid vs Marquee Flow) ── */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="inline-flex items-center p-1 rounded-full bg-zinc-100/90 border border-zinc-200/80 shadow-2xs backdrop-blur-md"
          >
            <button
              type="button"
              onClick={() => {
                userInteractedRef.current = true;
                setLayoutMode('marquee');
              }}
              className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1 rounded-full text-[11px] sm:text-xs font-semibold transition-all duration-300 ${
                layoutMode === 'marquee'
                  ? 'bg-white text-zinc-950 shadow-xs border border-zinc-200/60'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              <RefreshCw className={`w-3 h-3 ${layoutMode === 'marquee' ? 'text-emerald-600 animate-spin-slow' : ''}`} />
              <span>Marquee Flow</span>
            </button>

            <button
              type="button"
              onClick={() => {
                userInteractedRef.current = true;
                setLayoutMode('grid');
              }}
              className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1 rounded-full text-[11px] sm:text-xs font-semibold transition-all duration-300 ${
                layoutMode === 'grid'
                  ? 'bg-white text-zinc-950 shadow-xs border border-zinc-200/60'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              <LayoutGrid className="w-3 h-3 text-emerald-600" />
              <span>2×2 Grid</span>
            </button>
          </motion.div>
        </div>

        {/* ── 4 Primary Advantages: Interactive Layout Presentation ── */}
        <AnimatePresence mode="wait">
          {layoutMode === 'marquee' ? (
            /* ── Option A: Infinite Smooth Marquee Effect ── */
            <motion.div
              key="whyus-marquee-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="w-full overflow-hidden pb-2 pt-1"
            >
              <div 
                className="relative overflow-hidden w-full"
                style={{
                  maskImage: 'linear-gradient(to right, transparent, black 4%, black 96%, transparent)',
                  WebkitMaskImage: 'linear-gradient(to right, transparent, black 4%, black 96%, transparent)'
                }}
              >
                <div 
                  className="marquee-track flex items-stretch hover:[animation-play-state:paused] active:[animation-play-state:paused]"
                  style={{ '--marquee-speed': '28s' } as React.CSSProperties}
                >
                  {marqueeItems.map((item, idx) => (
                    <WhyUsMarqueeCard
                      key={`whyus-marquee-item-${idx}`}
                      item={item}
                      index={idx % items.length}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            /* ── Option B: 2×2 Grid (Responsive Desktop & Mobile 2/2) ── */
            <motion.div
              key="whyus-grid-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              {/* Mobile 2x2 Grid (High-density compact layout) */}
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5 md:hidden w-full">
                {items.map((item: any, idx: number) => (
                  <WhyUsGrid2x2Card
                    key={`whyus-grid2x2-${idx}`}
                    item={item}
                    index={idx}
                  />
                ))}
              </div>

              {/* Desktop 2x2 Bento Grid (Spacious landscape layout) */}
              <div className="hidden md:grid md:grid-cols-2 gap-3.5 md:gap-4 w-full">
                {items.map((item: any, idx: number) => (
                  <WhyUsCard 
                    key={`whyus-bento-${idx}`} 
                    item={item} 
                    index={idx} 
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── 3 Trust & Enterprise Perks (Bottom Compact Single-Line Trio) ── */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5 md:gap-3.5 max-w-6xl mx-auto mt-4 sm:mt-6 w-full">
          {benefits.map((benefit: any, idx: number) => {
            const icons: Record<number, LucideIcon> = {
              0: Globe,
              1: ShieldCheck,
              2: Headset
            };
            const Icon = icons[idx] || Sparkles;

            return (
              <motion.div
                key={`benefit-trio-${idx}`}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-20px" }}
                transition={{ duration: 0.5, delay: 0.2 + idx * 0.08 }}
                className="bg-white/95 rounded-xl md:rounded-2xl p-2 sm:p-2.5 md:p-3.5 border-2 border-[#d8d3c7] hover:border-zinc-400/80 shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all duration-300 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-1.5 sm:gap-2.5 md:gap-3 group/perk min-w-0"
              >
                <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-md sm:rounded-lg bg-zinc-100/80 border border-zinc-200/80 shadow-2xs flex items-center justify-center text-zinc-900 group-hover/perk:scale-105 transition-transform shrink-0">
                  <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-zinc-700" />
                </div>
                
                <div className="space-y-0.5 min-w-0 w-full">
                  <h3 className="text-[10px] sm:text-[11.5px] md:text-[13px] font-bold text-zinc-900 tracking-tight truncate sm:whitespace-normal">
                    {benefit.title}
                  </h3>
                  <p className="text-[8px] sm:text-[10px] md:text-xs text-zinc-500 leading-tight sm:leading-relaxed line-clamp-2 sm:line-clamp-3">
                    {benefit.desc || benefit.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}

export default WhyUsSection;
