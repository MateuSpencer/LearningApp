import React from 'react';
import Link from 'next/link';
import PropTypes from 'prop-types';
import s from './AboutButton.module.css';

const AboutButton = ({ expanded }) => {
    if (!expanded) {
        return null;
    }

    return (
        <Link href="/about/" className={s.AboutButton} aria-label="About page">
            <span className={s.Icon}>?</span>
        </Link>
    );
};

AboutButton.propTypes = {
    expanded: PropTypes.bool
};

AboutButton.defaultProps = {
    expanded: false
};

export default AboutButton;