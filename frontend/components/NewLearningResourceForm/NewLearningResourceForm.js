import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import learningResources from '../../api/learningResources';
import s from './NewLearningResourceForm.module.css';

const NewLearningResourceForm = ({ pageSlug, onSuccess, onCancel }) => {
  // Form state
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [resourceType, setResourceType] = useState('website');
  
  // Status states
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [urlError, setUrlError] = useState(null);
  
  // Get router and auth context
  const router = useRouter();
  const { isAuthenticated, refreshAuth } = useAuth();

  // URL validation
  const validateUrl = (url) => {
    if (!url) return false;
    
    // Basic URL validation pattern
    const urlPattern = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/;
    return urlPattern.test(url);
  };

  // Handler for URL input changes
  const handleUrlChange = (e) => {
    const value = e.target.value;
    setUrl(value);
    
    if (value && !validateUrl(value)) {
      setUrlError('Please enter a valid URL (e.g., https://example.com)');
    } else {
      setUrlError(null);
    }
  };

  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic client-side validation
    if (!url.trim()) {
      setUrlError('URL is required');
      return;
    }
    
    if (!validateUrl(url)) {
      setUrlError('Please enter a valid URL (e.g., https://example.com)');
      return;
    }
    
    if (!title.trim()) {
      setError('Title is required');
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
      
      // First check if URL already exists
      const urlCheckResult = await learningResources.checkUrlExists(url);
      
      if (urlCheckResult.exists) {
        setUrlError('This URL is already associated with a resource');
        setSubmitting(false);
        return;
      }
      
      // Create resource with URL and associate it with page
      const newResource = await learningResources.createFromUrl({
        url,
        title,
        pageSlug,
        resourceType
      });
      
      // Clear form
      setUrl('');
      setTitle('');
      setResourceType('website');
      
      // Call success callback
      if (onSuccess) {
        onSuccess(newResource);
      }
      
    } catch (err) {
      console.error('Error creating learning resource:', err);
      
      // Check if it's an authentication issue
      if (err.status === 401) {
        setError('Your session has expired. Redirecting to login...');
        refreshAuth();
        setTimeout(() => {
          router.push('/accounts/login/');
        }, 1500);
      } else if (err.status === 403) {
        setError('You don\'t have permission to create resources. Please make sure you are logged in.');
        refreshAuth();
      } else if (err.data) {
        // Handle field-specific errors from the server
        if (err.data.url) {
          setUrlError(err.data.url);
        }
        if (err.data.title) {
          setError(err.data.title);
        } else if (err.data.detail || err.data.message) {
          setError(err.data.detail || err.data.message);
        } else {
          setError(`Failed to create resource: ${err.message || 'Unknown error'}`);
        }
      } else {
        setError(`Failed to create resource: ${err.message || 'Unknown error'}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={s.formContainer}>
      <h3 className={s.formTitle}>Add Learning Resource</h3>
      
      {error && <div className={s.errorMessage}>{error}</div>}
      {urlError && <div className={s.errorMessage}>{urlError}</div>}
      
      <form onSubmit={handleSubmit} className={s.form}>
        <div className={s.formGroup}>
          <label htmlFor="url" className={s.label}>Resource URL *</label>
          <input
            id="url"
            type="url"
            value={url}
            onChange={handleUrlChange}
            className={s.input}
            disabled={submitting}
            required
            placeholder="https://example.com"
          />
          <small className={s.hint}>The URL of the resource you want to add</small>
        </div>
        
        <div className={s.formGroup}>
          <label htmlFor="title" className={s.label}>Title *</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={s.input}
            disabled={submitting}
            required
            maxLength={255}
            placeholder="Resource title"
          />
          <small className={s.hint}>A descriptive title for the resource</small>
        </div>
        
        <div className={s.formGroup}>
          <label htmlFor="resourceType" className={s.label}>Resource Type</label>
          <select
            id="resourceType"
            value={resourceType}
            onChange={(e) => setResourceType(e.target.value)}
            className={s.select}
            disabled={submitting}
          >
            <option value="website">Website</option>
            <option value="video">Video</option>
            <option value="pdf">PDF</option>
            <option value="article">Article</option>
            <option value="image">Image</option>
          </select>
        </div>
        
        <div className={s.buttonGroup}>
          <button 
            type="submit" 
            className={s.submitButton}
            disabled={submitting || !isAuthenticated}
          >
            {submitting ? 'Adding...' : 'Add Resource'}
          </button>
          
          <button 
            type="button" 
            className={s.cancelButton}
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

NewLearningResourceForm.propTypes = {
  pageSlug: PropTypes.string.isRequired,
  onSuccess: PropTypes.func,
  onCancel: PropTypes.func
};

export default NewLearningResourceForm;
