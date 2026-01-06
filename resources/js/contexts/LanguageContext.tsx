import { createContext, useContext, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';

type Language = 'en' | 'ar';
type Direction = 'ltr' | 'rtl';

interface LanguageContextType {
    language: Language;
    direction: Direction;
    setLanguage: (lang: Language) => void;
    t: (key: string, options?: Record<string, unknown>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
    const { t: translate } = useTranslation();
    const language = i18n.language as Language;
    const direction: Direction = language === 'ar' ? 'rtl' : 'ltr';

    const setLanguage = (lang: Language) => {
        i18n.changeLanguage(lang);
    };

    const t = (key: string, options?: Record<string, unknown>): string => {
        return translate(key, options as never) as unknown as string;
    };

    return (
        <LanguageContext.Provider value={{ language, direction, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
