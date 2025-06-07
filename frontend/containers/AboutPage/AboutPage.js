import React from 'react';
import PropTypes from 'prop-types';
import { basePageWrap } from '../BasePage';
import RawHtml from '../../components/RawHtml';
import s from './AboutPage.module.css';

const AboutPage = ({ companyName, aboutText }) => {
    return (
        <div className={s.container}>
            <div className={s.contentWrapper}>
                <h1 className={s.title}>About {companyName}</h1>
                <div className={s.aboutContent}>
                    <RawHtml html={aboutText} />
                </div>
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