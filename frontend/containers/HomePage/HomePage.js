import React from 'react';
import PropTypes from 'prop-types';
import { basePageWrap } from '../BasePage';
import s from './HomePage.module.css';
import SearchBar from '../../components/SearchBar';
import Logo from '../../components/Logo';
import SiteName from '../../components/SiteName';

const HomePage = ({ siteName }) => {
    const handleSearch = (query) => {
        console.log('Search query:', query);
        // Implement search functionality
    };

    return (
        <div className={s.Container}>
            <div className={s.LogoContainer}>
                <Logo size="large" />
                <SiteName text={siteName} size="large" />
            </div>
            
            <div className={s.SearchContainer}>
                <SearchBar 
                    placeholder="What do you want to learn?" 
                    onSearch={handleSearch}
                    maxLength={50}
                />
            </div>
        </div>
    );
};

HomePage.defaultProps = {
    siteName: 'LearningApp'
};

HomePage.propTypes = {
    siteName: PropTypes.string
};

export default basePageWrap(HomePage);