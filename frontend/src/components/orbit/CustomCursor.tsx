import { useEffect, useState } from 'react';

// Standard arrow cursor SVG, colorized
const cursorSvg = (color: string, strokeColor: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">` +
    `<path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87c.45 0 .67-.54.35-.85L5.85 2.36a.5.5 0 0 0-.35.85z" ` +
      `fill="${color}" stroke="${strokeColor}" stroke-width="1" stroke-linejoin="round"/>` +
  `</svg>`;

const greenCursor = `url("data:image/svg+xml,${encodeURIComponent(cursorSvg('#10b981', '#065f46'))}") 6 2, auto`;
const goldCursor  = `url("data:image/svg+xml,${encodeURIComponent(cursorSvg('#f59e0b', '#92400e'))}") 6 2, auto`;

export function CustomCursor() {
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const check = () =>
      setIsMobile(
        window.matchMedia('(hover: none) and (pointer: coarse)').matches ||
        window.innerWidth < 768
      );
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  if (isMobile) return null;

  return (
    <style dangerouslySetInnerHTML={{ __html: `
      *, *::before, *::after { cursor: ${greenCursor} !important; }
      a, button, [role="button"], input[type="submit"],
      .cursor-pointer, [style*="cursor: pointer"],
      a *, button *, [role="button"] * { cursor: ${goldCursor} !important; }
    `}} />
  );
}
