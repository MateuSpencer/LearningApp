import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Post from '../Post';
import EditPostForm from '../EditPostForm';
import { httpDelete } from '../../utils/Http';
import { useCSRFToken } from '../../context/CSRFTokenContext';
import s from './PostsList.module.css';

const PostsList = ({ pageSlug, onNewPost, showOnlyMyPosts, sortBy, filterType }) => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingPostId, setEditingPostId] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [deleteError, setDeleteError] = useState(null);
    
    // Use the CSRF token from context
    const { token: csrfToken, loading: tokenLoading, error: tokenError, refreshToken } = useCSRFToken();
    
    // Fetch the current user
    useEffect(() => {
        const fetchCurrentUser = async () => {
            try {
                const response = await fetch('/api/auth/user/');
                if (response.ok) {
                    const data = await response.json();
                    setCurrentUser(data.id.toString());
                }
            } catch (err) {
                console.error('Error fetching current user:', err);
            }
        };
        
        fetchCurrentUser();
    }, []);

    // Fetch posts
    useEffect(() => {
        const fetchPosts = async () => {
            try {
                setLoading(true);
                
                // Build the API URL with query parameters
                let apiUrl = '/api/posts/';
                const queryParams = [];
                
                if (pageSlug) {
                    queryParams.push(`page=${pageSlug}`);
                }
                
                if (showOnlyMyPosts) {
                    queryParams.push('my_posts=true');
                }
                
                if (filterType && filterType !== 'all') {
                    queryParams.push(`status=${filterType}`);
                }
                
                if (sortBy) {
                    queryParams.push(`sort=${sortBy}`);
                }
                
                if (queryParams.length > 0) {
                    apiUrl += `?${queryParams.join('&')}`;
                }
                
                const response = await fetch(apiUrl);
                
                if (!response.ok) {
                    throw new Error('Failed to fetch posts');
                }
                
                const data = await response.json();
                setPosts(data);
                setError(null);
            } catch (err) {
                console.error('Error fetching posts:', err);
                setError('Failed to load posts. Please try again later.');
            } finally {
                setLoading(false);
            }
        };
        
        fetchPosts();
    }, [pageSlug, showOnlyMyPosts, sortBy, filterType, currentUser]);

    // Keep the rest of the component as is
    const handleEdit = (postId) => {
        setEditingPostId(postId);
    };
    
    const handleSaveEdit = (updatedPost) => {
        setPosts(posts.map(post => 
            post.id === updatedPost.id ? updatedPost : post
        ));
        setEditingPostId(null);
    };
    
    const handleCancelEdit = () => {
        setEditingPostId(null);
    };
    
    const handleDelete = async (postId) => {
        setDeleteError(null);

        if (!csrfToken) {
            setDeleteError('Security token not available. Please try again later.');
            return;
        }

        // Confirm deletion with the user
        if (!window.confirm('Are you sure you want to delete this post?')) {
            return;
        }
        
        try {
            // Use httpDelete with the token from context
            await httpDelete(`/api/posts/${postId}/`, csrfToken);
            
            // Remove the deleted post from state
            setPosts(posts.filter(post => post.id !== postId));
            
        } catch (err) {
            console.error('Error deleting post:', err);
            
            // Check if it's a CSRF token issue (usually 403 Forbidden)
            if (err.status === 403) {
                setDeleteError('Your session may have expired. Refreshing...');
                try {
                    // Try to refresh the token
                    await refreshToken();
                    setDeleteError('Please try deleting again.');
                } catch (refreshError) {
                    setDeleteError('Failed to refresh security token. Please reload the page.');
                }
            } else {
                setDeleteError(`Failed to delete post: ${err.message}`);
            }
        }
    };

    // Modify the header based on whether we're showing our own posts
    const headerTitle = showOnlyMyPosts ? "My Posts" : "Posts";

    return (
        <div className={s.container}>
            {!showOnlyMyPosts && (
                <div className={s.header}>
                    <h2 className={s.title}>{headerTitle}</h2>
                    {onNewPost && (
                        <button 
                            className={s.newPostButton}
                            onClick={onNewPost}
                            disabled={tokenLoading || !!tokenError} // Disable if token is loading or there's an error
                        >
                            Add New Post
                        </button>
                    )}
                </div>
            )}
            
            {/* Show token-related messages if needed */}
            {tokenLoading && <p className={s.loading}>Loading security token...</p>}
            {tokenError && (
                <div className={s.errorContainer}>
                    <p className={s.error}>Failed to load security token: {tokenError.message}</p>
                    <button 
                        onClick={refreshToken} 
                        className={s.retryButton}
                    >
                        Retry
                    </button>
                </div>
            )}
            
            {/* Show delete-specific errors */}
            {deleteError && <p className={s.error}>{deleteError}</p>}
            
            {/* Show post loading and errors */}
            {loading && <p className={s.loading}>Loading posts...</p>}
            {error && <p className={s.error}>{error}</p>}
            
            {!loading && !error && posts.length === 0 && (
                <p className={s.emptyMessage}>
                    {showOnlyMyPosts 
                        ? "You haven't created any posts yet."
                        : "No posts yet. Be the first to contribute!"}
                </p>
            )}
            
            <div className={s.postsList}>
                {posts.map(post => {
                    if (editingPostId === post.id) {
                        return (
                            <EditPostForm
                                key={post.id}
                                post={post}
                                onSave={handleSaveEdit}
                                onCancel={handleCancelEdit}
                            />
                        );
                    }
                    return (
                        <Post
                            key={post.id}
                            id={post.id}
                            title={post.title}
                            content={post.content}
                            author={post.author}
                            createdAt={post.created_at}
                            currentUser={currentUser}
                            slug={pageSlug}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            // Disable edit/delete if token is not available
                            canModify={!!csrfToken && !tokenLoading && !tokenError}
                        />
                    );
                })}
            </div>
        </div>
    );
};

PostsList.propTypes = {
    pageSlug: PropTypes.string,
    onNewPost: PropTypes.func,
    showOnlyMyPosts: PropTypes.bool,
    sortBy: PropTypes.string,
    filterType: PropTypes.string
};

PostsList.defaultProps = {
    pageSlug: '',
    onNewPost: null,
    showOnlyMyPosts: false,
    sortBy: 'newest',
    filterType: 'all'
};

export default PostsList;