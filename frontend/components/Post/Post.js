import React from 'react';
import PropTypes from 'prop-types';
import Link from 'next/link';
import s from './Post.module.css';
import { formatPageSlug } from '../../utils/stringUtils'; // Import from new utility file

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
  upvotes_count,
  downvotes_count,
  votes_score,
  user_vote,
  onEdit, 
  onDelete,
  onUpvote,
  onDownvote,
  canModify,
  canVote
}) => {
    const authorStr = String(author).trim();
    const currentUserStr = currentUser ? String(currentUser).trim() : '';
    const isAuthor = currentUser && authorStr === currentUserStr;
    
    // Get formatted versions of slugs using the imported function
    const formattedSlug = formatPageSlug(slug);
    const formattedPageSlug = formatPageSlug(page_slug);
    
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
    
    // Handle vote button clicks
    const handleUpvote = () => {
        if (onUpvote && canVote) {
            onUpvote(id);
        }
    };
    
    const handleDownvote = () => {
        if (onDownvote && canVote) {
            onDownvote(id);
        }
    };
    
    return (
        <div className={`${s.post} ${statusInfo.className}`}>
            <div className={s.postLayout}>
                {/* Vote controls on the left */}
                <div className={s.voteControls}>
                    <button 
                        onClick={handleUpvote}
                        className={`${s.voteButton} ${user_vote === 'upvote' ? s.upvoted : ''}`}
                        aria-label="Upvote"
                        title="Upvote"
                        disabled={!canVote}
                    >
                        <span className={s.voteIcon}>▲</span>
                    </button>
                    
                    <span className={s.voteScore}>{votes_score}</span>
                    
                    <button 
                        onClick={handleDownvote}
                        className={`${s.voteButton} ${user_vote === 'downvote' ? s.downvoted : ''}`}
                        aria-label="Downvote"
                        title="Downvote"
                        disabled={!canVote}
                    >
                        <span className={s.voteIcon}>▼</span>
                    </button>
                </div>
                
                {/* Post content on the right */}
                <div className={s.postContent}>
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
            </div>
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
    upvotes_count: PropTypes.number,
    downvotes_count: PropTypes.number, 
    votes_score: PropTypes.number,
    user_vote: PropTypes.string,
    onEdit: PropTypes.func,
    onDelete: PropTypes.func,
    onUpvote: PropTypes.func,
    onDownvote: PropTypes.func,
    canModify: PropTypes.bool,
    canVote: PropTypes.bool
};

Post.defaultProps = {
    author: 'Anonymous',
    createdAt: new Date().toISOString(),
    resource_url: '',
    slug: '',
    primary_slug: '',
    page_slug: '',
    status: 'published',
    upvotes_count: 0,
    downvotes_count: 0,
    votes_score: 0,
    user_vote: null,
    onEdit: () => {},
    onDelete: () => {},
    onUpvote: () => {},
    onDownvote: () => {},
    canModify: true,
    canVote: true
};

export default Post;