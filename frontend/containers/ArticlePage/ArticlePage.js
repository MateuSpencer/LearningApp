import React from 'react';
import PropTypes from 'prop-types';
import { basePageWrap } from '../BasePage';
import RawHtml from '../../components/RawHtml';
import s from './ArticlePage.module.css';

const ArticlePage = ({ title, richText, wikiUrl }) => {
    return (
        <div className={s.Container}>
            <h1 className={s.Title}>{title}</h1>
            <h3 className={s.Subtitle}>Wikipedia</h3>
            {wikiUrl && (
                <div className={s.UrlContainer}>
                    <a href={wikiUrl} target="_blank" rel="noopener noreferrer">
                        {wikiUrl}
                    </a>
                </div>
            )}
            <div className={s.Content}>
                <RawHtml html={richText} />
            </div>
        </div>
    );
};

ArticlePage.defaultProps = {
    title: '',
    richText: '',
    wikiUrl: '',
};

ArticlePage.propTypes = {
    title: PropTypes.string.isRequired,
    richText: PropTypes.string,
    wikiUrl: PropTypes.string,
};

export default basePageWrap(ArticlePage);
