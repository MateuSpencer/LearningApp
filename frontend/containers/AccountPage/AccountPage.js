import React, { useState, useEffect } from 'react';
import { basePageWrap } from '../BasePage';
import LoginForm from '../../components/LoginForm';
import RegistrationForm from '../../components/RegistrationForm';
import UserProfile from '../../components/UserProfile';
import LogoutButton from '../../components/LogoutButton';
import s from './AccountPage.module.css';

const AccountPage = () => {
  // User state
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Form display state
  const [showLogin, setShowLogin] = useState(true);
  
  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState(null);
  const [registrationError, setRegistrationError] = useState(null);
  const [logoutLoading, setLogoutLoading] = useState(false);

  // Check if user is already logged in
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // We'll implement this API function later
        // const response = await fetch('/api/auth/user', {
        //   credentials: 'include',
        // });
        
        // if (response.ok) {
        //   const userData = await response.json();
        //   setUser(userData);
        //   setIsAuthenticated(true);
        // }

        // For now, just check localStorage as a placeholder
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error checking authentication status:', error);
      }
    };

    checkAuthStatus();
  }, []);

  // Handle login form submission
  const handleLogin = async (formData) => {
    setIsLoading(true);
    setLoginError(null);
    
    try {
      // We'll implement this API call later
      // const response = await fetch('/api/auth/login', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(formData),
      //   credentials: 'include',
      // });
      
      // if (!response.ok) {
      //   const errorData = await response.json();
      //   throw new Error(errorData.message || 'Login failed');
      // }
      
      // const userData = await response.json();
      
      // Simulated login for now
      const mockUser = {
        username: formData.username,
        email: `${formData.username}@example.com`,
        dateJoined: new Date().toISOString()
      };
      
      // Store user in localStorage (temporary solution)
      localStorage.setItem('user', JSON.stringify(mockUser));
      
      setUser(mockUser);
      setIsAuthenticated(true);
    } catch (error) {
      setLoginError(error.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle registration form submission
  const handleRegistration = async (formData) => {
    setIsLoading(true);
    setRegistrationError(null);
    
    try {
      // We'll implement this API call later
      // const response = await fetch('/api/auth/register', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(formData),
      //   credentials: 'include',
      // });
      
      // if (!response.ok) {
      //   const errorData = await response.json();
      //   throw new Error(errorData.message || 'Registration failed');
      // }
      
      // const userData = await response.json();
      
      // Simulated registration for now
      const mockUser = {
        username: formData.username,
        email: formData.email,
        dateJoined: new Date().toISOString()
      };
      
      // Store user in localStorage (temporary solution)
      localStorage.setItem('user', JSON.stringify(mockUser));
      
      setUser(mockUser);
      setIsAuthenticated(true);
    } catch (error) {
      setRegistrationError(error.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    setLogoutLoading(true);
    
    try {
      // We'll implement this API call later
      // await fetch('/api/auth/logout', {
      //   method: 'POST',
      //   credentials: 'include',
      // });
      
      // Clear user from localStorage
      localStorage.removeItem('user');
      
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Error logging out:', error);
    } finally {
      setLogoutLoading(false);
    }
  };

  // Toggle between login and registration forms
  const toggleForm = () => {
    setShowLogin(!showLogin);
    setLoginError(null);
    setRegistrationError(null);
  };

  return (
    <div className={s.AccountPage}>
      <h1 className={s.Title}>My Account</h1>
      
      {isAuthenticated ? (
        <div className={s.ProfileSection}>
          <UserProfile user={user} />
          <div className={s.LogoutSection}>
            <LogoutButton onLogout={handleLogout} isLoading={logoutLoading} />
          </div>
        </div>
      ) : (
        <div className={s.AuthForms}>
          {showLogin ? (
            <div className={s.FormContainer}>
              <LoginForm 
                onSubmit={handleLogin}
                isLoading={isLoading}
                error={loginError}
              />
              <div className={s.FormToggle}>
                Don't have an account? 
                <button 
                  className={s.ToggleButton} 
                  onClick={toggleForm}
                  type="button"
                >
                  Register
                </button>
              </div>
            </div>
          ) : (
            <div className={s.FormContainer}>
              <RegistrationForm 
                onSubmit={handleRegistration}
                isLoading={isLoading}
                error={registrationError}
              />
              <div className={s.FormToggle}>
                Already have an account? 
                <button 
                  className={s.ToggleButton} 
                  onClick={toggleForm}
                  type="button"
                >
                  Log In
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default basePageWrap(AccountPage);