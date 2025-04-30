import React from 'react';
import Link from 'next/link';
import PropTypes from 'prop-types';
import { useAuth } from '../../context/AuthContext';
import s from './AccountButton.module.css';

const AccountButton = () => {
    // Use the centralized auth context instead of managing state locally
    const { isAuthenticated, user, isLoading, error, refreshAuth } = useAuth();
    
    // Show a subtle loading state if we're still checking auth
    if (isLoading && isAuthenticated === null) {
        return (
            <div className={s.AccountButton}>
                <span className={s.Icon}>⋯</span>
            </div>
        );
    }

    return (
        <Link 
            href={isAuthenticated ? "/accounts/email/" : "/accounts/login/"} 
            className={s.AccountButton} 
            aria-label={isAuthenticated ? "Manage account" : "Sign in"}
            onClick={() => {
                if (isAuthenticated) {
                    // Refresh auth state when navigating to account page
                    refreshAuth();
                }
            }}
        >
            <span className={s.Icon}>{isAuthenticated ? '👤' : '🔑'}</span>
        </Link>
    );
};

AccountButton.propTypes = {};

AccountButton.defaultProps = {};

export default AccountButton;