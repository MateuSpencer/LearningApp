import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../hooks/useTranslation';
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
  const { t } = useTranslation();
  const [associatedPages, setAssociatedPages] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Extract data from resource and association
  const { 
    id: resourceId, 
    title, 
    resource_type, 
    primary_url, 
    urls = [],
    quality_vote_sum = 0,
    quality_vote_count = 0,
    dominant_difficulty_level,
    average_quality_rating
  } = resource || {};
  
  const { id: associationId, appropriateness_upvotes, appropriateness_downvotes, user_vote, page_slug } = association || {};
  
  // Get the URL to display (primary URL if exists, otherwise first URL)
  const displayUrl = primary_url?.url || (urls.length > 0 ? urls[0].url : null);
  
  // Calculate vote score
  const voteScore = (appropriateness_upvotes || 0) - (appropriateness_downvotes || 0);
  
  // Calculate quality rating
  const qualityRating = average_quality_rating || (quality_vote_count > 0 ? quality_vote_sum / quality_vote_count : 0);
  
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
      
      // Enhanced YouTube URL handling
      if (urlObj.hostname.includes('youtube.com') && urlObj.pathname === '/watch') {
        const videoId = urlObj.searchParams.get('v');
        if (videoId) {
          return `youtube.com/watch?v=${videoId}`;
        }
      } else if (urlObj.hostname.includes('youtu.be')) {
        // Handle youtu.be short links
        const path = urlObj.pathname.replace('/', '');
        if (path) {
          return `youtu.be/${path}`;
        }
      }
      
      // Return domain name + path (truncated if too long)
      const path = urlObj.pathname === '/' ? '' : urlObj.pathname;
      const displayPath = path.length > 20 ? path.substring(0, 17) + '...' : path;
      
      // For non-YouTube URLs, include query parameters
      if (!urlObj.hostname.includes('youtube.com') && urlObj.search && urlObj.search.length > 0) {
        const queryString = urlObj.search.length > 20 ? urlObj.search.substring(0, 17) + '...' : urlObj.search;
        return urlObj.hostname + displayPath + queryString;
      }
      
      return urlObj.hostname + displayPath;
    } catch (err) {
      // Handle YouTube URLs that might not parse correctly
      if (url.includes('youtube.com/watch') && !url.includes('?v=')) {
        // Try to fix malformed YouTube URLs
        if (url.includes('youtube.com/watch')) {
          // Extract video ID if possible
          const match = url.match(/youtube\.com\/watch\/?([a-zA-Z0-9_-]{11})/);
          if (match && match[1]) {
            return `youtube.com/watch?v=${match[1]}`;
          }
        }
      }
      return url;
    }
  };
  
  // Get icon based on resource type
  const getResourceTypeIcon = (type) => {
    switch (type) {
      case 'youtube': 
        return (
          <Image 
            src="/img/youtube_logo.png" 
            alt="YouTube" 
            width={24} 
            height={24} 
            className={s.youtubeIcon}
          />
        );
      case 'video': return '🎬'; // Movie clapper board
      case 'pdf': return '📄'; // Document icon
      case 'image': return '🖼️'; // Picture frame icon
      case 'article': return '📰'; // Newspaper icon
      case 'book': return '📚'; // Books icon
      case 'course': return '🎓'; // Graduation cap icon
      case 'documentation': return '📋'; // Clipboard icon
      case 'tutorial': return '📝'; // Notepad icon
      case 'tool': return '🛠️'; // Tools icon
      case 'website': return '🌐'; // Globe icon
      default: return '🔗'; // Chain link icon
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
  
  // Render stars for the quality rating
  const renderStars = (rating) => {
    if (!rating) return <span className={s.ratingText}>{t('learningResources.noRatings')}</span>;
    
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating - fullStars >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    return (
      <>
        {[...Array(fullStars)].map((_, i) => (
          <span key={`full-${i}`} className={s.star}>★</span>
        ))}
        {hasHalfStar && <span className={s.halfStar}>★</span>}
        {[...Array(emptyStars)].map((_, i) => (
          <span key={`empty-${i}`} className={s.emptyStar}>★</span>
        ))}
        <span className={s.ratingText}>({rating.toFixed(1)})</span>
      </>
    );
  };
  
  // Format difficulty level for display
  const formatDifficultyLevel = (level) => {
    if (!level) return t('learningResources.notRated');
    return level.charAt(0).toUpperCase() + level.slice(1);
  };
  
  // Get CSS class for difficulty level
  const getDifficultyClass = (level) => {
    switch (level) {
      case 'beginner': return s.difficultyBeginner;
      case 'moderate': return s.difficultyModerate;
      case 'advanced': return s.difficultyAdvanced;
      default: return '';
    }
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
            aria-label={t('learningResources.upvote')}
            title={user_vote === 'upvote' ? t('learningResources.alreadyUpvoted') : t('learningResources.upvoteResource')}
          >
            ▲
          </button>
          <span className={s.voteScore}>{voteScore}</span>
          <button 
            className={getDownvoteClasses()}
            onClick={handleDownvote}
            disabled={!canVote}
            aria-label={t('learningResources.downvote')}
            title={user_vote === 'downvote' ? t('learningResources.alreadyDownvoted') : t('learningResources.downvoteResource')}
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
            <Link 
              href={`/learning-resources/${resourceId}`}
              className={s.resourceLink}
            >
              {title}
            </Link>
          </h4>
          
          <a 
            href={displayUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={s.resourceUrl}
          >
            {formatUrl(displayUrl)}
          </a>
          
          {/* Display quality rating and difficulty level */}
          <div className={s.resourceMeta}>
            <div className={s.metaItem}>
              <span className={s.metaLabel}>{t('learningResources.quality')}:</span>
              <div className={s.stars}>
                {renderStars(qualityRating)}
              </div>
            </div>
            
            <div className={s.metaItem}>
              <span className={s.metaLabel}>{t('learningResources.difficulty')}:</span>
              <span className={`${s.difficultyLevel} ${getDifficultyClass(dominant_difficulty_level)}`}>
                {formatDifficultyLevel(dominant_difficulty_level)}
              </span>
            </div>
          </div>
          
          {/* Display associated pages if showing all resources */}
          {showPageLinks && associatedPages.length > 0 && (
            <div className={s.associatedPages}>
              <span className={s.associatedPagesLabel}>{t('learningResources.pages')}:</span>
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
