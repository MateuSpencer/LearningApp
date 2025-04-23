import React, { useState, useEffect } from 'react';
import { basePageWrap } from '../BasePage';
import LoginForm from '../../components/LoginForm';
import RegistrationForm from '../../components/RegistrationForm';
import UserProfile from '../../components/UserProfile';
import LogoutButton from '../../components/LogoutButton';
import ChangePasswordForm from '../../components/ChangePasswordForm';
import DeleteAccountButton from '../../components/DeleteAccountButton';
import auth from '../../api/auth';
import s from './AccountPage.module.css';

const AccountPage = () => {
  // User state
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Form display state
  const [showLogin, setShowLogin] = useState(true);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  
  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState(null);
  const [registrationError, setRegistrationError] = useState(null);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [passwordChangeLoading, setPasswordChangeLoading] = useState(false);
  const [passwordChangeError, setPasswordChangeError] = useState(null);
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false);
  const [deleteAccountLoading, setDeleteAccountLoading] = useState(false);

  // Check if user is already logged in
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const userData = await auth.getCurrentUser();
        if (userData) {
          setUser(userData);
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
      const userData = await auth.login(formData);
      setUser(userData);
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
      const userData = await auth.register(formData);
      setUser(userData);
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
      await auth.logout();
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
  
  // Show password change form
  const handleShowPasswordForm = () => {
    setShowPasswordForm(true);
    setPasswordChangeError(null);
    setPasswordChangeSuccess(false);
  };
  
  // Hide password change form
  const handleCancelPasswordChange = () => {
    setShowPasswordForm(false);
    setPasswordChangeError(null);
  };
  
  // Handle password change
  const handlePasswordChange = async (passwordData) => {
    setPasswordChangeLoading(true);
    setPasswordChangeError(null);
    setPasswordChangeSuccess(false);
    
    try {
      // Send only the required fields to the API
      const { current_password, new_password } = passwordData;
      await auth.changePassword({ current_password, new_password });
      
      // Show success message and hide form after successful password change
      setPasswordChangeSuccess(true);
      setTimeout(() => {
        setShowPasswordForm(false);
        setPasswordChangeSuccess(false);
      }, 3000);
    } catch (error) {
      setPasswordChangeError(error.message || 'Failed to change password. Please try again.');
    } finally {
      setPasswordChangeLoading(false);
    }
  };
  
  // Handle account deletion
  const handleDeleteAccount = async () => {
    setDeleteAccountLoading(true);
    
    try {
      await auth.deleteAccount();
      // Logout the user after successful account deletion
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Error deleting account:', error);
      alert(error.message || 'Failed to delete account. Please try again later.');
    } finally {
      setDeleteAccountLoading(false);
    }
  };

  return (
    <div className={s.AccountPage}>
      <h1 className={s.Title}>My Account</h1>
      
      {isAuthenticated ? (
        <div className={s.ProfileSection}>
          {passwordChangeSuccess && (
            <div className={s.SuccessMessage}>
              Password changed successfully!
            </div>
          )}
          
          {!showPasswordForm ? (
            <>
              <UserProfile user={user} />
              
              <div className={s.AccountActions}>
                <button 
                  className={s.ChangePasswordButton}
                  onClick={handleShowPasswordForm}
                >
                  Change Password
                </button>
                
                <div className={s.LogoutSection}>
                  <LogoutButton onLogout={handleLogout} isLoading={logoutLoading} />
                </div>
                
                <div className={s.DangerZone}>
                  <h3 className={s.DangerZoneTitle}>Danger Zone</h3>
                  <DeleteAccountButton 
                    onDeleteAccount={handleDeleteAccount}
                    isLoading={deleteAccountLoading}
                  />
                </div>
              </div>
            </>
          ) : (
            <ChangePasswordForm 
              onSubmit={handlePasswordChange}
              onCancel={handleCancelPasswordChange}
              isLoading={passwordChangeLoading}
              error={passwordChangeError}
            />
          )}
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