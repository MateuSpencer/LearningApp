import React from 'react';
import PropTypes from 'prop-types';
import { SUPPORTED_LANGUAGES } from '../../config/languages';
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

  const languageOption = SUPPORTED_LANGUAGES.find(lang => lang.code === language);
  const languageLabel = languageOption ? languageOption.name : language.toUpperCase();

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
