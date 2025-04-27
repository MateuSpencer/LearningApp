import React from 'react';
import Link from 'next/link';
import PropTypes from 'prop-types';
import { useUser } from '../../auth/hooks'; 
import s from './AccountButton.module.css';

const AccountButton = () => {
    const user = useUser();
    
    // Determine where to link based on authentication status
    const linkHref = user ? "/account/password/change" : "/account/login"; 
    const ariaLabel = user ? `Account (${user.username || user.email})` : "Login";
    
    return (
        <Link href={linkHref} className={s.AccountButton} aria-label={ariaLabel}>
            <span className={s.Icon}>{user ? '👤' : '🔑'}</span>
            {user && <span className={s.Username}>{user.username || user.email.split('@')[0]}</span>}
        </Link>
    );
};

export default AccountButton;