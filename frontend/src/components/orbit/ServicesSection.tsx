import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useContent } from '@/contexts/ContentContext';
import { useLang } from '@/contexts/LanguageContext';
import {
  MonitorSmartphone,
  BotMessageSquare,
  Cpu,
  Smartphone,
  ShoppingCart,
  Globe,
  ArrowRight,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { RichText } from '@/components/ui/RichText';
import { WaveDivider } from '@/components/ui/WaveDivider';



const SERVICE_ICONS = [MonitorSmartphone, BotMessageSquare, Cpu, Smartphone, ShoppingCart, Globe];

const SERVICE_THEMES = [
  { 
    text: 'from-indigo-500 to-violet-600', 
    bg: 'bg-indigo-50', 
    border: 'border-indigo-200/50', 
    icon: 'text-indigo-600', 
    glow: 'rgba(99, 102, 241, 0.25)', 
    accent: '#6366f1',
    hoverBg: 'group-hover:border-indigo-400/50'
  },
  { 
    text: 'from-emerald-500 to-teal-600', 
    bg: 'bg-emerald-50', 
    border: 'border-emerald-200/50', 
    icon: 'text-emerald-600', 
    glow: 'rgba(16, 185, 129, 0.25)', 
    accent: '#10b981',
    hoverBg: 'group-hover:border-emerald-400/50'
  },
  { 
    text: 'from-amber-400 to-orange-600', 
    bg: 'bg-amber-50', 
    border: 'border-amber-200/50', 
    icon: 'text-amber-600', 
    glow: 'rgba(245, 158, 11, 0.25)', 
    accent: '#f59e0b',
    hoverBg: 'group-hover:border-amber-400/50'
  },
  { 
    text: 'from-rose-500 to-pink-600', 
    bg: 'bg-rose-50', 
    border: 'border-rose-200/50', 
    icon: 'text-rose-600', 
    glow: 'rgba(244, 63, 94, 0.25)', 
    accent: '#f43f5e',
    hoverBg: 'group-hover:border-rose-400/50'
  },
  { 
    text: 'from-blue-500 to-cyan-500', 
    bg: 'bg-blue-50', 
    border: 'border-blue-200/50', 
    icon: 'text-blue-600', 
    glow: 'rgba(59, 130, 246, 0.25)', 
    accent: '#3b82f6',
    hoverBg: 'group-hover:border-blue-400/50'
  },
  { 
    text: 'from-cyan-500 to-teal-500', 
    bg: 'bg-cyan-50', 
    border: 'border-cyan-200/50', 
    icon: 'text-cyan-600', 
    glow: 'rgba(6, 182, 212, 0.25)', 
    accent: '#06b6d4',
    hoverBg: 'group-hover:border-cyan-400/50'
  },
];

/* ──────────── 0: Full Stack Web Design — Layered browser with depth ──────────── */
const WebDesignVisual = () => (
  <div className="relative w-full h-full flex items-center justify-center p-2">
    {/* Atmospheric glow behind */}
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120px] h-[80px] bg-gradient-to-br from-violet-400/15 via-pink-300/10 to-blue-400/15 rounded-full blur-xl" />

    {/* Back layer — code editor hint */}
    <motion.div
      className="absolute top-2 right-3 w-[80px] h-[60px] rounded-lg bg-[#1e1e2e] border border-violet-500/20 shadow-[0_4px_16px_rgba(139,92,246,0.12)] overflow-hidden"
      animate={{ opacity: [0.5, 0.8, 0.5] }}
      transition={{ duration: 4, repeat: Infinity }}
    >
      <div className="p-1.5 space-y-1">
        <div className="flex gap-1">
          <div className="w-2 h-1 bg-pink-400/50 rounded-[1px]" />
          <div className="w-5 h-1 bg-violet-400/40 rounded-[1px]" />
        </div>
        <div className="flex gap-1 pl-2">
          <div className="w-4 h-1 bg-sky-400/40 rounded-[1px]" />
          <div className="w-3 h-1 bg-emerald-400/40 rounded-[1px]" />
        </div>
        <div className="flex gap-1 pl-2">
          <div className="w-3 h-1 bg-amber-400/30 rounded-[1px]" />
          <div className="w-6 h-1 bg-violet-300/30 rounded-[1px]" />
        </div>
        <div className="flex gap-1">
          <div className="w-2 h-1 bg-pink-400/50 rounded-[1px]" />
        </div>
      </div>
    </motion.div>

    {/* Front layer — browser */}
    <motion.div
      className="relative w-[140px] border border-purple-200/70 rounded-xl bg-white overflow-hidden shadow-[0_8px_30px_rgba(139,92,246,0.12)] z-10"
      animate={{ y: [0, -4, 0] }}
      transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
    >
      {/* Chrome */}
      <div className="flex items-center gap-1 px-2 py-1.5 bg-gradient-to-r from-slate-50 via-purple-50/50 to-blue-50 border-b border-purple-100/50">
        <div className="w-1.5 h-1.5 rounded-full bg-rose-400" />
        <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        <div className="ml-1.5 flex-1 h-2.5 bg-white/80 rounded-md border border-purple-100/40 flex items-center px-1">
          <div className="w-1 h-1 rounded-full bg-emerald-400 mr-0.5" />
          <div className="flex-1 h-1 bg-purple-100/60 rounded-full" />
        </div>
      </div>
      {/* Page */}
      <div className="p-2 space-y-1.5">
        {/* Hero with gradient mesh */}
        <motion.div
          className="w-full h-10 rounded-lg bg-gradient-to-br from-violet-500/20 via-pink-400/15 to-sky-400/20 relative overflow-hidden"
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <motion.div
            className="absolute w-8 h-8 rounded-full bg-gradient-to-br from-pink-400/30 to-transparent blur-sm"
            animate={{ x: [0, 30, 0], y: [0, 5, 0] }}
            transition={{ duration: 6, repeat: Infinity }}
          />
          <div className="absolute bottom-1.5 left-2 w-12 h-1.5 bg-white/60 rounded-full" />
          <div className="absolute bottom-1.5 right-2 w-6 h-2 bg-violet-500/40 rounded-sm" />
        </motion.div>
        {/* Cards row */}
        <div className="grid grid-cols-3 gap-1">
          {[
            'from-blue-400/20 to-blue-500/10',
            'from-violet-400/20 to-purple-500/10',
            'from-pink-400/20 to-rose-500/10',
          ].map((g, i) => (
            <motion.div
              key={i}
              className={`h-6 bg-gradient-to-b ${g} rounded-md border border-white/40`}
              initial={{ scaleY: 0, originY: 1 }}
              animate={{ scaleY: 1 }}
              transition={{ delay: 0.3 + i * 0.12, duration: 0.5, ease: 'easeOut' }}
            />
          ))}
        </div>
        {/* CTA row */}
        <div className="flex gap-1 items-center">
          <div className="flex-1 h-1.5 bg-slate-100 rounded-full" />
          <motion.div
            className="w-10 h-3 bg-gradient-to-r from-violet-500 to-purple-500 rounded-md shadow-[0_2px_8px_rgba(139,92,246,0.3)]"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
      </div>
    </motion.div>
  </div>
);

