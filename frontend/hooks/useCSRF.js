import { useState, useEffect } from 'react';

/**
 * Custom hook for getting CSRF token from Django cookie
 * 
 * @returns {Object} Object containing the CSRF token and loading state
 */
export const useCSRF = () => {
  const [csrfToken, setCsrfToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getCsrfToken = () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // First, try to get CSRF token from cookies (Django standard approach)
        const allCookies = document.cookie;
        
        if (allCookies) {
          // Look for any cookie that might be a CSRF token
          // Django can use several different names
          const tokenCookieNames = ['csrftoken', 'csrf_token', 'CSRF-TOKEN', 'XSRF-TOKEN'];
          
          // Find any cookie that matches our expected names
          const csrfCookie = document.cookie
            .split('; ')
            .find(row => {
              const cookieName = row.split('=')[0];
              return tokenCookieNames.some(name => cookieName.toLowerCase() === name.toLowerCase());
            });
          
          if (csrfCookie) {
            const token = csrfCookie.split('=')[1];
            setCsrfToken(token);
            setIsLoading(false);
            return;
          }
        }
        
        // Second, try to get token from meta tag
        const metaTag = document.querySelector('meta[name="csrf-token"]');
        if (metaTag) {
          const token = metaTag.getAttribute('content');
          setCsrfToken(token);
          setIsLoading(false);
          return;
        }
        
        // Third, try to get token from form fields
        const csrfInput = document.querySelector('[name=csrfmiddlewaretoken]');
        if (csrfInput) {
          setCsrfToken(csrfInput.value);
          setIsLoading(false);
          return;
        }
        
        // If no token found, make a request to auth_status to set a new token
        fetch('/api/auth/status/', {
          credentials: 'include',
          cache: 'no-store'
        })
          .then(response => {
            // Wait a moment for cookies to be set
            setTimeout(() => {
              // Try again to get the token
              const foundCookie = document.cookie
                .split('; ')
                .find(row => {
                  const cookieName = row.split('=')[0];
                  return tokenCookieNames.some(name => cookieName.toLowerCase() === name.toLowerCase());
                });
                
              if (foundCookie) {
                const token = foundCookie.split('=')[1];
                setCsrfToken(token);
              } else {
                setError('Could not get CSRF token. Please ensure cookies are enabled in your browser.');
              }
              
              setIsLoading(false);
            }, 100);
          })
          .catch(err => {
            setError('Could not refresh CSRF token. Please reload the page.');
            setIsLoading(false);
          });
      } catch (err) {
        setError(err.message || 'Failed to get CSRF token');
        setIsLoading(false);
      }
    };

    getCsrfToken();
    
    // Re-check the token when the document becomes visible (tab switch)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        getCsrfToken();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return { csrfToken, isLoading, error };
};

/**
 * Gets the CSRF token synchronously from various sources
 * For use in utility functions where hooks can't be used
 * 
 * @returns {string|null} The CSRF token or null if not found
 */
export const getCsrfToken = () => {
  try {
    // First check cookies with multiple possible names
    const tokenCookieNames = ['csrftoken', 'csrf_token', 'CSRF-TOKEN', 'XSRF-TOKEN'];
    
    // Look for any cookie that might be a CSRF token
    const csrfCookie = document.cookie
      .split('; ')
      .find(row => {
        if (!row.includes('=')) return false;
        const cookieName = row.split('=')[0];
        return tokenCookieNames.some(name => cookieName.toLowerCase() === name.toLowerCase());
      });
      
    if (csrfCookie) {
      return csrfCookie.split('=')[1];
    }
    
    // Then check meta tags
    const metaTag = document.querySelector('meta[name="csrf-token"]');
    if (metaTag) {
      return metaTag.getAttribute('content');
    }
    
    // Finally check form fields
    const csrfInput = document.querySelector('[name=csrfmiddlewaretoken]');
    if (csrfInput) {
      return csrfInput.value;
    }
    
    // If we get this far, no token was found
  } catch (err) {
    // Error handling silently failed
  }
  
  // If no token is found, trigger a refresh by making a request to auth_status
  // This is done asynchronously, so the current call will return null
  fetch('/api/auth/status/', { 
    credentials: 'include',
    cache: 'no-store'
  }).catch(() => {});
  
  return null;
};

export default useCSRF;