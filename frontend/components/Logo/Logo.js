import React from 'react';
import PropTypes from 'prop-types';
import Link from 'next/link';
import s from './Logo.module.css';

const Logo = ({ size, linkToHome = true }) => {
  const LogoImg = (
    <img 
      src="/img/logo.png" 
      alt="Logo" 
      className={`${s.LogoImage} ${s[size]}`}
    />
  );

  return linkToHome ? (
    <Link href="/" className={s.LogoContainer}>
      {LogoImg}
    </Link>
  ) : (
    <div className={s.LogoContainer}>
      {LogoImg}
    </div>
  );
};

Logo.propTypes = {
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  linkToHome: PropTypes.bool
};

Logo.defaultProps = {
  size: 'medium',
  linkToHome: true
};

export default Logo;