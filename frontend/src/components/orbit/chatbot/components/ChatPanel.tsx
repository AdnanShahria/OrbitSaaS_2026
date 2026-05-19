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
            className={`fixed md:bottom-[84px] left-0 right-0 md:left-auto md:right-6 z-[200] w-full md:w-[400px] max-w-full md:max-w-[400px] overflow-hidden bg-card border border-border shadow-2xl flex flex-col h-[100dvh] md:h-auto top-0 md:top-auto ${isKeyboardOpen && typeof window !== 'undefined' && window.innerWidth < 768 ? 'rounded-none border-t-0' : 'bottom-0 rounded-t-3xl md:rounded-2xl'}`}
          >
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
