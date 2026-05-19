/**
 * Extracts suggestion chips from AI response content using 4 fallback strategies,
 * then converts bot-perspective phrasing to user-perspective.
 */

// Common suggestion emoji pattern
const suggestionEmojiPattern = /(?:💬|🟢|➡️|👉|✅|🔹|🔸|💡|🎯|📌|⭐|🚀|🔵|🟡|🟠|🔴|⚡)/u;

export function extractAndCleanSuggestions(responseContent: string): {
  cleanedContent: string;
  suggestions: string[];
} {
  const lines = responseContent.split('\n').filter(l => l.trim());
  const suggestionLines: string[] = [];

  // Strategy 1: Lines starting with 💬 or other common suggestion emojis
  const emojiLines = lines.filter(l => {
    const firstChar = [...l.trim()][0] || '';
    return suggestionEmojiPattern.test(firstChar) || l.trim().startsWith('💬');
  });
  suggestionLines.push(...emojiLines);

  let remainingLines = lines.filter(l => {
    const firstChar = [...l.trim()][0] || '';
    return !suggestionEmojiPattern.test(firstChar) && !l.trim().startsWith('💬');
  });

  // Strategy 1b: Emoji-prefixed suggestion embedded INLINE at end of a paragraph
  if (suggestionLines.length === 0 && remainingLines.length > 0) {
    const lastLine = remainingLines[remainingLines.length - 1];
    const inlineEmojiMatch = lastLine.match(/(.*?[.!?])\s*((?:💬|🟢|➡️|👉|✅|🔹|🔸|💡|🎯|📌|⭐|🚀|🔵|🟡|🟠|🔴|⚡)\s*.{5,120})$/u);
    if (inlineEmojiMatch) {
      const beforeText = inlineEmojiMatch[1].trim();
      const suggestionText = inlineEmojiMatch[2].trim();
      suggestionLines.push(suggestionText);
      remainingLines[remainingLines.length - 1] = beforeText;
      remainingLines = remainingLines.filter(l => l.trim());
    }
  }

  // Strategy 2: Last line ending with ? (standalone follow-up question)
  if (suggestionLines.length === 0 && remainingLines.length > 1) {
    const lastLine = remainingLines[remainingLines.length - 1]?.trim() || '';
    if (lastLine.endsWith('?') && !lastLine.startsWith('-') && !lastLine.startsWith('•')) {
      suggestionLines.push(lastLine);
      remainingLines = remainingLines.slice(0, -1);
    }
  }

  // Strategy 3: Extract last sentence ending with ? from a paragraph
  if (suggestionLines.length === 0 && remainingLines.length > 0) {
    const fullText = remainingLines.join('\n');
    const sentences = fullText.match(/[^.!?\n]*\?/g);
    if (sentences && sentences.length > 0) {
      const lastQuestion = sentences[sentences.length - 1].trim();
      if (lastQuestion.length > 5 && lastQuestion.length < 120) {
        const idx = fullText.lastIndexOf(lastQuestion);
        const cleaned = (fullText.slice(0, idx) + fullText.slice(idx + lastQuestion.length)).trim();
        if (cleaned.length > 10) {
          suggestionLines.push(lastQuestion);
          remainingLines = cleaned.split('\n').filter(l => l.trim());
        }
      }
    }
  }

  // Strategy 4: Catch trailing imperative sentences embedded inline
  if (suggestionLines.length === 0 && remainingLines.length > 0) {
    const lastLine = remainingLines[remainingLines.length - 1];
    const imperativeMatch = lastLine.match(/(.*?[.!?])\s*((?:Tell me|Show me|Ask about|I(?:'d| would) like to|I want to|Help me|Share|Let me know|Inform me)\s.{5,100}[.!?]?)\s*$/);
    if (imperativeMatch) {
      const beforeText = imperativeMatch[1].trim();
      const suggestionText = imperativeMatch[2].trim();
      if (beforeText.length > 10) {
        suggestionLines.push(suggestionText);
        remainingLines[remainingLines.length - 1] = beforeText;
        remainingLines = remainingLines.filter(l => l.trim());
      }
    }
  }

  // Cleanup: Remove conversational filler immediately preceding the suggestion chip
  while (remainingLines.length > 0) {
    const lastBodyLine = remainingLines[remainingLines.length - 1].trim();
    if (/^(next|here (are|is)|some|possible)?\s*(next\s*steps?|you can (also )?ask|what you can ask|here are some things you can ask|suggested|actions?|you can reply with|would you like to|feel free to ask|ask me about|to proceed|or you can|for example):?$/i.test(lastBodyLine) || lastBodyLine === '💬') {
      remainingLines.pop();
    } else {
      break;
    }
  }

  const cleanedContent = remainingLines.join('\n').trimEnd();

  // Convert bot-perspective suggestions to user-perspective
  const suggestions = suggestionLines.map(l => {
    let s = l.replace(/^(?:\s|💬|🟢|➡️|👉|✅|🔹|🔸|💡|🎯|📌|⭐|🚀|🔵|🟡|🟠|🔴|⚡)*/u, '').trim();

    // ── Convert bot-asking-user questions into user-asking-bot statements ──
    s = s.replace(/^can you (share|provide|give me|send) your (email|e-mail|phone|number|contact|details).*$/i, 'I want to get in touch');
    s = s.replace(/^share your (email|e-mail|phone|number|contact|details).*$/i, 'I want to get in touch');
    s = s.replace(/^please (share|provide|give|send) (me )?(your )?(email|e-mail|phone|number|contact|details).*$/i, 'I want to get in touch');
    s = s.replace(/^what('s| is) your (email|e-mail|phone|number|contact).*\??$/i, 'I want to get in touch');
    s = s.replace(/^tell me about your (project idea|requirements|needs|project|business|goals)/i, 'Help me plan my project');
    s = s.replace(/^what (kind|type) of (software|project|app|website).*\??$/i, 'I want to discuss my project');
    s = s.replace(/^share your (requirements|needs|ideas|project details)/i, 'Help me define my requirements');
    s = s.replace(/^tell me (more )?about your (project|idea|business|company|needs|goals|requirements|budget)/i, 'I want to discuss my $2');
    s = s.replace(/^what is your (budget|timeline|deadline)/i, 'Tell me about your pricing and timeline');
    s = s.replace(/^describe your (project|idea|needs|requirements)/i, 'Help me plan my project');
    s = s.replace(/^what (do you need|are you looking for).*\??$/i, 'I need help with my project');
    s = s.replace(/^can you (tell|share|explain|describe) (me )?(about )?(your|more about your) /i, 'I want to discuss my ');

    // Mixed grammar corrections
    s = s.replace(/^help me explain/i, 'Help me describe');

    // Legacy cleanup conversions
    s = s.replace(/^would you like to (know|learn|hear) (about|more about)\s*/i, 'Tell me about ');
    s = s.replace(/^would you like to (see|view|check out)\s*/i, 'Show me ');
    s = s.replace(/^would you like to\s*/i, "I'd like to ");
    s = s.replace(/^do you want to\s*/i, 'I want to ');
    s = s.replace(/^shall I\s*/i, 'Please ');
    s = s.replace(/^can I help you with\s*/i, 'Help me with ');
    s = s.replace(/^learn more about (our|the)\s*/i, 'Tell me about your ');
    s = s.replace(/^learn more about\s*/i, 'Tell me about ');
    s = s.replace(/^explore (our|the)\s*/i, 'Show me your ');
    s = s.replace(/^explore\s*/i, 'Show me ');
    s = s.replace(/^check out (our|the)\s*/i, 'Show me your ');

    // Final cleanup
    s = s.replace(/\bour\b/gi, 'your');

    if (/^(help me|i want to|i need|let me|i'd like to|please)\b/i.test(s)) {
      s = s.replace(/\byour (project|requirements|project requirements|idea|needs|business|company|goals|budget)\b/gi, 'my $1');
    }

    s = s.replace(/\?$/, '');
    s = s.charAt(0).toUpperCase() + s.slice(1);

    // Failsafe for missed bot perspectives
    if (s.toLowerCase().startsWith('tell me about your ') && !s.toLowerCase().includes('pricing') && !s.toLowerCase().includes('process') && !s.toLowerCase().includes('services')) {
      s = 'I want to start a project';
    }

    // Failsafe: catch remaining email/contact requests from bot perspective
    if (/\b(share|provide|give|send)\b.*\b(your|you)\b.*\b(email|e-mail|phone|contact|number)\b/i.test(s) ||
        /\b(your|you)\b.*\b(email|e-mail|phone|contact|number)\b.*\b(share|provide|give|send|so i can)\b/i.test(s)) {
      s = 'I want to get in touch';
    }

    return s;
  }).filter(Boolean);

  return { cleanedContent, suggestions };
}
