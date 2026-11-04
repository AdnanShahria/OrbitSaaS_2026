import { motion } from 'framer-motion';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { X, Sparkles } from 'lucide-react';
import { useChatContext } from '../ChatContext';
import { useDevicePerformance } from '@/hooks/use-performance';

export function ChatToggleButton() {
  const { open, setOpen } = useChatContext();
  const { isLowEnd } = useDevicePerformance();

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 320, damping: 22, delay: 0.3 }}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.92 }}
      onClick={() => setOpen(!open)}
      aria-label={open ? "Close live chat" : "Open live AI assistant"}
      className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-[200] flex items-center justify-center cursor-pointer select-none group"
      style={{ willChange: 'transform, opacity' }}
    >
      {/* Outer ambient breathing halo ring */}
      <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-amber-500/25 via-purple-500/30 to-amber-400/25 blur-md opacity-75 group-hover:opacity-100 transition-opacity duration-500 animate-pulse pointer-events-none" />

      {/* Main Button Body - Champagne Obsidian Luxury Glass */}
      <div
        className={`relative flex items-center justify-center transition-all duration-300 shadow-[0_10px_35px_rgba(0,0,0,0.65),0_0_20px_rgba(245,158,11,0.25)] ${
          open
            ? 'w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-zinc-950 via-[#181428] to-[#251838] border border-amber-400/40 text-amber-200'
            : 'w-[56px] h-[56px] sm:w-[64px] sm:h-[64px] rounded-full bg-gradient-to-br from-[#0c0918] via-[#1a1232] to-[#2e1948] border-1.5 border-amber-400/50 backdrop-blur-xl'
        }`}
      >
        {/* Subtle Inner metallic highlight rim */}
        <div className="absolute inset-[1px] rounded-full border border-white/15 pointer-events-none" />

        {/* Shimmer sweep effect */}
        <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
          <motion.div
            animate={{ x: ['-200%', '200%'] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', repeatDelay: 2 }}
            className="w-1/2 h-full bg-gradient-to-r from-transparent via-amber-200/20 to-transparent -skew-x-20"
          />
        </div>

        {open ? (
          <X className="w-5 h-5 text-amber-300 transition-transform duration-300 group-hover:rotate-90" />
        ) : (
          <div className="relative flex items-center justify-center w-full h-full">
            {/* Pulsing Status Orb indicator */}
            <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-gradient-to-r from-amber-400 to-yellow-300 shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
            </span>

            {isLowEnd ? (
              <div className="flex flex-col items-center justify-center text-amber-300">
                <Sparkles className="w-6 h-6 drop-shadow-[0_2px_8px_rgba(245,158,11,0.5)]" />
              </div>
            ) : (
              <div className="relative w-full h-full flex items-center justify-center p-1.5">
                <DotLottieReact
                  src="/chatbot.lottie"
                  loop
                  autoplay
                  className="w-full h-full scale-110 drop-shadow-[0_2px_12px_rgba(245,158,11,0.35)]"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </motion.button>
  );
}
