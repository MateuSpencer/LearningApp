import React, { useState } from 'react';
import PropTypes from 'prop-types';
import s from './LoginForm.module.css';

const LoginForm = ({ onSubmit, isLoading, error }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className={s.LoginForm}>
      <h2 className={s.Title}>Log In</h2>
      {error && <div className={s.Error}>{error}</div>}
      <form onSubmit={handleSubmit}>
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
        </div>
        <button 
          type="submit" 
          className={s.Button} 
          disabled={isLoading}
        >
          {isLoading ? 'Logging in...' : 'Log In'}
        </button>
      </form>
    </div>
  );
};

LoginForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
  error: PropTypes.string
};

LoginForm.defaultProps = {
  isLoading: false,
  error: null
};

export default LoginForm;