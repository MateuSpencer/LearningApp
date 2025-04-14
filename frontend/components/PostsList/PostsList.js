import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Post from '../Post';
import EditPostForm from '../EditPostForm';
import { fetchCsrfToken } from '../../utils/Http';
import s from './PostsList.module.css';

const PostsList = ({ pageSlug, onNewPost }) => {
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
                    // Store the ID as currentUser instead of username
                    setCurrentUser(data.id.toString()); // Convert to string for consistent comparison
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
                const response = await fetch(`/api/posts/?page=${pageSlug}`);
                
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
    }, [pageSlug]);

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

    return (
        <div className={s.container}>
            <div className={s.header}>
                <h2 className={s.title}>Posts</h2>
                <button 
                    className={s.newPostButton}
                    onClick={onNewPost}
                >
                    Add New Post
                </button>
            </div>
            
            {loading && <p className={s.loading}>Loading posts...</p>}
            {error && <p className={s.error}>{error}</p>}
            
            {!loading && !error && posts.length === 0 && (
                <p className={s.emptyMessage}>No posts yet. Be the first to contribute!</p>
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
    pageSlug: PropTypes.string.isRequired,
    onNewPost: PropTypes.func.isRequired
};

export default PostsList;