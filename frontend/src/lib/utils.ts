import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function ensureAbsoluteUrl(url: string | undefined): string {
  if (!url) return '#';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `https://${url}`;
}

export type RichSegment = {
  text: string;
  bold: boolean;
  card: boolean;
  whiteCard: boolean;
  greenCard?: boolean;
  color?: 'green' | 'gold' | 'white';
};

/** Parse rich markers recursively to support combinations:
 * text, **bold**, [[gold-card]], {{white-card}}, ==green-card==
 * and nested: {{<<green text on white card>>}}
 */
export function parseRichText(str: string, inherited: Partial<RichSegment> = {}): RichSegment[] {
  if (!str) return [];
  const parts: RichSegment[] = [];

  // Matches any marker and captures its content
  // 1: **[[...]]**, 2: **{{...}}**, 3: **==...==**, 4: **<<...>>**, 5: **((...))**, 6: **||...||**, 7: **...**
  // 8: [[...]], 9: {{...}}, 10: ==...==, 11: <<...>>, 12: ((...)), 13: ||...||
  const regex = /\*\*\[\[(.+?)\]\]\*\*|\*\*\{\{(.+?)\}\}\*\*|\*\*==(.+?)==\*\*|\*\*<<(.+?)>>\*\*|\*\*\(\((.+?)\)\)\*\*|\*\*\|\|(.+?)\|\|\*\*|\*\*(.+?)\*\*|\[\[(.+?)\]\]|\{\{(.+?)\}\}|==(.+?)==|<<(.+?)>>|\(\((.+?)\)\)|\|\|(.+?)\|\|/g;

  let last = 0;
  let m: RegExpExecArray | null;

  while ((m = regex.exec(str)) !== null) {
    if (m.index > last) {
      parts.push({
        text: str.slice(last, m.index),
        bold: !!inherited.bold,
        card: !!inherited.card,
        whiteCard: !!inherited.whiteCard,
        greenCard: !!inherited.greenCard,
        color: inherited.color
      });
    }

    const content = m[1] || m[2] || m[3] || m[4] || m[5] || m[6] || m[7] || m[8] || m[9] || m[10] || m[11] || m[12] || m[13];
    const nextInherited: Partial<RichSegment> = { ...inherited };

    if (m[1] !== undefined) { nextInherited.bold = true; nextInherited.card = true; }
    else if (m[2] !== undefined) { nextInherited.bold = true; nextInherited.whiteCard = true; }
    else if (m[3] !== undefined) { nextInherited.bold = true; nextInherited.greenCard = true; }
    else if (m[4] !== undefined) { nextInherited.bold = true; nextInherited.color = 'green'; }
    else if (m[5] !== undefined) { nextInherited.bold = true; nextInherited.color = 'gold'; }
    else if (m[6] !== undefined) { nextInherited.bold = true; nextInherited.color = 'white'; }
    else if (m[7] !== undefined) { nextInherited.bold = true; }
    else if (m[8] !== undefined) { nextInherited.card = true; }
    else if (m[9] !== undefined) { nextInherited.whiteCard = true; }
    else if (m[10] !== undefined) { nextInherited.greenCard = true; }
    else if (m[11] !== undefined) { nextInherited.color = 'green'; }
    else if (m[12] !== undefined) { nextInherited.color = 'gold'; }
    else if (m[13] !== undefined) { nextInherited.color = 'white'; }

    // Recursively parse the content in case it has more markers
    const inner = parseRichText(content, nextInherited);
    parts.push(...inner);

    last = m.index + m[0].length;
  }

  if (last < str.length) {
    parts.push({
      text: str.slice(last),
      bold: !!inherited.bold,
      card: !!inherited.card,
      whiteCard: !!inherited.whiteCard,
      greenCard: !!inherited.greenCard,
      color: inherited.color
    });
  }

  return parts;
}
