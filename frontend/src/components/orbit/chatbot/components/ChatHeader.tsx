import { motion, AnimatePresence } from 'framer-motion';
import { MoreVertical, ChevronDown, Trash2, Bot, Globe } from 'lucide-react';
import { useChatContext } from '../ChatContext';

export function ChatHeader() {
  const { chatContentMemo, chatLang, setChatLang, showMenu, setShowMenu, clearChat, setOpen } = useChatContext();

  return (
    <div className="shrink-0 px-5 py-3.5 bg-white/[0.04] backdrop-blur-md border-b border-white/[0.08] flex items-center justify-between relative z-40">
      <div className="flex items-center gap-3">
        {/* Chatbot Icon */}
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30 shadow-sm shrink-0">
          <Bot className="w-4 h-4 text-primary" />
        </div>
        
        {/* Title & Status */}
        <div>
          <h4 className="font-semibold text-foreground text-sm leading-tight">
            {chatContentMemo.title}
          </h4>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
              {chatLang === 'bn' ? 'অনলাইন' : 'Online'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 chatbot-menu-container relative">
        {/* Control Pill */}
        <div className="flex items-center gap-1 bg-white/[0.08] p-0.5 rounded-full border border-white/[0.1] shadow-sm">
          {/* Actions Menu Trigger */}
          <button
            onClick={() => setShowMenu(!showMenu)}
            aria-label="Chat options"
            className={`w-7 h-7 flex items-center justify-center rounded-full transition-all cursor-pointer ${
              showMenu
                ? 'bg-white/20 text-white shadow-xs border border-white/25'
                : 'bg-white/[0.04] text-zinc-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>

          {/* Minimize Button */}
          <button
            onClick={() => setOpen(false)}
            aria-label="Minimize chat"
            className="w-7 h-7 flex items-center justify-center rounded-full bg-white/[0.04] text-zinc-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        {/* Backdrop for outside click dismissal */}
        {showMenu && (
          <div
            className="fixed inset-0 z-[205]"
            onClick={() => setShowMenu(false)}
          />
        )}

        {/* Apple HIG Liquid Glass Popover Menu */}
        <AnimatePresence>
          {showMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 6 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="absolute right-0 top-full mt-2 w-52 rounded-2xl bg-[#0f111a]/95 backdrop-blur-2xl border border-white/[0.14] shadow-[0_20px_50px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.18)] z-[210] p-2 overflow-hidden"
            >
              {/* Language Selection Segment */}
              <div className="px-1 pt-1 pb-1.5">
                <div className="flex items-center gap-1.5 mb-1.5 px-1">
                  <Globe className="w-3 h-3 text-zinc-400" />
                  <span className="text-[10px] font-semibold text-zinc-300 tracking-wider uppercase">
                    {chatLang === 'bn' ? 'ভাষা' : 'Language'}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 p-1 rounded-xl bg-white/[0.05] border border-white/[0.08] gap-1">
                  <button
                    onClick={() => { setChatLang('en'); setShowMenu(false); }}
                    className={`px-2.5 py-1.5 text-[11px] font-semibold rounded-lg transition-all text-center cursor-pointer ${
                      chatLang === 'en'
                        ? 'bg-white/20 text-white shadow-xs border border-white/20'
                        : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    English
                  </button>
                  <button
                    onClick={() => { setChatLang('bn'); setShowMenu(false); }}
                    className={`px-2.5 py-1.5 text-[11px] font-semibold rounded-lg transition-all text-center cursor-pointer ${
                      chatLang === 'bn'
                        ? 'bg-white/20 text-white shadow-xs border border-white/20'
                        : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    বাংলা
                  </button>
                </div>
              </div>

              {/* Hairline Divider */}
              <div className="h-px bg-white/[0.08] my-1 mx-1" />

              {/* Clear Chat Button */}
              <button
                onClick={() => { clearChat(); setShowMenu(false); }}
                className="w-full px-2.5 py-2 flex items-center gap-2.5 rounded-xl text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 active:scale-[0.98] transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>{chatLang === 'bn' ? 'চ্যাট মুছে ফেলুন' : 'Clear Conversation'}</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
