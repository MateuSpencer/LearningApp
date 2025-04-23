import React, { useState } from 'react';
import PropTypes from 'prop-types';
import s from './ChangePasswordForm.module.css';

const ChangePasswordForm = ({ onSubmit, isLoading, error, onCancel }) => {
  const [formData, setFormData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  
  const [formErrors, setFormErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
    
    // Clear field error when user starts typing again
    if (formErrors[name]) {
      setFormErrors(prevErrors => ({
        ...prevErrors,
        [name]: null
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    // Validate current password
    if (!formData.current_password.trim()) {
      errors.current_password = "Current password is required";
    }
    
    // Validate new password
    if (!formData.new_password.trim()) {
      errors.new_password = "New password is required";
    } else if (formData.new_password.length < 8) {
      errors.new_password = "Password must be at least 8 characters";
    }
    
    // Validate confirmation
    if (formData.new_password !== formData.confirm_password) {
      errors.confirm_password = "Passwords do not match";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <div className={s.ChangePasswordForm}>
      <h2 className={s.Title}>Change Password</h2>
      {error && <div className={s.Error}>{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className={s.FormGroup}>
          <label htmlFor="current_password">Current Password</label>
          <input
            type="password"
            id="current_password"
            name="current_password"
            value={formData.current_password}
            onChange={handleChange}
            className={s.Input}
            required
          />
          {formErrors.current_password && (
            <div className={s.FieldError}>{formErrors.current_password}</div>
          )}
        </div>
        
        <div className={s.FormGroup}>
          <label htmlFor="new_password">New Password</label>
          <input
            type="password"
            id="new_password"
            name="new_password"
            value={formData.new_password}
            onChange={handleChange}
            className={s.Input}
            required
          />
          {formErrors.new_password && (
            <div className={s.FieldError}>{formErrors.new_password}</div>
          )}
        </div>
        
        <div className={s.FormGroup}>
          <label htmlFor="confirm_password">Confirm New Password</label>
          <input
            type="password"
            id="confirm_password"
            name="confirm_password"
            value={formData.confirm_password}
            onChange={handleChange}
            className={s.Input}
            required
          />
          {formErrors.confirm_password && (
            <div className={s.FieldError}>{formErrors.confirm_password}</div>
          )}
        </div>
        
        <div className={s.ButtonGroup}>
          <button 
            type="submit" 
            className={s.Button} 
            disabled={isLoading}
          >
            {isLoading ? 'Changing Password...' : 'Change Password'}
          </button>
          
          <button
            type="button"
            className={s.CancelButton}
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

ChangePasswordForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
  error: PropTypes.string
};

ChangePasswordForm.defaultProps = {
  isLoading: false,
  error: null
};

export default ChangePasswordForm;