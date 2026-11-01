import { getDb } from '../_lib/db';
import { getCorsHeaders, handleOptions, jsonResponse } from '../_lib/cors';
import { isAuthorized } from '../_lib/auth';
import type { Env } from '../_lib/types';

const NVIDIA_API_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const SITE_BASE_URL = 'https://orbitsaas.cloud';
const MAX_MESSAGES = 50;
const MAX_MESSAGE_LENGTH = 2000;
const MAX_ENHANCE_LENGTH = 2000;

// ─── Model Configuration ───
// 1st Model (Main): Groq with OpenAI GPT-OSS 120B (High reasoning open model, ultra fast)
export const PRIMARY_AI_MODEL = 'openai/gpt-oss-120b';

interface AiModelCandidate {
    provider: 'nvidia' | 'groq';
    model: string;
    url: string;
    source: string;
    timeoutMs: number;
    getApiKey: (env: Env) => string | undefined;
}

const AI_MODEL_CANDIDATES: AiModelCandidate[] = [
    // 1st Model (Main): Groq with OpenAI GPT-OSS 120B (High reasoning, ultra-fast ~600ms)
    {
        provider: 'groq',
        model: 'openai/gpt-oss-120b',
        url: GROQ_API_URL,
        source: 'Orbit AI (Groq)',
        timeoutMs: 8000,
        getApiKey: (env) => env.GROQ_API_KEY,
    },
    // Fallback 1: Groq with OpenAI GPT-OSS 20B (Sub-300ms ultra-fast failover)
    {
        provider: 'groq',
        model: 'openai/gpt-oss-20b',
        url: GROQ_API_URL,
        source: 'Orbit AI (Groq)',
        timeoutMs: 6000,
        getApiKey: (env) => env.GROQ_API_KEY,
    },
    // Fallback 2: Groq with Qwen 3.8 27B
    {
        provider: 'groq',
        model: 'qwen/qwen3.8-27b',
        url: GROQ_API_URL,
        source: 'Orbit AI (Groq)',
        timeoutMs: 8000,
        getApiKey: (env) => env.GROQ_API_KEY,
    },
    // Fallback 3: Groq with Qwen 3.6 27B
    {
        provider: 'groq',
        model: 'qwen/qwen3.6-27b',
        url: GROQ_API_URL,
        source: 'Orbit AI (Groq)',
        timeoutMs: 8000,
        getApiKey: (env) => env.GROQ_API_KEY,
    },
    // Fallback 4: NVIDIA NIM with Moonshot AI Kimi K3 (https://build.nvidia.com/moonshotai/kimi-k3)
    {
        provider: 'nvidia',
        model: 'moonshotai/kimi-k3',
        url: NVIDIA_API_URL,
        source: 'Orbit AI (NVIDIA NIM)',
        timeoutMs: 10000,
        getApiKey: (env) => env.NVIDIA_API_KEY || env.NVIDIA_NIM_API_KEY,
    },
    // Fallback 5: NVIDIA NIM with OpenAI GPT-OSS 20B
    {
        provider: 'nvidia',
        model: 'openai/gpt-oss-20b',
        url: NVIDIA_API_URL,
        source: 'Orbit AI (NVIDIA NIM)',
        timeoutMs: 8000,
        getApiKey: (env) => env.NVIDIA_API_KEY || env.NVIDIA_NIM_API_KEY,
    },
];

