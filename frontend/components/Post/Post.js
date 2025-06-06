import React from 'react';
import PropTypes from 'prop-types';
import Link from 'next/link';
import s from './Post.module.css';
import { formatPageSlug } from '../../utils/stringUtils'; // Import from new utility file
import LanguageBadge from '../LanguageBadge/LanguageBadge';

const Post = ({ 
  id, 
  title,
  content,
  content_preview,
  author, 
  createdAt, 
  currentUser, 
  status,
  page_associations,
  slug, // Current page slug
  appropriateness_upvotes,
  appropriateness_downvotes,
  appropriateness_score,
  user_vote,
  language,
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
    
    // Calculate vote score if not provided directly
    const voteScore = appropriateness_score !== undefined 
        ? appropriateness_score 
        : (appropriateness_upvotes || 0) - (appropriateness_downvotes || 0);
    
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
    
    // Get CSS classes for vote buttons
    const getUpvoteClasses = () => {
        const baseClass = s.voteButton;
        if (user_vote === 'upvote') {
            return `${baseClass} ${s.upvoted}`;
        }
        return baseClass;
    };
    
    const getDownvoteClasses = () => {
        const baseClass = s.voteButton;
        if (user_vote === 'downvote') {
            return `${baseClass} ${s.downvoted}`;
        }
        return baseClass;
    };
    
    const statusInfo = getStatusInfo();
    
    // Check if this post should show voting controls
    // Only show voting controls when:
    // 1. We're on a wiki page (slug exists)
    // 2. We have vote handlers
    // 3. This post has an association with the current page
    const showVoting = slug && 
                      typeof onUpvote === 'function' && 
                      typeof onDownvote === 'function' &&
                      (user_vote !== undefined || appropriateness_score !== undefined);
    
    return (
        <div className={`${s.post} ${statusInfo.className}`}>
            <div className={s.postLayout}>
                {/* Vote controls on the left if we're on a page and should show voting */}
                {showVoting ? (
                    <div className={s.voteControls}>
                        <button 
                            className={getUpvoteClasses()}
                            onClick={() => typeof onUpvote === 'function' && onUpvote(id)}
                            disabled={!canVote}
                            aria-label="Upvote"
                            title={user_vote === 'upvote' ? 'You upvoted this post' : 'Upvote this post'}
                        >
                            <span className={s.voteIcon}>▲</span>
                        </button>
                        <span className={s.voteScore}>{voteScore}</span>
                        <button 
                            className={getDownvoteClasses()}
                            onClick={() => typeof onDownvote === 'function' && onDownvote(id)}
                            disabled={!canVote}
                            aria-label="Downvote"
                            title={user_vote === 'downvote' ? 'You downvoted this post' : 'Downvote this post'}
                        >
                            <span className={s.voteIcon}>▼</span>
                        </button>
                    </div>
                ) : (
                    <div className={s.contentIcon}>
                        <span className={s.icon}>📝</span>
                    </div>
                )}
                
                {/* Post content on the right */}
                <div className={s.postContent}>
                    <h3 className={s.title}>
                        <Link href={`/posts/${id}`} className={s.titleLink}>
                            {title}
                        </Link>
                    </h3>
                    {content_preview ? (
                        <div className={s.contentPreview}>{content_preview}</div>
                    ) : (
                        <div className={s.contentPreview}>
                            {content && content.length > 300 ? `${content.substring(0, 300)}...` : content}
                        </div>
                    )}
                    <div className={s.meta}>
                        <span className={s.author}>By: {author}</span>
                        <span className={s.date}>{new Date(createdAt).toLocaleDateString()}</span>
                        
                        {language && <LanguageBadge language={language} size="small" />}
                        
                        {page_associations && page_associations.length > 0 && (
                            <span className={s.topic}>
                                {page_associations.length === 1 ? 'Page: ' : 'Pages: '}
                                {page_associations.map((assoc, index) => (
                                    <React.Fragment key={assoc.id || index}>
                                        <Link 
                                            href={`/wiki/${assoc.page_slug}`}
                                            className={s.pageLink}
                                        >
                                            {formatPageSlug(assoc.page_slug)}
                                        </Link>
                                        {index < page_associations.length - 1 && ', '}
                                    </React.Fragment>
                                ))}
                            </span>
                        )}
                        
                        {status && <span className={`${s.status} ${statusInfo.className}`}>{statusInfo.label}</span>}
                    </div>
                    
                    {isAuthor && (
                        <div className={s.actions}>
                            <button 
                                onClick={() => typeof onEdit === 'function' && onEdit(id)} 
                                className={`${s.actionButton} ${s.editButton}`}
                                aria-label="Edit post"
                                title="Edit post"
                                disabled={!canModify}
                            >
                                <span className={s.icon}>✎</span>
                            </button>
                            <button 
                                onClick={() => typeof onDelete === 'function' && onDelete(id)} 
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
    title: PropTypes.string,
    content: PropTypes.string.isRequired,
    content_preview: PropTypes.string,
    author: PropTypes.string,
    createdAt: PropTypes.string,
    currentUser: PropTypes.string,
    status: PropTypes.oneOf(['published', 'draft', 'archived']),
    page_associations: PropTypes.array,
    slug: PropTypes.string, // Current page slug
    appropriateness_upvotes: PropTypes.number,
    appropriateness_downvotes: PropTypes.number,
    appropriateness_score: PropTypes.number,
    user_vote: PropTypes.string,
    language: PropTypes.string,
    onEdit: PropTypes.func,
    onDelete: PropTypes.func,
    onUpvote: PropTypes.func,
    onDownvote: PropTypes.func,
    canModify: PropTypes.bool,
    canVote: PropTypes.bool
};

Post.defaultProps = {
    title: '',
    author: 'Anonymous',
    createdAt: new Date().toISOString(),
    content_preview: '',
    status: 'published',
    page_associations: [],
    onEdit: () => {},
    onDelete: () => {},
    onUpvote: null,
    onDownvote: null,
    canModify: true,
    canVote: true
};

export default Post;