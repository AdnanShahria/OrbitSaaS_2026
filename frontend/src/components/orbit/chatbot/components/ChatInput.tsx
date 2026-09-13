import { Send } from 'lucide-react';
import { useChatContext } from '../ChatContext';

export function ChatInput() {
  const { input, setInput, handleSend, isLoading, chatContentMemo, showEmailPrompt, suggestions } = useChatContext();

  return (
    <div className="chatbot-input-area shrink-0 relative font-poppins">
      <div className={`px-4 py-3 pb-6 md:pb-3 ${suggestions.length > 0 && !isLoading ? 'pt-2' : ''} flex gap-2.5 items-center bg-white/[0.03] backdrop-blur-md border-t border-white/[0.08] transition-opacity ${showEmailPrompt ? 'opacity-40 pointer-events-none' : ''}`}>
        <div className="relative flex-1 group">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            onFocus={(e) => {
              if (window.innerWidth < 768) {
                e.target.scrollIntoView({ block: 'nearest' });
                setTimeout(() => window.scrollTo(0, 0), 50);
                setTimeout(() => window.scrollTo(0, 0), 150);
                setTimeout(() => window.scrollTo(0, 0), 300);
              }
            }}
            placeholder={chatContentMemo.placeholder}
            disabled={isLoading}
            enterKeyHint="send"
            autoFocus={false}
            className="w-full bg-white/[0.05] border border-emerald-500/35 rounded-xl px-4 py-2.5 text-base md:text-[14.5px] text-white placeholder:text-white/40 outline-none font-poppins shadow-[0_0_16px_rgba(16,185,129,0.12)] ring-1 ring-emerald-400/20 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/40 focus:shadow-[0_0_24px_rgba(16,185,129,0.3)] disabled:opacity-50 transition-all duration-200"
          />
        </div>
        <button
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-500 text-white flex items-center justify-center hover:from-emerald-500 hover:to-emerald-400 transition-all cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.35)] hover:shadow-[0_0_22px_rgba(16,185,129,0.55)] hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none shrink-0"
        >
          <Send className="w-4 h-4" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
