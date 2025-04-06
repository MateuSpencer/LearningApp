// This is a new file to create at:
// frontend/components/ThemeToggleButton/ThemeToggleButton.js
import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import s from './ThemeToggleButton.module.css';

const ThemeToggleButton = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <button 
            className={s.ThemeToggle} 
            onClick={toggleTheme} 
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
            {theme === 'light' ? '🌙' : '☀️'}
        </button>
    );
};

export default ThemeToggleButton;