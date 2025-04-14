import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { fetchCsrfToken } from '../../utils/Http';
import s from './EditPostForm.module.css';

const EditPostForm = ({ post, onSave, onCancel }) => {
  const [title, setTitle] = useState(post.title);
  const [content, setContent] = useState(post.content);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [csrfToken, setCsrfToken] = useState(null);
  
  // Fetch CSRF token when component mounts
  useEffect(() => {
    const getToken = async () => {
      try {
        const token = await fetchCsrfToken();
        setCsrfToken(token);
      } catch (error) {
        console.error('Failed to fetch CSRF token:', error);
      }
    };
    
    getToken();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      setError('Title and content are required');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      const response = await fetch(`/api/posts/${post.id}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
        body: JSON.stringify({
          title,
          content,
          page_slug: post.page_slug // Add this line to include the page_slug
        }),
        credentials: 'same-origin'
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update post: ${response.status} ${response.statusText}\n${errorText}`);
      }
      
      const updatedPost = await response.json();
      onSave(updatedPost);
      
    } catch (err) {
      console.error('Error updating post:', err);
      setError(`Failed to update post: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
};

  return (
    <div className={s.formContainer}>
      <h3 className={s.formTitle}>Edit Post</h3>
      
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
            {submitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

EditPostForm.propTypes = {
  post: PropTypes.shape({
    id: PropTypes.number.isRequired,
    title: PropTypes.string.isRequired,
    content: PropTypes.string.isRequired
  }).isRequired,
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired
};

export default EditPostForm;