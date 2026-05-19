import { motion, AnimatePresence } from 'framer-motion';
import { useChatContext } from '../ChatContext';

export function ChatWelcomePopup() {
  const { open, showWelcomePopup, chatLang, popupMessage, isTypingAnim, typingText, setOpen } = useChatContext();

  return (
    <AnimatePresence>
      {!open && showWelcomePopup && (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.3, transformOrigin: 'bottom right' }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.5 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="fixed bottom-[14dvh] sm:bottom-[104px] right-4 sm:right-6 z-[195] flex flex-col items-end pointer-events-none origin-[calc(100%-24px)_calc(100%+24px)]"
        >
          <div className="relative pointer-events-auto cursor-pointer group" onClick={() => setOpen(true)}>
            {/* Main Speech Bubble */}
            <motion.div
              className="relative flex flex-col items-start gap-0.5 bg-card rounded-xl rounded-br-sm px-3.5 py-1.5 transition-all duration-300 group-hover:-translate-y-1 green-glow-border"
            >
              {/* Text Content */}
              <div className="flex flex-col items-start pr-1">
                <p className="text-[10px] font-bold uppercase tracking-widest mb-0 text-primary">
                  ORBIT AI
                </p>
                <span className="text-[12px] font-medium text-foreground tracking-wide whitespace-nowrap transition-all duration-300">
                  {isTypingAnim ? typingText : (chatLang === 'bn' ? popupMessage.bn : popupMessage.en)}
                  {isTypingAnim && <span className="inline-block w-[2px] h-[14px] bg-primary ml-[1px] animate-pulse" />}
                </span>
              </div>
            </motion.div>

            {/* Speech Bubble Tail */}
            <motion.div
              className="absolute -bottom-[5px] right-5 sm:right-7 w-2.5 h-2.5 bg-card rotate-45 transform green-glow-tail"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
