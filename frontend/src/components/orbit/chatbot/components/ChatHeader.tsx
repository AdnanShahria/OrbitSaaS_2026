import { motion, AnimatePresence } from 'framer-motion';
import { MoreVertical, ChevronDown, Trash2, Bot } from 'lucide-react';
import { useChatContext } from '../ChatContext';

export function ChatHeader() {
  const { chatContentMemo, chatLang, setChatLang, showMenu, setShowMenu, clearChat, setOpen } = useChatContext();

  return (
    <div className="shrink-0 px-5 py-3.5 bg-primary/20 border-b border-border flex items-center justify-between relative">
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

      <div className="flex items-center gap-1 chatbot-menu-container">
        {/* Control Pill */}
        <div className="flex items-center gap-1 bg-secondary/80 p-0.5 rounded-full border border-border/50 shadow-sm">
          {/* Actions Menu Trigger */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className={`w-7 h-7 flex items-center justify-center rounded-full transition-all cursor-pointer ${showMenu ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-background/50 text-muted-foreground hover:text-foreground hover:bg-background'}`}
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 10 }}
                  className="absolute right-0 mt-3 w-48 rounded-2xl bg-card border border-border shadow-2xl z-[210] py-2 overflow-hidden ring-1 ring-black/5"
                >
                  {/* Lang Selector inside Menu */}
                  <div className="px-4 py-2 border-b border-border/50">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
                      {chatLang === 'bn' ? 'ভাষা নির্বাচন করুন' : 'Select Language'}
                    </p>
                    <div className="flex bg-secondary p-0.5 rounded-lg border border-border/50">
                      <button
                        onClick={() => { setChatLang('en'); setShowMenu(false); }}
                        className={`flex-1 px-2 py-1.5 text-[10px] font-bold rounded-md transition-all ${chatLang === 'en' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                      >
                        English
                      </button>
                      <button
                        onClick={() => { setChatLang('bn'); setShowMenu(false); }}
                        className={`flex-1 px-2 py-1.5 text-[10px] font-bold rounded-md transition-all ${chatLang === 'bn' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                      >
                        বাংলা
                      </button>
                    </div>
                  </div>

                  {/* Clear Chat inside Menu */}
                  <button
                    onClick={() => { clearChat(); setShowMenu(false); }}
                    className="w-full px-4 py-2.5 flex items-center gap-3 text-xs font-medium text-red-500 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {chatLang === 'bn' ? 'চ্যাট মুছুন' : 'Clear Conversation'}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Minimize Button */}
          <button
            onClick={() => setOpen(false)}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-background/50 text-muted-foreground hover:text-foreground hover:bg-background transition-all cursor-pointer"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
