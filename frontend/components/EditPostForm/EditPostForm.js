import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import { httpPut } from '../../utils/Http';
import ContentLanguageSelector from '../ContentLanguageSelector';
import s from './EditPostForm.module.css';

const EditPostForm = ({ post, onSave, onCancel }) => {
  const router = useRouter();
  const { isAuthenticated, refreshAuth } = useAuth();
  const [title, setTitle] = useState(post?.title || '');
  const [content, setContent] = useState(post?.content || '');
  const [status, setStatus] = useState(post?.status || 'published');
  const [language, setLanguage] = useState(post?.language || 'en');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Check authentication
  React.useEffect(() => {
    if (!isAuthenticated) {
      router.push('/accounts/login/');
    }
  }, [isAuthenticated, router]);

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
      
      // Make sure we're sending the page_slug in the request
      // This ensures we're keeping the original page association
      const updatedPost = await httpPut(
        `/api/posts/${post.id}/`,
        {
          title,
          content,
          status,
          language,
          page_slug: post.page_slug // Explicitly include the page_slug
        }
      );
      
      onSave(updatedPost);
      
    } catch (err) {
      console.error('Error updating post:', err);
      // Check if it's an authentication issue (401 Unauthorized)
      if (err.response && err.response.status === 401) {
        setError('Your session has expired. Redirecting to login...');
        refreshAuth();
        setTimeout(() => {
          router.push('/accounts/login/');
        }, 1500);
      } else if (err.response && err.response.status === 403) {
        setError('You don\'t have permission to edit this post.');
      } else if (err.data && err.data.title) {
        // Handle specific title validation errors from the server
        setError(err.data.title);
      } else {
        setError(`Failed to update post: ${err.message || 'Unknown error'}`);
      }
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
          <label htmlFor="title" className={s.label}>Title *</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={s.input}
            disabled={submitting || !isAuthenticated}
            required
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
            disabled={submitting || !isAuthenticated}
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
    title: PropTypes.string,
    content: PropTypes.string,
    status: PropTypes.string,
    language: PropTypes.string,
    page_slug: PropTypes.string
  }),
  onSave: PropTypes.func,
  onCancel: PropTypes.func,
};

EditPostForm.defaultProps = {
  post: { content: '', status: 'published', language: 'en' },
  onSave: () => {},
  onCancel: () => {},
};

export default EditPostForm;