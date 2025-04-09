import React from 'react';
import PropTypes from 'prop-types';
import { basePageWrap } from '../BasePage';
import RawHtml from '../../components/RawHtml';
import s from './AboutPage.module.css';

const AboutPage = ({ companyName, aboutText }) => {
    return (
        <div className={s.AboutPage}>
            <h1>About {companyName}</h1>
            <div className={s.AboutContent}>
                <RawHtml html={aboutText} />
            </div>
        </div>
    );
};

AboutPage.defaultProps = {
    companyName: '',
    aboutText: '',
};

AboutPage.propTypes = {
    companyName: PropTypes.string,
    aboutText: PropTypes.string,
};

export default basePageWrap(AboutPage);