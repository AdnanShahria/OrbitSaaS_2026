import React, { createContext, useContext, useState, useRef, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { useLang } from '@/contexts/LanguageContext';
import { useContent } from '@/contexts/ContentContext';
import { sendToGroq } from '@/services/aiService';
import { translations } from '@/lib/i18n';
import type { Lang, ChatMessage, ContextMessage } from './types';
import { useIdlePopup } from './hooks/useIdlePopup';
import { useViewport } from './hooks/useViewport';
import { useChatSummary } from './hooks/useChatSummary';
import { extractAndCleanSuggestions } from './utils/suggestionParser';
import { fetchKnowledgeContext, buildClientKnowledgeBase, buildSystemPrompt, buildFullSystemMessage } from './utils/knowledgeBase';

// ─── Context shape ───
interface ChatContextValue {
  // State
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  showMenu: boolean;
  setShowMenu: React.Dispatch<React.SetStateAction<boolean>>;
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  chatLang: Lang;
  setChatLang: React.Dispatch<React.SetStateAction<Lang>>;
  suggestions: string[];
  setSuggestions: React.Dispatch<React.SetStateAction<string[]>>;
  // Lead state
  hasProvidedEmail: boolean;
  showEmailPrompt: boolean;
  setShowEmailPrompt: React.Dispatch<React.SetStateAction<boolean>>;
  leadEmail: string;
  setLeadEmail: React.Dispatch<React.SetStateAction<string>>;
  leadStatus: 'idle' | 'loading';
  pendingMessagesRef: React.MutableRefObject<ChatMessage[] | null>;
  // Popup state (from useIdlePopup)
  showWelcomePopup: boolean;
  popupMessage: ContextMessage;
  typingText: string;
  isTypingAnim: boolean;
  // Viewport state (from useViewport)
  viewportStyle: React.CSSProperties;
  isKeyboardOpen: boolean;
  // Computed
  chatContentMemo: { title: string; placeholder: string; greeting: string; systemPrompt: string };
  // Refs
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  // Actions
  handleSend: () => Promise<void>;
  executeAIResponse: (chatHistory: ChatMessage[]) => Promise<void>;
  handleLeadSubmit: (e: React.FormEvent) => Promise<void>;
  clearChat: () => void;
  scrollToBottom: () => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function useChatContext(): ChatContextValue {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChatContext must be used within ChatProvider');
  return ctx;
}

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { lang: siteLang } = useLang();
  const { content } = useContent();

  // ─── Core state ───
  const [open, setOpen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatLang, setChatLang] = useState<Lang>('en');
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // ─── Lead state ───
  const [hasProvidedEmail, setHasProvidedEmail] = useState(false);
  const [showEmailPrompt, setShowEmailPrompt] = useState(false);
  const [leadEmail, setLeadEmail] = useState('');
  const [leadStatus, setLeadStatus] = useState<'idle' | 'loading'>('idle');
  const pendingMessagesRef = useRef<ChatMessage[] | null>(null);

  // ─── Refs ───
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<ChatMessage[]>([]);
  messagesRef.current = messages;

  // ─── Compose hooks ───
  const { showWelcomePopup, popupMessage, typingText, isTypingAnim } = useIdlePopup({
    open,
    messagesLength: messages.length,
    chatLang,
  });

  const { viewportStyle, isKeyboardOpen } = useViewport(open);

  const { sendChatSummary, summarySentRef } = useChatSummary({
    messages,
    hasProvidedEmail,
    leadEmail,
  });

  // ─── Computed ───
  const chatContentMemo = useMemo(() => ({
    title: (content[chatLang] as any)?.chatbot?.title || translations[chatLang].chatbot.title,
    placeholder: (content[chatLang] as any)?.chatbot?.placeholder || translations[chatLang].chatbot.placeholder,
    greeting: (content[chatLang] as any)?.chatbot?.greeting || translations[chatLang].chatbot.greeting,
    systemPrompt: (content[chatLang] as any)?.chatbot?.systemPrompt || '',
  }), [content, chatLang]);

  // ─── Simple helpers ───
  const scrollToBottom = () => {
    setTimeout(() => {
      if (!messagesEndRef.current) return;
      
      const container = messagesEndRef.current.closest('.chatbot-messages-area');
      if (!container) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        return;
      }

      const messageElements = container.querySelectorAll('[id^="chat-msg-"]');
      if (messageElements.length === 0) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        return;
      }

      const lastMsgEl = messageElements[messageElements.length - 1] as HTMLElement;
      const lastMsgRole = lastMsgEl.getAttribute('data-role');
      const idealScrollTop = container.scrollHeight - container.clientHeight;

      // If the last message is from the USER (AI hasn't replied yet),
      // scroll fully to the bottom so user sees their message + loading dots
      if (lastMsgRole === 'user') {
        container.scrollTo({ top: idealScrollTop, behavior: 'smooth' });
        return;
      }

      // AI reply exists — find the last USER message to use as anchor
      let lastUserMsg: HTMLElement | null = null;
      for (let i = messageElements.length - 1; i >= 0; i--) {
        const el = messageElements[i] as HTMLElement;
        if (el.getAttribute('data-role') === 'user') {
          lastUserMsg = el;
          break;
        }
      }

      if (lastUserMsg) {
        // Only anchor to the user's question if scrolling to the bottom
        // would actually push the user's question out of view (AI reply is very tall).
        // If it's a short reply, just natural scroll to bottom.
        if (lastUserMsg.offsetTop < idealScrollTop) {
          const anchoredScrollTop = Math.max(0, lastUserMsg.offsetTop - 12);
          container.scrollTo({ top: anchoredScrollTop, behavior: 'smooth' });
        } else {
          container.scrollTo({ top: idealScrollTop, behavior: 'smooth' });
        }
      } else {
        // No user message found, just scroll to bottom
        container.scrollTo({ top: idealScrollTop, behavior: 'smooth' });
      }
    }, 50);
  };

  const clearChat = () => {
    setMessages([]);
    setSuggestions([]);
  };

  // ─── Load email status on mount ───
  useEffect(() => {
    const status = localStorage.getItem('orbit_chatbot_email_provided');
    if (status === 'true') {
      setHasProvidedEmail(true);
    }
  }, []);

  // ─── Click outside menu handler ───
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.chatbot-menu-container')) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  // ─── Dispatch chatbot state event + send summary on close ───
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('orbit-chatbot-state-change', { detail: { isOpen: open } }));
    if (!open && hasProvidedEmail && messagesRef.current.length > 0) {
      sendChatSummary(messagesRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // ─── Scroll to bottom on new messages or loading state change ───
  useEffect(() => {
    scrollToBottom();
  }, [messages, open, isLoading]);

  // ─── Core AI response function ───
  const executeAIResponse = async (chatHistory: ChatMessage[]) => {
    setIsLoading(true);
    try {
      const activeT = chatLang === 'bn' ? translations.bn : translations.en;
      const chatContent = activeT.chatbot;

      // 1. Fetch knowledge base from server
      let { knowledgeBase, qaContext } = await fetchKnowledgeContext(chatLang);

      // 2. Fallback: build from client-side content
      if (!knowledgeBase) {
        const activeContent = content[chatLang] || content['en'];
        const fallback = buildClientKnowledgeBase(activeContent, chatLang);
        knowledgeBase = fallback.knowledgeBase;
        qaContext = fallback.qaContext;
      }

      // 3. Build system prompt
      const adminPrompt = (chatContent as any)?.systemPrompt;
      const systemPrompt = buildSystemPrompt(chatLang, adminPrompt);

      // 4. Full system message
      const fullSystemMessage = buildFullSystemMessage(systemPrompt, hasProvidedEmail, knowledgeBase, qaContext);

      // 5. Cap conversation history to last 8 messages
      const recentHistory = chatHistory.filter(m => m.role !== 'system').slice(-8);
      const conversationHistory: ChatMessage[] = [
        { role: 'system', content: fullSystemMessage },
        ...recentHistory
      ];

      // 6. Call AI
      const responseContent = await sendToGroq(conversationHistory);

      // 7. Extract suggestions
      const { cleanedContent, suggestions: newSuggestions } = extractAndCleanSuggestions(responseContent);

      // 8. Auto-trigger email form
      const emailSuggestionPattern = /\b(email|e-mail|contact|phone|get in touch)\b/i;
      const emailBodyPattern = /\b(share|provide|give|send|drop)\b.{0,30}\b(your|you).{0,15}\b(email|e-mail|phone|contact)\b/i;
      const hasEmailSuggestion = newSuggestions.some(s => emailSuggestionPattern.test(s));
      const hasEmailInBody = emailBodyPattern.test(cleanedContent);

      if ((hasEmailSuggestion || hasEmailInBody) && !hasProvidedEmail) {
        const filteredSuggestions = newSuggestions.filter(s => !emailSuggestionPattern.test(s));
        setSuggestions(filteredSuggestions);
        setMessages(prev => [...prev, { role: 'assistant', content: cleanedContent }]);
        setTimeout(() => setShowEmailPrompt(true), 600);
      } else {
        setSuggestions(newSuggestions);
        setMessages(prev => [...prev, { role: 'assistant', content: cleanedContent }]);
      }
    } catch (error) {
      console.error('Failed to get response:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: "I'm sorry, I'm having trouble connecting right now. Please try again later." }]);
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Handle send (with email gate + inline email intercept) ───
  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setSuggestions([]);

    // --- EMAIL INTERCEPTOR ---
    const emailMatch = input.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
    if (emailMatch) {
      try {
        const userMessagesOnly = messages.filter(m => m.role === 'user');
        const extractedInterest = userMessagesOnly.length > 0
          ? userMessagesOnly[userMessagesOnly.length - 1].content
          : 'General Inquiry';

        const chatSummary = messages
          .map(m => `${m.role === 'user' ? 'User' : 'Orbit AI'}: ${m.content}`)
          .join('\n\n');

        const API_BASE = import.meta.env.VITE_API_URL || '';
        fetch(`${API_BASE}/api/leads?action=submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: emailMatch[0],
            source: 'AI Chatbot Intercept',
            interest: extractedInterest,
            chat_summary: chatSummary
          })
        }).catch(() => { });
        localStorage.setItem('orbit_chatbot_email_provided', 'true');
        localStorage.setItem('orbit_chatbot_email', emailMatch[0]);
        setHasProvidedEmail(true);
        summarySentRef.current = false;
      } catch {
        // Fail silently
      }
    }

    // --- EMAIL GATE (every message until email is provided) ---
    const emailAlreadyProvided = hasProvidedEmail || !!emailMatch;
    if (!emailAlreadyProvided) {
      pendingMessagesRef.current = newMessages;
      setShowEmailPrompt(true);
      return;
    }

    setIsLoading(true);
    await executeAIResponse(newMessages);
  };

  // ─── Lead submission handler ───
  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadEmail || !leadEmail.includes('@')) {
      toast.error(chatLang === 'bn' ? 'দয়া করে সঠিক ইমেইল দিন' : 'Please enter a valid email');
      return;
    }

    setLeadStatus('loading');
    try {
      const chatSummary = messages
        .map(m => `${m.role === 'user' ? 'User' : 'Orbit AI'}: ${m.content}`)
        .join('\n\n');

      const userMessages = messages.filter(m => m.role === 'user');
      const extractedInterest = userMessages.length > 0
        ? userMessages[userMessages.length - 1].content
        : 'General Inquiry';

      const API_BASE = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${API_BASE}/api/leads?action=submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: leadEmail,
          source: 'Chatbot Gateway',
          interest: extractedInterest,
          chat_summary: chatSummary
        })
      });

      if (res.ok) {
        localStorage.setItem('orbit_chatbot_email_provided', 'true');
        localStorage.setItem('orbit_chatbot_email', leadEmail);
        setHasProvidedEmail(true);
        setShowEmailPrompt(false);
        summarySentRef.current = false;
        toast.success(chatLang === 'bn' ? 'ধন্যবাদ! এখন আপনি চ্যাট শুরু করতে পারেন।' : 'Thank you! You can now start chatting.');

        const pending = pendingMessagesRef.current || messages;
        pendingMessagesRef.current = null;
        setIsLoading(true);
        executeAIResponse(pending);
      } else {
        throw new Error('Failed');
      }
    } catch {
      toast.error(chatLang === 'bn' ? 'কিছু ভুল হয়েছে, আবার চেষ্টা করুন' : 'Something went wrong, please try again');
    } finally {
      setLeadStatus('idle');
    }
  };

  // ─── Context value ───
  const value: ChatContextValue = {
    open, setOpen,
    showMenu, setShowMenu,
    input, setInput,
    messages, setMessages,
    isLoading, setIsLoading,
    chatLang, setChatLang,
    suggestions, setSuggestions,
    hasProvidedEmail,
    showEmailPrompt, setShowEmailPrompt,
    leadEmail, setLeadEmail,
    leadStatus,
    pendingMessagesRef,
    showWelcomePopup,
    popupMessage,
    typingText,
    isTypingAnim,
    viewportStyle,
    isKeyboardOpen,
    chatContentMemo,
    messagesEndRef,
    handleSend,
    executeAIResponse,
    handleLeadSubmit,
    clearChat,
    scrollToBottom,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}
