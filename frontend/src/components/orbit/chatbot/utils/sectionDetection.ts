import type { MutableRefObject } from 'react';
import type { UserMode } from '../types';

const SECTIONS = ['hero', 'services', 'tech-stack', 'why-us', 'project', 'reviews', 'leadership', 'contact'];

export function getActiveSection(): string {
  let currentSection = 'default';
  let maxVisibleHeight = 0;

  SECTIONS.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      const rect = el.getBoundingClientRect();
      const visibleHeight = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);
      if (visibleHeight > maxVisibleHeight && visibleHeight > window.innerHeight * 0.2) {
        maxVisibleHeight = visibleHeight;
        currentSection = id;
      }
    }
  });
  return currentSection;
}

export function detectUserMode(
  lastScrollTimeRef: MutableRefObject<number>,
  tabWasHiddenRef: MutableRefObject<boolean>,
  sectionHistoryRef: MutableRefObject<Set<string>>,
  scrollCountRef: MutableRefObject<number>,
): UserMode {
  const now = Date.now();
  const timeSinceLastScroll = now - lastScrollTimeRef.current;
  if (tabWasHiddenRef.current) { tabWasHiddenRef.current = false; return 'returning'; }
  if (sectionHistoryRef.current.size >= 3) return 'exploring';
  if (scrollCountRef.current > 5 && timeSinceLastScroll < 8000) return 'browsing';
  if (timeSinceLastScroll < 15000 && scrollCountRef.current > 1) return 'reading';
  if (timeSinceLastScroll > 20000) return 'deep-idle';
  return 'casual';
}
