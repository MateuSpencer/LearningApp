import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { basePageWrap } from '../BasePage';
import { useAuth } from '../../context/AuthContext';
import learningResources from '../../api/learningResources';
import s from './LearningResourcePage.module.css';

const LearningResourcePage = ({ resourceId, initialResourceData }) => {
  const router = useRouter();
  const { isAuthenticated, refreshAuth } = useAuth();
  
  const [resource, setResource] = useState(initialResourceData || null);
  const [loading, setLoading] = useState(!initialResourceData);
  const [error, setError] = useState(null);
  
  const [qualityRating, setQualityRating] = useState(0);
  const [accessibilityLevel, setAccessibilityLevel] = useState('');
  const [userVotes, setUserVotes] = useState({
    quality: 0,
    accessibility: ''
  });
  
  // Fetch resource data when component mounts or resourceId changes
  useEffect(() => {
    const fetchResourceData = async () => {
      if (!resourceId) {
        setError('Resource ID is required');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        const data = await learningResources.getById(resourceId);
        setResource(data);
        
        // Set initial rating values if user has already voted
        if (data.user_quality_vote) {
          setQualityRating(data.user_quality_vote);
          setUserVotes(prev => ({ ...prev, quality: data.user_quality_vote }));
        }
        
        if (data.user_accessibility_vote) {
          setAccessibilityLevel(data.user_accessibility_vote);
          setUserVotes(prev => ({ ...prev, accessibility: data.user_accessibility_vote }));
        }
      } catch (err) {
        console.error('Failed to fetch learning resource:', err);
        setError('Failed to load resource. It may have been removed or you may not have permission to view it.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchResourceData();
  }, [resourceId]);
  
  // Ensure user is authenticated before actions that require auth
  const requireAuth = () => {
    if (!isAuthenticated) {
      router.push('/accounts/login/');
      return false;
    }
    return true;
  };
  
  // Handle quality vote submission
  const handleQualityVote = async (rating) => {
    if (!requireAuth()) return;
    
    try {
      setLoading(true);
      
      // Submit the vote
      await learningResources.submitQualityVote(resourceId, rating);
      
      // Update local state optimistically
      setQualityRating(rating);
      setUserVotes(prev => ({ ...prev, quality: rating }));
      
      // Refetch to get updated aggregate values
      const updatedResource = await learningResources.getById(resourceId);
      setResource(updatedResource);
    } catch (err) {
      console.error('Failed to submit quality vote:', err);
      
      // Handle session expiration
      if (err.response && err.response.status === 401) {
        refreshAuth();
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Handle accessibility vote submission
  const handleAccessibilityVote = async (level) => {
    if (!requireAuth()) return;
    
    try {
      setLoading(true);
      
      // Submit the vote
      await learningResources.submitAccessibilityVote(resourceId, level);
      
      // Update local state optimistically
      setAccessibilityLevel(level);
      setUserVotes(prev => ({ ...prev, accessibility: level }));
      
      // Refetch to get updated aggregate values
      const updatedResource = await learningResources.getById(resourceId);
      setResource(updatedResource);
    } catch (err) {
      console.error('Failed to submit accessibility vote:', err);
      
      // Handle session expiration
      if (err.response && err.response.status === 401) {
        refreshAuth();
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Format page slug for display
  const formatPageSlug = (slug) => {
    return slug
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  // Render stars for the quality rating input
  const renderStarInput = () => {
    return (
      <div className={s.starRating}>
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            className={`${s.starButton} ${star <= qualityRating ? s.active : ''}`}
            onClick={() => handleQualityVote(star)}
            disabled={!isAuthenticated}
            title={isAuthenticated ? `Rate ${star} out of 5` : 'Log in to vote'}
          >
            ★
          </button>
        ))}
      </div>
    );
  };
  
  // If still loading or error occurred
  if (loading && !resource) {
    return <div className={s.container}><p className={s.loading}>Loading resource...</p></div>;
  }
  
  if (error && !resource) {
    return <div className={s.container}><p className={s.error}>{error}</p></div>;
  }
  
  // Resource not found
  if (!resource) {
    return (
      <div className={s.container}>
        <h1 className={s.title}>Resource Not Found</h1>
        <p>The learning resource you're looking for doesn't exist or has been removed.</p>
        <Link href="/learning-resources" className={s.link}>Browse All Resources</Link>
      </div>
    );
  }
  
  // Determine primary URL to display/embed
  const primaryUrl = resource.urls?.find(url => url.is_primary)?.url || resource.urls?.[0]?.url || '';
  const additionalUrls = resource.urls?.filter(url => !url.is_primary) || [];

  return (
    <div className={s.container}>
      <h1 className={s.title}>{resource.title}</h1>
      
      <div className={s.typeLabel}>{resource.resource_type}</div>
      
      <div className={s.contentContainer}>
        <div className={s.primaryContent}>
          {primaryUrl && (
            <>
              {/* Try to embed content, with fallback to link */}
              <div className={s.embedContainer}>
                <iframe
                  src={primaryUrl}
                  className={s.embedFrame}
                  title={resource.title}
                  sandbox="allow-scripts allow-same-origin allow-popups"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                  onError={() => console.log('Failed to load embed')}
                />
              </div>
              
              <div className={s.embedFallback}>
                <p>If the content doesn't load correctly, you can access it directly:</p>
                <a 
                  href={primaryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={s.primaryLink}
                >
                  {primaryUrl}
                </a>
              </div>
            </>
          )}
          
          {!primaryUrl && (
            <div className={s.noContent}>
              <p>This resource doesn't have any URLs attached.</p>
            </div>
          )}
        </div>
        
        <div className={s.sidebar}>
          <div className={s.sidebarSection}>
            <h3 className={s.sectionTitle}>Quality Rating</h3>
            <div className={s.ratingDisplay}>
              <div className={s.averageRating}>
                <span className={s.ratingValue}>{resource.average_quality_rating?.toFixed(1) || 'No votes'}</span>
                <span className={s.ratingLabel}>/ 5</span>
              </div>
            </div>
            <div className={s.voteSection}>
              <h4 className={s.voteTitle}>Your Rating</h4>
              {renderStarInput()}
            </div>
          </div>
          
          <div className={s.sidebarSection}>
            <h3 className={s.sectionTitle}>Accessibility Level</h3>
            <div className={s.accessibilityDisplay}>
              <div className={s.dominantLevel}>
                Most users rated this resource as:
                <span className={s.levelBadge}>
                  {resource.dominant_accessibility_level || 'Not Yet Rated'}
                </span>
              </div>
            </div>
            <div className={s.voteSection}>
              <h4 className={s.voteTitle}>Your Assessment</h4>
              <div className={s.accessibilityButtons}>
                <button
                  className={`${s.levelButton} ${accessibilityLevel === 'beginner' ? s.active : ''}`}
                  onClick={() => handleAccessibilityVote('beginner')}
                  disabled={!isAuthenticated}
                >
                  Beginner
                </button>
                <button
                  className={`${s.levelButton} ${accessibilityLevel === 'moderate' ? s.active : ''}`}
                  onClick={() => handleAccessibilityVote('moderate')}
                  disabled={!isAuthenticated}
                >
                  Moderate
                </button>
                <button
                  className={`${s.levelButton} ${accessibilityLevel === 'advanced' ? s.active : ''}`}
                  onClick={() => handleAccessibilityVote('advanced')}
                  disabled={!isAuthenticated}
                >
                  Advanced
                </button>
              </div>
            </div>
          </div>
          
          {additionalUrls.length > 0 && (
            <div className={s.sidebarSection}>
              <h3 className={s.sectionTitle}>Additional URLs</h3>
              <ul className={s.urlList}>
                {additionalUrls.map((urlItem, index) => (
                  <li key={index} className={s.urlItem}>
                    <a 
                      href={urlItem.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={s.urlLink}
                    >
                      {urlItem.url}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
      
      {resource.page_associations && resource.page_associations.length > 0 && (
        <div className={s.associatedPages}>
          <h3 className={s.associatedTitle}>Associated Topics</h3>
          <div className={s.pagesList}>
            {resource.page_associations.map((association, index) => (
              <Link 
                key={index}
                href={`/wiki/${association.page_slug}`}
                className={s.pageLink}
              >
                {formatPageSlug(association.page_slug)}
              </Link>
            ))}
          </div>
        </div>
      )}
      
      <div className={s.metadata}>
        <div className={s.created}>Created: {new Date(resource.created_at).toLocaleDateString()}</div>
        <div className={s.updated}>Last Updated: {new Date(resource.updated_at).toLocaleDateString()}</div>
      </div>
    </div>
  );
};

LearningResourcePage.propTypes = {
  resourceId: PropTypes.string,
  initialResourceData: PropTypes.object,
};

LearningResourcePage.defaultProps = {
  resourceId: '',
  initialResourceData: null,
};

export default basePageWrap(LearningResourcePage);
