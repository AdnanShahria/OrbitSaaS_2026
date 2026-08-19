import { motion, AnimatePresence } from 'framer-motion';
import { useChatContext } from '../ChatContext';
import { ChatHeader } from './ChatHeader';
import { ChatMessageList } from './ChatMessageList';
import { ChatSuggestionChips } from './ChatSuggestionChips';
import { ChatInput } from './ChatInput';

export function ChatPanel() {
  const { open, setOpen, viewportStyle, isKeyboardOpen } = useChatContext();

  return (
    <>
      {/* Backdrop for mobile */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[190] bg-background/80 chatbot-overlay-blur md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{
              type: 'spring',
              damping: 25,
              stiffness: 300
            }}
            style={{
              ...viewportStyle,
              transformOrigin: 'bottom',
            }}
            className={`fixed md:bottom-[84px] left-0 right-0 md:left-auto md:right-6 z-[200] w-full md:w-[440px] max-w-full md:max-w-[440px] overflow-hidden bg-[#0d0d16] border border-indigo-500/40 shadow-[0_0_35px_rgba(99,102,241,0.35),0_0_70px_rgba(168,85,247,0.18),0_25px_60px_rgba(0,0,0,0.9)] ring-1 ring-indigo-400/20 flex flex-col h-[100dvh] md:h-auto top-0 md:top-auto font-poppins ${isKeyboardOpen && typeof window !== 'undefined' && window.innerWidth < 768 ? 'rounded-none border-t-0' : 'bottom-0 rounded-t-3xl md:rounded-2xl'}`}
          >
            {/* Ambient Top Glow Line */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-400 to-transparent opacity-80 z-30 pointer-events-none" />
            <ChatHeader />
            <ChatMessageList />
            <ChatSuggestionChips />
            <ChatInput />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
