import { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import i18n, { t as i18nT } from '../i18n';

/**
 * Custom hook for translations that integrates with LanguageContext
 * Provides translation function and re-renders on language changes
 */
export const useTranslation = () => {
  const { language, isLoading } = useLanguage();
  const [, forceUpdate] = useState({});

  // Force re-render when language changes
  useEffect(() => {
    const handleLanguageChange = () => {
      forceUpdate({});
    };

    i18n.on('languageChanged', handleLanguageChange);
    
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, []);

  // Translation function
  const t = (key, options = {}) => {
    return i18nT(key, options);
  };

  return {
    t,
    language,
    isLoading,
    i18n,
  };
};

export default useTranslation;
