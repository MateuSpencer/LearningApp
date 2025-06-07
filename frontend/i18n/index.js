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
import { LANGUAGE_CODES, DEFAULT_LANGUAGE, isLanguageSupported } from '../config/languages';

// Import only supported translation files
import en from './translations/en.json';
import ru from './translations/ru.json';

// Only initialize if not already initialized
if (!i18next.isInitialized) {
    i18next.init({
        lng: DEFAULT_LANGUAGE, // default language
        fallbackLng: DEFAULT_LANGUAGE,
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
            ru: { translation: ru },
        },
    });
}

// Get current language
export const getCurrentLanguage = () => i18next.language || DEFAULT_LANGUAGE;

// Change language
export const changeLanguage = (langCode) => {
    if (isLanguageSupported(langCode)) {
        return i18next.changeLanguage(langCode);
    }
    return Promise.reject(new Error(`Language ${langCode} not supported`));
};

// Get available languages
export const getAvailableLanguages = () => LANGUAGE_CODES;

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
