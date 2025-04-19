import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { fetchCsrfToken } from '../utils/Http';

// Create the context
const CSRFTokenContext = createContext();

/**
 * Provider component for CSRF token management
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components that will have access to the context
 */
export const CSRFTokenProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Function to fetch the CSRF token
  const getToken = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const csrfToken = await fetchCsrfToken();
      setToken(csrfToken);
      return csrfToken;
    } catch (err) {
      console.error('Failed to fetch CSRF token:', err);
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Method to refresh the token (e.g., when it expires)
  const refreshToken = useCallback(async () => {
    return getToken();
  }, [getToken]);

  // Fetch token when the provider mounts
  useEffect(() => {
    getToken();
  }, [getToken]);

  // Context value
  const contextValue = {
    token,
    loading,
    error,
    refreshToken
  };

  return (
    <CSRFTokenContext.Provider value={contextValue}>
      {children}
    </CSRFTokenContext.Provider>
  );
};

/**
 * Custom hook to access the CSRF token context
 * @returns {Object} Object containing token, loading state, error, and refreshToken method
 */
export const useCSRFToken = () => {
  const context = useContext(CSRFTokenContext);
  
  if (!context) {
    throw new Error('useCSRFToken must be used within a CSRFTokenProvider');
  }
  
  return context;
};

export default CSRFTokenContext;