// ─── AI Helper: NVIDIA NIM & Groq API with Multi-Model Fallback ───
async function executeAiRequest(
    messages: unknown[],
    env: Env,
    options: {
        model?: string;
        temperature: number;
        max_tokens: number;
    }
): Promise<{ content: string; source: string; model: string }> {
    const hasNvidiaKey = Boolean(env.NVIDIA_API_KEY || env.NVIDIA_NIM_API_KEY);
    const hasGroqKey = Boolean(env.GROQ_API_KEY);

    if (!hasNvidiaKey && !hasGroqKey) {
        throw new Error('AI configuration missing: no NVIDIA or Groq API key configured');
    }

    let candidateList = [...AI_MODEL_CANDIDATES];
    if (options.model) {
        const found = candidateList.find(c => c.model === options.model);
        if (found) {
            candidateList = [found, ...candidateList.filter(c => c !== found)];
        }
    }

    let lastError = '';

    for (const candidate of candidateList) {
        const apiKey = candidate.getApiKey(env);
        if (!apiKey) {
            continue;
        }

        try {
            const res = await fetch(candidate.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model: candidate.model,
                    messages,
                    temperature: options.temperature,
                    max_tokens: options.max_tokens,
                }),
                signal: AbortSignal.timeout(candidate.timeoutMs),
            });

            if (res.ok) {
                const data = await res.json() as any;
                const message = data.choices?.[0]?.message;
                const content = typeof message?.content === 'string' ? message.content.trim() : '';

                if (content) {
                    return { content, source: candidate.source, model: candidate.model };
                }

                const finishReason = data.choices?.[0]?.finish_reason || 'unknown';
                console.warn(`[AI] Candidate ${candidate.provider}/${candidate.model} returned empty content (finish_reason: ${finishReason}). Attempting fallback...`);
                lastError = `Empty content from ${candidate.model}`;
            } else {
                const errorText = await res.text().catch(() => 'Unknown error');
                console.warn(`[AI] Candidate ${candidate.provider}/${candidate.model} returned error ${res.status}: ${errorText}. Attempting fallback...`);
                lastError = `HTTP ${res.status}: ${errorText}`;
            }
        } catch (err: any) {
            console.warn(`[AI] Candidate ${candidate.provider}/${candidate.model} request error:`, err.message || err);
            lastError = err.message || String(err);
        }
    }

    console.error(`[AI] All candidate models failed. Last error: ${lastError}`);
    throw new Error('AI provider unavailable');
}

// ─── Action: Chat ───
async function handleChat(request: Request, env: Env): Promise<Response> {
    if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, request, 405);

    const body = await request.json() as { messages?: unknown[] };
    const { messages } = body;
    if (!messages || !Array.isArray(messages)) return jsonResponse({ error: 'Missing or invalid messages array' }, request, 400);

    // Input validation: limit message count and individual message length
    if (messages.length > MAX_MESSAGES) return jsonResponse({ error: `Too many messages (max ${MAX_MESSAGES})` }, request, 400);
    
    // Filter out invalid messages or malicious injection
    const sanitizedMessages: Array<{ role: string; content: string }> = [];
    for (const msg of messages) {
        const m = msg as any;
        if (!m || typeof m !== 'object') continue;
        const role = typeof m.role === 'string' ? m.role.toLowerCase() : '';
        if (!['user', 'assistant', 'system'].includes(role)) continue;
        const content = typeof m.content === 'string' ? m.content : '';
        if (role !== 'system' && role !== 'assistant' && content.length > MAX_MESSAGE_LENGTH) {
            return jsonResponse({ error: `Message too long (max ${MAX_MESSAGE_LENGTH} characters)` }, request, 400);
        }
        sanitizedMessages.push({ role, content });
    }

    if (sanitizedMessages.length === 0 || !sanitizedMessages.some(m => m.role === 'user')) {
        return jsonResponse({ error: 'At least one user message is required' }, request, 400);
    }

    try {
        const result = await executeAiRequest(sanitizedMessages, env, {
            temperature: 0.6,
            max_tokens: 1000,
        });

        return jsonResponse({ success: true, content: result.content, source: result.source, model: result.model }, request);
    } catch (e: any) {
        console.error('[Chat] AI error:', e);
        return jsonResponse({ error: 'Failed to generate response. Please try again.' }, request, 500);
    }
}

