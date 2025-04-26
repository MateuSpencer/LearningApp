import React from 'react';
import PropTypes from 'prop-types';
import s from './Button.module.css';

const Button = ({ onClick, children, disabled, className, type = 'button', ...rest }) => (
    <button 
        className={`${s.Button} ${className || ''}`} 
        onClick={onClick}
        disabled={disabled}
        type={type}
        {...rest}
    >
        {children}
    </button>
);

Button.propTypes = {
    onClick: PropTypes.func,
    children: PropTypes.node.isRequired,
    disabled: PropTypes.bool,
    className: PropTypes.string,
    type: PropTypes.string
};

Button.defaultProps = {
    onClick: () => {},
    disabled: false,
    className: '',
    type: 'button'
};

export default Button;