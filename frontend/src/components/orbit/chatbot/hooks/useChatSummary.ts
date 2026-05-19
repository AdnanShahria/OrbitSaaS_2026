import { useRef, useEffect, useCallback } from 'react';
import type { ChatMessage } from '../types';
import { sendToGroq } from '@/services/aiService';

interface UseChatSummaryParams {
  messages: ChatMessage[];
  hasProvidedEmail: boolean;
  leadEmail: string;
}

export function useChatSummary({ messages, hasProvidedEmail, leadEmail }: UseChatSummaryParams) {
  const summarySentRef = useRef(false);
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- Reusable function to generate AI summary and send to leads API ---
  const sendChatSummary = useCallback(async (currentMessages: ChatMessage[], sync = false) => {
    if (summarySentRef.current) return;

    const userMsgs = currentMessages.filter(m => m.role === 'user');
    const assistantMsgs = currentMessages.filter(m => m.role === 'assistant');
    if (userMsgs.length < 1 || assistantMsgs.length < 1) return;

    const storedEmail = leadEmail || localStorage.getItem('orbit_chatbot_email') || '';
    if (!storedEmail) return;

    summarySentRef.current = true;

    // For sync (beacon) calls, send raw chat without AI summary
    if (sync) {
      const rawChat = currentMessages
        .filter(m => m.role !== 'system')
        .map(m => `${m.role === 'user' ? 'User' : 'Orbit AI'}: ${m.content}`)
        .join('\n');
      const API_BASE = import.meta.env.VITE_API_URL || '';
      try {
        navigator.sendBeacon(
          `${API_BASE}/api/leads?action=submit`,
          new Blob([JSON.stringify({
            email: storedEmail,
            source: 'Chatbot Gateway',
            interest: userMsgs[userMsgs.length - 1]?.content || 'General Inquiry',
            chat_summary: `[Raw Chat - ${new Date().toLocaleString()}]\n${rawChat}`
          })], { type: 'application/json' })
        );
      } catch { /* fail silently */ }
      return;
    }

    try {
      const rawChat = currentMessages
        .filter(m => m.role !== 'system')
        .map(m => `${m.role === 'user' ? 'User' : 'Orbit AI'}: ${m.content}`)
        .join('\n');

      const summaryPrompt: ChatMessage[] = [
        {
          role: 'system',
          content: `You are a chat summarizer. Given a conversation between a user and Orbit SaaS AI, produce a compact 2-4 sentence summary. Include: what the user asked about, what services/projects interested them, and any action items. Be concise and factual. Do NOT use markdown. Output ONLY the summary text.`
        },
        { role: 'user', content: rawChat }
      ];

      const aiSummary = await sendToGroq(summaryPrompt);

      const API_BASE = import.meta.env.VITE_API_URL || '';
      await fetch(`${API_BASE}/api/leads?action=submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: storedEmail,
          source: 'Chatbot Gateway',
          interest: userMsgs[userMsgs.length - 1]?.content || 'General Inquiry',
          chat_summary: `[AI Summary] ${aiSummary}`
        })
      });
    } catch {
      // Fail silently — this is a background enhancement
    }
  }, [leadEmail]);

  // --- INACTIVITY SUMMARY: After 45s of no new messages ---
  useEffect(() => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);

    const userMsgs = messages.filter(m => m.role === 'user');
    const assistantMsgs = messages.filter(m => m.role === 'assistant');
    if (!hasProvidedEmail || userMsgs.length < 1 || assistantMsgs.length < 1) return;

    inactivityTimer.current = setTimeout(() => {
      sendChatSummary(messages);
    }, 45000);

    return () => {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };
  }, [messages, hasProvidedEmail, sendChatSummary]);

  // --- SUMMARY ON PAGE LEAVE / TAB SWITCH ---
  useEffect(() => {
    if (!hasProvidedEmail) return;

    const handleBeforeUnload = () => {
      const userMsgs = messages.filter(m => m.role === 'user');
      const assistantMsgs = messages.filter(m => m.role === 'assistant');
      if (userMsgs.length < 1 || assistantMsgs.length < 1 || summarySentRef.current) return;
      sendChatSummary(messages, true);
    };

    const handleVisibilityChange = () => {
      if (document.hidden && messages.filter(m => m.role === 'user').length >= 1) {
        sendChatSummary(messages, true);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [messages, hasProvidedEmail, sendChatSummary]);

  return { sendChatSummary, summarySentRef };
}
