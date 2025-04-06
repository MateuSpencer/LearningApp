import React from 'react';
import PropTypes from 'prop-types';
import { useTheme } from '../../context/ThemeContext';
import s from './ThemeToggleButton.module.css';

const ThemeToggleButton = ({ small }) => {
    const { theme, toggleTheme } = useTheme();

    return (
        <button 
            className={`${s.ThemeToggle} ${small ? s.Small : ''}`}
            onClick={toggleTheme} 
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
            {theme === 'light' ? '🌙' : '☀️'}
        </button>
    );
};

ThemeToggleButton.propTypes = {
    small: PropTypes.bool
};

ThemeToggleButton.defaultProps = {
    small: false
};

export default ThemeToggleButton;