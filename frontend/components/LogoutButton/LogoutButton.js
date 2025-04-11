import React from 'react';
import PropTypes from 'prop-types';
import s from './LogoutButton.module.css';

const LogoutButton = ({ onLogout, isLoading }) => {
  return (
    <button 
      className={s.LogoutButton} 
      onClick={onLogout}
      disabled={isLoading}
    >
      {isLoading ? 'Logging out...' : 'Log Out'}
    </button>
  );
};

LogoutButton.propTypes = {
  onLogout: PropTypes.func.isRequired,
  isLoading: PropTypes.bool
};

LogoutButton.defaultProps = {
  isLoading: false
};

export default LogoutButton;