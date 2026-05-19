import { motion } from 'framer-motion';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { X } from 'lucide-react';
import { useChatContext } from '../ChatContext';

export function ChatToggleButton() {
  const { open, setOpen } = useChatContext();

  return (
    <motion.button
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.3 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => setOpen(!open)}
      className={`fixed bottom-[6dvh] md:bottom-4 right-4 sm:right-6 z-[200] flex items-center justify-center cursor-pointer transition-all duration-300 ${open
        ? 'w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary text-primary-foreground shadow-xl hidden md:flex'
        : 'w-16 h-16 sm:w-[88px] sm:h-[88px] bg-transparent'
        }`}
      style={{ willChange: 'opacity' }}
    >
      {open ? (
        <X className="w-5 h-5" />
      ) : (
        <div className="chatbot-float-icon relative w-full h-full flex items-center justify-center">
          <DotLottieReact
            src="/chatbot.lottie"
            loop
            autoplay
            className="w-full h-full"
          />
        </div>
      )}
    </motion.button>
  );
}
