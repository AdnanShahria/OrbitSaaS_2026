import type { Lang } from '../types';
import { translations } from '@/lib/i18n';

/**
 * Fetch knowledge base context from the server API.
 */
export async function fetchKnowledgeContext(chatLang: Lang): Promise<{ knowledgeBase: string; qaContext: string }> {
  const API_BASE = import.meta.env.VITE_API_URL || '';
  try {
    const ctxRes = await fetch(`${API_BASE}/api/ai?action=context&lang=${chatLang}`);
    if (ctxRes.ok) {
      const ctxData = await ctxRes.json();
      return {
        knowledgeBase: ctxData.knowledgeBase || '',
        qaContext: ctxData.qaPairs || '',
      };
    }
  } catch {
    // API failed — caller will use client-side fallback
  }
  return { knowledgeBase: '', qaContext: '' };
}

/**
 * Build knowledge base from client-side content (fallback when API fails).
 */
export function buildClientKnowledgeBase(activeContent: any, chatLang: Lang): { knowledgeBase: string; qaContext: string } {
  const activeT = chatLang === 'bn' ? translations.bn : translations.en;
  let knowledgeBase = "ORBIT SaaS - PRIMARY AUTHORITY DATA:\n\n";

  const hero = (activeContent.hero as any);
  if (hero) {
    knowledgeBase += `IDENTITY & MISSION: ${hero.title}. Tagline: "${hero.tagline}". Mission: ${hero.subtitle}\n\n`;
  }

  const siteBaseUrl = 'https://orbitsaas.cloud';
  const projects = (activeContent.projects as any)?.items || [];
  if (projects.length > 0) {
    knowledgeBase += "COMPLETED PORTFOLIO PROJECTS (USE THESE EXACT LINKS):\n";
    projects.forEach((p: any, index: number) => {
      const projectId = p.id || index;
      knowledgeBase += `- ${p.title}: ${p.desc} | URL: ${siteBaseUrl}/project/${projectId}\n`;
    });
    knowledgeBase += "\n";
  }

  const services = (activeContent.services as any)?.items || [];
  if (services.length > 0) {
    knowledgeBase += "CORE AGENCY SERVICES:\n";
    services.forEach((s: any) => { knowledgeBase += `- ${s.title}: ${s.desc}\n`; });
    knowledgeBase += "\n";
  }

  const linksData = (activeContent.links as any)?.items || [];
  if (linksData.length > 0) {
    knowledgeBase += "IMPORTANT LINKS:\n";
    linksData.forEach((l: any) => { knowledgeBase += `- ${l.title}: ${l.link}\n`; });
    knowledgeBase += "\n";
  }

  const leadership = (activeContent.leadership as any)?.members || [];
  if (leadership.length > 0) {
    knowledgeBase += "LEADERSHIP TEAM:\n";
    leadership.forEach((m: any) => { knowledgeBase += `- ${m.name}: ${m.role}\n`; });
    knowledgeBase += "\n";
  }

  knowledgeBase += `CORE LINKS: Home: ${siteBaseUrl}, Projects: ${siteBaseUrl}/project, Contact: ${siteBaseUrl}/#contact\n\n`;

  const qaContext = (activeT.chatbot.qaPairs || [])
    .map((qa: { question: string; answer: string }) => `Q: ${qa.question}\nA: ${qa.answer}`)
    .join('\n\n');

  return { knowledgeBase, qaContext };
}

/**
 * Build the system prompt based on language and optional admin override.
 */
