import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { basePageWrap } from '../BasePage';
import { useAuth } from '../../context/AuthContext';
import learningResources from '../../api/learningResources';
import LearningResourceSummary from '../../components/LearningResourceSummary/LearningResourceSummary';
import s from './LearningResourcePage.module.css';

// Helper function to check if URL is from YouTube
const isYouTubeUrl = (url) => {
  if (!url) return false;
  
  try {
    // Match YouTube URL patterns
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)/;
    return youtubeRegex.test(url);
  } catch (err) {
    return false;
  }
};

// Helper function to convert regular YouTube URLs to embed format
const getEmbedUrl = (url) => {
  if (!url) return '';
  
  try {
    // Only convert YouTube URLs
    if (!isYouTubeUrl(url)) return url;
    
    // Match YouTube URL patterns
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(youtubeRegex);
    
    if (match && match[1]) {
      // Return the embed URL format
      return `https://www.youtube.com/embed/${match[1]}`;
    }
    
    // If not a YouTube URL or pattern doesn't match, return the original URL
    return url;
  } catch (err) {
    return url;
  }
};

const LearningResourcePage = ({ resourceId, initialResourceData }) => {
  const router = useRouter();
  const { isAuthenticated, refreshAuth } = useAuth();
  
  const [resource, setResource] = useState(initialResourceData || null);
  const [loading, setLoading] = useState(!initialResourceData);
  const [error, setError] = useState(null);
  
  const [qualityRating, setQualityRating] = useState(0);
  const [difficultyLevel, setDifficultyLevel] = useState('');
  const [userVotes, setUserVotes] = useState({
    quality: 0,
    difficulty: ''
  });
  
  // Add state for page associations
  const [pageAssociations, setPageAssociations] = useState([]);
  const [loadingAssociations, setLoadingAssociations] = useState(false);
  
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
        
        if (data.user_difficulty_vote) {
          setDifficultyLevel(data.user_difficulty_vote);
          setUserVotes(prev => ({ ...prev, difficulty: data.user_difficulty_vote }));
        }
      } catch (err) {
        setError('Failed to load resource. It may have been removed or you may not have permission to view it.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchResourceData();
  }, [resourceId]);
  
  // Fetch page associations for the resource
  useEffect(() => {
    if (resource?.id) {
      const fetchPageAssociations = async () => {
        setLoadingAssociations(true);
        try {
          const response = await learningResources.getAssociationsForResource(resource.id);
          const associationsWithSlugs = response.results 
            ? response.results.filter(assoc => !!assoc.page_slug)
            : [];
          
          setPageAssociations(associationsWithSlugs);
        } catch (err) {
          setPageAssociations([]);
        } finally {
          setLoadingAssociations(false);
        }
      };
      
      fetchPageAssociations();
    }
  }, [resource?.id]);
  
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
      
      // If clicking on the same star rating that's already selected, remove the vote
      const ratingToSubmit = rating === qualityRating ? null : rating;
      
      // Submit the vote
      await learningResources.submitQualityVote(resourceId, ratingToSubmit);
      
      // Update local state optimistically
      setQualityRating(ratingToSubmit || 0);
      setUserVotes(prev => ({ ...prev, quality: ratingToSubmit }));
      
      // Refetch to get updated aggregate values
      const updatedResource = await learningResources.getById(resourceId);
      setResource(updatedResource);
    } catch (err) {
      console.error("Error submitting quality vote for resource", resourceId, ":", err);
      // Handle session expiration
      if (err.response && err.response.status === 401) {
        refreshAuth();
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Handle difficulty vote submission
  const handleDifficultyVote = async (level) => {
    if (!requireAuth()) return;
    
    try {
      setLoading(true);
      
      // Submit the vote
      await learningResources.submitDifficultyVote(resourceId, level);
      
      // Update local state optimistically
      setDifficultyLevel(level);
      setUserVotes(prev => ({ ...prev, difficulty: level }));
      
      // Refetch to get updated aggregate values
      const updatedResource = await learningResources.getById(resourceId);
      setResource(updatedResource);
    } catch (err) {
      // Handle session expiration
      if (err.response && err.response.status === 401) {
        refreshAuth();
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Get CSS class for difficulty level badge
  const getLevelBadgeClass = (level) => {
    switch (level) {
      case 'beginner': return s.beginnerBadge;
      case 'moderate': return s.moderateBadge;
      case 'advanced': return s.advancedBadge;
      default: return '';
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
      
      <div className={s.headerSection}>
        <div className={s.typeLabel}>{resource.resource_type}</div>
      </div>
      
      {/* Associated Pages section above the video - styled like resource index page */}
      {pageAssociations.length > 0 && (
        <div className={s.associatedPagesSection}>
          <div className={s.associatedPages}>
            <span className={s.associatedPagesLabel}>Associated Pages:</span>
            {pageAssociations.map((association, index) => (
              <React.Fragment key={association.id}>
                <Link 
                  href={`/wiki/${association.page_slug}`}
                  className={s.pageLink}
                >
                  {formatPageSlug(association.page_slug)}
                </Link>
                {index < pageAssociations.length - 1 && <span className={s.pageSeparator}>,</span>}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
      
      {loadingAssociations && (
        <div className={s.associatedPagesSection}>
          <div className={s.associatedPages}>
            <span>Loading associated pages...</span>
          </div>
        </div>
      )}
      
      {/* Metadata section - moved near top */}
      <div className={s.metadata}>
        <div className={s.created}>Created: {new Date(resource.created_at).toLocaleDateString()}</div>
        <div className={s.updated}>Last Updated: {new Date(resource.updated_at).toLocaleDateString()}</div>
      </div>
      
      {primaryUrl && (
        <>
          {/* URL fallback message - moved above the iframe */}
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
          
          {/* Try to embed content */}
          <div className={s.embedContainer}>
            <iframe
              src={getEmbedUrl(primaryUrl)}
              className={s.embedFrame}
              title={resource.title}
              sandbox="allow-scripts allow-same-origin allow-popups allow-presentation"
              referrerPolicy="no-referrer"
              loading="lazy"
              onError={() => {}}
            />
          </div>
        </>
      )}
      
      {!primaryUrl && (
        <div className={s.noContent}>
          <p>This resource doesn't have any URLs attached.</p>
        </div>
      )}
      
      <div className={s.votingSection}>
        <div className={s.ratingCard}>
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
        
        <div className={s.ratingCard}>
          <h3 className={s.sectionTitle}>Difficulty Level</h3>
          <div className={s.difficultyDisplay}>
            <div className={s.dominantLevel}>
              Most users rated this resource as:
              <span className={`${s.levelBadge} ${getLevelBadgeClass(resource.dominant_difficulty_level)}`}>
                {resource.dominant_difficulty_level ? resource.dominant_difficulty_level.charAt(0).toUpperCase() + resource.dominant_difficulty_level.slice(1) : 'Not Yet Rated'}
              </span>
            </div>
          </div>
          <div className={s.voteSection}>
            <h4 className={s.voteTitle}>Your Assessment</h4>
            <div className={s.difficultyButtons}>
              <button
                className={`${s.levelButton} ${s.beginnerButton} ${difficultyLevel === 'beginner' ? s.active : ''}`}
                onClick={() => handleDifficultyVote('beginner')}
                disabled={!isAuthenticated}
              >
                Beginner
              </button>
              <button
                className={`${s.levelButton} ${s.moderateButton} ${difficultyLevel === 'moderate' ? s.active : ''}`}
                onClick={() => handleDifficultyVote('moderate')}
                disabled={!isAuthenticated}
              >
                Moderate
              </button>
              <button
                className={`${s.levelButton} ${s.advancedButton} ${difficultyLevel === 'advanced' ? s.active : ''}`}
                onClick={() => handleDifficultyVote('advanced')}
                disabled={!isAuthenticated}
              >
                Advanced
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {additionalUrls.length > 0 && (
        <div className={s.additionalUrls}>
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
      
      {/* AI Summary Section */}
      <LearningResourceSummary 
        resource={resource} 
        onSummaryGenerated={(result) => {
          // Update the resource state when a summary is generated
          if (result) {
            // If the result contains a structured summary object
            let summaryText = '';
            
            if (typeof result === 'string') {
              summaryText = result;
            } else if (result.summary) {
              // Format the summary as text with highlights and target audience
              summaryText = result.summary;
              
              // Add highlights if available
              if (result.highlights && result.highlights.length > 0) {
                summaryText += '\n\nKey Highlights:\n';
                result.highlights.forEach((highlight, idx) => {
                  summaryText += `${idx + 1}. ${highlight}\n`;
                });
              }
              
              // Add target audience if available
              if (result.targetAudience) {
                summaryText += `\nTarget Audience: ${result.targetAudience}`;
              }
            }
            
            // Update the resource state with new summary data
            setResource({
              ...resource,
              ai_summary: summaryText || result.ai_summary || '',
              ai_summary_generated: true,
              ai_summary_generated_at: new Date().toISOString()
            });
          }
        }} 
      />
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
