import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// Create the authentication context
const AuthContext = createContext(null);

/**
 * AuthProvider component to manage authentication state
 * This provides login/logout state to the entire application
 */
export const AuthProvider = ({ children }) => {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Function to check authentication status
  const checkAuthStatus = useCallback(async () => {
    try {
      setError(null);
      
      const response = await fetch('/api/auth/status/', {
        credentials: 'include', // Include cookies in the request
      });
      
      if (response.ok) {
        const data = await response.json();
        
        setIsAuthenticated(data.isAuthenticated);
        
        // If authenticated, set user data from response
        if (data.isAuthenticated) {
          setUser({
            username: data.username,
            // Add any other user data returned by the API
          });
        } else {
          setUser(null);
        }
      } else {
        // Handle HTTP errors
        setIsAuthenticated(false);
        setUser(null);
        setError(`Authentication check failed: ${response.status}`);
      }
    } catch (error) {
      // Handle network or other errors
      console.error("Error checking authentication status:", error);
      setIsAuthenticated(false);
      setUser(null);
      setError(error.message || "Authentication check failed");
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Manual refresh function that can be called by components
  const refreshAuth = useCallback(() => {
    setIsLoading(true);
    return checkAuthStatus();
  }, [checkAuthStatus]);
  
  // Check auth status when the component mounts
  useEffect(() => {
    checkAuthStatus();
    
    // Periodically check authentication status (every 5 minutes)
    // This handles session expiration
    const interval = setInterval(checkAuthStatus, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [checkAuthStatus]);
  
  // Pass the authentication state and methods to children
  return (
    <AuthContext.Provider 
      value={{
        isAuthenticated, 
        user, 
        isLoading, 
        error,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to easily access the authentication context
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default AuthContext;