/**
 * Usage:
 * import i18n from 'i18n'
 *
 * Then call translate like this:
 * i18n.t('hello.world', 'Fallback')
 *
 * See: https://www.i18next.com/ for more information
 */

import i18next from 'i18next';

// Import all translation files
import en from './translations/en.json';
import es from './translations/es.json';
import fr from './translations/fr.json';
import de from './translations/de.json';
import it from './translations/it.json';
import pt from './translations/pt.json';
import sv from './translations/sv.json';
import ru from './translations/ru.json';
import ja from './translations/ja.json';
import zh from './translations/zh.json';
import ar from './translations/ar.json';
import hi from './translations/hi.json';
import ko from './translations/ko.json';

// Available languages
const availableLanguages = ['en', 'es', 'fr', 'de', 'it', 'pt', 'sv', 'ru', 'ja', 'zh', 'ar', 'hi', 'ko'];

// Only initialize if not already initialized
if (!i18next.isInitialized) {
    i18next.init({
        lng: 'en', // default language
        fallbackLng: 'en',
        debug: false, // Disabled debug logging
        logger: {
            warn: () => {}, // Suppress warning logs
            error: console.error, // Keep error logs
        },
        interpolation: {
            escapeValue: false, // React already escapes values
        },
        resources: {
            en: { translation: en },
            es: { translation: es },
            fr: { translation: fr },
            de: { translation: de },
            it: { translation: it },
            pt: { translation: pt },
            sv: { translation: sv },
            ru: { translation: ru },
            ja: { translation: ja },
            zh: { translation: zh },
            ar: { translation: ar },
            hi: { translation: hi },
            ko: { translation: ko },
        },
    });
}

// Get current language
export const getCurrentLanguage = () => i18next.language || 'en';

// Change language
export const changeLanguage = (langCode) => {
    if (availableLanguages.includes(langCode)) {
        return i18next.changeLanguage(langCode);
    }
    return Promise.reject(new Error(`Language ${langCode} not supported`));
};

// Get available languages
export const getAvailableLanguages = () => availableLanguages;

// Translation function with better error handling
export const t = (key, options = {}) => {
    try {
        return i18next.t(key, options);
    } catch (error) {
        console.warn(`Translation missing for key: ${key}`);
        return key; // Return the key as fallback
    }
};

export default i18next;
