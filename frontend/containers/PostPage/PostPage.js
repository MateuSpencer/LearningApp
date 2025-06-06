import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { basePageWrap } from '../BasePage';
import { useAuth } from '../../context/AuthContext';
import posts from '../../api/posts';
import { formatPageSlug } from '../../utils/stringUtils';
import ConfirmationModal from '../../components/ConfirmationModal/ConfirmationModal';
import LanguageBadge from '../../components/LanguageBadge/LanguageBadge';
import s from './PostPage.module.css';

const PostPage = ({ postId, initialPostData }) => {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  
  const [post, setPost] = useState(initialPostData || null);
  const [loading, setLoading] = useState(!initialPostData);
  const [error, setError] = useState(null);
  
  // State for managing page associations and their votes
  const [pageAssociations, setPageAssociations] = useState([]);
  
  // State for edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  
  // State for delete confirmation
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Fetch post data when component mounts or postId changes
  useEffect(() => {
    const fetchPostData = async () => {
      if (!postId) {
        setError('Post ID is required');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        const data = await posts.getById(postId);
        setPost(data);
        
        // Update page associations from the response
        if (data.page_associations) {
          setPageAssociations(data.page_associations);
        }
      } catch (err) {
        // Only log non-404 errors, since 404s are expected for missing posts
        if (!err.isNotFoundError) {
          console.error('Error fetching post:', err);
        }
        
        // Handle based on error type
        if (err.status === 404) {
          setError('Post not found. It may have been removed.');
          // Redirect immediately for 404s
          router.replace('/posts');
        } else {
          setError('Failed to load post. You may not have permission to view it.');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchPostData();
  }, [postId, router]);
  
  // Handle vote actions for a specific association
  const handleUpvoteAssociation = async (associationId) => {
    if (!isAuthenticated) {
      router.push('/accounts/login/');
      return;
    }
    
    try {
      const updatedData = await posts.upvoteAssociation(associationId);
      
      // Fetch updated post data to get latest associations
      const updatedPost = await posts.getById(post.id);
      setPost(updatedPost);
      setPageAssociations(updatedPost.page_associations);
    } catch (err) {
      console.error('Error upvoting association:', err);
    }
  };
  
  const handleDownvoteAssociation = async (associationId) => {
    if (!isAuthenticated) {
      router.push('/accounts/login/');
      return;
    }
    
    try {
      const updatedData = await posts.downvoteAssociation(associationId);
      
      // Fetch updated post data to get latest associations
      const updatedPost = await posts.getById(post.id);
      setPost(updatedPost);
      setPageAssociations(updatedPost.page_associations);
    } catch (err) {
      console.error('Error downvoting association:', err);
    }
  };
  
  // Add a page association
  const handleAddPageAssociation = async (pageSlug) => {
    if (!isAuthenticated) {
      router.push('/accounts/login/');
      return;
    }
    
    try {
      await posts.associateWithPage(post.id, pageSlug);
      
      // Fetch updated post data
      const updatedPost = await posts.getById(post.id);
      setPost(updatedPost);
      setPageAssociations(updatedPost.page_associations);
    } catch (err) {
      console.error('Error associating post with page:', err);
    }
  };
  
  // Redirect to posts page if post doesn't exist
  // Handle edit button click
  const handleEditClick = () => {
    if (!isAuthenticated) {
      router.push('/accounts/login/');
      return;
    }
    setEditTitle(post.title);
    setEditContent(post.content);
    setIsEditing(true);
  };
  
  // Handle save edit
  const handleSaveEdit = async () => {
    if (!isAuthenticated) {
      router.push('/accounts/login/');
      return;
    }
    
    try {
      setLoading(true);
      const updatedPost = await posts.update(post.id, {
        title: editTitle,
        content: editContent,
        status: post.status // Keep the same status
      });
      
      setPost(updatedPost);
      setIsEditing(false);
      // Refresh page associations
      if (updatedPost.page_associations) {
        setPageAssociations(updatedPost.page_associations);
      }
    } catch (err) {
      console.error('Error updating post:', err);
      setError('Failed to update post. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle cancel edit
  const handleCancelEdit = () => {
    setIsEditing(false);
  };
  
  // Handle delete button click
  const handleDeleteClick = () => {
    if (!isAuthenticated) {
      router.push('/accounts/login/');
      return;
    }
    setShowDeleteModal(true);
  };
  
  // Handle confirm delete
  const handleConfirmDelete = async () => {
    try {
      setLoading(true);
      await posts.delete(post.id);
      setShowDeleteModal(false);
      // Redirect to posts page
      router.replace('/posts');
    } catch (err) {
      console.error('Error deleting post:', err);
      setError('Failed to delete post. Please try again.');
      setShowDeleteModal(false);
      setLoading(false);
    }
  };
  
  // Handle cancel delete
  const handleCancelDelete = () => {
    setShowDeleteModal(false);
  };
  
  useEffect(() => {
    if ((error || !post) && !loading) {
      // Add a small delay before redirecting to show the message
      // Don't delay for 404s (handled separately in the fetch function)
      if (error && error.includes('not found')) {
        // Already redirecting in the fetch function
        return;
      }
      
      const redirectTimer = setTimeout(() => {
        // Use router.replace to avoid adding to history stack
        router.replace('/posts');
      }, 1500); // 1.5 second delay for better UX
      
      return () => clearTimeout(redirectTimer);
    }
  }, [error, post, loading, router]);
  
  if (loading) {
    return <div className={s.loading}>Loading post...</div>;
  }
  
  // This renders briefly before redirect happens
  if (error || !post) {
    return <div className={s.loading}>Redirecting to posts...</div>;
  }
  
  // Format the page slug for display
  const formattedPageSlug = formatPageSlug(post.page_slug);
  
  // Check if user is the author of the post
  const isAuthor = isAuthenticated && user?.username === post.author_username;
  
  return (
    <div className={s.container}>
      {/* Delete confirmation modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        title="Delete Post"
        message="Are you sure you want to delete this post? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
      />
      
      <div className={s.postContainer}>
        <header className={s.header}>
          {!isEditing ? (
            <>
              <h1 className={s.title}>{post.title}</h1>
              
              <div className={s.statusRow}>
                <span className={`${s.statusLabel} ${s[`status${post.status.charAt(0).toUpperCase() + post.status.slice(1)}`]}`}>
                  {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                </span>
              </div>
            </>
          ) : (
            <h1 className={s.formTitle}>Edit Post</h1>
          )}
          
          <div className={s.authorSection}>
            <div className={s.authorInfo}>
              <span className={s.byAuthor}>Author: {post.author_name || post.author_username}</span>
              <span className={s.postedDate}>Posted: {new Date(post.created_at).toLocaleDateString()}</span>
              {post.updated_at !== post.created_at && (
                <span className={s.updatedDate}>Updated: {new Date(post.updated_at).toLocaleDateString()}</span>
              )}
              {post.language && (
                <div className={s.languageInfo}>
                  <span className={s.languageLabel}>Language: </span>
                  <LanguageBadge language={post.language} size="medium" />
                </div>
              )}
              {pageAssociations && pageAssociations.length > 0 && (
                <span className={s.associatedPages}>
                  Associated Pages: {pageAssociations.map((association, index) => (
                    <React.Fragment key={association.id}>
                      <Link 
                        href={`/wiki/${association.page_slug}`} 
                        className={s.pageLink}
                      >
                        {formatPageSlug(association.page_slug)}
                      </Link>
                      {index < pageAssociations.length - 1 && <span className={s.pageSeparator}>, </span>}
                    </React.Fragment>
                  ))}
                </span>
              )}
            </div>
            
            {/* Add action buttons if user is author */}
            {isAuthor && !isEditing && (
              <div className={s.actionButtons}>
                <button 
                  onClick={handleEditClick} 
                  className={`${s.actionButton} ${s.editButton}`}
                  disabled={loading}
                >
                  Edit Post
                </button>
                <button 
                  onClick={handleDeleteClick} 
                  className={`${s.actionButton} ${s.deleteButton}`}
                  disabled={loading}
                >
                  Delete Post
                </button>
              </div>
            )}
          </div>
        </header>
        
        <div className={s.contentSection}>
          <div className={s.contentArea}>
            {!isEditing ? (
              <div className={s.postContent}>
                {/* Split content by paragraphs for better display */}
                {post.content.split('\n').map((paragraph, index) => (
                  paragraph.trim() ? <p key={index}>{paragraph}</p> : <br key={index} />
                ))}
              </div>
            ) : (
              <div className={s.editForm}>
                {error && <div className={s.errorMessage}>{error}</div>}
                
                <div className={s.formGroup}>
                  <label htmlFor="title" className={s.label}>Title</label>
                  <input
                    id="title"
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className={s.input}
                    disabled={loading}
                    required
                  />
                </div>
                
                <div className={s.formGroup}>
                  <label htmlFor="content" className={s.label}>Content</label>
                  <textarea
                    id="content"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className={s.textarea}
                    disabled={loading}
                    rows={10}
                    required
                  />
                </div>
                
                <div className={s.formButtons}>
                  <button 
                    onClick={handleCancelEdit} 
                    className={s.cancelButton}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSaveEdit} 
                    className={s.saveButton}
                    disabled={loading || !editTitle.trim() || !editContent.trim()}
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

PostPage.propTypes = {
  postId: PropTypes.string,
  initialPostData: PropTypes.object
};

export default basePageWrap(PostPage);
