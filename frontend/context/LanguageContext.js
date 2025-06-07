import React, { createContext, useState, useContext, useEffect } from 'react';
import { changeLanguage as i18nChangeLanguage, getCurrentLanguage } from '../i18n';
import { LANGUAGE_CODES, DEFAULT_LANGUAGE, isLanguageSupported } from '../config/languages';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(DEFAULT_LANGUAGE); // Default language is English
  const [isLoading, setIsLoading] = useState(false);

  // Initialize language from localStorage or browser preference
  useEffect(() => {
    const initializeLanguage = () => {
      let initialLanguage = DEFAULT_LANGUAGE;
      
      // Try to get saved preference first
      if (typeof window !== 'undefined') {
        const savedLanguage = localStorage.getItem('websiteLanguage');
        if (savedLanguage && isLanguageSupported(savedLanguage)) {
          initialLanguage = savedLanguage;
        } else {
          // Fallback to browser language
          const browserLanguage = navigator.language.split('-')[0];
          if (isLanguageSupported(browserLanguage)) {
            initialLanguage = browserLanguage;
          }
        }
      }
      
      setLanguageState(initialLanguage);
      i18nChangeLanguage(initialLanguage);
    };

    initializeLanguage();
  }, []);

  // Function to change language with persistence
  const setLanguage = async (newLanguage) => {
    setIsLoading(true);
    try {
      await i18nChangeLanguage(newLanguage);
      setLanguageState(newLanguage);
      
      // Persist to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('websiteLanguage', newLanguage);
      }
    } catch (error) {
      console.error('Failed to change language:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    language,
    setLanguage,
    isLoading,
    getCurrentLanguage: () => getCurrentLanguage(),
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
