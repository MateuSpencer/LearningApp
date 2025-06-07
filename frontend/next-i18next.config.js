const { LANGUAGE_CODES, DEFAULT_LANGUAGE } = require('./config/languages');

module.exports = {
    i18n: {
        defaultLocale: DEFAULT_LANGUAGE,
        locales: LANGUAGE_CODES,
    },
};
