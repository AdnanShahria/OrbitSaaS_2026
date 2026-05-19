import { Send } from 'lucide-react';
import { useChatContext } from '../ChatContext';

export function ChatInput() {
  const { input, setInput, handleSend, isLoading, chatContentMemo, showEmailPrompt, suggestions } = useChatContext();

  return (
    <div className="chatbot-input-area shrink-0 relative">
      <div className={`px-4 py-3 pb-6 md:pb-3 ${suggestions.length > 0 && !isLoading ? 'pt-2' : ''} flex gap-2 bg-card/90 backdrop-blur-md transition-opacity ${showEmailPrompt ? 'opacity-40 pointer-events-none' : ''}`}>
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
          className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-base md:text-[15px] text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 transition-all"
        />
        <button
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          <Send className="w-4 h-4" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
