import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { basePageWrap } from '../BasePage';
import PostsList from '../../components/PostsList';
import { useAuth } from '../../context/AuthContext';
import s from './PostsIndexPage.module.css';

const PostsIndexPage = ({ title, description }) => {
    const { isAuthenticated } = useAuth();
    const [showNewPostForm, setShowNewPostForm] = useState(false);
    
    // Handle creating a new post
    const handleNewPost = () => {
        setShowNewPostForm(true);
    };
    
    return (
        <div className={s.container}>
            <header className={s.header}>
                <h1 className={s.title}>{title}</h1>
                {description && <p className={s.description}>{description}</p>}
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
    title: 'Posts',
    description: 'Explore posts shared by our community members.',
};

export default basePageWrap(PostsIndexPage);
