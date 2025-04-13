import React, { useState } from 'react';
import PropTypes from 'prop-types';
import s from './NewPostForm.module.css';

const NewPostForm = ({ pageSlug, onSubmit, onCancel }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!title.trim() || !content.trim()) {
            setError('Title and content are required');
            return;
        }
        
        try {
            setSubmitting(true);
            setError(null);
            
            const response = await fetch('/api/posts/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title,
                    content,
                    page_slug: pageSlug
                }),
            });
            
            if (!response.ok) {
                throw new Error('Failed to create post');
            }
            
            const newPost = await response.json();
            setTitle('');
            setContent('');
            onSubmit(newPost);
            
        } catch (err) {
            console.error('Error creating post:', err);
            setError('Failed to create post. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className={s.formContainer}>
            <h3 className={s.formTitle}>Create New Post</h3>
            
            {error && <div className={s.errorMessage}>{error}</div>}
            
            <form onSubmit={handleSubmit} className={s.form}>
                <div className={s.formGroup}>
                    <label htmlFor="title" className={s.label}>Title</label>
                    <input
                        type="text"
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className={s.input}
                        disabled={submitting}
                        placeholder="Enter post title"
                    />
                </div>
                
                <div className={s.formGroup}>
                    <label htmlFor="content" className={s.label}>Content</label>
                    <textarea
                        id="content"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className={s.textarea}
                        disabled={submitting}
                        rows={5}
                        placeholder="Write your post content here"
                    />
                </div>
                
                <div className={s.buttonGroup}>
                    <button 
                        type="button" 
                        onClick={onCancel} 
                        className={s.cancelButton}
                        disabled={submitting}
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        className={s.submitButton}
                        disabled={submitting}
                    >
                        {submitting ? 'Submitting...' : 'Submit Post'}
                    </button>
                </div>
            </form>
        </div>
    );
};

NewPostForm.propTypes = {
    pageSlug: PropTypes.string.isRequired,
    onSubmit: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired
};

export default NewPostForm;