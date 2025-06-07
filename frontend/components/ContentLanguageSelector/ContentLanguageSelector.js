import React from 'react';
import PropTypes from 'prop-types';
import { SUPPORTED_LANGUAGES } from '../../config/languages';
import styles from './ContentLanguageSelector.module.css';

// Content languages based on the centralized language configuration
const CONTENT_LANGUAGE_OPTIONS = SUPPORTED_LANGUAGES.map(lang => ({
  value: lang.code,
  label: lang.name
}));

/**
 * Reusable content language selector component
 * Provides a dropdown for selecting a language for posts and learning resources
 */
const ContentLanguageSelector = ({ 
  value, 
  onChange, 
  disabled = false, 
  required = false,
  showAllOption = false,
  allOptionLabel = "All Languages",
  className = '',
  id,
  name,
  'aria-label': ariaLabel
}) => {
  const handleChange = (e) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };

  return (
    <select
      id={id}
      name={name}
      value={value || ''}
      onChange={handleChange}
      disabled={disabled}
      required={required}
      className={`${styles.languageSelect} ${className}`}
      aria-label={ariaLabel || 'Select content language'}
    >
      {showAllOption && (
        <option value="">{allOptionLabel}</option>
      )}
      {CONTENT_LANGUAGE_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};

ContentLanguageSelector.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  showAllOption: PropTypes.bool,
  allOptionLabel: PropTypes.string,
  className: PropTypes.string,
  id: PropTypes.string,
  name: PropTypes.string,
  'aria-label': PropTypes.string
};

export default ContentLanguageSelector;
export { CONTENT_LANGUAGE_OPTIONS };
