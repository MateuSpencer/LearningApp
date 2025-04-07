import React from 'react';
import PropTypes from 'prop-types';
import s from './SiteName.module.css';

const SiteName = ({ text, size }) => {
    // Use the provided text or default to "LearningApp"
    const displayText = text || 'LearningApp';
    
    return (
        <span className={`${s.SiteName} ${s[size]}`}>
            {displayText}
        </span>
    );
};

SiteName.propTypes = {
    text: PropTypes.string,
    size: PropTypes.oneOf(['small', 'medium', 'large'])
};

SiteName.defaultProps = {
    text: 'LearningApp',
    size: 'medium'
};

export default SiteName;