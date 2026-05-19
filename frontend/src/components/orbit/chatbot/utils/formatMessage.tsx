import React from 'react';

/**
 * Markdown-to-JSX formatter for chat messages.
 * Handles bold, links, bullet points, quoted text, and timeline/roadmap detection.
 */
export function formatMessage(content: string): React.ReactNode {
  // 1. Pre-process to fix common AI punctuation spacing issues
  let processed = content
    .replace(/\s+([,.?!])/g, '$1')
    .replace(/(\*\*.*?)(([,.?!])\s*)\*\*/g, '$1**$2');

  // 2. Extract ALL links (markdown and raw)
  const linkPlaceholders: { url: string; text: string }[] = [];

  // First: Markdown links [text](url)
  processed = processed.replace(/\[([^\]]*?)]\(([^)]+)\)/g, (_match, text, url) => {
    const idx = linkPlaceholders.length;
    linkPlaceholders.push({ url, text: text.replace(/\*\*/g, '').trim() });
    return `__LINK_${idx}__`;
  });

  // Second: Raw URLs (that aren't already placeholders)
  processed = processed.replace(/(https?:\/\/[^\s)]+)/g, (url) => {
    if (processed.includes(`](${url})`)) return url;
    const idx = linkPlaceholders.length;
    linkPlaceholders.push({ url, text: '' });
    return `__LINK_${idx}__`;
  });

  const lines = processed.split('\n');

  // Helper: render inline content (bold, quoted text, + link placeholders)
  const renderInline = (text: string, keyPrefix: string) => {
    const parts = text.split(/(\*\*.*?\*\*|__LINK_\d+__|"[^"]{2,}")/g);
    return parts.map((part, i) => {
      // Bold
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={`${keyPrefix}-b${i}`} className="font-bold text-primary/90">{part.slice(2, -2)}</strong>;
      }
      // Double-quoted text → render as bold italic (no quotes)
      if (part.startsWith('"') && part.endsWith('"') && part.length > 2) {
        return <strong key={`${keyPrefix}-q${i}`} className="font-bold italic text-primary/90">{part.slice(1, -1)}</strong>;
      }
      // Link placeholder → render as a sleek, modern inline card button
      const linkMatch = part.match(/^__LINK_(\d+)__$/);
      if (linkMatch) {
        const link = linkPlaceholders[parseInt(linkMatch[1], 10)];
        return (
          <a
            key={`${keyPrefix}-l${i}`}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            title={link.url}
            className="inline-flex mt-1.5 mb-1 mx-1 items-center gap-2 px-3 py-1.5 bg-background/60 hover:bg-background text-foreground text-xs md:text-[13px] font-semibold rounded-lg border border-border hover:border-primary/50 shadow-sm hover:shadow-primary/20 transition-all duration-300 group align-middle animate-in zoom-in-50 duration-300"
          >
            <span className="truncate max-w-[180px] md:max-w-[220px]">{link.text || 'View Details'}</span>
            <span className="w-5 h-5 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors shadow-sm">
              <svg className="w-3 h-3 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </span>
          </a>
        );
      }
      return part;
    });
  };

  // ── TIMELINE/ROADMAP DETECTION ──
  const numberedStepPattern = /^(?:\*\*)?(\d+)[.)]\s*(.+?)(?:\*\*)?$/;
  const steps: { num: string; title: string; desc: string; url?: string }[] = [];
  const preLines: string[] = [];
  const postLines: string[] = [];
  let inSteps = false;
  let doneSteps = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (inSteps) continue;
      if (doneSteps) { postLines.push(line); continue; }
      preLines.push(line);
      continue;
    }

    const cleanForStep = trimmed.replace(/^[\s*-]*/, '');
    const stepMatch = cleanForStep.match(numberedStepPattern);

    if (stepMatch) {
      inSteps = true;
      const num = stepMatch[1];
      const rest = stepMatch[2].replace(/\*\*/g, '').trim();
      const sepMatch = rest.match(/^(.+?)\s*(?::\s|(?:\s[–—]\s))\s*(.+)$/);
      
      let title = '';
      let desc = '';
      
      if (sepMatch) {
        title = sepMatch[1].trim();
        desc = sepMatch[2].trim();
      } else {
        title = rest;
        desc = '';
      }

      // Check if title contains a link placeholder
      let url = '';
      const linkMatch = title.match(/__LINK_(\d+)__/);
      if (linkMatch) {
        const linkData = linkPlaceholders[parseInt(linkMatch[1], 10)];
        url = linkData.url;
        // Clean title to just be the text, removing the link placeholder
        title = title.replace(`__LINK_${linkMatch[1]}__`, linkData.text).trim();
      }

      steps.push({ num, title, desc, url });
    } else if (inSteps && !doneSteps) {
      doneSteps = true;
      postLines.push(line);
    } else if (!inSteps) {
      preLines.push(line);
    } else {
      postLines.push(line);
    }
  }

  // Render timeline if 2+ steps detected
  if (steps.length >= 2) {
    const renderTextLines = (textLines: string[]) =>
      textLines.map((line, li) => {
        const isBullet = /^\s*[*-]\s+/.test(line);
        let cleanLine = line.replace(/^\s*[*-]\s+/, '');
        if (isBullet) {
          const colonIndex = cleanLine.indexOf(':');
          if (colonIndex > 0 && colonIndex < 80 && !cleanLine.includes('**')) {
            cleanLine = `**${cleanLine.substring(0, colonIndex + 1)}**${cleanLine.substring(colonIndex + 1)}`;
          }
        }
        const inline = renderInline(isBullet ? cleanLine : line, `tl-${li}`);
        if (isBullet) {
          return (
            <div key={`tl-${li}`} className="flex gap-2.5 pl-1 my-1 text-[15px] md:text-sm group/bullet">
              <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shrink-0 shadow-[0_0_6px_rgba(16,185,129,0.4)] group-hover/bullet:shadow-[0_0_10px_rgba(16,185,129,0.6)] transition-shadow" />
              <span className="flex-1 leading-relaxed">{inline}</span>
            </div>
          );
        }
        return (
          <div key={`tl-${li}`} className={`text-[15px] md:text-sm leading-relaxed ${line.trim() === '' ? 'h-2' : 'mb-1.5 last:mb-0'}`}>
            {inline}
          </div>
        );
      });

    // Determine if steps are sequential (process) or independent (list)
    const introText = preLines.join(' ').toLowerCase();
    const sequentialKeywords = /\b(step|process|follow|phase|plan|how|workflow|approach|stage|procedure|roadmap|order|sequence|first|then|next|finally|after)\b/i;
    const allHaveDesc = steps.every(s => s.desc.length > 0);
    const isSequential = sequentialKeywords.test(introText) || (allHaveDesc && steps.length <= 6);

    return (
      <>
        {/* Pre-timeline text */}
        {preLines.filter(l => l.trim()).length > 0 && renderTextLines(preLines)}

        {/* Steps container */}
        <div className="relative mt-3.5 mb-2 ml-0.5">
          {steps.map((step, idx) => (
            <div
              key={`step-${idx}`}
              className={`relative flex gap-3.5 ${isSequential ? 'pb-3' : 'pb-2.5'} last:pb-0 animate-in fade-in slide-in-from-bottom-3 duration-500`}
              style={{ animationDelay: `${idx * 150}ms`, animationFillMode: 'both' }}
            >
              {/* Connector line — only for sequential steps */}
              {isSequential && idx < steps.length - 1 && (
                <div
                  className="absolute left-[15px] top-[36px] bottom-0 w-[2px] animate-in fade-in duration-700"
                  style={{
                    background: 'linear-gradient(to bottom, rgba(16,185,129,0.5), rgba(16,185,129,0.08))',
                    animationDelay: `${idx * 150 + 200}ms`,
                    animationFillMode: 'both',
                  }}
                />
              )}

              {/* Step number circle — glowing badge */}
              <div
                className="relative z-10 shrink-0 w-[32px] h-[32px] rounded-full flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(16,185,129,0.08) 100%)',
                  border: '2px solid rgba(16,185,129,0.6)',
                  boxShadow: '0 0 14px rgba(16,185,129,0.2), inset 0 1px 2px rgba(16,185,129,0.15)',
                }}
              >
                <span
                  className="text-[11px] font-black leading-none"
                  style={{ color: '#34d399' }}
                >
                  {step.num.padStart(2, '0')}
                </span>
              </div>

              {/* Content card */}
              {step.url ? (
                <a
                  href={step.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 min-w-0 rounded-xl px-3.5 py-2.5 transition-all duration-300 block hover:-translate-y-0.5 group/card"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
                    border: '1px solid rgba(16,185,129,0.3)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2), 0 0 15px rgba(16,185,129,0.1), inset 0 1px 0 rgba(255,255,255,0.04)',
                    cursor: 'pointer'
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[13px] md:text-xs font-bold text-emerald-400 group-hover/card:text-emerald-300 leading-snug transition-colors">
                      {renderInline(step.title, `st-${idx}`)}
                    </p>
                    <svg className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5 opacity-70 group-hover/card:opacity-100 group-hover/card:-translate-y-0.5 group-hover/card:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </div>
                  {step.desc && (
                    <p className="text-[11.5px] md:text-[11px] text-muted-foreground leading-relaxed mt-1 opacity-80 group-hover/card:opacity-100 transition-opacity">
                      {renderInline(step.desc, `sd-${idx}`)}
                    </p>
                  )}
                </a>
              ) : (
                <div
                  className="flex-1 min-w-0 rounded-xl px-3.5 py-2.5 transition-all duration-300"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.015) 100%)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.04)',
                  }}
                >
                  <p className="text-[13px] md:text-xs font-bold text-foreground leading-snug">
                    {renderInline(step.title, `st-${idx}`)}
                  </p>
                  {step.desc && (
                    <p className="text-[11.5px] md:text-[11px] text-muted-foreground leading-relaxed mt-1 opacity-80">
                      {renderInline(step.desc, `sd-${idx}`)}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Post-timeline text */}
        {postLines.filter(l => l.trim()).length > 0 && renderTextLines(postLines)}
      </>
    );
  }

  // ── DEFAULT LINE-BY-LINE RENDERING (no timeline detected) ──
  return lines.map((line, lineIndex) => {
    const isBullet = /^\s*[*-]\s+/.test(line);
    let cleanLine = line.replace(/^\s*[*-]\s+/, '');

    if (isBullet) {
      const colonIndex = cleanLine.indexOf(':');
      if (colonIndex > 0 && colonIndex < 80 && !cleanLine.includes('**')) {
        cleanLine = `**${cleanLine.substring(0, colonIndex + 1)}**${cleanLine.substring(colonIndex + 1)}`;
      }
    }

    const inlineContent = renderInline(isBullet ? cleanLine : line, `line-${lineIndex}`);

    if (isBullet) {
      return (
        <div key={`line-${lineIndex}`} className="flex gap-2.5 pl-1 my-1 text-[15px] md:text-sm group/bullet">
          <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shrink-0 shadow-[0_0_6px_rgba(16,185,129,0.4)] group-hover/bullet:shadow-[0_0_10px_rgba(16,185,129,0.6)] transition-shadow" />
          <span className="flex-1 leading-relaxed">{inlineContent}</span>
        </div>
      );
    }

    return (
      <div key={`line-${lineIndex}`} className={`text-[15px] md:text-sm leading-relaxed ${line.trim() === '' ? 'h-2' : 'mb-1.5 last:mb-0'}`}>
        {inlineContent}
      </div>
    );
  });
}
