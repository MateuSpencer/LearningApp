import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { httpPost } from '../../utils/Http';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import ContentLanguageSelector from '../ContentLanguageSelector';
import s from './NewPostForm.module.css';

const NewPostForm = ({ pageSlug, onSubmit, onCancel }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState('published');
  const [language, setLanguage] = useState('en');
  const [error, setError] = useState(null);
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
  
  // URL validation removed as it's no longer needed

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    
    if (!content.trim()) {
      setError('Content is required');
      return;
    }
    
    if (!isAuthenticated) {
      router.push('/accounts/login/');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      // Use httpPost with the extracted page slug - the token is now handled automatically
      const newPost = await httpPost(
        '/api/posts/',
        {
          title,
          content,
          status,
          language,
          page_slug: actualPageSlug
        }
      );
      
      setTitle('');
      setContent('');
      setStatus('published');
      setLanguage('en');
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
        if (err.data.title) {
          setError(err.data.title);
        }
        else if (err.data.content) {
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
      
      <form onSubmit={handleSubmit} className={s.form}>
        <div className={s.formGroup}>
          <label htmlFor="title" className={s.label}>Title *</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={s.input}
            disabled={submitting || !isAuthenticated}
            required
            placeholder="Enter a title for your post"
          />
        </div>
        
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
          <label htmlFor="language" className={s.label}>Language</label>
          <ContentLanguageSelector
            id="language"
            name="language"
            value={language}
            onChange={setLanguage}
            disabled={submitting || !isAuthenticated}
            required
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
            disabled={submitting || !isAuthenticated || !title.trim() || !content.trim()}
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