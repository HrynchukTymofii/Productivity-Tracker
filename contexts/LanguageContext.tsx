import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import i18n from 'i18next';
import { initReactI18next, useTranslation } from 'react-i18next';
import { I18nManager } from 'react-native';
import * as Localization from 'expo-localization';
import { Language } from '../types';
import { languages, getLanguageByCode, isRTL, defaultLanguage } from '../constants/languages';
import { getSettings, updateLanguage as updateLanguageDB } from '../database/queries';

// Import all locale files
import en from '../locales/en.json';
import es from '../locales/es.json';
import fr from '../locales/fr.json';
import de from '../locales/de.json';
import it from '../locales/it.json';
import pt from '../locales/pt.json';
import ua from '../locales/ua.json';
import ja from '../locales/ja.json';
import ko from '../locales/ko.json';
import zhCN from '../locales/zh-CN.json';
import zhTW from '../locales/zh-TW.json';
import ar from '../locales/ar.json';
import hi from '../locales/hi.json';
import tr from '../locales/tr.json';
import nl from '../locales/nl.json';

// Initialize i18n
i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    es: { translation: es },
    fr: { translation: fr },
    de: { translation: de },
    it: { translation: it },
    pt: { translation: pt },
    ua: { translation: ua },
    ja: { translation: ja },
    ko: { translation: ko },
    'zh-CN': { translation: zhCN },
    'zh-TW': { translation: zhTW },
    ar: { translation: ar },
    hi: { translation: hi },
    tr: { translation: tr },
    nl: { translation: nl },
  },
  lng: defaultLanguage,
  fallbackLng: defaultLanguage,
  interpolation: {
    escapeValue: false,
  },
  compatibilityJSON: 'v4',
});

interface LanguageContextType {
  currentLanguage: Language;
  setLanguage: (langCode: string) => Promise<void>;
  allLanguages: Language[];
  isRTL: boolean;
  isLoading: boolean;
  t: (key: string, options?: any) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState<Language>(
    getLanguageByCode(defaultLanguage) || languages[0]
  );
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    loadLanguageSettings();
  }, []);

  const loadLanguageSettings = async () => {
    try {
      const settings = await getSettings();
      const savedLang = getLanguageByCode(settings.language);

      if (savedLang) {
        setCurrentLanguage(savedLang);
        i18n.changeLanguage(savedLang.code);

        // Handle RTL
        if (savedLang.rtl !== I18nManager.isRTL) {
          I18nManager.allowRTL(savedLang.rtl);
          I18nManager.forceRTL(savedLang.rtl);
        }
      } else {
        // Use device locale if no saved preference
        const locales = Localization.getLocales();
        const deviceLocale = locales[0]?.languageCode || defaultLanguage;
        const deviceLang = getLanguageByCode(deviceLocale);
        if (deviceLang) {
          setCurrentLanguage(deviceLang);
          i18n.changeLanguage(deviceLang.code);
        }
      }
    } catch (error) {
      console.error('Error loading language settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setLanguage = useCallback(async (langCode: string) => {
    const language = getLanguageByCode(langCode);
    if (language) {
      setCurrentLanguage(language);
      i18n.changeLanguage(langCode);
      await updateLanguageDB(langCode);

      // Handle RTL layout change
      if (language.rtl !== I18nManager.isRTL) {
        I18nManager.allowRTL(language.rtl);
        I18nManager.forceRTL(language.rtl);
        // Note: For RTL changes to fully take effect, the app may need to restart
      }
    }
  }, []);

  const value: LanguageContextType = {
    currentLanguage,
    setLanguage,
    allLanguages: languages,
    isRTL: currentLanguage.rtl,
    isLoading,
    t,
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export { i18n };
