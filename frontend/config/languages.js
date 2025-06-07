/**
 * Centralized language configuration for the frontend
 * This is the single source of truth for supported languages
 */

// Supported languages for the website UI
export const SUPPORTED_LANGUAGES = [
    { 
        code: 'en', 
        name: 'English', 
        nativeName: 'English',
        direction: 'ltr',
        flag: '🇬🇧'
    },
    { 
        code: 'ru', 
        name: 'Russian', 
        nativeName: 'Русский',
        direction: 'ltr',
        flag: '🇷🇺'
    }
];

// Get list of language codes only
export const LANGUAGE_CODES = SUPPORTED_LANGUAGES.map(lang => lang.code);

// Default language
export const DEFAULT_LANGUAGE = 'en';

// Get language info by code
export const getLanguageInfo = (code) => {
    return SUPPORTED_LANGUAGES.find(lang => lang.code === code) || SUPPORTED_LANGUAGES[0];
};

// Check if language is supported
export const isLanguageSupported = (code) => {
    return LANGUAGE_CODES.includes(code);
};
