import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import learningResources from '../../api/learningResources';
import { normalizeUrl, validateUrl } from '../../utils/urlUtils';
import s from './NewLearningResourceForm.module.css';

const NewLearningResourceForm = ({ pageSlug, onSuccess, onCancel }) => {
  // Form state
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [resourceType, setResourceType] = useState('website');
  
  // Status states
  const [submitting, setSubmitting] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState(null);
  const [urlError, setUrlError] = useState(null);
  const [urlSuccess, setUrlSuccess] = useState(false);
  const [suggestedUrl, setSuggestedUrl] = useState('');
  
  // Locking states for form fields
  const [titleLocked, setTitleLocked] = useState(false);
  const [resourceTypeLocked, setResourceTypeLocked] = useState(false);
  const [lastValidatedUrl, setLastValidatedUrl] = useState('');
  
  // Get router and auth context
  const router = useRouter();
  const { isAuthenticated, refreshAuth } = useAuth();

  // Reset URL validation state when URL changes
  useEffect(() => {
    // If URL has changed from the last validated one, reset validation state
    if (url !== lastValidatedUrl) {
      setUrlSuccess(false);
      setUrlError(null);
      setSuggestedUrl('');
      
      // Unlock fields if they were locked
      if (titleLocked || resourceTypeLocked) {
        setTitleLocked(false);
        setResourceTypeLocked(false);
      }
    }
  }, [url, lastValidatedUrl, titleLocked, resourceTypeLocked]);

  // Basic URL validation
  const isValidUrlFormat = (url) => {
    if (!url) return false;
    
    // Basic URL validation pattern
    const urlPattern = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/;
    return urlPattern.test(url);
  };

  // Handler for URL input changes
  const handleUrlChange = (e) => {
    const value = e.target.value;
    setUrl(value);
    
    // Reset validation states
    setUrlSuccess(false);
    setUrlError(null);
    setSuggestedUrl('');
    
    // If URL has changed from last validated, unlock fields
    if (value !== lastValidatedUrl) {
      setTitleLocked(false);
      setResourceTypeLocked(false);
    }
    
    // Basic format validation
    if (value && !isValidUrlFormat(value)) {
      setUrlError('Please enter a valid URL (e.g., https://example.com)');
    }
  };
  
  // Handle URL validation
  const handleValidateUrl = async () => {
    if (!url.trim()) {
      setUrlError('URL is required');
      return;
    }
    
    try {
      setValidating(true);
      setUrlError(null);
      setUrlSuccess(false);
      setSuggestedUrl('');
      
      // First normalize the URL client-side to handle basic formatting
      let processedUrl = url;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        processedUrl = `https://${url}`;
      }
      
      // For YouTube URLs, ensure we have a valid video ID (exactly 11 characters)
      const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
      const match = processedUrl.match(youtubeRegex);
      
      // Pre-validate YouTube URLs client-side
      let isYoutubeUrl = processedUrl.includes('youtube.com') || processedUrl.includes('youtu.be');
      
      if (isYoutubeUrl && (!match || !match[1])) {
        // It looks like a YouTube URL but doesn't have a valid video ID
        setUrlError('Invalid YouTube URL: Missing or malformed video ID. YouTube video IDs are 11 characters long.');
        setValidating(false);
        return;
      }
      
      if (match && match[1]) {
        // It's a YouTube URL with valid format, set resource type
        setResourceType('youtube');
        const videoId = match[1];
        // Keep the video ID parameter but remove all other parameters
        processedUrl = `https://www.youtube.com/watch?v=${videoId}`;
      }
      
      // Validate URL with backend
      const validationResult = await learningResources.validateUrl(processedUrl);
      
      if (validationResult.status === 'success') {
        // For YouTube URLs, ensure we have metadata before marking as success
        if (validationResult.url_type === 'youtube') {
          // Check if we have a valid YouTube video ID and metadata
          const videoId = validationResult.youtube_video_id;
          
          if (!videoId || videoId.length !== 11) {
            setUrlError('Invalid YouTube video ID. YouTube video IDs must be 11 characters long.');
            setUrlSuccess(false);
            setTitleLocked(false);
            setResourceTypeLocked(false);
            setValidating(false);
            return;
          }
          
          // Try to get metadata to verify it's a valid video
          try {
            const youtubeData = await learningResources.getYoutubeMetadata(videoId);
            
            if (youtubeData.status === 'error' || !youtubeData.title) {
              setUrlError(`Invalid YouTube video: ${youtubeData.message}`);
              setUrlSuccess(false);
              setTitleLocked(false);
              setResourceTypeLocked(false);
              setValidating(false);
              return;
            }
            
            // We have valid metadata, update title and lock it
            setTitle(youtubeData.title);
            setTitleLocked(true);
            
            // Set resource type and lock it since we confirmed it's a valid YouTube video
            setResourceType('youtube');
            setResourceTypeLocked(true);
          } catch (metadataErr) {
            // Handle error quietly without displaying in console
            setUrlError('Invalid YouTube video: Could not verify this video exists.');
            setUrlSuccess(false);
            setTitleLocked(false);
            setResourceTypeLocked(false);
            setValidating(false);
            return;
          }
        }
        
        // URL is valid, update state
        setUrlSuccess(true);
        
        // Save the last validated URL to track changes
        setLastValidatedUrl(validationResult.normalized_url || processedUrl);
        
        // If URL was modified, show the normalized version
        if (validationResult.normalized_url && validationResult.normalized_url !== url) {
          setUrl(validationResult.normalized_url);
        }
        
        // If a different URL is recommended (e.g., HTTP to HTTPS), show it
        if (validationResult.recommended_url && 
            validationResult.recommended_url !== validationResult.normalized_url) {
          setSuggestedUrl(validationResult.recommended_url);
        }
      } else if (validationResult.status === 'duplicate') {
        // URL already exists in the system
        setUrlError(`${validationResult.message || 'This URL already exists in the system'}`);
        if (validationResult.existing_resource) {
          setUrlError(prev => `${prev} (Resource: ${validationResult.existing_resource.title})`);
        }
        setUrlSuccess(false);
      } else {
        // Other validation error
        setUrlError(validationResult.message || 'URL validation failed');
        setUrlSuccess(false);
        
        // Unlock title and resource type since validation failed
        setTitleLocked(false);
        setResourceTypeLocked(false);
        
        // If there's a suggested URL, show it
        if (validationResult.recommended_url) {
          setSuggestedUrl(validationResult.recommended_url);
        }
      }
    } catch (err) {
      console.error('Error validating URL:', err);
      setUrlError(`URL validation failed: ${err.message || 'Unknown error'}`);
      setUrlSuccess(false);
      // Unlock fields since validation failed
      setTitleLocked(false);
      setResourceTypeLocked(false);
    } finally {
      setValidating(false);
    }
  };
  
  // Use suggested URL
  const handleUseSuggestedUrl = () => {
    if (suggestedUrl) {
      setUrl(suggestedUrl);
      setSuggestedUrl('');
      setUrlSuccess(true);
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
    
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    
    if (!isAuthenticated) {
      router.push('/accounts/login/');
      return;
    }
    
    // Ensure URL was validated
    if (!urlSuccess) {
      setUrlError('Please validate the URL before submitting');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setUrlError(null);
      
      // Use the suggested URL if available, otherwise use the current URL
      const finalUrl = suggestedUrl || url;
      
      // Create resource with URL and associate it with page
      const result = await learningResources.createFromUrl({
        url: finalUrl,
        title,
        pageSlug,
        resourceType
      });
      
      // Check if the operation was successful
      if (!result.success) {
        // Handle duplicate URL case without throwing an error
        if (result.status === 'duplicate_url') {
          const resourceInfo = result.existingResource ? 
            ` (Resource ID: ${result.existingResource.id.substring(0, 8)}...)` : '';
          setUrlError(`${result.message}${resourceInfo}. Please try another URL.`);
          setSubmitting(false);
          return;
        }
      }
      
      // If successful, clear the form and call the success callback
      const newResource = result.resource;
      
      // Clear form
      setUrl('');
      setTitle('');
      setResourceType('website');
      setUrlSuccess(false);
      
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
          setUrlError(Array.isArray(err.data.url) ? err.data.url[0] : err.data.url);
        }
        if (err.data.title) {
          setError(Array.isArray(err.data.title) ? err.data.title[0] : err.data.title);
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
      {urlSuccess && <div className={s.successMessage}>URL validated successfully!</div>}
      
      <form onSubmit={handleSubmit} className={s.form}>
        <div className={s.formGroup}>
          <label htmlFor="url" className={s.label}>Resource URL *</label>
          <div className={s.urlInputGroup}>
            <input
              id="url"
              type="url"
              value={url}
              onChange={handleUrlChange}
              className={`${s.input} ${urlSuccess ? s.validatedInput : ''}`}
              disabled={submitting || validating}
              required
              placeholder="https://example.com"
            />
            {urlSuccess && (
              <div className={s.validationIcon}>✓</div>
            )}
            <button 
              type="button" 
              className={`${s.validateButton} ${urlSuccess ? s.validatedButton : url !== lastValidatedUrl && lastValidatedUrl ? s.needsValidationButton : ''}`}
              onClick={handleValidateUrl}
              disabled={submitting || validating || !url}
              title="Validates URL format, accessibility, and checks if it's already in the system"
            >
              {validating ? 'Checking...' : 
               urlSuccess ? '✓ Valid URL' : 
               url !== lastValidatedUrl && lastValidatedUrl ? 'Validate New URL!' : 'Check URL'}
            </button>
          </div>
          {suggestedUrl && (
            <div className={s.suggestionContainer}>
              <span>Suggested URL: </span>
              <code className={s.suggestedUrl}>{suggestedUrl}</code>
              <button 
                type="button" 
                className={s.useSuggestedButton}
                onClick={handleUseSuggestedUrl}
              >
                Use this
              </button>
            </div>
          )}
          <small className={s.hint}>
            {urlSuccess ? 
              'URL validated successfully. You can now submit the form.' : 
              url !== lastValidatedUrl && lastValidatedUrl ?
              'URL has changed since last validation. Please validate again before submitting.' :
              'The URL of the resource you want to add. Click "Check URL" to validate it before submitting.'}
          </small>
        </div>
        
        <div className={s.formGroup}>
          <label htmlFor="title" className={`${s.label} ${titleLocked ? s.lockedFieldLabel : ''}`}>
            {titleLocked && <span className={s.lockIcon}>🔒</span>}
            Title *
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={`${s.input} ${titleLocked ? s.lockedField : ''}`}
            disabled={submitting || validating || titleLocked}
            required
            maxLength={255}
            placeholder="Resource title"
            readOnly={titleLocked}
          />
          <small className={s.hint}>
            {titleLocked ? 
              'Title auto-populated from YouTube video. Edit URL and validate again to change.' : 
              'A descriptive title for the resource (required)'}
          </small>
        </div>
        
        <div className={s.formGroup}>
          <label htmlFor="resourceType" className={`${s.label} ${resourceTypeLocked ? s.lockedFieldLabel : ''}`}>
            {resourceTypeLocked && <span className={s.lockIcon}>🔒</span>}
            Resource Type
          </label>
          <select
            id="resourceType"
            value={resourceType}
            onChange={(e) => setResourceType(e.target.value)}
            className={`${s.select} ${resourceTypeLocked ? s.lockedField : ''}`}
            disabled={submitting || validating || resourceTypeLocked}
            readOnly={resourceTypeLocked}
          >
            <option value="website">Website</option>
            <option value="youtube">YouTube</option>
            <option value="video">Video</option>
            <option value="pdf">PDF</option>
            <option value="article">Article</option>
            <option value="book">Book</option>
            <option value="course">Course</option>
            <option value="image">Image</option>
            <option value="tool">Tool</option>
          </select>
          {resourceTypeLocked && (
            <small className={s.hint}>Resource type is fixed for this URL. Edit URL and validate again to change.</small>
          )}
        </div>
        
        <div className={s.buttonGroup}>
          <button 
            type="submit" 
            className={s.submitButton}
            disabled={submitting || !isAuthenticated || !urlSuccess || (url !== lastValidatedUrl && lastValidatedUrl)}
            title={!urlSuccess ? "URL must be validated before submitting" : 
                  (url !== lastValidatedUrl && lastValidatedUrl) ? "URL has changed - please validate again" : ""}
          >
            {submitting ? 'Adding...' : 
             !urlSuccess && url ? 'Validate URL First' : 
             (url !== lastValidatedUrl && lastValidatedUrl) ? 'Validate URL First' : 'Add Resource'}
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
