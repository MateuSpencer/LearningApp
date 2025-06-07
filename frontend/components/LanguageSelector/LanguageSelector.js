import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useTranslation } from '../../hooks/useTranslation';
import { SUPPORTED_LANGUAGES, getLanguageInfo } from '../../config/languages';
import Portal from '../Portal/Portal';
import s from './LanguageSelector.module.css';

const LanguageSelector = ({ onToggle }) => {
    const { language, setLanguage, isLoading } = useLanguage();
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const selectorRef = useRef(null);

    // Get flag emoji based on language code
    const getFlag = (langCode) => {
        const languageInfo = getLanguageInfo(langCode);
        return languageInfo.flag || '🌐';
    };
    
    // Get language name based on language code
    const getLanguageName = (langCode) => {
        const languageInfo = getLanguageInfo(langCode);
        return languageInfo.nativeName || languageInfo.name || langCode;
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
                                    {SUPPORTED_LANGUAGES.map((lang) => (
                                        <button 
                                            key={lang.code}
                                            className={`${s.LanguageCard} ${lang.code === language ? s.ActiveCard : ''}`}
                                            onClick={() => changeLanguage(lang.code)}
                                            disabled={isLoading}
                                        >
                                            <span className={s.CardFlag}>{lang.flag}</span>
                                            <span className={s.CardName}>{lang.nativeName}</span>
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
