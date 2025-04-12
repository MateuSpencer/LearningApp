import React, { useState } from 'react';
import PropTypes from 'prop-types';
import s from './RegistrationForm.module.css';

const RegistrationForm = ({ onSubmit, isLoading, error }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: ''
  });

  const [formErrors, setFormErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
    
    // Clear error when field is edited
    if (formErrors[name]) {
      setFormErrors(prevErrors => ({
        ...prevErrors,
        [name]: null
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords don't match";
    }
    
    if (formData.password && formData.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      errors.email = "Please enter a valid email address";
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
    <div className={s.RegistrationForm}>
      <h2 className={s.Title}>Create Account</h2>
      {error && <div className={s.Error}>{error}</div>}
      
      <form onSubmit={handleSubmit}>
      <div className={s.FormGroup}>
        <label htmlFor="first_name">First Name</label>
        <input
          type="text"
          id="first_name"
          name="first_name"
          value={formData.first_name}
          onChange={handleChange}
          className={s.Input}
        />
      </div>
      <div className={s.FormGroup}>
        <label htmlFor="last_name">Last Name</label>
        <input
          type="text"
          id="last_name"
          name="last_name"
          value={formData.last_name}
          onChange={handleChange}
          className={s.Input}
        />
      </div>
        <div className={s.FormGroup}>
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            className={s.Input}
          />
          {formErrors.username && <div className={s.FieldError}>{formErrors.username}</div>}
        </div>
        
        <div className={s.FormGroup}>
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className={s.Input}
          />
          {formErrors.email && <div className={s.FieldError}>{formErrors.email}</div>}
        </div>
        
        <div className={s.FormGroup}>
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            className={s.Input}
          />
          {formErrors.password && <div className={s.FieldError}>{formErrors.password}</div>}
        </div>
        
        <div className={s.FormGroup}>
          <label htmlFor="confirmPassword">Confirm Password</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            className={s.Input}
          />
          {formErrors.confirmPassword && <div className={s.FieldError}>{formErrors.confirmPassword}</div>}
        </div>
        
        <button 
          type="submit" 
          className={s.Button} 
          disabled={isLoading}
        >
          {isLoading ? 'Creating Account...' : 'Register'}
        </button>
      </form>
    </div>
  );
};

RegistrationForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
  error: PropTypes.string
};

RegistrationForm.defaultProps = {
  isLoading: false,
  error: null
};

export default RegistrationForm;