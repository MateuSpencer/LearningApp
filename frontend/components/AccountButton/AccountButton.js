import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import PropTypes from 'prop-types';
import s from './AccountButton.module.css';

const AccountButton = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    
    // Check authentication status when component mounts
    useEffect(() => {
        const checkAuthStatus = async () => {
            try {
                setIsLoading(true);
                const response = await fetch('/api/auth/status/', {
                    credentials: 'include', // Important: include cookies in the request
                });
                
                if (response.ok) {
                    const data = await response.json();
                    setIsAuthenticated(data.isAuthenticated);
                } else {
                    // If the request fails, assume not authenticated
                    setIsAuthenticated(false);
                }
            } catch (error) {
                console.error("Error checking authentication status:", error);
                setIsAuthenticated(false);
            } finally {
                setIsLoading(false);
            }
        };

        checkAuthStatus();
        
        // Check authentication status periodically (every 5 minutes)
        const interval = setInterval(checkAuthStatus, 5 * 60 * 1000);
        
        return () => clearInterval(interval);
    }, []);

    // Show a subtle loading state or use the last known auth state
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
        >
            <span className={s.Icon}>{isAuthenticated ? '👤' : '🔑'}</span>
        </Link>
    );
};

AccountButton.propTypes = {};

AccountButton.defaultProps = {};

export default AccountButton;