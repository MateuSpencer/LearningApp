import React from 'react';
import PropTypes from 'prop-types';
import Link from 'next/link';
import s from './Post.module.css';

const Post = ({ 
  id, 
  content, 
  resource_url,
  author, 
  createdAt, 
  currentUser, 
  slug,
  primary_slug,
  page_slug,
  status,
  onEdit, 
  onDelete,
  canModify
}) => {
    const authorStr = String(author).trim();
    const currentUserStr = String(currentUser).trim();
    const isAuthor = currentUser && authorStr === currentUserStr;
    
    // Format slugs for display (replace underscores with spaces and capitalize)
    const formatForDisplay = (slugText) => {
        if (!slugText) return '';
        return slugText
            .replace(/_/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };
    
    // Get formatted versions of slugs
    const formattedSlug = formatForDisplay(slug);
    const formattedPageSlug = formatForDisplay(page_slug);
    
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
            {resource_url && (
                <div className={s.resourceUrl}>
                    <strong>Resource:</strong> 
                    <a 
                        href={resource_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className={s.resourceLink}
                    >
                        {resource_url}
                    </a>
                </div>
            )}
            <div className={s.content}>{content}</div>
            <div className={s.meta}>
                <span className={s.author}>By: {author}</span>
                <span className={s.date}>{new Date(createdAt).toLocaleDateString()}</span>
                
                {page_slug && (
                    <span className={s.topic}>
                        Page: 
                        <Link 
                            href={`/wiki/${page_slug}`}
                            className={s.pageLink}
                        >
                            {formattedPageSlug}
                        </Link>
                    </span>
                )}
                
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
    content: PropTypes.string.isRequired,
    resource_url: PropTypes.string,
    author: PropTypes.string,
    createdAt: PropTypes.string,
    currentUser: PropTypes.string,
    slug: PropTypes.string,
    primary_slug: PropTypes.string,
    page_slug: PropTypes.string,
    status: PropTypes.oneOf(['published', 'draft', 'archived']),
    onEdit: PropTypes.func,
    onDelete: PropTypes.func,
    canModify: PropTypes.bool
};

Post.defaultProps = {
    author: 'Anonymous',
    createdAt: new Date().toISOString(),
    resource_url: '',
    slug: '',
    primary_slug: '',
    page_slug: '',
    status: 'published',
    onEdit: () => {},
    onDelete: () => {},
    canModify: true
};

export default Post;