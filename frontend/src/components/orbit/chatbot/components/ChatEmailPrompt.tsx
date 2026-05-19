import { Bot, Loader2, Send } from 'lucide-react';
import { useChatContext } from '../ChatContext';

export function ChatEmailPrompt() {
  const { chatLang, showEmailPrompt, hasProvidedEmail, leadEmail, setLeadEmail, leadStatus, handleLeadSubmit } = useChatContext();

  if (!showEmailPrompt || hasProvidedEmail) return null;

  return (
    <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex gap-2">
        <div className="w-8 h-8 rounded-full bg-border flex items-center justify-center shrink-0">
          <Bot className="w-4 h-4 text-foreground" />
        </div>
        <div className="bg-muted rounded-xl rounded-tl-none px-4 py-3 text-base md:text-[15px] text-foreground max-w-[90%] border border-border">
          <p className="mb-3 text-[15px] md:text-sm leading-relaxed font-medium">
            {chatLang === 'bn'
              ? 'অবশ্যই, আমি সাহায্য করতে পারি। তবে আমাদের সংযোগ বিচ্ছিন্ন হয়ে গেলে, আমি কোথায় উত্তর পাঠাবো? আপনার ইমেইলটি দিন:'
              : 'Definitely I can help with that. In case we get disconnected, what is your email address?'}
          </p>
          <form onSubmit={handleLeadSubmit} className="flex flex-col gap-2 relative z-10">
            <input
              type="email"
              required
              placeholder={chatLang === 'bn' ? 'আপনার ইমেইল...' : 'Your email address...'}
              value={leadEmail}
              onChange={(e) => setLeadEmail(e.target.value)}
              disabled={leadStatus === 'loading'}
              className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-base md:text-[15px] focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all pointer-events-auto"
            />
            <button
              type="submit"
              disabled={leadStatus === 'loading' || !leadEmail}
              className="w-full bg-emerald-600 text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 text-xs transition-opacity cursor-pointer pointer-events-auto"
            >
              {leadStatus === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              {chatLang === 'bn' ? 'উত্তর পান' : 'Send & Continue'}
            </button>
            <p className="text-[9px] text-muted-foreground text-center mt-1">
              {chatLang === 'bn' ? 'আমরা স্প্যাম করি না।' : '100% Secure. No spam.'}
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
