import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import pt from './pt';
import en from './en';
import pt_admin from './pt_admin';
import en_admin from './en_admin';

type Lang = 'pt' | 'en';
type ClientTranslations = typeof pt;
type AdminTranslations = typeof pt_admin;

interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: keyof ClientTranslations) => string;
  ta: (key: keyof AdminTranslations) => string;
}

const clientTranslations: Record<Lang, ClientTranslations> = { pt, en };
const adminTranslations: Record<Lang, AdminTranslations> = { pt: pt_admin, en: en_admin };

const LanguageContext = createContext<LanguageContextType>({
  lang: 'pt',
  setLang: () => {},
  t: (key) => key as string,
  ta: (key) => key as string,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = localStorage.getItem('dream_lang');
    return (saved === 'en' || saved === 'pt') ? saved : 'pt';
  });

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem('dream_lang', l);
  }, []);

  const t = useCallback((key: keyof ClientTranslations): string => {
    return clientTranslations[lang][key] || key as string;
  }, [lang]);

  const ta = useCallback((key: keyof AdminTranslations): string => {
    return adminTranslations[lang][key] || key as string;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, ta }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
