import React from 'react';
import Link from 'next/link';
import PropTypes from 'prop-types';
import s from './AccountButton.module.css';

const AccountButton = () => {
    return (
        <Link href="/accounts/login" className={s.AccountButton} aria-label="Account page">
            <span className={s.Icon}>👤</span>
        </Link>
    );
};

AccountButton.propTypes = {};

AccountButton.defaultProps = {};

export default AccountButton;