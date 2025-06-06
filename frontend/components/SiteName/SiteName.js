import React from 'react';
import PropTypes from 'prop-types';
import Link from 'next/link';
import s from './SiteName.module.css';

const SiteName = ({ size, linkToHome = true }) => {
    const displayText = 'LearningApp';
    
    const SiteNameText = (
        <span className={`${s.SiteName} ${s[size]}`}>
            {displayText}
        </span>
    );

    return linkToHome ? (
        <Link href="/" className={s.SiteNameContainer}>
            {SiteNameText}
        </Link>
    ) : (
        <div className={s.SiteNameContainer}>
            {SiteNameText}
        </div>
    );
};

SiteName.propTypes = {
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    linkToHome: PropTypes.bool
};

SiteName.defaultProps = {
    size: 'medium',
    linkToHome: true
};

export default SiteName;