// ─── Action: Chatbot Context ───
function buildKnowledgeBase(content: Record<string, any>): string {
    let kb = '';
    const hero = content.hero;
    if (hero) kb += `IDENTITY: ${hero.title}. "${hero.tagline}". ${hero.subtitle}\n`;

    const projects = content.projects?.items || [];
    if (projects.length > 0) {
        kb += 'PROJECTS (USE THESE EXACT LINKS ONLY):\n';
        projects.forEach((p: any, index: number) => {
            const projectId = p.id || index;
            const tags = (p.tags || []).join(', ');
            kb += `- ${p.title} (${tags}): ${SITE_BASE_URL}/project/${projectId}\n`;
        });
    }

    const services = content.services?.items || [];
    if (services.length > 0) kb += 'SERVICES: ' + services.map((s: any) => s.title).join(', ') + '\n';

    const ts = content.techStack;
    if (ts) {
        const items = ts.items || [];
        if (items.length > 0) kb += 'TECH: ' + items.map((t: any) => t.name || t).join(', ') + '\n';
    }

    const whyUs = content.whyUs?.items || [];
    if (whyUs.length > 0) kb += 'WHY US: ' + whyUs.map((w: any) => w.title).join(', ') + '\n';

    const leadership = content.leadership?.members || [];
    if (leadership.length > 0) kb += 'TEAM: ' + leadership.map((l: any) => `${l.name} (${l.role})`).join(', ') + '\n';

    const footer = content.footer;
    if (footer) {
        const activeSocials = (footer.socials || []).filter((s: any) => s.enabled && s.url);
        if (activeSocials.length > 0) kb += 'SOCIALS: ' + activeSocials.map((s: any) => `${s.platform}: ${s.url}`).join(', ') + '\n';
    }

    const contactEmail = content.hero?.contactEmail || content.footer?.email || 'contact@orbitsaas.cloud';
    const rawWhatsapp = content.contact?.whatsapp || content.footer?.phone || content.hero?.whatsappNumber || '+8801853452264';
    const cleanWhatsapp = rawWhatsapp.replace(/[^0-9]/g, '');
    const whatsappDisplay = rawWhatsapp.startsWith('+') ? rawWhatsapp : `+${rawWhatsapp}`;
    const location = content.footer?.location || 'Rajshahi, Bangladesh';

    kb += 'OFFICIAL CONTACT DETAILS (STRICT TRUTH - NEVER INVENT OTHER NUMBERS/EMAILS):\n';
    kb += `- Official Email: ${contactEmail}\n`;
    kb += `- WhatsApp / Direct Phone: ${whatsappDisplay} (https://wa.me/${cleanWhatsapp})\n`;
    kb += `- Contact & Free Quote Form: ${SITE_BASE_URL}/#contact\n`;
    kb += `- Location: ${location}\n`;
    kb += '- Instructions: When users ask how to contact us, provide these exact contact methods. NEVER invent any fake phone numbers or emails.\n';

    kb += `CORE LINKS: Home: ${SITE_BASE_URL} | Projects: ${SITE_BASE_URL}/project | Contact: ${SITE_BASE_URL}/#contact\n`;

    const linksData = content.links?.items || [];
    if (linksData.length > 0) kb += 'ADDITIONAL LINKS:\n' + linksData.map((l: any) => `- ${l.title}: ${l.link}`).join('\n') + '\n';

    return kb;
}

async function generateGist(knowledgeBase: string, env: Env): Promise<string | null> {
    try {
        const { content } = await executeAiRequest(
            [
                {
                    role: 'system',
                    content: 'You are a technical documentator. Summarize the following company knowledge base into a SHORT factual reference (~200 words max). CRITICAL: All URLs, proper names (Project Titles, Service Names), TEAM MEMBERS (Name + Role), and CONTACT DETAILS (Email, WhatsApp number, Contact URL) must be preserved EXACTLY as in the source. NEVER drop team/leadership or contact info. NEVER invent phone numbers or emails. NEVER abbreviate URLs. NO marketing fluff. Output ONLY the summary.'
                },
                { role: 'user', content: knowledgeBase }
            ], 
            env, 
            {
                temperature: 0.2,
                max_tokens: 500,
            }
        );
        return content.trim() || null;
    } catch { return null; }
}

async function handleContext(request: Request, env: Env): Promise<Response> {
    if (request.method !== 'GET') return jsonResponse({ error: 'Method not allowed' }, request, 405);

    const db = getDb(env);
    const url = new URL(request.url);
    const lang = url.searchParams.get('lang') || 'en';
    const forceRefresh = url.searchParams.get('refresh') === 'true';

    if (forceRefresh) {
        if (!(await isAuthorized(request, env.JWT_SECRET))) {
            return jsonResponse({ error: 'Unauthorized: admin token required to refresh context' }, request, 401);
        }
        try { await db.execute({ sql: 'DELETE FROM kb_gist WHERE lang = ?', args: [lang] }); } catch { /* skip */ }
    }

    let content: Record<string, any> = {};

    // Try cache first
    try {
        const cacheResult = await db.execute({ sql: 'SELECT data FROM content_cache WHERE lang = ?', args: [lang] });
        if (cacheResult.rows.length > 0) content = JSON.parse(cacheResult.rows[0].data as string);
    } catch { /* skip */ }

    // Fallback
    if (Object.keys(content).length === 0) {
        const result = await db.execute({ sql: 'SELECT section, data FROM site_content WHERE lang = ?', args: [lang] });
        for (const row of result.rows) content[row.section as string] = JSON.parse(row.data as string);
    }

    // Try cached gist
    let knowledgeBase = '';
    try {
        const gistResult = await db.execute({ sql: 'SELECT gist FROM kb_gist WHERE lang = ?', args: [lang] });
        if (gistResult.rows.length > 0 && (gistResult.rows[0] as any).gist) {
            knowledgeBase = (gistResult.rows[0] as any).gist as string;
        }
    } catch { /* skip */ }

    // Generate gist if missing
    if (!knowledgeBase) {
        const fullKB = buildKnowledgeBase(content);
        let leadInfo = '';
        try {
            const leadResult = await db.execute('SELECT COUNT(*) as count FROM leads');
            const count = Number(leadResult.rows[0]?.count ?? 0);
            if (count > 0) leadInfo = `\nLEAD STATS: ${count} total leads captured.\n`;
        } catch { /* skip */ }

        const fullKBWithLeads = fullKB + leadInfo;
        const gist = await generateGist(fullKBWithLeads, env);

        if (gist) {
            knowledgeBase = gist;
            try {
                await db.execute({ sql: `CREATE TABLE IF NOT EXISTS kb_gist (lang TEXT PRIMARY KEY, gist TEXT NOT NULL, updated_at TEXT DEFAULT (datetime('now')))` });
                await db.execute({
                    sql: `INSERT INTO kb_gist (lang, gist, updated_at) VALUES (?, ?, datetime('now')) ON CONFLICT(lang) DO UPDATE SET gist = ?, updated_at = datetime('now')`,
                    args: [lang, gist, gist],
                });
            } catch { /* skip */ }
        } else {
            knowledgeBase = fullKBWithLeads;
        }
    }

    const chatbot = content.chatbot || {};
    const sanitizedKB = knowledgeBase.replace(/orbitsaas-projects|orbitsaas-team/g, 'orbitsaas.cloud');
    const qaPairs = (chatbot.qaPairs || [])
        .map((qa: { question: string; answer: string }) => `Q: ${qa.question}\nA: ${qa.answer}`)
        .join('\n\n');

    return jsonResponse(
        {
            success: true,
            knowledgeBase: sanitizedKB,
            qaPairs: qaPairs || null,
            systemPrompt: chatbot.systemPrompt || null,
            lang,
        },
        request,
        200,
        {
            'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
        }
    );
}

