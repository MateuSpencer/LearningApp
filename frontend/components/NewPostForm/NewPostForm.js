import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { httpPost } from '../../utils/Http';
import { useCSRFToken } from '../../context/CSRFTokenContext';
import { useRouter } from 'next/router';
import s from './NewPostForm.module.css';

const NewPostForm = ({ pageSlug, onSubmit, onCancel }) => {
  const [content, setContent] = useState('');
  const [status, setStatus] = useState('published');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [actualPageSlug, setActualPageSlug] = useState(pageSlug);
  
  // Get router to extract current path
  const router = useRouter();
  
  // Extract the pageSlug from the URL path if it's not provided
  useEffect(() => {
    if (!pageSlug) {
      const path = router.asPath;
      // Remove query parameters and trailing slash
      const cleanPath = path.split('?')[0].replace(/\/$/, '');
      // Extract the last part of the path (which should be the slug)
      const pathParts = cleanPath.split('/').filter(Boolean);
      if (pathParts.length > 0) {
        const extractedSlug = pathParts[pathParts.length - 1];
        setActualPageSlug(extractedSlug);
      }
    }
  }, [router, pageSlug]);
  
  // Use the CSRF token from context instead of fetching it in the component
  const { token: csrfToken, loading: tokenLoading, error: tokenError, refreshToken } = useCSRFToken();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!content.trim()) {
      setError('Content is required');
      return;
    }
    
    if (!csrfToken) {
      setError('Security token not available. Please try again later.');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      // Use httpPost with the token from context and the extracted page slug
      const newPost = await httpPost(
        '/api/posts/',
        {
          content,
          status,
          page_slug: actualPageSlug
        },
        csrfToken
      );
      
      setContent('');
      setStatus('published');
      onSubmit(newPost);
      
    } catch (err) {
      console.error('Error creating post:', err);
      // Check if it's a CSRF token issue (usually 403 Forbidden)
      if (err.status === 403) {
        setError('Your session may have expired. Refreshing...');
        try {
          // Try to refresh the token
          await refreshToken();
          setError('Please try submitting again.');
        } catch (refreshError) {
          setError('Failed to refresh security token. Please reload the page.');
        }
      } else {
        setError(`Failed to create post: ${err.message}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Show loading state while waiting for the token
  if (tokenLoading) {
    return <div className={s.loading}>Loading security token...</div>;
  }

  // Show error if token fetch failed
  if (tokenError) {
    return (
      <div className={s.errorContainer}>
        <div className={s.errorMessage}>
          Failed to load security token: {tokenError.message}
        </div>
        <button 
          onClick={refreshToken} 
          className={s.retryButton}
          disabled={submitting}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={s.formContainer}>
      <h3 className={s.formTitle}>Share Your Thoughts</h3>
      
      {error && <div className={s.errorMessage}>{error}</div>}
      
      <form onSubmit={handleSubmit} className={s.form}>
        <div className={s.formGroup}>
          <label htmlFor="content" className={s.label}>Content *</label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className={s.textarea}
            disabled={submitting || !csrfToken}
            rows={5}
            required
            placeholder="Share your knowledge, ideas, or questions..."
          />
        </div>
        
        <div className={s.formGroup}>
          <label htmlFor="status" className={s.label}>Status</label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={s.select}
            disabled={submitting || !csrfToken}
          >
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
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
            disabled={submitting || !csrfToken || !content.trim()}
          >
            {submitting ? 'Posting...' : 'Post'}
          </button>
        </div>
      </form>
    </div>
  );
};

NewPostForm.propTypes = {
  pageSlug: PropTypes.string,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired
};

NewPostForm.defaultProps = {
  pageSlug: '',
};

export default NewPostForm;