import { useState, useRef, useCallback, useEffect } from 'react';
import type { Lang, EscalationLevel, ContextMessage } from '../types';
import { contextMessages } from '../constants';
import { getActiveSection, detectUserMode } from '../utils/sectionDetection';

interface UseIdlePopupParams {
  open: boolean;
  messagesLength: number;
  chatLang: Lang;
}

export function useIdlePopup({ open, messagesLength, chatLang }: UseIdlePopupParams) {
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState<ContextMessage>({ en: 'Chat with ORBIT', bn: 'ORBIT-এর সাথে চ্যাট করুন' });
  const [typingText, setTypingText] = useState('');
  const [isTypingAnim, setIsTypingAnim] = useState(false);

  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cycleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shownMessages = useRef<Set<string>>(new Set());
  const idleLevelRef = useRef<EscalationLevel>('casual');
  const escalationTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- Behavior mode detection refs ---
  const scrollCountRef = useRef(0);
  const lastScrollTimeRef = useRef(Date.now());
  const sectionHistoryRef = useRef<Set<string>>(new Set());
  const tabWasHiddenRef = useRef(false);

  // Typing animation — character-by-character reveal (30ms per char)
  const startTypingAnimation = useCallback((text: string) => {
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    setIsTypingAnim(true);
    setTypingText('');
    let ci = 0;
    const typeChar = () => {
      if (ci < text.length) {
        setTypingText(text.slice(0, ci + 1));
        ci++;
        typingTimerRef.current = setTimeout(typeChar, 30);
      } else {
        setIsTypingAnim(false);
      }
    };
    typingTimerRef.current = setTimeout(typeChar, 30);
  }, []);

  // Select a mode-aware message, never repeating until all exhausted
  const getRandomContextMessage = useCallback((sectionId: string, escalation?: EscalationLevel) => {
    const userMode = detectUserMode(lastScrollTimeRef, tabWasHiddenRef, sectionHistoryRef, scrollCountRef);
    const level = escalation || idleLevelRef.current;

    // For returning users, prefer returning messages first
    if (userMode === 'returning') {
      const returnMsgs = contextMessages['returning'] || [];
      const unusedReturn = returnMsgs.filter(m => !shownMessages.current.has(m.en));
      if (unusedReturn.length > 0) {
        const pick = unusedReturn[Math.floor(Math.random() * unusedReturn.length)];
        shownMessages.current.add(pick.en);
        return pick;
      }
    }

    const allMsgs = contextMessages[sectionId] || contextMessages['default'];
    const levelMsgs = allMsgs.filter(m => m.mode === level);
    const pool = levelMsgs.length > 0 ? levelMsgs : allMsgs;

    const unused = pool.filter(m => !shownMessages.current.has(m.en));
    if (unused.length === 0) {
      // All shown — reset and pick fresh
      pool.forEach(m => shownMessages.current.delete(m.en));
      const fresh = pool.filter(m => m.en !== popupMessage.en);
      const pick = fresh.length > 0 ? fresh[Math.floor(Math.random() * fresh.length)] : pool[0];
      shownMessages.current.add(pick.en);
      return pick;
    }
    const pick = unused[Math.floor(Math.random() * unused.length)];
    shownMessages.current.add(pick.en);
    return pick;
     
  }, [popupMessage.en]);

  // Listen to external interactions to temporarily hide the popup
  useEffect(() => {
    const handleRemoteDismiss = () => setShowWelcomePopup(false);
    window.addEventListener('orbit-cta-open', handleRemoteDismiss);
    return () => window.removeEventListener('orbit-cta-open', handleRemoteDismiss);
  }, []);

  // Hide the welcome popup during comet collisions
  useEffect(() => {
    const handleCollisionStart = () => setShowWelcomePopup(false);
    window.addEventListener('orbit-collision-start', handleCollisionStart);
    window.addEventListener('orbit-collision-end', handleCollisionStart);
    return () => {
      window.removeEventListener('orbit-collision-start', handleCollisionStart);
      window.removeEventListener('orbit-collision-end', handleCollisionStart);
    };
  }, []);

  // Tab visibility tracking for returning-user detection
  useEffect(() => {
    const handleVisibility = () => { if (document.hidden) tabWasHiddenRef.current = true; };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // Scroll tracking for behavior mode detection
  useEffect(() => {
    const handleScroll = () => {
      scrollCountRef.current++;
      lastScrollTimeRef.current = Date.now();
      const sec = getActiveSection();
      if (sec !== 'default') sectionHistoryRef.current.add(sec);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Progressive escalation: casual(3s) → engaging(10s) → action(30s)
  useEffect(() => {
    if (!showWelcomePopup || open) return;

    const engagingTimer = setTimeout(() => {
      idleLevelRef.current = 'engaging';
      const activeSec = getActiveSection();
      const msg = getRandomContextMessage(activeSec, 'engaging');
      setPopupMessage(msg);
      startTypingAnimation(chatLang === 'bn' ? msg.bn : msg.en);
    }, 10000);

    const actionTimer = setTimeout(() => {
      idleLevelRef.current = 'action';
      const activeSec = getActiveSection();
      const msg = getRandomContextMessage(activeSec, 'action');
      setPopupMessage(msg);
      startTypingAnimation(chatLang === 'bn' ? msg.bn : msg.en);
    }, 30000);

    // Continue cycling every 8s
    cycleTimer.current = setInterval(() => {
      const activeSec = getActiveSection();
      const msg = getRandomContextMessage(activeSec);
      setPopupMessage(msg);
      startTypingAnimation(chatLang === 'bn' ? msg.bn : msg.en);
    }, 8000);

    escalationTimers.current = [engagingTimer, actionTimer];

    return () => {
      clearTimeout(engagingTimer);
      clearTimeout(actionTimer);
      if (cycleTimer.current) clearInterval(cycleTimer.current as unknown as number);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showWelcomePopup, open, chatLang]);

  // Idle tracking — hide instantly on ANY activity, re-appear after 3s idle
  useEffect(() => {
    if (open || messagesLength > 0) {
      setShowWelcomePopup(false);
      if (idleTimer.current) clearTimeout(idleTimer.current);
      return;
    }

    const showPopup = () => {
      if (!open && messagesLength === 0) {
        idleLevelRef.current = 'casual';
        const activeSec = getActiveSection();
        const msg = getRandomContextMessage(activeSec, 'casual');
        setPopupMessage(msg);
        setShowWelcomePopup(true);
        startTypingAnimation(chatLang === 'bn' ? msg.bn : msg.en);
      }
    };

    const hideAndResetIdle = () => {
      setShowWelcomePopup(false);
      setIsTypingAnim(false);
      setTypingText('');
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      idleLevelRef.current = 'casual';
      escalationTimers.current.forEach(t => clearTimeout(t));
      if (idleTimer.current) clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(showPopup, 3000);
    };

    const events = ['mousemove', 'scroll', 'keydown', 'mousedown', 'touchstart', 'touchmove', 'click'];
    events.forEach(evt => window.addEventListener(evt, hideAndResetIdle, { passive: true }));
    idleTimer.current = setTimeout(showPopup, 3000);

    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      escalationTimers.current.forEach(t => clearTimeout(t));
      events.forEach(evt => window.removeEventListener(evt, hideAndResetIdle));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, messagesLength, chatLang]);

  return {
    showWelcomePopup,
    popupMessage,
    typingText,
    isTypingAnim,
  };
}
