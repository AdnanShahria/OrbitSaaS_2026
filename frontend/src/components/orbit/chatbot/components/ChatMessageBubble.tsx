import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useChatContext } from '../ChatContext';
import { formatMessage } from '../utils/formatMessage';
import type { ChatMessage } from '../types';

interface ChatMessageBubbleProps {
  msg: ChatMessage;
  index: number;
}

export const ChatMessageBubble = React.memo(function ChatMessageBubble({ msg, index }: ChatMessageBubbleProps) {
  const { chatLang, setChatLang } = useChatContext();
  const isAssistant = msg.role === 'assistant';
  const isUser = msg.role === 'user';
  const hasSwitchSuggestion = isAssistant && msg.content.includes('[SUGGEST_SWITCH]');
  const cleanContent = isAssistant ? msg.content.replace('[SUGGEST_SWITCH]', '').trim() : msg.content;

  // Memoize markdown formatting so typing in the input doesn't trigger expensive re-parsing
  const formattedContent = useMemo(() => {
    return isAssistant ? formatMessage(cleanContent) : null;
  }, [isAssistant, cleanContent]);

  return (
    <div
      id={`chat-msg-${index}`}
      data-role={msg.role}
      className="space-y-1.5 font-poppins animate-in fade-in duration-200"
    >
      <div className={`flex gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
        {isUser ? (
          <div className="font-poppins rounded-2xl px-4 py-2 text-[12.5px] md:text-[12px] leading-relaxed max-w-[88%] bg-gradient-to-r from-emerald-600 to-emerald-700 text-white border border-emerald-500/30 rounded-tr-sm font-medium shadow-sm">
            {msg.content}
          </div>
        ) : (
          <div className="font-poppins text-[12.5px] md:text-[12px] leading-relaxed w-full text-[#ededfa] px-0.5 py-0.5">
            {formattedContent}
          </div>
        )}
      </div>
      {hasSwitchSuggestion && (
        <motion.div
          className="flex justify-start pb-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.2 }}
        >
          <button
            onClick={() => setChatLang(chatLang === 'en' ? 'bn' : 'en')}
            className="font-poppins px-3.5 py-1.5 rounded-full text-[10.5px] font-semibold bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:scale-105 transition-all flex items-center gap-1.5 cursor-pointer ring-2 ring-primary/20"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            {chatLang === 'en' ? 'বাংলায় কথা বলুন' : 'Switch to English'}
          </button>
        </motion.div>
      )}
    </div>
  );
});
