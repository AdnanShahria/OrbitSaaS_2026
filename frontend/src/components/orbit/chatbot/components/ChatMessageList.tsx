import { Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChatContext } from '../ChatContext';
import { ChatMessageBubble } from './ChatMessageBubble';
import { ChatEmailPrompt } from './ChatEmailPrompt';

export function ChatMessageList() {
  const { messages, chatLang, setChatLang, isLoading, messagesEndRef } = useChatContext();

  return (
    <div className="chatbot-messages-area font-poppins flex-1 min-h-0 overflow-y-auto p-4 space-y-3 bg-transparent md:max-h-[500px] relative">
      <div className="space-y-3">
        {/* Initial Selection Flow */}
        {messages.length === 0 && !isLoading && (
          <div className="space-y-4 py-2">
            <div className="flex gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 border border-primary/30">
                <Zap className="w-4 h-4 text-primary" />
              </div>
              <div className="bg-white/[0.06] border border-white/[0.1] rounded-xl rounded-tl-none px-3.5 py-2.5 text-xs text-foreground max-w-[85%] leading-relaxed backdrop-blur-md shadow-sm">
                <p className="font-bold mb-1 uppercase tracking-widest text-[10px] text-primary">
                  {chatLang === 'bn' ? 'স্বাগতম!' : 'Welcome!'}
                </p>
                {chatLang === 'bn'
                  ? 'শুরু করার জন্য আপনার পছন্দের ভাষাটি নির্বাচন করুন:'
                  : 'Please select your preferred language to begin:'}
              </div>
            </div>
            <div className="flex gap-2 pl-9">
              <button
                onClick={() => setChatLang('en')}
                className={`px-4 py-1.5 rounded-full text-[10px] font-bold border transition-all shadow-sm ${chatLang === 'en' ? 'bg-primary border-primary text-primary-foreground shadow-primary/20' : 'bg-white/[0.06] border-white/[0.1] text-white/80 hover:bg-white/[0.12] hover:border-primary/40'}`}
              >
                English
              </button>
              <button
                onClick={() => setChatLang('bn')}
                className={`px-4 py-1.5 rounded-full text-[10px] font-bold border transition-all shadow-sm ${chatLang === 'bn' ? 'bg-primary border-primary text-primary-foreground shadow-primary/20' : 'bg-white/[0.06] border-white/[0.1] text-white/80 hover:bg-white/[0.12] hover:border-primary/40'}`}
              >
                বাংলা
              </button>
            </div>
          </div>
        )}

        {messages.filter(m => m.role !== 'system').map((msg, i) => (
          <ChatMessageBubble key={`msg-${i}-${msg.role}`} msg={msg} index={i} />
        ))}

        {/* Email Prompt */}
        <ChatEmailPrompt />

        {/* ── Typing Indicator ── */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -5, scale: 0.95 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="flex gap-2"
            >
              <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0 border border-primary/25">
                <motion.div
                  animate={{
                    scale: [1, 1.2, 0.9, 1.1, 1],
                    rotate: [0, -15, 20, -10, 0],
                    filter: ['brightness(1)', 'brightness(1.3)', 'brightness(1)'],
                  }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <Zap className="w-4 h-4 text-primary fill-primary/40" />
                </motion.div>
              </div>
              <div className="bg-white/[0.08] border border-white/[0.1] rounded-xl rounded-tl-none px-5 flex items-center gap-2 h-[38px] backdrop-blur-md">
                {[0, 0.2, 0.4].map((delay, i) => (
                  <motion.span
                    key={i}
                    className="w-[7px] h-[7px] rounded-full bg-primary"
                    animate={{
                      y: [0, -5, 0],
                      opacity: [0.4, 1, 0.4],
                      scale: [0.85, 1.15, 0.85],
                    }}
                    transition={{
                      duration: 0.9,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay,
                    }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="h-4 shrink-0" />
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
