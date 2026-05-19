import type { ChatMessage } from '@/services/aiService';

export type Lang = 'en' | 'bn';
export type UserMode = 'browsing' | 'reading' | 'deep-idle' | 'returning' | 'exploring' | 'casual';
export type EscalationLevel = 'casual' | 'engaging' | 'action';

export interface ContextMessage {
  en: string;
  bn: string;
  mode?: string;
}

export type { ChatMessage };