// ─── Action: Enhance ───
async function handleEnhance(request: Request, env: Env): Promise<Response> {
    if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, request, 405);

    if (!(await isAuthorized(request, env.JWT_SECRET))) {
        return jsonResponse({ error: 'Unauthorized' }, request, 401);
    }

    const body = await request.json() as { text?: string; lang?: string };
    const { text, lang } = body;
    if (!text || !lang) return jsonResponse({ error: 'Missing text or lang' }, request, 400);

    // Input validation: limit text length
    if (text.length > MAX_ENHANCE_LENGTH) return jsonResponse({ error: `Text too long (max ${MAX_ENHANCE_LENGTH} characters)` }, request, 400);

    const systemPrompt = lang === 'en'
        ? "You are a professional copywriter for ORBIT SaaS. Your goal is to refine and compact the user's input. Make it more professional, high-impact, and premium. Keep it extremely concise (compact). Use active voice. If the input contains HTML tags, PRESERVE them. Return ONLY the refined text, no preamble."
        : "আপনি ORBIT SaaS-এর একজন পেশাদার কপিরাইটার। আপনার লক্ষ্য হলো ইউজারের ইনপুটকে আরও মার্জিত, পেশাদার এবং প্রিমিয়াম করা। কথাগুলো খুব সংক্ষিপ্ত কিন্তু আকর্ষণীয় রাখুন। যদি ইনপুটে HTML ট্যাগ থাকে, সেগুলো পরিবর্তন করবেন ঘনবেন না। শুধুমাত্র সংশোধিত টেক্সটটি রিটার্ন করুন, অন্য কোনো কথা বলবেন না।";

    try {
        const { content, source } = await executeAiRequest(
            [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: text },
            ],
            env,
            {
                temperature: 0.4,
                max_tokens: 1024,
            }
        );
        const enhancedText = content.trim() || text;
        return jsonResponse({ success: true, enhancedText, source }, request);
    } catch (e: any) {
        console.error('[Enhance] AI error:', e);
        return jsonResponse({ error: 'Failed to enhance text. Please try again.' }, request, 500);
    }
}

// ─── Main Router ───
export const onRequest: PagesFunction<Env> = async (context) => {
    const { request, env } = context;

    if (request.method === 'OPTIONS') return handleOptions(request);

    const url = new URL(request.url);
    const action = url.searchParams.get('action') || '';

    try {
        switch (action) {
            case 'chat': return await handleChat(request, env);
            case 'context': return await handleContext(request, env);
            case 'enhance': return await handleEnhance(request, env);
            default: return jsonResponse({ error: 'Unknown action. Use ?action=chat|context|enhance' }, request, 400);
        }
    } catch (error) {
        console.error('AI API error:', error);
        return jsonResponse({ error: 'Failed to process AI request' }, request, 500);
    }
};
