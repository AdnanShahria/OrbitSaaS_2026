import { parseRichText } from '@/lib/utils';
import React from 'react';

interface RichTextProps {
  text: string;
  className?: string;
}

/**
 * A unified component to render rich text markers (**bold**, ((accented)), {{highlighted}})
 * consistently across the application.
 */
export const RichText: React.FC<RichTextProps> = ({ text, className }) => {
  if (!text) return null;
  const segments = parseRichText(text);

  return (
    <span className={className}>
      {segments.map((seg, i) => {
        if (!seg.bold && !seg.card && !seg.whiteCard && !seg.color && !seg.greenCard) {
          return <React.Fragment key={i}>{seg.text}</React.Fragment>;
        }

        const classes = [
          seg.bold && !seg.color ? 'font-bold' : '',
          seg.bold && seg.color ? 'font-bold' : '',
          seg.card ? 'word-card-gold' : '',
          seg.whiteCard ? 'word-card-white' : '',
          seg.greenCard ? 'word-card-green' : '',
          seg.color === 'green' ? '!text-emerald-500' : '',
          seg.color === 'gold' ? '!text-amber-500' : '',
          seg.color === 'white' ? '!text-slate-900' : '',
        ].filter(Boolean).join(' ');

        return (
          <span key={i} className={classes}>
            {seg.text}
          </span>
        );
      })}
    </span>
  );
};
