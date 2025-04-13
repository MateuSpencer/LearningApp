import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Post from '../Post';
import s from './PostsList.module.css';

const PostsList = ({ pageSlug, onNewPost }) => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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

    return (
        <div className={s.container}>
            <div className={s.header}>
                <h2 className={s.title}>Discussion</h2>
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
                {posts.map(post => (
                    <Post
                        key={post.id}
                        title={post.title}
                        content={post.content}
                        author={post.author}
                        createdAt={post.created_at}
                    />
                ))}
            </div>
        </div>
    );
};

PostsList.propTypes = {
    pageSlug: PropTypes.string.isRequired,
    onNewPost: PropTypes.func.isRequired
};

export default PostsList;