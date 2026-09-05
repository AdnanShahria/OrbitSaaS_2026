import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { translations, type Lang } from '@/lib/i18n';
import { useContent } from './ContentContext';

interface LanguageContextType {
  lang: Lang;
  t: any;
  toggleLang: () => void;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('lang') === 'bn') return 'bn';
      const stored = localStorage.getItem('orbit_lang');
      if (stored === 'bn' || stored === 'en') return stored;
    }
    return 'en';
  });

  const toggleLang = () => {
    setLang(l => {
      const next = l === 'en' ? 'bn' : 'en';
      if (typeof window !== 'undefined') {
        localStorage.setItem('orbit_lang', next);
      }
      return next;
    });
  };

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
      if (lang === 'bn') {
        document.documentElement.classList.add('font-bengali');
      } else {
        document.documentElement.classList.remove('font-bengali');
      }
    }
  }, [lang]);

  // Try to use dynamic content from API, fallback to i18n.ts
  const { content } = useContent();

  // Use dynamic content from API, fallback to i18n.ts
  const t = content[lang] || translations[lang];

  return (
    <LanguageContext.Provider value={{ lang, t, toggleLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLang must be used within LanguageProvider');
  return ctx;
}
