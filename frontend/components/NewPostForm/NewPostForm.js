import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { httpPost } from '../../utils/Http';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import s from './NewPostForm.module.css';

const NewPostForm = ({ pageSlug, onSubmit, onCancel }) => {
  const [content, setContent] = useState('');
  const [resourceUrl, setResourceUrl] = useState('');
  const [status, setStatus] = useState('published');
  const [error, setError] = useState(null);
  const [urlError, setUrlError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [actualPageSlug, setActualPageSlug] = useState(pageSlug);
  
  // Get router to extract current path
  const router = useRouter();
  
  // Use the centralized auth context
  const { isAuthenticated, refreshAuth } = useAuth();
  
  // Check authentication
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/accounts/login/');
    }
  }, [isAuthenticated, router]);
  
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
      } else {
        // Fallback if we couldn't extract from URL
        setActualPageSlug('wiki'); // Use a more meaningful default than 'post'
      }
    } else {
      // If pageSlug is provided as prop, use it
      setActualPageSlug(pageSlug);
    }
  }, [router, pageSlug]);
  
  // Simple URL validation on the client side
  const validateUrl = (url) => {
    if (!url) return true; // Empty URLs are allowed
    
    // Basic URL format validation
    const urlPattern = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/;
    return urlPattern.test(url);
  };

  const handleUrlChange = (e) => {
    const value = e.target.value;
    setResourceUrl(value);
    
    if (value && !validateUrl(value)) {
      setUrlError('Please enter a valid URL (e.g., https://example.com)');
    } else {
      setUrlError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!content.trim()) {
      setError('Content is required');
      return;
    }
    
    if (resourceUrl && !validateUrl(resourceUrl)) {
      setUrlError('Please enter a valid URL (e.g., https://example.com)');
      return;
    }
    
    if (!isAuthenticated) {
      router.push('/accounts/login/');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      setUrlError(null);
      
      // Use httpPost with the extracted page slug - the token is now handled automatically
      const newPost = await httpPost(
        '/api/posts/',
        {
          content,
          resource_url: resourceUrl,
          status,
          page_slug: actualPageSlug
        }
      );
      
      setContent('');
      setResourceUrl('');
      setStatus('published');
      onSubmit(newPost);
      
    } catch (err) {
      console.error('Error creating post:', err);
      
      // Check if it's an authentication issue (401 Unauthorized)
      if (err.status === 401) {
        setError('Your session has expired. Redirecting to login...');
        refreshAuth();
        setTimeout(() => {
          router.push('/accounts/login/');
        }, 1500);
      } else if (err.status === 403) {
        setError('You don\'t have permission to create a post. Please make sure you are logged in.');
        refreshAuth();
      } else if (err.data) {
        // Handle field-specific errors from the server
        if (err.data.resource_url) {
          setUrlError(err.data.resource_url);
        }
        if (err.data.content) {
          setError(err.data.content);
        } else if (err.data.detail || err.data.message) {
          setError(err.data.detail || err.data.message);
        } else {
          setError(`Failed to create post: ${err.message || 'Unknown error'}`);
        }
      } else {
        setError(`Failed to create post: ${err.message || 'Unknown error'}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={s.formContainer}>
      <h3 className={s.formTitle}>Share Your Thoughts</h3>
      
      {error && <div className={s.errorMessage}>{error}</div>}
      {urlError && <div className={s.errorMessage}>{urlError}</div>}
      
      <form onSubmit={handleSubmit} className={s.form}>
        <div className={s.formGroup}>
          <label htmlFor="content" className={s.label}>Content *</label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className={s.textarea}
            disabled={submitting || !isAuthenticated}
            rows={5}
            required
            placeholder="Share your knowledge, ideas, or questions..."
          />
        </div>
        
        <div className={s.formGroup}>
          <label htmlFor="resourceUrl" className={s.label}>Resource URL</label>
          <input
            id="resourceUrl"
            type="url"
            value={resourceUrl}
            onChange={handleUrlChange}
            className={s.input}
            disabled={submitting || !isAuthenticated}
            placeholder="https://example.com"
          />
        </div>
        
        <div className={s.formGroup}>
          <label htmlFor="status" className={s.label}>Status</label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={s.select}
            disabled={submitting || !isAuthenticated}
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
            disabled={submitting || !isAuthenticated || !content.trim()}
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