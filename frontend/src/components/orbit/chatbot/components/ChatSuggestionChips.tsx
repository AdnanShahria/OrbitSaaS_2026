import { useChatContext } from '../ChatContext';
import type { ChatMessage } from '../types';

export function ChatSuggestionChips() {
  const {
    chatLang, suggestions, setSuggestions, messages, setMessages, setInput,
    isLoading, showEmailPrompt, hasProvidedEmail, pendingMessagesRef,
    setShowEmailPrompt, setIsLoading, executeAIResponse,
  } = useChatContext();

  const defaultChips = chatLang === 'bn'
    ? ['তোমাদের সেবাগুলো কি?', 'প্রজেক্টগুলো দেখাও', 'প্রাইসিং কেমন?', 'যোগাযোগ করতে চাই']
    : ['What services do you offer?', 'Show me your projects', 'Tell me about pricing', 'I want to contact you'];
  const activeChips = suggestions.length > 0 ? suggestions : (messages.length <= 1 ? defaultChips : []);

  if (activeChips.length === 0 || isLoading) return null;

  return (
    <div className={`shrink-0 px-4 pt-2 pb-0 bg-card/80 transition-opacity ${showEmailPrompt ? 'opacity-40 pointer-events-none' : ''}`}>
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {activeChips.map((s, i) => (
          <button
            key={i}
            onClick={() => {
              setSuggestions([]);
              setInput(s);
              setTimeout(() => {
                const userMessage: ChatMessage = { role: 'user', content: s };
                const newMessages = [...messages, userMessage];
                setMessages(newMessages);
                setInput('');

                // Email gate: on 2nd question, show email form before AI reply
                const userMsgCount = newMessages.filter(m => m.role === 'user').length;
                if (userMsgCount >= 2 && !hasProvidedEmail) {
                  pendingMessagesRef.current = newMessages;
                  setShowEmailPrompt(true);
                  return;
                }

                setIsLoading(true);
                executeAIResponse(newMessages);
              }, 50);
            }}
            className="shrink-0 px-4 py-2 rounded-full text-[11px] font-bold bg-muted text-foreground border border-border hover:bg-muted-foreground/10 transition-colors cursor-pointer whitespace-nowrap"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
