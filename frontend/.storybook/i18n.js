import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { LANGUAGE_CODES, DEFAULT_LANGUAGE } from '../config/languages';

import en from '../public/locales/en/common.json';
import ru from '../public/locales/ru/common.json';

i18n.use(initReactI18next).init({
    resources: {
        en: { translation: en },
        ru: { translation: ru },
    },
    fallbackLng: DEFAULT_LANGUAGE,
    defaultLocale: DEFAULT_LANGUAGE,
    locales: LANGUAGE_CODES,
    debug: true,
});

export default i18n;
