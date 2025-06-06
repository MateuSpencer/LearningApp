import React from 'react';
import PropTypes from 'prop-types';
import { LANGUAGE_OPTIONS } from '../ContentLanguageSelector/ContentLanguageSelector';
import styles from './LanguageBadge.module.css';

/**
 * Language badge component for displaying language tags
 */
const LanguageBadge = ({ 
  language, 
  className = '',
  size = 'small'
}) => {
  if (!language) return null;

  const languageOption = LANGUAGE_OPTIONS.find(option => option.value === language);
  const languageLabel = languageOption ? languageOption.label : language.toUpperCase();

  return (
    <span 
      className={`${styles.languageBadge} ${styles[size]} ${className}`}
      title={`Language: ${languageLabel}`}
    >
      {languageLabel}
    </span>
  );
};

LanguageBadge.propTypes = {
  language: PropTypes.string.isRequired,
  className: PropTypes.string,
  size: PropTypes.oneOf(['small', 'medium', 'large'])
};

export default LanguageBadge;
