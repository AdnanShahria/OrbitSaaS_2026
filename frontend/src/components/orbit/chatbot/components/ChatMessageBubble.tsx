import { Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { useChatContext } from '../ChatContext';
import { formatMessage } from '../utils/formatMessage';
import type { ChatMessage } from '../types';

interface ChatMessageBubbleProps {
  msg: ChatMessage;
  index: number;
}

export function ChatMessageBubble({ msg, index }: ChatMessageBubbleProps) {
  const { chatLang, setChatLang } = useChatContext();
  const isAssistant = msg.role === 'assistant';
  const isUser = msg.role === 'user';
  const hasSwitchSuggestion = isAssistant && msg.content.includes('[SUGGEST_SWITCH]');
  const cleanContent = isAssistant ? msg.content.replace('[SUGGEST_SWITCH]', '').trim() : msg.content;

  return (
    <motion.div
      id={`chat-msg-${index}`}
      data-role={msg.role}
      className="space-y-2"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <div className={`flex gap-2 ${isUser ? 'justify-end' : ''}`}>
        {isAssistant && (
          <div className="w-8 h-8 rounded-full bg-border flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4 text-foreground" />
          </div>
        )}
        <div className={`rounded-xl px-3 py-2 text-[15px] md:text-sm max-w-[85%] border ${isUser
          ? 'bg-emerald-600 text-white border-emerald-600 rounded-tr-none'
          : 'bg-muted border-border text-foreground rounded-tl-none'
          }`}>
          {isAssistant ? formatMessage(cleanContent) : msg.content}
        </div>
      </div>
      {hasSwitchSuggestion && (
        <motion.div
          className="flex justify-start ml-9 pb-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          <button
            onClick={() => setChatLang(chatLang === 'en' ? 'bn' : 'en')}
            className="px-4 py-1.5 rounded-full text-[10px] font-bold bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:scale-105 transition-all flex items-center gap-1.5 cursor-pointer ring-2 ring-primary/20"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            {chatLang === 'en' ? 'বাংলায় কথা বলুন' : 'Switch to English'}
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}
