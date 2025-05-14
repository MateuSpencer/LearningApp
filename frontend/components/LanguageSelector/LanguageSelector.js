import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import s from './LanguageSelector.module.css';

const LanguageSelector = ({ onDropdownToggle }) => {
    const { language, setLanguage } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

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
    
    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
                if (onDropdownToggle) {
                    onDropdownToggle(false);
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onDropdownToggle]);

    const toggleDropdown = () => {
        const newIsOpen = !isOpen;
        setIsOpen(newIsOpen);
        if (onDropdownToggle) {
            onDropdownToggle(newIsOpen);
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
        <div className={s.LanguageSelector} ref={dropdownRef}>
            <button 
                className={s.LanguageButton} 
                onClick={toggleDropdown}
                aria-label="Select language"
                aria-expanded={isOpen}
            >
                <span className={s.Flag}>{getFlag(language)}</span>
            </button>
            
            {isOpen && (
                <div className={s.LanguageDropdown} style={{
                    // Override any positioning from CSS to ensure visibility
                    position: 'fixed',
                    bottom: '120px',
                    left: '30px',
                    zIndex: 10000,
                    visibility: 'visible',
                    opacity: 1,
                    display: 'block'
                }}>
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
