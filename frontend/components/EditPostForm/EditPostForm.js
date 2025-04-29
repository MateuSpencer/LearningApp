import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { httpPut } from '../../utils/Http';
import s from './EditPostForm.module.css';

const EditPostForm = ({ post, onSave, onCancel }) => {
  const [content, setContent] = useState(post?.content || '');
  const [resourceUrl, setResourceUrl] = useState(post?.resource_url || '');
  const [status, setStatus] = useState(post?.status || 'published');
  const [error, setError] = useState(null);
  const [urlError, setUrlError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  

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
    
    if (!csrfToken) {
      setError('Security token not available. Please try again later.');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      // Make sure we're sending the page_slug in the request
      // This ensures we're keeping the original page association
      const updatedPost = await httpPut(
        `/api/posts/${post.id}/`,
        {
          content,
          resource_url: resourceUrl,
          status,
          page_slug: post.page_slug // Explicitly include the page_slug
        },
        csrfToken
      );
      
      onSave(updatedPost);
      
    } catch (err) {
      console.error('Error updating post:', err);
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
      } else if (err.data && err.data.resource_url) {
        // Handle specific resource URL validation errors from the server
        setUrlError(err.data.resource_url);
        setError(null);
      } else {
        setError(`Failed to update post: ${err.message}`);
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
      <h3 className={s.formTitle}>Edit Post</h3>
      
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
            disabled={submitting || !csrfToken}
            rows={5}
            required
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
            disabled={submitting || !csrfToken}
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
            disabled={submitting || !csrfToken}
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
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    content: PropTypes.string,
    status: PropTypes.string,
    page_slug: PropTypes.string
  }),
  onSave: PropTypes.func,
  onCancel: PropTypes.func,
};

EditPostForm.defaultProps = {
  post: { content: '', status: 'published' },
  onSave: () => {},
  onCancel: () => {},
};

export default EditPostForm;