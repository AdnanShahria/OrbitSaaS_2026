import React from 'react';
import { motion } from 'framer-motion';
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
  LucideIcon
} from 'lucide-react';
import { RichText } from '@/components/ui/RichText';
import { WaveDivider } from '@/components/ui/WaveDivider';

/* ─── Apple-Grade Interactive Visual Units ─── */

/**
 * 0. Direct ROI Impact Visual — Apple Finance / Health Style Growth Visualizer
 */
const ROIVisual = () => {
  const bars = [
    { height: 35, val: '1.2x' },
    { height: 50, val: '1.8x' },
    { height: 42, val: '2.1x' },
    { height: 75, val: '2.9x' },
    { height: 60, val: '3.1x' },
    { height: 95, val: '3.5x' },
  ];

  return (
    <div className="relative w-full h-36 bg-gradient-to-b from-zinc-50/80 to-zinc-100/50 rounded-2xl p-4 border border-zinc-200/70 flex flex-col justify-between overflow-hidden group/roi">
      {/* Background Accent Grid */}
      <div 
        className="absolute inset-0 opacity-[0.4] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#d4d4d8 1px, transparent 1px)',
          backgroundSize: '16px 16px'
        }}
      />

      {/* Top Header Pill */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Yield Engine</span>
        </div>
        <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/60 text-[10px] font-bold text-emerald-700 tabular-nums">
          +350% Net ROI
        </span>
      </div>

      {/* Dynamic Animated Bars */}
      <div className="relative z-10 flex items-end justify-between gap-2 h-16 pt-2">
        {bars.map((bar, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group/bar">
            <motion.div
              initial={{ height: 0 }}
              whileInView={{ height: `${bar.height}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className={`w-full rounded-t-md transition-all duration-300 relative ${
                i === bars.length - 1 
                  ? 'bg-gradient-to-t from-emerald-600 to-teal-400 shadow-[0_0_12px_rgba(16,185,129,0.3)]' 
                  : 'bg-zinc-200 group-hover/bar:bg-emerald-400/80'
              }`}
            >
              {i === bars.length - 1 && (
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-zinc-900 text-[8px] font-bold text-white whitespace-nowrap shadow-sm">
                  {bar.val}
                </div>
              )}
            </motion.div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * 1. Infinite Scalability Visual — Apple Cloud / Micro-Node Architecture
 */
const ScalabilityVisual = () => {
  return (
    <div className="relative w-full h-36 bg-gradient-to-b from-zinc-50/80 to-zinc-100/50 rounded-2xl p-4 border border-zinc-200/70 flex flex-col justify-between overflow-hidden">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Server className="w-3.5 h-3.5 text-blue-600" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Auto-Scale Node</span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200/60 text-[10px] font-bold text-blue-700">
          <Activity className="w-3 h-3 text-blue-600 animate-pulse" />
          <span>0.8ms Latency</span>
        </div>
      </div>

      {/* Network Mesh Simulation */}
      <div className="relative flex items-center justify-center my-auto py-1">
        <div className="flex items-center justify-between w-full max-w-[220px] relative">
          {/* Connector Line */}
          <div className="absolute inset-x-0 h-[1.5px] bg-gradient-to-r from-blue-400/40 via-indigo-500 to-blue-400/40 top-1/2 -translate-y-1/2 z-0" />
          
          {/* Node 1: Origin */}
          <div className="relative z-10 w-8 h-8 rounded-xl bg-white border border-zinc-200 shadow-sm flex items-center justify-center text-zinc-700">
            <Zap className="w-3.5 h-3.5 text-blue-600" />
          </div>

          {/* Node 2: Load Balancer (Center) */}
          <motion.div 
            animate={{ scale: [1, 1.06, 1] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            className="relative z-10 px-3 py-1.5 rounded-xl bg-zinc-900 text-white text-[10px] font-bold shadow-md flex items-center gap-1.5 border border-zinc-700"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>10M+ Req/s</span>
          </motion.div>

          {/* Node 3: Edge Workers */}
          <div className="relative z-10 w-8 h-8 rounded-xl bg-white border border-zinc-200 shadow-sm flex items-center justify-center text-zinc-700">
            <Globe className="w-3.5 h-3.5 text-indigo-600" />
          </div>
        </div>
      </div>

      {/* Bottom Micro Tickers */}
      <div className="flex items-center justify-between text-[9px] font-medium text-zinc-500 pt-1 border-t border-zinc-200/50">
        <span>Global Edge: 280+ POPs</span>
        <span className="text-blue-600 font-semibold">99.99% SLA</span>
      </div>
    </div>
  );
};

/**
 * 2. AI-First Architecture Visual — Apple Intelligence Iridescent Core
 */
const AIVisual = () => {
  return (
    <div className="relative w-full h-36 bg-gradient-to-b from-zinc-50/80 to-zinc-100/50 rounded-2xl p-4 border border-zinc-200/70 flex flex-col justify-between overflow-hidden">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="w-3.5 h-3.5 text-purple-600" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Autonomous Core</span>
        </div>
        <span className="px-2 py-0.5 rounded-full bg-purple-50 border border-purple-200/60 text-[10px] font-bold text-purple-700">
          Agentic Mesh
        </span>
      </div>

      {/* Iridescent Orb Center */}
      <div className="relative flex items-center justify-center my-auto">
        <div className="relative w-14 h-14 flex items-center justify-center">
          {/* Animated Spectrum Glow Ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full bg-gradient-to-tr from-purple-500 via-pink-500 to-indigo-500 opacity-30 blur-md"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0.5 rounded-full border border-purple-400/40 border-dashed"
          />
          <div className="relative z-10 w-9 h-9 rounded-full bg-white border border-zinc-200/80 shadow-md flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-purple-600" />
          </div>
        </div>
        
        {/* Real-time Agent Tags */}
        <div className="ml-4 flex flex-col gap-1 text-[9px]">
          <div className="flex items-center gap-1.5 font-semibold text-zinc-800">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
            <span>Multi-Agent Reasoning</span>
          </div>
          <div className="flex items-center gap-1.5 text-zinc-500">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-300" />
            <span>Real-Time Model Fallback</span>
          </div>
        </div>
      </div>

      {/* Bottom Status */}
      <div className="flex items-center justify-between text-[9px] font-medium text-zinc-500 pt-1 border-t border-zinc-200/50">
        <span>Zero Vendor Lock-in</span>
        <span className="text-purple-600 font-semibold">Self-Healing</span>
      </div>
    </div>
  );
};

/**
 * 3. Long-Term Growth Visual — Modular Tier Layering
 */
const GrowthVisual = () => {
  return (
    <div className="relative w-full h-36 bg-gradient-to-b from-zinc-50/80 to-zinc-100/50 rounded-2xl p-4 border border-zinc-200/70 flex flex-col justify-between overflow-hidden">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-amber-600" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Modular Evolution</span>
        </div>
        <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200/60 text-[10px] font-bold text-amber-700">
          Zero Tech Debt
        </span>
      </div>

      {/* Stacked Layer Visualizer */}
      <div className="relative flex flex-col gap-1.5 my-auto max-w-[220px] mx-auto w-full">
        <motion.div 
          whileHover={{ x: 3 }}
          className="px-3 py-1.5 rounded-lg bg-white border border-zinc-200/90 shadow-sm flex items-center justify-between text-[10px] font-semibold text-zinc-800"
        >
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded bg-amber-500" />
            Microservices & APIs
          </span>
          <span className="text-[8px] text-zinc-400 font-mono">v3.0</span>
        </motion.div>

        <motion.div 
          whileHover={{ x: 3 }}
          className="px-3 py-1.5 rounded-lg bg-zinc-100/80 border border-zinc-200/60 flex items-center justify-between text-[10px] font-medium text-zinc-600"
        >
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded bg-zinc-400" />
            Serverless Core
          </span>
          <span className="text-[8px] text-zinc-400 font-mono">v2.0</span>
        </motion.div>
      </div>

      {/* Bottom Status */}
      <div className="flex items-center justify-between text-[9px] font-medium text-zinc-500 pt-1 border-t border-zinc-200/50">
        <span>Continuous CI/CD Delivery</span>
        <span className="text-amber-600 font-semibold">Proactive Evolution</span>
      </div>
    </div>
  );
};

/* Visual Components Map */
const BENTO_VISUALS = [ROIVisual, ScalabilityVisual, GrowthVisual, AIVisual];

/* ─── Main WhyUsSection Component ─── */
export function WhyUsSection() {
  const { content } = useContent();
  const { lang } = useLang();
  
  const t = (content[lang] as any)?.whyUs;
  const items = t?.items || [];
  const benefits = t?.benefits || [];

  if (!items.length) return null;

  return (
    <section 
      id="why-us" 
      className="relative bg-white text-zinc-900 py-20 sm:py-28 overflow-hidden selection:bg-zinc-900 selection:text-white"
    >
      {/* Ambient Apple Lighting Effect */}
      <div className="absolute top-0 inset-x-0 h-96 pointer-events-none overflow-hidden select-none -z-10">
        <div className="absolute top-[-30%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-indigo-50/50 via-zinc-50/20 to-transparent blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-5 sm:px-8 relative z-10">
        
        {/* ── Section Header ── */}
        <div className="max-w-3xl mx-auto text-center mb-16 sm:mb-20">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-zinc-100/90 border border-zinc-200/80 text-[11px] font-semibold tracking-wider text-zinc-800 uppercase shadow-sm mb-5"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {t?.badge || (lang === 'bn' ? 'কেন আমরা সেরা' : 'Why Choose Us')}
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-zinc-950 leading-[1.1] mb-5"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            {t?.heading || t?.title || (lang === 'bn' ? 'দ্য অরবিট সুবিধা' : 'The ORBIT Advantage')}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base sm:text-lg text-zinc-600 leading-relaxed font-normal"
          >
            {t?.subtitle || (lang === 'bn' 
              ? 'আমরা শুধু সফটওয়্যার বানাই না — আমরা আপনার দীর্ঘমেয়াদী টেকনোলজি পার্টনার।' 
              : "We don't just build products — we become your technology partner, engineering for maximum ROI, global scale, and future-proof innovation.")}
          </motion.p>
        </div>

        {/* ── 4 Primary Advantages (Apple Bento Grid) ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 max-w-6xl mx-auto">
          {items.map((item: any, idx: number) => {
            const VisualComponent = BENTO_VISUALS[idx % BENTO_VISUALS.length];
            
            return (
              <motion.div
                key={`bento-item-${idx}`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.6, delay: idx * 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="group relative bg-[#FAFAFC] hover:bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200/80 hover:border-zinc-300/90 shadow-[0_4px_24px_rgba(0,0,0,0.02)] hover:shadow-[0_16px_40px_rgba(0,0,0,0.06)] transition-all duration-500 flex flex-col justify-between gap-6"
              >
                {/* Card Header & Content */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight group-hover:text-black transition-colors">
                      {item.title}
                    </h3>
                    <span className="text-xs font-mono font-bold text-zinc-400">
                      0{idx + 1}
                    </span>
                  </div>

                  <p className="text-sm sm:text-[15px] leading-relaxed text-zinc-600">
                    <RichText text={item.desc || item.description} />
                  </p>
                </div>

                {/* Apple Visual Unit */}
                <div className="w-full">
                  <VisualComponent />
                </div>

                {/* Key Metric / Takeaway Bottom Pill */}
                {item.benefit && (
                  <div className="pt-4 border-t border-zinc-200/60 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="text-xs text-zinc-700 font-medium leading-normal">
                      {item.benefit}
                    </span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* ── 3 Trust & Enterprise Perks (Bottom Modern Trio) ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 max-w-6xl mx-auto mt-6 sm:mt-8">
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
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-20px" }}
                transition={{ duration: 0.5, delay: 0.3 + idx * 0.1 }}
                className="bg-[#FAFAFC] hover:bg-white rounded-2xl p-5 border border-zinc-200/70 hover:border-zinc-300 shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.05)] transition-all duration-300 flex items-start gap-4 group/perk"
              >
                <div className="w-10 h-10 rounded-xl bg-white border border-zinc-200/80 shadow-sm flex items-center justify-center text-zinc-900 group-hover/perk:scale-105 transition-transform shrink-0">
                  <Icon className="w-5 h-5 text-zinc-800" />
                </div>
                
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-zinc-900 tracking-tight">
                    {benefit.title}
                  </h4>
                  <p className="text-xs text-zinc-600 leading-relaxed">
                    {benefit.desc || benefit.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>

      {/* Smooth Wave Transition into #FDFBF7 (Projects Section) */}
      <WaveDivider fill="#FDFBF7" />
    </section>
  );
}

export default WhyUsSection;
