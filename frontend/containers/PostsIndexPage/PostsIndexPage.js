import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { basePageWrap } from '../BasePage';
import PostsList from '../../components/PostsList';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../hooks/useTranslation';
import s from './PostsIndexPage.module.css';

const PostsIndexPage = ({ title, description }) => {
    const { isAuthenticated } = useAuth();
    const { t } = useTranslation();
    const [showNewPostForm, setShowNewPostForm] = useState(false);
    
    // Handle creating a new post
    const handleNewPost = () => {
        setShowNewPostForm(true);
    };
    
    return (
        <div className={s.container}>
            <header className={s.header}>
                <h1 className={s.title}>{title || t('posts.title')}</h1>
                {(description || !title) && <p className={s.description}>{description || t('posts.explore')}</p>}
            </header>
            
            <div className={s.postsListContainer}>
                <PostsList 
                    showOnlyMyPosts={false}
                    onNewPost={isAuthenticated ? handleNewPost : null}
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
