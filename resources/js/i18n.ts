import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation files
import enCommon from './locales/en/common.json';
import enNav from './locales/en/nav.json';
import enShop from './locales/en/shop.json';
import enCheckout from './locales/en/checkout.json';

import arCommon from './locales/ar/common.json';
import arNav from './locales/ar/nav.json';
import arShop from './locales/ar/shop.json';
import arCheckout from './locales/ar/checkout.json';

const resources = {
    en: {
        common: enCommon,
        nav: enNav,
        shop: enShop,
        checkout: enCheckout,
    },
    ar: {
        common: arCommon,
        nav: arNav,
        shop: arShop,
        checkout: arCheckout,
    },
};

// Get saved language from localStorage or default to 'en'
const getSavedLanguage = (): string => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('language') || 'en';
    }
    return 'en';
};

i18n.use(initReactI18next).init({
    resources,
    lng: getSavedLanguage(),
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common', 'nav', 'shop', 'checkout'],
    interpolation: {
        escapeValue: false, // React already escapes values
    },
    react: {
        useSuspense: false,
    },
});

// Update document direction when language changes
i18n.on('languageChanged', (lng) => {
    if (typeof document !== 'undefined') {
        document.documentElement.lang = lng;
        document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
        localStorage.setItem('language', lng);
    }
});

export default i18n;