/* ──────────── 1: AI Chatbot — Refined conversation with AI brain ──────────── */
const ChatbotVisual = () => (
  <div className="relative w-full h-full flex items-center justify-center p-2">
    {/* Atmospheric glow */}
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100px] h-[80px] bg-gradient-to-br from-teal-400/10 via-cyan-300/8 to-emerald-400/10 rounded-full blur-xl" />

    <div className="relative w-full max-w-[150px] sm:max-w-[170px]">
      {/* AI brain indicator — top right */}
      <motion.div
        className="absolute -top-1 right-0 z-20"
        animate={{ y: [0, -2, 0] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-teal-400 to-cyan-500 shadow-[0_4px_16px_rgba(20,184,166,0.35)] flex items-center justify-center">
          <BotMessageSquare className="w-3.5 h-3.5 text-white" />
        </div>
        {/* Pulse ring */}
        <motion.div
          className="absolute inset-0 rounded-lg border border-teal-400/40"
          animate={{ scale: [1, 1.6], opacity: [0.6, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </motion.div>

      {/* Chat container */}
      <div className="mt-5 space-y-1.5 bg-white/50 rounded-xl border border-teal-100/50 p-2 backdrop-blur-sm shadow-[0_4px_20px_rgba(20,184,166,0.06)]">
        {/* User msg */}
        <motion.div
          className="ml-auto w-[78%] bg-gradient-to-br from-amber-100 to-orange-50 border border-amber-200/50 rounded-xl rounded-br-none px-2 py-1.5 shadow-sm"
          initial={{ opacity: 0, x: 10, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <div className="w-full h-1 bg-amber-400/30 rounded-full mb-0.5" />
          <div className="w-3/4 h-1 bg-amber-300/20 rounded-full" />
        </motion.div>

        {/* Bot msg */}
        <motion.div
          className="mr-auto w-[82%] bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-200/40 rounded-xl rounded-bl-none px-2 py-1.5 shadow-sm"
          initial={{ opacity: 0, x: -10, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ delay: 0.7, duration: 0.4 }}
        >
          <div className="w-full h-1 bg-teal-400/30 rounded-full mb-0.5" />
          <div className="w-full h-1 bg-teal-300/20 rounded-full mb-0.5" />
          <div className="w-1/2 h-1 bg-cyan-300/20 rounded-full" />
        </motion.div>

        {/* User msg 2 */}
        <motion.div
          className="ml-auto w-[60%] bg-gradient-to-br from-amber-100 to-orange-50 border border-amber-200/50 rounded-xl rounded-br-none px-2 py-1.5 shadow-sm"
          initial={{ opacity: 0, x: 10, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ delay: 1.2, duration: 0.4 }}
        >
          <div className="w-full h-1 bg-amber-400/25 rounded-full" />
        </motion.div>

        {/* Typing indicator */}
        <motion.div
          className="mr-auto flex items-center gap-1 bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200/40 rounded-xl rounded-bl-none px-2.5 py-1.5 w-fit shadow-sm"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.6, duration: 0.3 }}
        >
          {['bg-teal-500', 'bg-emerald-500', 'bg-cyan-500'].map((c, i) => (
            <motion.div
              key={i}
              className={`w-1.5 h-1.5 rounded-full ${c} shadow-sm`}
              animate={{ y: [0, -3, 0], scale: [0.8, 1.2, 0.8] }}
              transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.12 }}
            />
          ))}
        </motion.div>
      </div>
    </div>
  </div>
);

/* ──────────── 2: AI Automation — Orbital pipeline with particles ──────────── */
const AutomationVisual = () => (
  <div className="relative w-full h-full flex items-center justify-center p-2">
    {/* Background glow */}
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140px] h-[60px] bg-gradient-to-r from-emerald-400/10 via-amber-300/8 to-violet-400/10 rounded-full blur-xl" />

    <div className="relative flex items-center gap-1 sm:gap-2">
      {/* Floating particles */}
      {[
        { top: '-4px', left: '20px', color: 'bg-emerald-400', delay: 0 },
        { top: '30px', left: '60px', color: 'bg-amber-400', delay: 0.5 },
        { top: '-2px', left: '100px', color: 'bg-violet-400', delay: 1 },
      ].map((p, i) => (
        <motion.div
          key={i}
          className={`absolute w-1 h-1 rounded-full ${p.color}/50`}
          style={{ top: p.top, left: p.left }}
          animate={{ y: [0, -8, 0], opacity: [0, 1, 0] }}
          transition={{ duration: 2, repeat: Infinity, delay: p.delay }}
        />
      ))}

      {/* Node 1: Trigger — emerald */}
      <motion.div
        className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-[0_4px_16px_rgba(16,185,129,0.3)] relative"
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Cpu className="w-4 h-4 text-white" />
        <motion.div
          className="absolute inset-0 rounded-2xl border border-emerald-300/40"
          animate={{ scale: [1, 1.3], opacity: [0.5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </motion.div>

      {/* Connector 1 */}
      <div className="relative w-3 sm:w-5 h-[3px]">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-300/40 to-amber-300/40 rounded-full" />
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-gradient-to-r from-emerald-400 to-amber-400 shadow-[0_0_6px_rgba(16,185,129,0.5)]"
          animate={{ left: ['0%', '100%', '0%'] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Node 2: Process — amber */}
      <motion.div
        className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-[0_4px_16px_rgba(245,158,11,0.3)] relative"
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
      >
        <motion.div
          className="w-4 h-4 border-2 border-white/70 border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute inset-0 rounded-2xl border border-amber-300/40"
          animate={{ scale: [1, 1.3], opacity: [0.5, 0] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
        />
      </motion.div>

      {/* Connector 2 */}
      <div className="relative w-3 sm:w-5 h-[3px]">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-300/40 to-violet-300/40 rounded-full" />
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-gradient-to-r from-amber-400 to-violet-400 shadow-[0_0_6px_rgba(245,158,11,0.5)]"
          animate={{ left: ['0%', '100%', '0%'] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
        />
      </div>

      {/* Node 3: Output — violet */}
      <motion.div
        className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-[0_4px_16px_rgba(139,92,246,0.3)] relative"
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      >
        <motion.div
          className="w-3.5 h-3.5 bg-white/70 rounded-md"
          animate={{ rotate: [0, 90, 0], scale: [0.8, 1, 0.8] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        <motion.div
          className="absolute inset-0 rounded-2xl border border-violet-300/40"
          animate={{ scale: [1, 1.3], opacity: [0.5, 0] }}
          transition={{ duration: 2, repeat: Infinity, delay: 1 }}
        />
      </motion.div>
    </div>
  </div>
);

/* ──────────── 3: Mobile App Dev — Floating phone with app ecosystem ──────────── */
const MobileAppVisual = () => (
  <div className="relative w-full h-full flex items-center justify-center p-2">
    {/* Glow behind phone */}
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80px] h-[100px] bg-gradient-to-b from-violet-400/12 to-pink-400/8 rounded-full blur-xl" />

    {/* Floating mini app icons — orbiting */}
    <motion.div
      className="absolute top-3 left-3 w-5 h-5 rounded-lg bg-gradient-to-br from-rose-400 to-pink-500 shadow-[0_2px_8px_rgba(244,63,94,0.3)] flex items-center justify-center"
      animate={{ y: [0, -4, 0], x: [0, 2, 0] }}
      transition={{ duration: 3, repeat: Infinity }}
    >
      <div className="w-2 h-2 bg-white/70 rounded-sm" />
    </motion.div>
    <motion.div
      className="absolute top-5 right-4 w-5 h-5 rounded-lg bg-gradient-to-br from-sky-400 to-blue-500 shadow-[0_2px_8px_rgba(56,189,248,0.3)] flex items-center justify-center"
      animate={{ y: [0, 4, 0], x: [0, -2, 0] }}
      transition={{ duration: 3.5, repeat: Infinity, delay: 0.5 }}
    >
      <div className="w-2 h-0.5 bg-white/70 rounded-full mb-0.5" />
      <div className="w-2 h-0.5 bg-white/50 rounded-full" />
    </motion.div>
    <motion.div
      className="absolute bottom-4 left-5 w-5 h-5 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 shadow-[0_2px_8px_rgba(16,185,129,0.3)] flex items-center justify-center"
      animate={{ y: [0, -3, 0] }}
      transition={{ duration: 4, repeat: Infinity, delay: 1 }}
    >
      <div className="w-2 h-2 rounded-full bg-white/60" />
    </motion.div>

    {/* Phone */}
    <motion.div
      className="relative w-[56px] h-[96px] border-2 border-violet-300/70 rounded-2xl bg-white overflow-hidden shadow-[0_8px_30px_rgba(139,92,246,0.15)] z-10"
      animate={{ y: [0, -5, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
    >
      {/* Notch */}
      <div className="absolute top-0.5 left-1/2 -translate-x-1/2 w-6 h-1.5 bg-gradient-to-r from-violet-200 to-purple-200 rounded-full z-10" />
      {/* Sliding screens */}
      <motion.div
        className="absolute inset-0 flex"
        animate={{ x: [0, -56, -112, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', times: [0, 0.3, 0.6, 1] }}
      >
        {/* Screen 1 — Social app */}
        <div className="w-[56px] h-full shrink-0 p-1.5 pt-3.5 flex flex-col gap-1 bg-gradient-to-b from-violet-50 to-white">
          <div className="w-full h-2.5 bg-gradient-to-r from-violet-400 to-purple-500 rounded-md" />
          <div className="flex-1 bg-gradient-to-b from-pink-100/50 to-violet-100/30 rounded-md relative overflow-hidden">
            <motion.div
              className="absolute w-full h-3 bg-white/60 rounded-sm top-1 left-0 px-0.5"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
          <div className="grid grid-cols-4 gap-0.5">
            {['bg-violet-300', 'bg-pink-300', 'bg-blue-300', 'bg-emerald-300'].map((c, i) => (
              <div key={i} className={`h-1.5 ${c} rounded-[2px]`} />
            ))}
          </div>
        </div>
        {/* Screen 2 — Dashboard */}
        <div className="w-[56px] h-full shrink-0 p-1.5 pt-3.5 flex flex-col gap-1 bg-gradient-to-b from-teal-50 to-white">
          <div className="w-2/3 h-1.5 bg-teal-500 rounded-full" />
          <div className="flex gap-0.5 flex-1">
            <div className="flex-1 bg-gradient-to-b from-teal-200/50 to-cyan-100/30 rounded-md" />
            <div className="flex-1 bg-gradient-to-b from-emerald-200/50 to-teal-100/30 rounded-md" />
          </div>
          <div className="h-3 bg-teal-100/50 rounded-md" />
        </div>
        {/* Screen 3 — Media player */}
        <div className="w-[56px] h-full shrink-0 p-1.5 pt-3.5 flex flex-col gap-1 bg-gradient-to-b from-orange-50 to-white">
          <div className="w-full h-12 bg-gradient-to-br from-orange-200 to-amber-100 rounded-lg" />
          <div className="w-full h-1 bg-orange-300/40 rounded-full mt-0.5" />
          <div className="flex justify-between px-1">
            <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
            <div className="w-4 h-1.5 bg-orange-300/30 rounded-full" />
            <div className="w-1.5 h-1.5 rounded-full bg-orange-300" />
          </div>
        </div>
      </motion.div>
      {/* Home bar */}
      <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-6 h-[2px] bg-violet-400/40 rounded-full z-10" />
    </motion.div>
  </div>
);


/* ──────────── 4: eCommerce & Enterprise — Mini storefront with cart ──────────── */
const EcommerceVisual = () => {
  return (
    <div className="relative w-full h-full flex items-center justify-center p-3">
      <div className="relative w-[160px] h-[120px]">
        {/* Product card */}
        <motion.div
          className="absolute top-0 left-0 w-[72px] bg-white rounded-lg border-2 border-rose-200/60 overflow-hidden shadow-[0_3px_12px_rgba(244,63,94,0.1)]"
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          {/* Product image placeholder */}
          <div className="h-10 bg-gradient-to-br from-rose-100 via-pink-50 to-orange-50" />
          <div className="p-1.5 space-y-1">
            <div className="w-full h-1.5 bg-slate-200 rounded-full" />
            <div className="w-2/3 h-1.5 bg-slate-100 rounded-full" />
            {/* Price tag */}
            <motion.div
              className="w-fit px-1.5 py-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full text-[5px] font-bold text-white"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              $49.99
            </motion.div>
          </div>
        </motion.div>

        {/* Cart icon with badge */}
        <motion.div
          className="absolute top-1 right-1"
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center shadow-[0_3px_12px_rgba(251,146,60,0.3)]">
            <ShoppingCart className="w-4 h-4 text-white" />
          </div>
          {/* Badge */}
          <motion.div
            className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-[6px] font-bold text-white flex items-center justify-center shadow-sm"
            animate={{ scale: [0.9, 1.1, 0.9] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            3
          </motion.div>
        </motion.div>

        {/* Payment card sliding in */}
        <motion.div
          className="absolute bottom-0 right-0 w-[80px] h-[48px] rounded-lg bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 shadow-[0_4px_16px_rgba(99,102,241,0.25)] p-2 flex flex-col justify-between"
          animate={{ x: [20, 0, 0, 20], opacity: [0, 1, 1, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', times: [0, 0.2, 0.7, 1] }}
        >
          <div className="flex justify-between items-center">
            <div className="w-4 h-3 bg-amber-300/80 rounded-sm" />
            <div className="w-5 h-1 bg-white/30 rounded-full" />
          </div>
          <div className="space-y-0.5">
            <div className="w-full h-1 bg-white/20 rounded-full" />
            <div className="flex justify-between">
              <div className="w-8 h-1 bg-white/15 rounded-full" />
              <div className="w-4 h-1 bg-white/15 rounded-full" />
            </div>
          </div>
        </motion.div>

        {/* Success checkmark pulse */}
        <motion.div
          className="absolute bottom-8 left-[38%] w-5 h-5 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-[0_0_12px_rgba(16,185,129,0.4)]"
          animate={{ scale: [0, 1, 1, 0], opacity: [0, 1, 1, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', times: [0.15, 0.35, 0.65, 0.85], delay: 1 }}
        >
          <span className="text-white text-[8px] font-bold">✓</span>
        </motion.div>
      </div>
    </div>
  );
};

/* ──────────── 5: PWA & Advanced Web Apps — Cross-platform orbiting devices ──────────── */
const PWAVisual = () => (
  <div className="relative w-full h-full flex items-center justify-center p-3">
    <div className="relative w-[150px] h-[130px]">
      {/* Orbiting ring 1 */}
      <motion.div
        className="absolute inset-2 rounded-full border border-dashed border-indigo-300/40"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      />
      {/* Orbiting ring 2 */}
      <motion.div
        className="absolute inset-6 rounded-full border border-dashed border-orange-300/30"
        animate={{ rotate: -360 }}
        transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
      />

      {/* Central app icon */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
        <motion.div
          className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-[0_4px_20px_rgba(99,102,241,0.35)] flex items-center justify-center"
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Globe className="w-5 h-5 text-white" />
        </motion.div>
      </div>

      {/* Device 1: Phone — top right */}
      <motion.div
        className="absolute top-0 right-2"
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="w-[18px] h-[30px] rounded-[4px] border-2 border-orange-400 bg-gradient-to-b from-orange-50 to-amber-50 shadow-[0_2px_8px_rgba(251,146,60,0.2)]">
          <div className="mx-auto mt-1 w-2 h-3 bg-orange-300/40 rounded-[1px]" />
          <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-0.5 bg-orange-300 rounded-full" />
        </div>
      </motion.div>

      {/* Device 2: Monitor — bottom left */}
      <motion.div
        className="absolute bottom-1 left-0"
        animate={{ y: [0, 4, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
      >
        <div className="w-[34px] h-[22px] rounded-[3px] border-2 border-blue-400 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-[0_2px_8px_rgba(59,130,246,0.2)]">
          <div className="m-1 h-2.5 bg-blue-200/50 rounded-[1px]" />
        </div>
        <div className="mx-auto w-3 h-1 bg-blue-300/50 rounded-b-sm" />
      </motion.div>

      {/* Device 3: Tablet — bottom right */}
      <motion.div
        className="absolute bottom-0 right-0"
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      >
        <div className="w-[26px] h-[20px] rounded-[3px] border-2 border-violet-400 bg-gradient-to-br from-violet-50 to-purple-50 shadow-[0_2px_8px_rgba(139,92,246,0.2)]">
          <div className="m-0.5 h-3 bg-violet-200/40 rounded-[1px]" />
        </div>
      </motion.div>

      {/* Sync pulse — animated ring from center */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full border border-indigo-400/30"
        animate={{ scale: [1, 2.5], opacity: [0.6, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeOut' }}
      />

      {/* Offline badge — top left */}
      <motion.div
        className="absolute top-1 left-1 px-1.5 py-0.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-[5px] font-bold text-white shadow-[0_0_8px_rgba(16,185,129,0.3)] whitespace-nowrap"
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        OFFLINE ✓
      </motion.div>
    </div>
  </div>
);

/* ──────────── Service Visual Dispatcher ──────────── */
const SERVICE_VISUALS = [WebDesignVisual, ChatbotVisual, AutomationVisual, MobileAppVisual, EcommerceVisual, PWAVisual];

const ServiceVisual = ({ index }: { index: number }) => {
  const Visual = SERVICE_VISUALS[index % SERVICE_VISUALS.length];
  const visualRef = useRef<HTMLDivElement>(null);

  const handleVisualEnter = () => {
    const el = visualRef.current;
    if (!el) return;
    el.style.transform = 'scale(1.06) translateY(-2px)';
    el.style.boxShadow = '0 12px 36px -8px rgba(16,185,129,0.2), 0 0 0 2px var(--nav-accent)';
    el.style.borderColor = 'transparent';
  };

  const handleVisualLeave = () => {
    const el = visualRef.current;
    if (!el) return;
    el.style.transform = 'scale(1) translateY(0px)';
    el.style.boxShadow = 'none';
    el.style.borderColor = '';
  };

  return (
    <div
      ref={visualRef}
      onMouseEnter={handleVisualEnter}
      onMouseLeave={handleVisualLeave}
      className="w-full h-full min-h-[85px] sm:min-h-[120px] md:min-h-0 bg-white rounded-xl sm:rounded-2xl border-2 border-blue-400/80 overflow-hidden relative flex items-center justify-center shrink-0 cursor-pointer shadow-[0_4px_12px_rgba(59,130,246,0.15),inset_0_0_20px_rgba(59,130,246,0.05)]"
      style={{ transition: 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease, border-color 0.3s ease' }}
    >
      <div className="scale-[0.58] sm:scale-[0.75] md:scale-95 lg:scale-110 transition-transform duration-500">
        <Visual />
      </div>
      {/* Inner shine on hover */}
      <div className="visual-inner-shine absolute inset-0 rounded-2xl bg-gradient-to-br from-white/0 to-white/0 pointer-events-none transition-all duration-300" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#EBE8E0]/10 to-transparent pointer-events-none opacity-20 mix-blend-multiply" />
    </div>
  );
};

/* ─────────────────────── Agent Skills Canvas Background ─────────────────────── */
const CardCanvasBackground = ({ index }: { index: number }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Skip entirely on mobile — hover-only effect, saves 6 RAF loops + 180 particles
  const [isMobile] = useState(() => 
    typeof window !== 'undefined' && (window.matchMedia('(hover: none) and (pointer: coarse)').matches || window.innerWidth < 768)
  );

  useEffect(() => {
    if (isMobile) return; // No canvas work on mobile

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;
    
    let w = 0;
    let h = 0;
    let raf: number;
    let mouseX = -1000;
    let mouseY = -1000;
    let isVisible = true;

    const resize = () => {
      w = canvas.offsetWidth;
      h = canvas.offsetHeight;
      canvas.width = w * window.devicePixelRatio;
      canvas.height = h * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();

    // Pause when off-screen
    const observer = new IntersectionObserver(
      ([entry]) => { isVisible = entry.isIntersecting; },
      { threshold: 0.1 }
    );
    observer.observe(canvas);

    // Determine color based on index to differentiate cards slightly
    const colors = [
      '139, 92, 246', // Violet
      '20, 184, 166', // Teal
      '16, 185, 129', // Emerald
      '244, 63, 94',  // Rose
      '59, 130, 246', // Blue
      '245, 158, 11'  // Amber
    ];
    const themeColor = colors[index % colors.length];

    const particles = Array.from({ length: 30 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      s: Math.random() * 1.5 + 0.5,
      c: themeColor
    }));

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    };
    
    const handleMouseLeave = () => {
      mouseX = -1000;
      mouseY = -1000;
    };

    const parent = canvas.parentElement;
    if (parent) {
      parent.addEventListener('mousemove', handleMouseMove);
      parent.addEventListener('mouseleave', handleMouseLeave);
    }

    const render = () => {
      if (!isVisible) {
        raf = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, w, h);
      
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;

        let drawX = p.x;
        let drawY = p.y;
        
        // Agent skill interaction: mild repel/attract to mouse
        if (mouseX !== -1000) {
          const dx = mouseX - p.x;
          const dy = mouseY - p.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if (dist < 120) {
            const angle = Math.atan2(dy, dx);
            const force = (120 - dist) / 120;
            drawX -= Math.cos(angle) * force * 15;
            drawY -= Math.sin(angle) * force * 15;
          }
        }

        ctx.beginPath();
        ctx.arc(drawX, drawY, p.s, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.c}, 0.6)`;
        ctx.fill();

        // Connect nearby particles to form neural/agent web
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          let d2X = p2.x;
          let d2Y = p2.y;
          
          if (mouseX !== -1000) {
            const dx2 = mouseX - p2.x;
            const dy2 = mouseY - p2.y;
            const dist2 = Math.sqrt(dx2*dx2 + dy2*dy2);
            if (dist2 < 120) {
              const angle2 = Math.atan2(dy2, dx2);
              const force2 = (120 - dist2) / 120;
              d2X -= Math.cos(angle2) * force2 * 15;
              d2Y -= Math.sin(angle2) * force2 * 15;
            }
          }

          const cdx = drawX - d2X;
          const cdy = drawY - d2Y;
          const cdist = Math.sqrt(cdx*cdx + cdy*cdy);
          if (cdist < 80) {
            ctx.beginPath();
            ctx.moveTo(drawX, drawY);
            ctx.lineTo(d2X, d2Y);
            ctx.strokeStyle = `rgba(${p.c}, ${0.2 * (1 - cdist/80)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(render);
    };
    render();

    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      observer.disconnect();
      if (parent) {
        parent.removeEventListener('mousemove', handleMouseMove);
        parent.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, [index, isMobile]);

  if (isMobile) return null; // Don't even render the canvas element on mobile

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 w-full h-full pointer-events-none rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-0" 
    />
  );
};

/* ─────────────────────── Bento Card with 3D Hover ─────────────────────── */
function BentoCard({
  item,
  index,
}: {
  item: { title?: string; desc?: string; id?: string | number; [key: string]: unknown };
  index: number;
}) {
  const Icon = SERVICE_ICONS[index % SERVICE_ICONS.length];
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -6;
    const rotateY = ((x - centerX) / centerX) * 6;
    card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;

    // Move the shine effect
    const shine = card.querySelector('.card-shine') as HTMLElement;
    if (shine) {
      shine.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(255,255,255,0.15) 0%, transparent 60%)`;
    }
  };

  const handleMouseLeave = () => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) translateY(0px)';
    const shine = card.querySelector('.card-shine') as HTMLElement;
    if (shine) {
      shine.style.background = 'transparent';
    }
  };

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`group relative overflow-hidden rounded-[2rem] bg-white/95 backdrop-blur-2xl border-2 border-[#d8d3c7] ${SERVICE_THEMES[index % SERVICE_THEMES.length].hoverBg} p-5 md:p-6 md:min-h-[240px] flex flex-col justify-between cursor-default shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)]`}
      style={{ 
        transition: 'transform 0.15s ease-out, border-color 0.4s, box-shadow 0.4s', 
        willChange: 'transform',
        '--card-glow': SERVICE_THEMES[index % SERVICE_THEMES.length].glow
      } as any}
    >
      {/* HTML Canvas Agent Skills Background */}
      <CardCanvasBackground index={index} />

      {/* Shine overlay — follows cursor */}
      <div className="card-shine absolute inset-0 pointer-events-none z-20 rounded-[2rem]" style={{ transition: 'background 0.15s ease-out' }} />

      {/* Decorative Glow */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
        style={{ background: `linear-gradient(to bottom right, var(--card-glow), transparent)` }}
      />

      {/* Bottom border accent glow */}
      <div 
        className="absolute bottom-0 left-[10%] right-[10%] h-[2px] opacity-0 group-hover:opacity-60 transition-opacity duration-500"
        style={{ background: `linear-gradient(to right, transparent, ${SERVICE_THEMES[index % SERVICE_THEMES.length].accent}, transparent)` }}
      />

      {/* Refined Layout: Title top, Content row below */}
      <div className="flex flex-col relative z-10 h-full">
        {/* Title row - Full width */}
        <div className="flex items-center gap-2 sm:gap-3 mb-3 md:mb-4">
          <div className={`flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg sm:rounded-xl shadow-sm border ${SERVICE_THEMES[index % SERVICE_THEMES.length].bg} ${SERVICE_THEMES[index % SERVICE_THEMES.length].border} ${SERVICE_THEMES[index % SERVICE_THEMES.length].icon} group-hover:shadow-[0_0_12px_var(--card-glow)] transition-shadow duration-500`}>
            <Icon size={16} className="sm:w-5 sm:h-5" strokeWidth={2} />
          </div>
          <h3 
            className={`text-base sm:text-lg md:text-xl leading-tight font-bold bg-clip-text text-transparent bg-gradient-to-r ${SERVICE_THEMES[index % SERVICE_THEMES.length].text} transition-all duration-500 group-hover:scale-[1.02] origin-left`} 
            style={{ 
              fontFamily: 'var(--font-display)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            {item.title}
          </h3>
        </div>

        {/* Content row: Responsive Layout */}
        <div className="flex flex-row md:grid md:grid-cols-[1fr_200px] lg:grid-cols-[1fr_240px] gap-4 sm:gap-6 items-start md:items-stretch flex-grow">
          <div className="flex-grow min-w-0">
            <p className="text-[11px] sm:text-[13px] md:text-[14px] leading-relaxed text-slate-500" style={{ fontFamily: 'var(--font-body)' }}>
              <RichText text={item.desc} />
            </p>
          </div>

          <div className="shrink-0 w-[95px] h-[95px] sm:w-[130px] sm:h-[130px] md:w-full md:h-full">
            <ServiceVisual index={index} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────────────────── Main Section ─────────────────────── */
export function ServicesSection({ embedded }: { embedded?: boolean }) {
  const { content } = useContent();
  const { lang } = useLang();
  const navigate = useNavigate();
  type ContentServices = { items?: Array<{ title?: string; desc?: string; id?: string | number; [key: string]: unknown }>; heading?: string; sub?: string };
  const t = (content[lang] as { services?: ContentServices })?.services;
  const allItems = t?.items || [];

  const Wrapper = embedded ? 'div' : 'section';

  return (
    <Wrapper id="services" className="relative w-full min-h-[100dvh] overflow-visible bg-[#FAFAFA] pb-4 pt-10 md:pt-14 md:pb-6 z-10 flex flex-col items-center !border-none">
      
      {/* Background Decorators - Luxury Beige organic glows */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -right-[5%] w-[800px] h-[800px] rounded-full bg-emerald-600/5 blur-[120px]" />
        <div className="absolute top-[40%] -left-[10%] w-[600px] h-[600px] rounded-full bg-amber-600/5 blur-[120px]" />
        <div className="absolute -bottom-[20%] right-[15%] w-[700px] h-[700px] rounded-full bg-orange-600/5 blur-[150px]" />
      </div>

      <div className="section-container relative z-10 max-w-[1280px] mx-auto px-6 lg:px-8 w-full">
        
        {/* Section Header: 2-Column layout to utilize horizontal space and save vertical height */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-12 mb-10 md:mb-12">
          <div className="max-w-2xl text-left">
            <motion.h2 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-[3rem] font-extrabold text-[#1E293B] tracking-tight leading-[1.05]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {t?.heading || 'End-to-end digital solutions that scale.'}
            </motion.h2>
          </div>

          <motion.div
             initial={{ opacity: 0, x: 20 }}
             whileInView={{ opacity: 1, x: 0 }}
             viewport={{ once: true }}
             transition={{ delay: 0.2 }}
             className="max-w-md text-left"
          >
            <p className="text-base md:text-[1.05rem] text-slate-500 leading-relaxed md:pb-2" style={{ fontFamily: 'var(--font-body)' }}>
              {t?.sub || 'We combine strategic design with cutting-edge engineering to build products that dominate.'}
            </p>
          </motion.div>
        </div>

        {/* ────── Dynamic Bento Grid Layout ────── */}
        <div className="flex flex-col gap-4 pb-6">
          {Array.from({ length: Math.ceil((allItems.length || 6) / 2) }).map((_, rowIndex) => {
             // Fallback items if array is empty
             const rowItems = allItems.length > 0 ? allItems.slice(rowIndex * 2, rowIndex * 2 + 2) : [
                { title: `Service ${rowIndex * 2 + 1}`, desc: 'Placeholder description.' },
                { title: `Service ${rowIndex * 2 + 2}`, desc: 'Placeholder description.' }
             ];
             if (rowItems.length === 0) return null;
             
             // Alternating ratio logic: 53/47 then 47/53 then 53/47
             const gridClass = rowIndex % 2 === 0 
                ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-[53fr_47fr]" 
                : "grid-cols-1 md:grid-cols-2 lg:grid-cols-[47fr_53fr]";

              return (
               <div key={rowIndex} className={`grid ${gridClass} gap-4`}>
                 {rowItems.map((item: { title?: string; desc?: string; id?: string | number; [key: string]: unknown }, colIndex: number) => (
                   <BentoCard key={(item.id as string | number) || (item.title as string) || colIndex} item={item} index={rowIndex * 2 + colIndex} />
                 ))}
               </div>
             );
          })}
        </div>
        
        {/* ────── Premium Unified Button Row ────── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="w-full flex flex-col md:flex-row items-center justify-between gap-6 mt-8 md:mt-10 pt-6"
        >
          {/* Left: Aesthetic Get Early Access CTA */}
          <button
            onClick={() => {
              const el = document.getElementById('contact');
              if (el) {
                el.scrollIntoView({ behavior: 'smooth' });
              } else {
                navigate('/contact');
              }
            }}
            className="order-1 md:order-1 group relative px-12 py-5 bg-[#0e0e10] text-white rounded-[2rem] font-bold text-base md:text-lg border border-white/10 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.4)] transition-all duration-500 hover:scale-[1.02] active:scale-95 overflow-hidden cursor-pointer"
          >
            {/* Agent Skills Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-sky-500/10 to-violet-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            
            {/* Shimmer effect */}
            <motion.div 
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent skew-x-12" 
            />
            
            <span className="relative z-10 flex items-center gap-4">
              <Sparkles className="w-5 h-5 text-emerald-400 group-hover:animate-spin-slow" />
              {lang === 'en' ? 'Get Early Access' : 'এক্সক্লুসিভ অ্যাক্সেস নিন'}
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-2" />
            </span>
          </button>


        </motion.div>
        
      </div>
      <WaveDivider fill="var(--bg-dark)" />
    </Wrapper>
  );
}

export default ServicesSection;
