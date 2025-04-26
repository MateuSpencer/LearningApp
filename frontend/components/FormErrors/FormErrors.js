import React from 'react';
import PropTypes from 'prop-types';

/**
 * Component to display form errors from API responses
 * 
 * @param {Object} props
 * @param {Array} props.errors - Array of error objects
 * @param {string} props.param - Optional parameter name to filter errors by
 * @returns {JSX.Element|null}
 */
const FormErrors = ({ errors, param }) => {
  if (!errors || !errors.length) {
    return null;
  }

  // If a specific parameter is requested, filter errors for that param
  const relevantErrors = param
    ? errors.filter(error => error.param === param)
    : errors.filter(error => !error.param);

  if (!relevantErrors.length) {
    return null;
  }

  return (
    <div className="form-errors">
      {relevantErrors.map((error, index) => (
        <div key={index} className="error-message">
          {error.message}
        </div>
      ))}
    </div>
  );
};

FormErrors.propTypes = {
  errors: PropTypes.arrayOf(
    PropTypes.shape({
      param: PropTypes.string,
      message: PropTypes.string.isRequired,
    })
  ),
  param: PropTypes.string
};

export default FormErrors;