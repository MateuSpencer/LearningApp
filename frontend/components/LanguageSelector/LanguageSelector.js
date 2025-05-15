import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import s from './LanguageSelector.module.css';

const LanguageSelector = ({ onToggle }) => {
    const { language, setLanguage } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const selectorRef = useRef(null);

    // Get flag emoji based on language code
    const getFlag = (langCode) => {
        const flags = {
            en: '🇬🇧',
            es: '🇪🇸',
            fr: '🇫🇷',
            de: '🇩🇪',
        };
        return flags[langCode] || '🌐';
    };
    
    // Close language options when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (selectorRef.current && !selectorRef.current.contains(event.target)) {
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
    }, [onToggle]);

    const toggleLanguageOptions = () => {
        const newIsOpen = !isOpen;
        setIsOpen(newIsOpen);
        if (onToggle) {
            onToggle(newIsOpen);
        }
    };

    const changeLanguage = (newLanguage) => {
        setLanguage(newLanguage);
        setIsOpen(false);
    };

    // Currently only English is available
    const availableLanguages = [
        { code: 'en', name: 'English' }
    ];

    return (
        <div className={s.LanguageSelector} ref={selectorRef}>
            <button 
                className={s.LanguageButton} 
                onClick={toggleLanguageOptions}
                aria-label="Select language"
                aria-expanded={isOpen}
            >
                <span className={s.Flag}>{getFlag(language)}</span>
            </button>
            
            {isOpen && (
                <div className={s.LanguageToggle}>
                    <ul className={s.LanguageList}>
                        {availableLanguages.map((lang) => (
                            <li key={lang.code}>
                                <button 
                                    className={`${s.LanguageOption} ${lang.code === language ? s.Active : ''}`}
                                    onClick={() => changeLanguage(lang.code)}
                                >
                                    <span className={s.OptionFlag}>{getFlag(lang.code)}</span>
                                    <span className={s.OptionName}>{lang.name}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default LanguageSelector;
