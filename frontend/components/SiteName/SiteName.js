import React from 'react';
import PropTypes from 'prop-types';
import s from './SiteName.module.css';

const SiteName = ({ size }) => {
    const displayText ='LearningApp';
    
    return (
        <span className={`${s.SiteName} ${s[size]}`}>
            {displayText}
        </span>
    );
};

SiteName.propTypes = {
    size: PropTypes.oneOf(['small', 'medium', 'large'])
};

SiteName.defaultProps = {
    size: 'medium'
};

export default SiteName;