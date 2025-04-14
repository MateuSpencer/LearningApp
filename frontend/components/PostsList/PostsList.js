import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Post from '../Post';
import EditPostForm from '../EditPostForm';
import { fetchCsrfToken } from '../../utils/Http';
import s from './PostsList.module.css';

const PostsList = ({ pageSlug, onNewPost, showOnlyMyPosts, sortBy, filterType }) => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingPostId, setEditingPostId] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    
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
        try {
            const csrfToken = await fetchCsrfToken();
            const response = await fetch(`/api/posts/${postId}/`, {
                method: 'DELETE',
                headers: {
                    'X-CSRFToken': csrfToken
                },
                credentials: 'same-origin'
            });
            
            if (!response.ok) {
                throw new Error(`Failed to delete: ${response.status} ${response.statusText}`);
            }
            
            // Remove the deleted post from state
            setPosts(posts.filter(post => post.id !== postId));
            
        } catch (err) {
            console.error('Error deleting post:', err);
            alert('Failed to delete post. Please try again.');
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
                        >
                            Add New Post
                        </button>
                    )}
                </div>
            )}
            
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