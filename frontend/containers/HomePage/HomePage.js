import React from 'react';
import PropTypes from 'prop-types';
import { basePageWrap } from '../BasePage';
import SearchBar from '../../components/SearchBar';
import s from './HomePage.module.css';

const HomePage = ({ title }) => {
    const handleSearch = (query) => {
        // TODO: Implement search functionality
    };

    return (
        <div className={s.Container}>
            <div className={s.SiteNameContainer}>
                <h1 className={s.SiteName}>LearningApp</h1>
            </div>
            <div className={s.SearchContainer}>
                <h2 className={s.Title}>What do you want to learn?</h2>
                <SearchBar 
                    onSearch={handleSearch} 
                    placeholder="Type anything..." 
                />
            </div>
        </div>
    );
};

HomePage.defaultProps = {
    title: 'What do you want to learn?',
};

HomePage.propTypes = {
    title: PropTypes.string.isRequired,
};

export default basePageWrap(HomePage);