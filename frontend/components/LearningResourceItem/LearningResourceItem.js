import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import learningResources from '../../api/learningResources';
import s from './LearningResourceItem.module.css';

const LearningResourceItem = ({ 
  resource, 
  association,
  onUpvote,
  onDownvote,
  canVote,
  showPageLinks = false,
  showVoting = true
}) => {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [associatedPages, setAssociatedPages] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Extract data from resource and association
  const { id: resourceId, title, resource_type, primary_url, urls = [] } = resource || {};
  const { id: associationId, appropriateness_upvotes, appropriateness_downvotes, user_vote, page_slug } = association || {};
  
  // Get the URL to display (primary URL if exists, otherwise first URL)
  const displayUrl = primary_url?.url || (urls.length > 0 ? urls[0].url : null);
  
  // Calculate vote score
  const voteScore = (appropriateness_upvotes || 0) - (appropriateness_downvotes || 0);
  
  // Fetch associated pages for this resource if showPageLinks is true
  useEffect(() => {
    if (showPageLinks && resourceId) {
      const fetchAssociatedPages = async () => {
        setLoading(true);
        try {
          const response = await learningResources.getAssociationsForResource(resourceId);
          
          // No need to filter anymore since backend should now properly filter by resource_id
          const associationsWithSlugs = response.results 
            ? response.results.filter(assoc => !!assoc.page_slug)
            : [];
          
          setAssociatedPages(associationsWithSlugs);
        } catch (err) {
          console.error(`Error fetching associations for resource ${resourceId}:`, err);
          setAssociatedPages([]);
        } finally {
          setLoading(false);
        }
      };
      
      fetchAssociatedPages();
    }
  }, [showPageLinks, resourceId]);
  
  // Format the URL for display
  const formatUrl = (url) => {
    if (!url) return '';
    try {
      const urlObj = new URL(url);
      // Return domain name + path (truncated if too long)
      const path = urlObj.pathname === '/' ? '' : urlObj.pathname;
      const displayPath = path.length > 20 ? path.substring(0, 17) + '...' : path;
      return urlObj.hostname + displayPath;
    } catch (err) {
      return url;
    }
  };
  
  // Get icon based on resource type
  const getResourceTypeIcon = (type) => {
    switch (type) {
      case 'video': return '🎥';
      case 'pdf': return '📄';
      case 'image': return '🖼️';
      case 'article': return '📰';
      case 'course': return '📚';
      case 'documentation': return '📋';
      case 'tutorial': return '📝';
      case 'tool': return '🛠️';
      default: return '🔗';
    }
  };
  
  const handleUpvote = () => {
    if (!isAuthenticated) {
      router.push('/accounts/login/');
      return;
    }
    
    if (onUpvote && associationId) {
      onUpvote(associationId);
    }
  };
  
  const handleDownvote = () => {
    if (!isAuthenticated) {
      router.push('/accounts/login/');
      return;
    }
    
    if (onDownvote && associationId) {
      onDownvote(associationId);
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
  
  if (!resource || !displayUrl) {
    return null; // Don't render if resource or URL is missing
  }
  
  return (
    <div className={s.resourceItem}>
      {/* Only show voting UI when showVoting is true */}
      {showVoting && (
        <div className={s.voteContainer}>
          <button 
            className={getUpvoteClasses()}
            onClick={handleUpvote}
            disabled={!canVote}
            aria-label="Upvote"
            title={user_vote === 'upvote' ? 'You upvoted this resource' : 'Upvote this resource'}
          >
            ▲
          </button>
          <span className={s.voteScore}>{voteScore}</span>
          <button 
            className={getDownvoteClasses()}
            onClick={handleDownvote}
            disabled={!canVote}
            aria-label="Downvote"
            title={user_vote === 'downvote' ? 'You downvoted this resource' : 'Downvote this resource'}
          >
            ▼
          </button>
        </div>
      )}
      
      <div className={s.resourceContent}>
        <span className={s.resourceType} title={resource_type}>
          {getResourceTypeIcon(resource_type)}
        </span>
        
        <div className={s.resourceInfo}>
          <h4 className={s.resourceTitle}>
            <a 
              href={displayUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={s.resourceLink}
            >
              {title}
            </a>
          </h4>
          
          <a 
            href={displayUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={s.resourceUrl}
          >
            {formatUrl(displayUrl)}
          </a>
          
          {/* Display associated pages if showing all resources */}
          {showPageLinks && associatedPages.length > 0 && (
            <div className={s.associatedPages}>
              <span className={s.associatedPagesLabel}>Pages:</span>
              {associatedPages.map((assoc, index) => (
                <React.Fragment key={assoc.id}>
                  <Link href={`/wiki/${assoc.page_slug}`} className={s.pageLink}>
                    {assoc.page_slug.replace(/-/g, ' ')}
                  </Link>
                  {index < associatedPages.length - 1 && <span className={s.pageSeparator}>,</span>}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

LearningResourceItem.propTypes = {
  resource: PropTypes.object.isRequired,
  association: PropTypes.object.isRequired,
  onUpvote: PropTypes.func,
  onDownvote: PropTypes.func,
  canVote: PropTypes.bool,
  showPageLinks: PropTypes.bool,
  showVoting: PropTypes.bool
};

LearningResourceItem.defaultProps = {
  canVote: false,
  showPageLinks: false,
  showVoting: true
};

export default LearningResourceItem;