export function buildSystemPrompt(chatLang: Lang, adminPrompt: string | undefined): string {
  const defaultPrompt = (chatLang === 'en'
    ? `You are ORBIT SaaS's AI rep. Rules:
GREETING: First msg only: "Hello! Welcome to Orbit SaaS." No re-introductions.
ABOUT: Bangladesh-based agency, A-Z custom software globally.
PRICING: Project-based (no hourly). End-to-End only. MVP→milestones(25/50/75/100%)→pay by progress. Yearly maintenance available.
DELIVERY: ~1 week typical. Never guess durations for individual steps. On completion: source code, env files, tutorials, docs.
SERVICES: ALL software types.
COMMS: PM contact via Telegram/WhatsApp. Updates every 10%.
SCOPE: ORBIT topics only. Redirect off-topic.
LEADS: If user wants pricing/consultation and no email given (see EMAIL STATUS), ask for it first.
LINKS: Only when user asks. Use actual names as markdown links [Name](URL). Never fabricate URLs or use generic labels.
LANG: English only. Bangla→prepend "[SUGGEST_SWITCH]".
STYLE: Casual+professional. 80-150 words max. Max 8 list items. Include ALL KB services when listing.
FORMAT: 2+ items→numbered "1. Title: Description". Projects with URLs→"1. [Name](URL): Description". Intro/closing=plain paragraphs, not numbered. Single-paragraph answers=no numbers. Never use bullets.
Example:
We build all types of software:
1. Full Stack Web Apps: Modern React, Next.js solutions
2. [Eco Haat](https://orbitsaas.cloud/project/1): Sustainable marketplace
We use cutting-edge tech.
FOLLOW-UP: End every reply with 1 "💬" suggestion on its own new line. Write as user→ORBIT request ("your"=ORBIT's). Never as bot asking user. Never use "our".
Good: "💬 Tell me about your pricing" / "💬 I want to start a project"
Bad: "💬 Tell me about your project idea" / "💬 Share your requirements"`
    : `আপনি ORBIT SaaS-এর AI সহকারী। নিয়ম:
শুভেচ্ছা: প্রথম মেসেজে "হ্যালো! Orbit SaaS-এ স্বাগতম 😊" পরে পরিচয় নয়।
পরিচিতি: বাংলাদেশভিত্তিক সফটওয়্যার কোম্পানি। সব ধরনের সফটওয়্যার বানাই।
মূল্য: প্রজেক্ট অনুযায়ী। MVP→ধাপে ধাপে পেমেন্ট।
ডেলিভারি: ~১ সপ্তাহ। আলাদা ধাপের সময় অনুমান করবেন না। শেষে সোর্স কোড, টিউটোরিয়াল দিই।
যোগাযোগ: PM-এর সাথে টেলিগ্রাম/হোয়াটসঅ্যাপে সরাসরি যোগাযোগ। রোবোটিক ভাষায় নয়।
সীমা: শুধু ORBIT বিষয়ে। অন্য বিষয় ORBIT সেবায় ফেরান।
লিড: প্রাইসিং চাইলে ও ইমেইল না দিলে আগে ইমেইল চান।
লিংক: চাইলেই দিন, মার্কডাউনে [আসল নাম](URL)। ফেক URL বা জেনেরিক নাম নয়।
ভাষা: স্বাভাবিক, সাবলীল বাংলা। গুগল ট্রান্সলেটের মতো নয়। টেক শব্দ (AI, MVP, SaaS) ইংরেজিতে রাখুন। ইংরেজি বললে "[SUGGEST_SWITCH]"।
শৈলী: প্রফেশনাল+বন্ধুসুলভ। ৮০-১৫০ শব্দ max।
ফরম্যাট: ২+ আইটেম→নম্বর "1. শিরোনাম: বিবরণ"। প্রজেক্ট→"1. [নাম](URL): বিবরণ"। ভূমিকা/শেষ=প্যারাগ্রাফ। একক উত্তর=নম্বর নয়।
ফলো-আপ: শেষে আলাদা লাইনে "💬" দিয়ে ১টি suggestion। ইউজার→ORBIT ভাবে লিখুন ("তোমাদের"=ORBIT-এর)।
সঠিক: "💬 তোমাদের প্রাইসিং জানাও" / "💬 আমার প্রজেক্ট প্ল্যান করতে সাহায্য করো"
ভুল: "💬 আপনার প্রজেক্টের কথা বলুন" / "💬 আপনি কী বানাতে চান?"`);
  return (adminPrompt && adminPrompt.trim()) ? adminPrompt : defaultPrompt;
}

/**
 * Compose the full system message with all context injected.
 */
export function buildFullSystemMessage(
  systemPrompt: string,
  hasProvidedEmail: boolean,
  knowledgeBase: string,
  qaContext: string,
): string {
  const emailStatus = hasProvidedEmail
    ? 'EMAIL: User already gave email. Do NOT ask again.'
    : 'EMAIL: User has NOT given email. Ask when relevant.';

  return `${systemPrompt}\n\n${emailStatus}\n\n=== KNOWLEDGE BASE ===\n${knowledgeBase}${qaContext ? `\n\n=== Q&A ===\n${qaContext}` : ''}`;
}
