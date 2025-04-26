import React from 'react';
import Link from 'next/link';
import PropTypes from 'prop-types';
import { useUser } from '../../auth'; // Updated import path
import s from './AccountButton.module.css';

const AccountButton = () => {
    const user = useUser();
    
    // Determine where to link based on authentication status
    const linkHref = user ? "/account/profile" : "/account/login";
    const ariaLabel = user ? "My account" : "Login or sign up";
    
    return (
        <Link href={linkHref} className={s.AccountButton} aria-label={ariaLabel}>
            <span className={s.Icon}>👤</span>
        </Link>
    );
};

AccountButton.propTypes = {};

AccountButton.defaultProps = {};

export default AccountButton;