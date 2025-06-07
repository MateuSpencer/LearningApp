import React from 'react';
import PropTypes from 'prop-types';
import Link from 'next/link';
import s from './PostPageAssociation.module.css';
import { formatPageSlug } from '../../utils/stringUtils';

const PostPageAssociation = ({ 
  id, 
  postId,
  postTitle,
  page_slug,
  appropriateness_upvotes,
  appropriateness_downvotes,
  appropriateness_score,
  user_vote,
  onUpvote, 
  onDownvote,
  onRemove,
  canVote,
  canRemove
}) => {
    const formattedPageSlug = formatPageSlug(page_slug);
    
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
    
    const handleRemove = () => {
        if (onRemove && canRemove) {
            onRemove(id, page_slug);
        }
    };
    
    return (
        <div className={s.association}>
            <div className={s.associationLayout}>
                {/* Vote controls */}
                <div className={s.voteControls}>
                    <button 
                        onClick={handleUpvote}
                        className={`${s.voteButton} ${user_vote === 'upvote' ? s.upvoted : ''}`}
                        aria-label="Upvote"
                        title="Upvote this association"
                        disabled={!canVote}
                    >
                        <span className={s.voteIcon}>▲</span>
                    </button>
                    
                    <span className={s.voteScore}>{appropriateness_score}</span>
                    
                    <button 
                        onClick={handleDownvote}
                        className={`${s.voteButton} ${user_vote === 'downvote' ? s.downvoted : ''}`}
                        aria-label="Downvote"
                        title="Downvote this association"
                        disabled={!canVote}
                    >
                        <span className={s.voteIcon}>▼</span>
                    </button>
                </div>
                
                {/* Association info */}
                <div className={s.associationInfo}>
                    <div className={s.pageLink}>
                        <Link 
                            href={`/wiki/${page_slug}`}
                            className={s.link}
                        >
                            {formattedPageSlug}
                        </Link>
                    </div>
                    
                    {canRemove && (
                        <button 
                            onClick={handleRemove} 
                            className={s.removeButton}
                            aria-label="Remove association"
                            title="Remove this page association"
                        >
                            <span className={s.removeIcon}>✕</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

PostPageAssociation.propTypes = {
    id: PropTypes.string.isRequired,
    postId: PropTypes.string.isRequired,
    postTitle: PropTypes.string,
    page_slug: PropTypes.string.isRequired,
    appropriateness_upvotes: PropTypes.number,
    appropriateness_downvotes: PropTypes.number,
    appropriateness_score: PropTypes.number,
    user_vote: PropTypes.string,
    onUpvote: PropTypes.func,
    onDownvote: PropTypes.func,
    onRemove: PropTypes.func,
    canVote: PropTypes.bool,
    canRemove: PropTypes.bool
};

PostPageAssociation.defaultProps = {
    postTitle: '',
    appropriateness_upvotes: 0,
    appropriateness_downvotes: 0,
    appropriateness_score: 0,
    user_vote: null,
    onUpvote: () => {},
    onDownvote: () => {},
    onRemove: () => {},
    canVote: true,
    canRemove: false
};

export default PostPageAssociation;
