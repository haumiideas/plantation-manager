import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Language, translations } from '../i18n/translations';
import { translateEstateText } from '../i18n/vernacularTranslator';

const LANGUAGE_STORAGE_KEY = '@plantation_app_language';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: keyof typeof translations['en']) => string;
  translateUserText: (text: string | undefined | null) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: async () => {},
  t: (key) => translations.en[key] || key,
  translateUserText: (text) => text || '',
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (stored === 'en' || stored === 'ta' || stored === 'ml') {
          setLanguageState(stored);
        }
      } catch {
        // default to 'en'
      }
    })();
  }, []);

  const setLanguage = async (newLang: Language) => {
    setLanguageState(newLang);
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, newLang);
    } catch {
      // ignore
    }
  };

  const t = (key: keyof typeof translations['en']): string => {
    const langDict = (translations as any)[language] || translations.en;
    return langDict[key] || translations.en[key] || (key as string);
  };

  const translateUserText = (text: string | undefined | null): string => {
    return translateEstateText(text, language);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, translateUserText }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
