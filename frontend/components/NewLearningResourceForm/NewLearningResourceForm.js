import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../hooks/useTranslation';
import learningResources from '../../api/learningResources';
import { normalizeUrl, validateUrl } from '../../utils/urlUtils';
import urlValidationService from '../../services/urlValidationService';
import ContentLanguageSelector from '../ContentLanguageSelector';
import s from './NewLearningResourceForm.module.css';

const NewLearningResourceForm = ({ 
  pageSlug, 
  onSuccess, 
  onCancel, 
  initialUrl = '', 
  initialTitle = '', 
  initialResourceType = 'website',
  initialDescription = ''
}) => {
  // Form state
  const [url, setUrl] = useState(initialUrl);
  const [title, setTitle] = useState(initialTitle);
  const [resourceType, setResourceType] = useState(initialResourceType);
  const [language, setLanguage] = useState('en');
  
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
  const { t } = useTranslation();

  // Auto-validate URL if provided as initial value
  useEffect(() => {
    if (initialUrl && !lastValidatedUrl) {
      // Small delay to allow component to fully mount
      setTimeout(() => {
        handleValidateUrl();
      }, 100);
    }
  }, [initialUrl]); // Only run on mount or when initialUrl changes

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
    return urlValidationService.isValidUrlFormat(url);
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
      setUrlError(t('newLearningResourceForm.invalidUrl'));
    }
  };
  
  // Handle URL validation
  const handleValidateUrl = async () => {
    if (!url.trim()) {
      setUrlError(t('newLearningResourceForm.urlRequired'));
      return;
    }
    
    try {
      setValidating(true);
      setUrlError(null);
      setUrlSuccess(false);
      setSuggestedUrl('');
      
      // Use the URL validation service for full validation
      const validationResult = await urlValidationService.validateUrlFull(url);
      
      if (validationResult.isValid) {
        // URL is valid, update state
        setUrlSuccess(true);
        
        // Save the last validated URL to track changes
        setLastValidatedUrl(validationResult.normalizedUrl);
        
        // If URL was normalized, update the form URL
        if (validationResult.normalizedUrl !== url) {
          setUrl(validationResult.normalizedUrl);
        }
        
        // If a different URL is recommended, show it
        if (validationResult.suggestedUrl && 
            validationResult.suggestedUrl !== validationResult.normalizedUrl) {
          setSuggestedUrl(validationResult.suggestedUrl);
        }
        
        // Handle YouTube-specific logic
        if (validationResult.resourceType === 'youtube' && validationResult.metadata) {
          // Set resource type and lock it since we confirmed it's a valid YouTube video
          setResourceType('youtube');
          setResourceTypeLocked(true);
          
          // If we have a title from metadata, use it and lock the title field
          if (validationResult.metadata.title) {
            setTitle(validationResult.metadata.title);
            setTitleLocked(true);
          }
        }
      } else {
        // Validation failed
        setUrlError(validationResult.error);
        setUrlSuccess(false);
        
        // Unlock title and resource type since validation failed
        setTitleLocked(false);
        setResourceTypeLocked(false);
        
        // If there's a suggested URL, show it
        if (validationResult.suggestedUrl) {
          setSuggestedUrl(validationResult.suggestedUrl);
        }
      }
    } catch (err) {
      console.error('Error validating URL:', err);
      setUrlError(`${t('newLearningResourceForm.urlValidationFailed')}: ${err.message || t('newLearningResourceForm.unknownError')}`);
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
      setUrlError(t('newLearningResourceForm.urlRequired'));
      return;
    }
    
    if (!title.trim()) {
      setError(t('newLearningResourceForm.titleRequired'));
      return;
    }
    
    if (!isAuthenticated) {
      router.push('/accounts/login/');
      return;
    }
    
    // Ensure URL was validated
    if (!urlSuccess) {
      setUrlError(t('newLearningResourceForm.validateBeforeSubmit'));
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
        resourceType,
        language
      });
      
      // Check if the operation was successful
      if (!result.success) {
        // Handle duplicate URL case without throwing an error
        if (result.status === 'duplicate_url') {
          const resourceInfo = result.existingResource ? 
            ` (Resource ID: ${result.existingResource.id.substring(0, 8)}...)` : '';
          setUrlError(`${result.message}${resourceInfo}. ${t('newLearningResourceForm.duplicateUrl')}`);
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
      setLanguage('en');
      setUrlSuccess(false);
      
      // Call success callback
      if (onSuccess) {
        onSuccess(newResource);
      }
      
    } catch (err) {
      console.error('Error creating learning resource:', err);
      
      // Check if it's an authentication issue
      if (err.status === 401) {
        setError(t('newLearningResourceForm.sessionExpired'));
        refreshAuth();
        setTimeout(() => {
          router.push('/accounts/login/');
        }, 1500);
      } else if (err.status === 403) {
        setError(t('newLearningResourceForm.permissionDenied'));
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
          setError(`${t('newLearningResourceForm.failedToAdd')}: ${err.message || t('newLearningResourceForm.unknownError')}`);
        }
      } else {
        setError(`${t('newLearningResourceForm.failedToAdd')}: ${err.message || t('newLearningResourceForm.unknownError')}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={s.formContainer}>
      <h3 className={s.formTitle}>{t('newLearningResourceForm.title')}</h3>
      
      {error && <div className={s.errorMessage}>{error}</div>}
      {urlError && <div className={s.errorMessage}>{urlError}</div>}
      {urlSuccess && <div className={s.successMessage}>{t('newLearningResourceForm.urlValidated')}</div>}
      
      <form onSubmit={handleSubmit} className={s.form}>
        <div className={s.formGroup}>
          <label htmlFor="url" className={s.label}>{t('newLearningResourceForm.urlLabel')}</label>
          <div className={s.urlInputGroup}>
            <input
              id="url"
              type="url"
              value={url}
              onChange={handleUrlChange}
              className={`${s.input} ${urlSuccess ? s.validatedInput : ''}`}
              disabled={submitting || validating}
              required
              placeholder={t('newLearningResourceForm.urlPlaceholder')}
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
              {validating ? t('newLearningResourceForm.validating') : 
               urlSuccess ? t('newLearningResourceForm.urlValid') : 
               url !== lastValidatedUrl && lastValidatedUrl ? t('newLearningResourceForm.validateNewUrl') : t('newLearningResourceForm.validateUrl')}
            </button>
          </div>
          {suggestedUrl && (
            <div className={s.suggestionContainer}>
              <span>{t('newLearningResourceForm.suggestedUrl')}</span>
              <code className={s.suggestedUrl}>{suggestedUrl}</code>
              <button 
                type="button" 
                className={s.useSuggestedButton}
                onClick={handleUseSuggestedUrl}
              >
                {t('newLearningResourceForm.useThis')}
              </button>
            </div>
          )}
          <small className={s.hint}>
            {urlSuccess ? 
              t('newLearningResourceForm.validateSuccessHint') : 
              url !== lastValidatedUrl && lastValidatedUrl ?
              t('newLearningResourceForm.urlChangedValidate') :
              t('newLearningResourceForm.validateHint')}
          </small>
        </div>
        
        <div className={s.formGroup}>
          <label htmlFor="title" className={`${s.label} ${titleLocked ? s.lockedFieldLabel : ''}`}>
            {titleLocked && <span className={s.lockIcon}>🔒</span>}
            {t('newLearningResourceForm.titleLabel')}
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
            placeholder={t('newLearningResourceForm.titlePlaceholder')}
            readOnly={titleLocked}
          />
          <small className={s.hint}>
            {titleLocked ? 
              t('newLearningResourceForm.titleLockedHint') : 
              t('newLearningResourceForm.titleHint')}
          </small>
        </div>
        
        <div className={s.formGroup}>
          <label htmlFor="resourceType" className={`${s.label} ${resourceTypeLocked ? s.lockedFieldLabel : ''}`}>
            {resourceTypeLocked && <span className={s.lockIcon}>🔒</span>}
            {t('newLearningResourceForm.typeLabel')}
          </label>
          <select
            id="resourceType"
            value={resourceType}
            onChange={(e) => setResourceType(e.target.value)}
            className={`${s.select} ${resourceTypeLocked ? s.lockedField : ''}`}
            disabled={submitting || validating || resourceTypeLocked}
            readOnly={resourceTypeLocked}
          >
            <option value="website">{t('newLearningResourceForm.typeWebsite')}</option>
            <option value="youtube">{t('newLearningResourceForm.typeYoutube')}</option>
            <option value="video">{t('newLearningResourceForm.typeVideo')}</option>
            <option value="pdf">{t('newLearningResourceForm.typePdf')}</option>
            <option value="article">{t('newLearningResourceForm.typeArticle')}</option>
            <option value="book">{t('newLearningResourceForm.typeBook')}</option>
            <option value="course">{t('newLearningResourceForm.typeCourse')}</option>
            <option value="documentation">{t('newLearningResourceForm.typeDocumentation')}</option>
            <option value="tutorial">{t('newLearningResourceForm.typeTutorial')}</option>
            <option value="image">{t('newLearningResourceForm.typeImage')}</option>
            <option value="tool">{t('newLearningResourceForm.typeTool')}</option>
          </select>
          {resourceTypeLocked && (
            <small className={s.hint}>{t('newLearningResourceForm.typeLockedHint')}</small>
          )}
        </div>
        
        <div className={s.formGroup}>
          <label htmlFor="language" className={s.label}>{t('newLearningResourceForm.languageLabel')}</label>
          <ContentLanguageSelector
            id="language"
            name="language"
            value={language}
            onChange={setLanguage}
            disabled={submitting || validating}
            required
          />
        </div>
        
        <div className={s.buttonGroup}>
          <button 
            type="submit" 
            className={s.submitButton}
            disabled={submitting || !isAuthenticated || !urlSuccess || (url !== lastValidatedUrl && lastValidatedUrl)}
            title={!urlSuccess ? t('newLearningResourceForm.urlMustBeValidated') : 
                  (url !== lastValidatedUrl && lastValidatedUrl) ? t('newLearningResourceForm.urlChangedValidateAgain') : ""}
          >
            {submitting ? t('newLearningResourceForm.adding') : 
             !urlSuccess && url ? t('newLearningResourceForm.validateUrlFirst') : 
             (url !== lastValidatedUrl && lastValidatedUrl) ? t('newLearningResourceForm.validateUrlFirst') : t('newLearningResourceForm.add')}
          </button>
          
          <button 
            type="button" 
            className={s.cancelButton}
            onClick={onCancel}
            disabled={submitting}
          >
            {t('newLearningResourceForm.cancel')}
          </button>
        </div>
      </form>
    </div>
  );
};

NewLearningResourceForm.propTypes = {
  pageSlug: PropTypes.string.isRequired,
  onSuccess: PropTypes.func,
  onCancel: PropTypes.func,
  initialUrl: PropTypes.string,
  initialTitle: PropTypes.string,
  initialResourceType: PropTypes.string,
  initialDescription: PropTypes.string
};

export default NewLearningResourceForm;
