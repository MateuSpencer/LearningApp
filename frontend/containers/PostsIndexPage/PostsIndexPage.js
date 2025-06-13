import React from 'react';
import PropTypes from 'prop-types';
import { basePageWrap } from '../BasePage';
import PostsList from '../../components/PostsList';
import { useTranslation } from '../../hooks/useTranslation';
import s from './PostsIndexPage.module.css';

const PostsIndexPage = ({ title, description }) => {
    const { t } = useTranslation();
    
    return (
        <div className={s.container}>
            <div className={s.centeredHeader}>
                <h1 className={s.title}>{t('posts.browserTitle')}</h1>
            </div>
            
            <div className={s.postsListContainer}>
                <PostsList 
                    showOnlyMyPosts={false}
                    allowedFilters={['status', 'timeframe', 'search', 'author', 'language']}
                    allowedSortFields={['votes_score', 'created_at', 'updated_at', 'title', 'status']}
                />
            </div>
        </div>
    );
};

PostsIndexPage.propTypes = {
    title: PropTypes.string,
    description: PropTypes.string
};

PostsIndexPage.defaultProps = {
    title: '',
    description: '',
};

export default basePageWrap(PostsIndexPage);
