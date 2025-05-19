import React from 'react';
import PropTypes from 'prop-types';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import s from './AIResourceSummaryButton.module.css';

const AIResourceSummaryButton = ({ resourceId, onClick, isGenerating = false }) => {
    const { isAuthenticated } = useAuth();
    const router = useRouter();
    
    const handleClick = () => {
        // Redirect to login if not authenticated
        if (!isAuthenticated) {
            router.push('/accounts/login/');
            return;
        }
        
        // Call the provided onClick handler if authenticated
        if (onClick && typeof onClick === 'function') {
            onClick(resourceId);
        }
    };
    
    return (
        <button 
            className={`${s.button} ${isGenerating ? s.generating : ''}`}
            onClick={handleClick}
            disabled={isGenerating}
        >
            {isGenerating ? (
                <>
                    <span className={s.loadingIcon}></span>
                    Generating Summary...
                </>
            ) : (
                <>
                    <span className={s.aiIcon}>✨</span>
                    Generate AI Summary
                </>
            )}
        </button>
    );
};

AIResourceSummaryButton.propTypes = {
    resourceId: PropTypes.string,
    onClick: PropTypes.func,
    isGenerating: PropTypes.bool
};

export default AIResourceSummaryButton;
