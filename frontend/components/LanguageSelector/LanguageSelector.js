import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useTranslation } from '../../hooks/useTranslation';
import Portal from '../Portal/Portal';
import s from './LanguageSelector.module.css';

const LanguageSelector = ({ onToggle }) => {
    const { language, setLanguage, isLoading } = useLanguage();
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const selectorRef = useRef(null);

    // Get flag emoji based on language code
    const getFlag = (langCode) => {
        const flags = {
            en: '🇬🇧',
            es: '🇪🇸',
            fr: '🇫🇷',
            de: '🇩🇪',
            it: '🇮🇹',
            pt: '🇵🇹',
            ru: '🇷🇺',
            ja: '🇯🇵',
            ko: '🇰🇷',
            zh: '🇨🇳',
            ar: '🇸🇦',
            hi: '🇮🇳',
        };
        return flags[langCode] || '🌐';
    };
    
    // Get language name based on language code
    const getLanguageName = (langCode) => {
        const languageNames = {
            en: 'English',
            es: 'Español',
            fr: 'Français',
            de: 'Deutsch',
            it: 'Italiano',
            pt: 'Português',
            ru: 'Русский',
            ja: '日本語',
            ko: '한국어',
            zh: '中文',
            ar: 'العربية',
            hi: 'हिन्दी',
        };
        return languageNames[langCode] || langCode;
    };
    
    // Close language options when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            // Close modal when clicking on backdrop (but not on modal itself)
            if (isOpen && 
                event.target.classList && 
                event.target.classList.contains(s.ModalBackdrop)) {
                setIsOpen(false);
                if (onToggle) {
                    onToggle(false);
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onToggle, isOpen]);

    const toggleLanguageOptions = () => {
        const newIsOpen = !isOpen;
        setIsOpen(newIsOpen);
        
        if (onToggle) {
            onToggle(newIsOpen);
        }
    };

    const changeLanguage = async (newLanguage) => {
        await setLanguage(newLanguage);
        // Don't close the modal after language selection
        // Just update the language
    };

    // Available languages for website UI
    const availableLanguages = [
        { code: 'en', name: 'English', direction: 'ltr' },
        { code: 'es', name: 'Español', direction: 'ltr' },
        { code: 'fr', name: 'Français', direction: 'ltr' },
        { code: 'de', name: 'Deutsch', direction: 'ltr' },
        { code: 'it', name: 'Italiano', direction: 'ltr' },
        { code: 'pt', name: 'Português', direction: 'ltr' },
        { code: 'ru', name: 'Русский', direction: 'ltr' },
        { code: 'ja', name: '日本語', direction: 'ltr' },
        { code: 'ko', name: '한국어', direction: 'ltr' },
        { code: 'zh', name: '中文', direction: 'ltr' },
        { code: 'ar', name: 'العربية', direction: 'rtl' },
        { code: 'hi', name: 'हिन्दी', direction: 'ltr' }
    ];

    return (
        <div className={s.LanguageSelector} ref={selectorRef}>
            <button 
                className={s.LanguageButton} 
                onClick={toggleLanguageOptions}
                aria-label={t('sidebar.websiteLanguage')}
                aria-expanded={isOpen}
                disabled={isLoading}
                title={getLanguageName(language)}
            >
                <span className={s.Flag}>
                    {isLoading ? '⏳' : getFlag(language)}
                </span>
            </button>
            
            {isOpen && typeof document !== 'undefined' && (
                <Portal rootId="language-modal-portal">
                    <div className={s.ModalBackdrop}>
                        <div className={s.LanguageModal}>
                            <div className={s.ModalHeader}>
                                <h3>{t('sidebar.websiteLanguage')}</h3>
                                <button 
                                    className={s.CloseButton}
                                    onClick={toggleLanguageOptions}
                                    aria-label="Close"
                                >
                                    ✕
                                </button>
                            </div>
                            <div className={s.ModalContent}>
                                <div className={s.LanguageGrid}>
                                    {availableLanguages.map((lang) => (
                                        <button 
                                            key={lang.code}
                                            className={`${s.LanguageCard} ${lang.code === language ? s.ActiveCard : ''}`}
                                            onClick={() => changeLanguage(lang.code)}
                                            disabled={isLoading}
                                        >
                                            <span className={s.CardFlag}>{getFlag(lang.code)}</span>
                                            <span className={s.CardName}>{lang.name}</span>
                                            {lang.code === language && <span className={s.ActiveIndicator}>✓</span>}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </Portal>
            )}
        </div>
    );
};

export default LanguageSelector;
