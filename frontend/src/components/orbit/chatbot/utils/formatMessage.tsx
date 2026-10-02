import React from 'react';

/**
 * Ultra-Fast & Lightweight Markdown-to-JSX Formatter for ORBIT AI Chatbot.
 * - Headings: font-caladea (serif)
 * - Body text, messages, & tables: font-poppins (sans-serif)
 * - Tables: High-performance flat tables with zero nested scroll traps
 */

interface LinkData {
  url: string;
  text: string;
}

export function formatMessage(content: string): React.ReactNode {
  if (!content) return null;

  // 1. Quick normalizations
  const normalized = content.replace(/\r\n/g, '\n');

  // 2. Protect fenced code blocks first so links and markdown inside are never modified
  const codeBlocks: string[] = [];
  let processed = normalized.replace(/```[\s\S]*?```/g, (match) => {
    const idx = codeBlocks.length;
    codeBlocks.push(match);
    return `__CODE_BLOCK_${idx}__`;
  });

  // 3. Protect inline code (`...`) so URLs inside code are not converted to link buttons
  const inlineCodes: string[] = [];
  processed = processed.replace(/`([^`]+)`/g, (_match, code) => {
    const idx = inlineCodes.length;
    inlineCodes.push(code);
    return `__INLINE_CODE_${idx}__`;
  });

  // 4. Extract links (markdown, angle-bracketed, and raw)
  const linkPlaceholders: LinkData[] = [];

  // Match markdown links [text](url)
  processed = processed.replace(/\[([^\]]*?)]\(([^)]+)\)/g, (_match, text, url) => {
    const idx = linkPlaceholders.length;
    linkPlaceholders.push({ url: url.trim(), text: text.replace(/\*\*/g, '').trim() });
    return `__LINK_${idx}__`;
  });

  // Match bracketed URLs <https://...> (strip angle brackets cleanly)
  processed = processed.replace(/<((?:https?:\/\/)[^\s>]+)>/g, (_match, url) => {
    const idx = linkPlaceholders.length;
    linkPlaceholders.push({ url: url.trim(), text: '' });
    return `__LINK_${idx}__`;
  });

  // Match remaining standalone raw URLs
  processed = processed.replace(/(https?:\/\/[^\s)<>]+)/g, (url) => {
    const idx = linkPlaceholders.length;
    linkPlaceholders.push({ url: url.trim(), text: '' });
    return `__LINK_${idx}__`;
  });

  // Fast inline parser (bold, italic, inline code, link)
  const renderInline = (text: string, keyPrefix: string, customFont = 'font-poppins'): React.ReactNode => {
    if (!text) return null;
    const parts = text.split(/(__INLINE_CODE_\d+__|\*\*.*?\*\*|__LINK_\d+__|\*[^*]+\*)/g);

    return parts.map((part, i) => {
      if (!part) return null;

      // Inline Code placeholder: __INLINE_CODE_X__
      if (part.startsWith('__INLINE_CODE_') && part.endsWith('__')) {
        const m = part.match(/^__INLINE_CODE_(\d+)__$/);
        if (m) {
          const rawCode = inlineCodes[parseInt(m[1], 10)] || '';
          // Ensure any accidental link token inside code is safely restored to raw text
          const safeCode = rawCode.replace(/__LINK_(\d+)__/g, (_, lIdx) => linkPlaceholders[parseInt(lIdx, 10)]?.url || '');
          return (
            <code
              key={`${keyPrefix}-c${i}`}
              className="px-1.5 py-0.5 mx-0.5 rounded bg-white/10 text-emerald-300 font-mono text-[10.5px] border border-white/10 break-all"
            >
              {safeCode}
            </code>
          );
        }
      }

      // Direct fallback for raw backticks if any remained
      if (part.charCodeAt(0) === 96 && part.charCodeAt(part.length - 1) === 96 && part.length > 2) {
        const safeCode = part.slice(1, -1).replace(/__LINK_(\d+)__/g, (_, lIdx) => linkPlaceholders[parseInt(lIdx, 10)]?.url || '');
        return (
          <code
            key={`${keyPrefix}-c${i}`}
            className="px-1.5 py-0.5 mx-0.5 rounded bg-white/10 text-emerald-300 font-mono text-[10.5px] border border-white/10 break-all"
          >
            {safeCode}
          </code>
        );
      }

      // Bold: **text**
      if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
        return (
          <strong key={`${keyPrefix}-b${i}`} className={`font-semibold text-white ${customFont}`}>
            {renderInline(part.slice(2, -2), `${keyPrefix}-b${i}`, customFont)}
          </strong>
        );
      }

      // Italic: *text*
      if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
        return (
          <em key={`${keyPrefix}-i${i}`} className={`italic text-foreground/90 ${customFont}`}>
            {part.slice(1, -1)}
          </em>
        );
      }

      // Link placeholder: __LINK_X__
      if (part.startsWith('__LINK_') && part.endsWith('__')) {
        const linkMatch = part.match(/^__LINK_(\d+)__$/);
        if (linkMatch) {
          const link = linkPlaceholders[parseInt(linkMatch[1], 10)];
          if (link) {
            return (
              <a
                key={`${keyPrefix}-l${i}`}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                title={link.url}
                className="inline-flex my-0.5 mx-1 items-center gap-1.5 px-2.5 py-1 bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 hover:text-indigo-100 text-[11px] font-medium font-poppins rounded-md border border-indigo-500/35 hover:border-indigo-400/60 shadow-sm transition-all group align-middle whitespace-nowrap"
              >
                <span className="truncate max-w-[170px] md:max-w-[200px]">{link.text || 'View Details'}</span>
                <svg
                  className="w-2.5 h-2.5 text-indigo-400 group-hover:translate-x-0.5 transition-transform shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>
            );
          }
        }
      }

      // If a stray __LINK_X__ is embedded in text
      if (part.includes('__LINK_')) {
        const subParts = part.split(/(__LINK_\d+__)/g);
        return subParts.map((sp, spIdx) => renderInline(sp, `${keyPrefix}-sp${spIdx}`, customFont));
      }

      return <span key={`${keyPrefix}-t${i}`} className={customFont}>{part}</span>;
    });
  };

  // 5. Block-Level Tokenization
  const rawLines = processed.split('\n');
  const blocks: React.ReactNode[] = [];
  let lineIdx = 0;

  while (lineIdx < rawLines.length) {
    const line = rawLines[lineIdx];
    const trimmed = line.trim();

    // Blank line
    if (!trimmed) {
      blocks.push(<div key={`sp-${lineIdx}`} className="h-1" />);
      lineIdx++;
      continue;
    }

    // Protected Fenced Code Block placeholder (__CODE_BLOCK_X__)
    if (trimmed.startsWith('__CODE_BLOCK_') && trimmed.endsWith('__')) {
      const cbMatch = trimmed.match(/^__CODE_BLOCK_(\d+)__$/);
      if (cbMatch) {
        const rawCodeBlock = codeBlocks[parseInt(cbMatch[1], 10)] || '';
        const lines = rawCodeBlock.split('\n');
        const lang = lines[0].replace(/^```/, '').trim();
        const codeLines = lines.slice(1, -1);
        blocks.push(
          <div key={`code-${lineIdx}`} className="my-2 rounded-lg border border-white/10 bg-[#0a0a14] overflow-hidden">
            {lang && (
              <div className="px-2.5 py-1 bg-white/[0.04] border-b border-white/10 text-[9.5px] uppercase font-mono tracking-wider text-muted-foreground flex items-center justify-between">
                <span>{lang}</span>
              </div>
            )}
            <pre className="p-2.5 text-[11px] font-mono text-emerald-300 overflow-x-auto leading-relaxed">
              <code>{codeLines.join('\n')}</code>
            </pre>
          </div>
        );
        lineIdx++;
        continue;
      }
    }

    // Direct Fenced Code Block (fallback)
    if (trimmed.startsWith('```')) {
      const lang = trimmed.slice(3).trim();
      const codeLines: string[] = [];
      lineIdx++;
      while (lineIdx < rawLines.length && !rawLines[lineIdx].trim().startsWith('```')) {
        codeLines.push(rawLines[lineIdx]);
        lineIdx++;
      }
      lineIdx++;

      blocks.push(
        <div key={`code-${lineIdx}`} className="my-2 rounded-lg border border-white/10 bg-[#0a0a14] overflow-hidden">
          {lang && (
            <div className="px-2.5 py-1 bg-white/[0.04] border-b border-white/10 text-[9.5px] uppercase font-mono tracking-wider text-muted-foreground flex items-center justify-between">
              <span>{lang}</span>
            </div>
          )}
          <pre className="p-2.5 text-[11px] font-mono text-emerald-300 overflow-x-auto leading-relaxed">
            <code>{codeLines.join('\n')}</code>
          </pre>
        </div>
      );
      continue;
    }

    // Markdown Table Detection (| Header 1 | Header 2 |)
    if (trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.length > 2) {
      const tableLines: string[] = [];
      while (lineIdx < rawLines.length && rawLines[lineIdx].trim().startsWith('|') && rawLines[lineIdx].trim().endsWith('|')) {
        tableLines.push(rawLines[lineIdx].trim());
        lineIdx++;
      }

      if (tableLines.length >= 2) {
        const headerCells = tableLines[0]
          .slice(1, -1)
          .split('|')
          .map(c => c.trim());

        const hasSeparator = tableLines.length > 1 && /^\|?(\s*:?-+:?\s*\|?)+$/.test(tableLines[1]);
        const bodyStartIndex = hasSeparator ? 2 : 1;

        const bodyRows = tableLines.slice(bodyStartIndex).map(r =>
          r.slice(1, -1).split('|').map(c => {
            // Strip any accidental dangling angle brackets around link tokens: < __LINK_0__ >
            return c.trim().replace(/^<\s*(__LINK_\d+__)\s*>$/, '$1');
          })
        );

        blocks.push(
          <div
            key={`tbl-${lineIdx}`}
            className="my-3 overflow-x-auto rounded-xl border border-emerald-500/35 bg-[#0b1313]/80 shadow-[0_0_22px_rgba(16,185,129,0.22),0_0_8px_rgba(52,211,153,0.15)] ring-1 ring-emerald-400/20 font-poppins"
          >
            <table className="w-full text-left text-xs border-collapse min-w-full">
              <thead>
                <tr className="bg-emerald-950/50 border-b border-emerald-500/25">
                  {headerCells.map((header, hIdx) => (
                    <th
                      key={`th-${hIdx}`}
                      className="py-2 px-2.5 font-semibold uppercase tracking-wider text-emerald-300 text-[10px] md:text-[10.5px] whitespace-nowrap bg-emerald-950/50"
                    >
                      {renderInline(header, `th-${hIdx}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-500/10">
                {bodyRows.map((row, rIdx) => (
                  <tr key={`tr-${rIdx}`} className="even:bg-emerald-950/20 hover:bg-emerald-500/15 transition-colors">
                    {row.map((cell, cIdx) => (
                      <td key={`td-${rIdx}-${cIdx}`} className="py-2 px-2.5 text-foreground/90 text-[11px] md:text-[11.5px] leading-snug align-middle">
                        {renderInline(cell, `td-${rIdx}-${cIdx}`)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        continue;
      }
    }

    // Standalone Bold Header (e.g. **Our Core Services**)
    const boldHeaderMatch = trimmed.match(/^\*\*([^*]+)\*\*:?$/);
    if (boldHeaderMatch) {
      const title = boldHeaderMatch[1].trim();
      blocks.push(
        <h3 key={`bh-${lineIdx}`} className="mt-2.5 mb-1 text-[14px] md:text-[15px] font-bold font-caladea chatbot-heading text-white tracking-wide flex items-center gap-1.5">
          <span className="w-1 h-3 rounded-full bg-gradient-to-b from-indigo-400 to-purple-500 inline-block shrink-0" />
          <span>{title}</span>
        </h3>
      );
      lineIdx++;
      continue;
    }

    // Headings (###, ##, #) — uses font-caladea
    if (trimmed.startsWith('#')) {
      const headingMatch = trimmed.match(/^(#{1,4})\s+(.+)$/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        const text = headingMatch[2];
        lineIdx++;

        if (level === 1 || level === 2) {
          blocks.push(
            <h3 key={`h-${lineIdx}`} className="mt-2.5 mb-1 text-[14.5px] md:text-[15.5px] font-bold font-caladea chatbot-heading text-white tracking-wide flex items-center gap-1.5">
              <span className="w-1 h-3 rounded-full bg-gradient-to-b from-indigo-400 to-purple-500 inline-block shrink-0" />
              {renderInline(text, `h-${lineIdx}`, 'font-caladea')}
            </h3>
          );
        } else {
          blocks.push(
            <h4 key={`h-${lineIdx}`} className="mt-2 mb-0.5 text-[12.5px] md:text-[13.5px] font-bold font-caladea chatbot-heading text-indigo-300 tracking-wide">
              {renderInline(text, `h-${lineIdx}`, 'font-caladea')}
            </h4>
          );
        }
        continue;
      }
    }

    // Horizontal Divider (--- or ***)
    if (/^(\*{3,}|-{3,}|_{3,})$/.test(trimmed)) {
      blocks.push(<hr key={`hr-${lineIdx}`} className="my-2 border-white/10" />);
      lineIdx++;
      continue;
    }

    // Blockquote (> quote)
    if (trimmed.startsWith('>')) {
      const quoteText = trimmed.replace(/^>\s*/, '');
      blocks.push(
        <div key={`bq-${lineIdx}`} className="my-1.5 pl-2.5 py-1 border-l-2 border-indigo-500 bg-indigo-500/10 rounded-r-md text-[11px] font-poppins text-indigo-200 leading-relaxed">
          {renderInline(quoteText, `bq-${lineIdx}`)}
        </div>
      );
      lineIdx++;
      continue;
    }

    // Numbered Steps / Process items (1. Step Title : description or 1. Normal instruction)
    const stepMatch = trimmed.match(/^(?:\*\*)?(\d+)[.)]\s*(.+)$/);
    if (stepMatch) {
      const num = stepMatch[1];
      const rest = stepMatch[2].replace(/\*\*/g, '').trim();
      const sepMatch = rest.match(/^(.+?)\s*(?::\s|(?:\s[–—]\s))\s*(.+)$/);

      // Only treat as title + desc if title is concise (<= 45 chars) and doesn't contain code/URLs
      const isTrueTitle = sepMatch && sepMatch[1].trim().length <= 45 && !sepMatch[1].includes('`') && !sepMatch[1].includes('__INLINE_CODE_');
      const title = isTrueTitle ? sepMatch[1].trim() : rest;
      const desc = isTrueTitle ? sepMatch[2].trim() : '';

      blocks.push(
        <div key={`step-${lineIdx}`} className="flex gap-2 my-1.5 items-start font-poppins">
          <div className="shrink-0 w-4 h-4 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-[9.5px] font-bold text-indigo-300 mt-0.5">
            {num}
          </div>
          <div className="flex-1 text-[12px] md:text-[12.5px] leading-relaxed">
            <span className={isTrueTitle ? "font-semibold text-white" : "text-foreground/90"}>
              {renderInline(title, `st-${lineIdx}`)}
            </span>
            {desc && <span className="text-foreground/80 ml-1.5">{renderInline(desc, `sd-${lineIdx}`)}</span>}
          </div>
        </div>
      );
      lineIdx++;
      continue;
    }

    // Bullet Point (- or * )
    if (/^\s*[*-]\s+/.test(trimmed)) {
      let cleanLine = trimmed.replace(/^\s*[*-]\s+/, '');
      const colonIndex = cleanLine.indexOf(':');
      if (colonIndex > 0 && colonIndex < 80 && !cleanLine.includes('**')) {
        cleanLine = `**${cleanLine.substring(0, colonIndex + 1)}**${cleanLine.substring(colonIndex + 1)}`;
      }

      blocks.push(
        <div key={`bl-${lineIdx}`} className="flex gap-2 pl-0.5 my-0.5 text-[12px] md:text-[12.5px] font-poppins leading-relaxed">
          <span className="mt-[6px] w-1.5 h-1.5 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 shrink-0 shadow-[0_0_4px_rgba(108,92,231,0.4)]" />
          <span className="flex-1 text-foreground/90">{renderInline(cleanLine, `bl-${lineIdx}`)}</span>
        </div>
      );
      lineIdx++;
      continue;
    }

    // Default Regular Paragraph Line in Poppins
    blocks.push(
      <div key={`p-${lineIdx}`} className="text-[12.5px] md:text-[12px] font-poppins leading-relaxed text-foreground/90 mb-1 last:mb-0">
        {renderInline(trimmed, `p-${lineIdx}`)}
      </div>
    );
    lineIdx++;
  }

  return <>{blocks}</>;
}
