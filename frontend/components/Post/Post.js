import React from 'react';
import PropTypes from 'prop-types';
import s from './Post.module.css';

const Post = ({ 
  id, 
  title, 
  content, 
  author, 
  createdAt, 
  currentUser, 
  slug, 
  status,
  onEdit, 
  onDelete,
  canModify
}) => {
    const authorStr = String(author).trim();
    const currentUserStr = String(currentUser).trim();
    const isAuthor = currentUser && authorStr === currentUserStr;
    
    // Format slug for display (replace underscores with spaces and capitalize)
    const formattedSlug = slug ? 
        slug.replace(/_/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ') 
        : '';
    
    // Get status label and CSS class
    const getStatusInfo = () => {
        switch(status) {
            case 'published':
                return { label: 'Published', className: s.statusPublished };
            case 'draft':
                return { label: 'Draft', className: s.statusDraft };
            case 'archived':
                return { label: 'Archived', className: s.statusArchived };
            default:
                return { label: 'Unknown', className: '' };
        }
    };
    
    const statusInfo = getStatusInfo();
    
    return (
        <div className={`${s.post} ${statusInfo.className}`}>
            <h3 className={s.title}>{title || 'Untitled Post'}</h3>
            <div className={s.content}>{content}</div>
            <div className={s.meta}>
                <span className={s.author}>By: {author}</span>
                <span className={s.date}>{new Date(createdAt).toLocaleDateString()}</span>
                {slug && <span className={s.topic}>Topic: {formattedSlug}</span>}
                {status && <span className={`${s.status} ${statusInfo.className}`}>{statusInfo.label}</span>}
            </div>
            
            {isAuthor && (
                <div className={s.actions}>
                    <button 
                        onClick={() => onEdit(id)} 
                        className={`${s.actionButton} ${s.editButton}`}
                        aria-label="Edit post"
                        title="Edit post"
                        disabled={!canModify}
                    >
                        <span className={s.icon}>✎</span>
                    </button>
                    <button 
                        onClick={() => onDelete(id)} 
                        className={`${s.actionButton} ${s.deleteButton}`}
                        aria-label="Delete post"
                        title="Delete post"
                        disabled={!canModify}
                    >
                        <span className={s.icon}>✕</span>
                    </button>
                </div>
            )}
        </div>
    );
};

Post.propTypes = {
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string,
    content: PropTypes.string.isRequired,
    author: PropTypes.string,
    createdAt: PropTypes.string,
    currentUser: PropTypes.string,
    slug: PropTypes.string,
    status: PropTypes.oneOf(['published', 'draft', 'archived']),
    onEdit: PropTypes.func,
    onDelete: PropTypes.func,
    canModify: PropTypes.bool
};

Post.defaultProps = {
    title: '',
    author: 'Anonymous',
    createdAt: new Date().toISOString(),
    slug: '',
    status: 'published',
    onEdit: () => {},
    onDelete: () => {},
    canModify: true
};

export default Post;