import React from 'react';
import { basePageWrap } from '../BasePage';
import s from './HomePage.module.css';
import SearchBar from '../../components/SearchBar';
import Logo from '../../components/Logo';
import SiteName from '../../components/SiteName';

const HomePage = ({}) => {
    return (
        <div className={s.Container}>
            <div className={s.LogoContainer}>
                <Logo size="large" />
                <SiteName size="large" />
            </div>
            
            <div className={s.SearchContainer}>
                <SearchBar/>
            </div>
        </div>
    );
};

export default basePageWrap(HomePage);