import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useRouter } from 'next/router';
import styles from './LearningResourceSummary.module.css';
import { generateSummary } from '../../api/aiSummary';
import learningResources from '../../api/learningResources';
import { useAuth } from '../../context/AuthContext';

/**
 * Component that displays AI summary for a learning resource
 * and provides functionality to generate a summary
 */
const LearningResourceSummary = ({ resource, onSummaryGenerated }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSummary, setShowSummary] = useState(true);
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  
  // Function to handle generating a summary
  const handleGenerateSummary = async () => {
    if (!resource || !resource.id) return;
    
    // Redirect to login page if user is not authenticated
    if (!isAuthenticated) {
      router.push('/accounts/login/');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Get the primary URL for the resource
      const url = resource.primary_url ? resource.primary_url.url : 
                  (resource.urls && resource.urls.length > 0 ? resource.urls[0].url : null);
      
      if (!url) {
        throw new Error('No URL available for this resource');
      }
      
      // Prepare resource data for summary generation
      const resourceData = {
        id: resource.id,
        url: url,
        title: resource.title,
        resourceType: resource.resource_type
      };
            
      // First generate the summary
      const generationResult = await generateSummary(resourceData);
      
      // Then save the summary to the resource
      try {
        await learningResources.saveSummaryToResource(resource.id, generationResult.summary);
        
        // Notify parent component if needed
        if (onSummaryGenerated) {
          onSummaryGenerated({ 
            summary: generationResult.summary,
            saved: true,
            resourceId: resource.id 
          });
        }
      } catch (saveError) {
        setError(`Summary was generated but couldn't be saved: ${saveError.message || 'Unknown error'}`);
        console.error('Summary save error:', saveError);
      }
    } catch (err) {
      console.error('Error generating summary:', err);
      setError(err.message || 'Failed to generate summary');
    } finally {
      setIsLoading(false);
    }
  };
  
  const toggleSummary = () => {
    setShowSummary(!showSummary);
  };
  
  // Determine if the summary is available
  const hasSummary = resource?.ai_summary_generated && resource?.ai_summary;
  
  // Format the summary content for display
  const formatSummaryContent = (text) => {
    if (!text) return '';
    return text; // Simply return the raw markdown content
  };
  
  // Helper to render summary content
  const renderSummaryContent = () => {
    if (!resource?.ai_summary) {
      return <p>No summary content available.</p>;
    }
    
    // Simply display the raw summary as is
    return (
      <>
        <div className={styles.summaryContent}>
          {resource.ai_summary.split('\n').map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
        
        <div className={styles.summaryMeta}>
          <span>Generated: {new Date(resource.ai_summary_generated_at).toLocaleString()}</span>
        </div>
      </>
    );
  };
  
  return (
    <div className={styles.summaryContainer}>
      <div className={styles.summaryCard}>
        <div className={styles.summaryHeader}>
          <h3>AI Summary</h3>
          <div className={styles.headerActions}>
            {hasSummary && (
              <button 
                onClick={toggleSummary} 
                className={styles.toggleButton}
              >
                {showSummary ? 'Hide' : 'Show'}
              </button>
            )}
            {!hasSummary && (
              <button 
                onClick={handleGenerateSummary} 
                disabled={isLoading || !resource?.id}
                className={`${styles.generateButton} ${isLoading ? styles.loading : ''}`}
              >
                {isLoading ? 'Generating...' : 'Generate AI Summary'}
              </button>
            )}
          </div>
        </div>
        
        {/* Summary content area */}
        {hasSummary && showSummary && renderSummaryContent()}
        
        {/* Error display */}
        {error && <p className={styles.error}>{error}</p>}
        
        {/* If already generated but hidden, show message */}
        {hasSummary && !showSummary && (
          <div className={styles.hiddenMessage}>
            <p>Summary is hidden. Click 'Show' to view the AI-generated summary.</p>
          </div>
        )}
      </div>
    </div>
  );
};

LearningResourceSummary.propTypes = {
  resource: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    resource_type: PropTypes.string.isRequired,
    primary_url: PropTypes.shape({
      url: PropTypes.string.isRequired
    }),
    urls: PropTypes.arrayOf(
      PropTypes.shape({
        url: PropTypes.string.isRequired
      })
    ),
    ai_summary: PropTypes.string,
    ai_summary_generated: PropTypes.bool,
    ai_summary_generated_at: PropTypes.string
  }),
  onSummaryGenerated: PropTypes.func
};

export default LearningResourceSummary;
