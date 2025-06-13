import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useRouter } from 'next/router';
import ReactMarkdown from 'react-markdown';
import styles from './LearningResourceSummary.module.css';
import { generateSummary } from '../../api/aiSummary';
import learningResources from '../../api/learningResources';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../hooks/useTranslation';

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
  const { t } = useTranslation();
  
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
        throw new Error(t('aiSummary.noUrlError'));
      }
      
      // Prepare resource data for summary generation
      const resourceData = {
        id: resource.id,
        url: url,
        title: resource.title,
        resourceType: resource.resource_type
      };
            
      // Generate the summary
      const generationResult = await generateSummary(resourceData);
      
      // Check if summary generation was successful
      if (!generationResult.success) {
        // Display error without saving
        setError(generationResult.error || t('aiSummary.generateError'));
        return;
      }
      
      // Only save the summary if generation was successful
      try {
        await learningResources.saveSummaryToResource(resource.id, generationResult);
        
        // Extract the actual summary text for the callback
        const summaryText = generationResult.data && generationResult.data.summary ? 
                           generationResult.data.summary : 
                           generationResult.summary || '';
        
        // Notify parent component if needed
        if (onSummaryGenerated) {
          onSummaryGenerated({ 
            summary: summaryText,
            saved: true,
            resourceId: resource.id 
          });
        }
      } catch (saveError) {
        setError(t('aiSummary.saveError') + ' ' + (saveError.message || t('aiSummary.generateError')));
        console.error('Summary save error:', saveError);
      }
    } catch (err) {
      console.error('Error generating summary:', err);
      setError(err.message || t('aiSummary.generateError'));
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
      return <p>{t('aiSummary.noSummaryContent')}</p>;
    }
    
    // Render the markdown content as formatted HTML
    return (
      <>
        <div className={styles.summaryContent}>
          <ReactMarkdown
            components={{
              // Custom styling for markdown elements if needed
              h1: ({children}) => <h1 className={styles.summaryH1}>{children}</h1>,
              h2: ({children}) => <h2 className={styles.summaryH2}>{children}</h2>,
              h3: ({children}) => <h3 className={styles.summaryH3}>{children}</h3>,
              p: ({children}) => <p className={styles.summaryParagraph}>{children}</p>,
              ul: ({children}) => <ul className={styles.summaryList}>{children}</ul>,
              ol: ({children}) => <ol className={styles.summaryOrderedList}>{children}</ol>,
              li: ({children}) => <li className={styles.summaryListItem}>{children}</li>,
              strong: ({children}) => <strong className={styles.summaryBold}>{children}</strong>,
              em: ({children}) => <em className={styles.summaryItalic}>{children}</em>,
            }}
          >
            {resource.ai_summary}
          </ReactMarkdown>
        </div>
        
        <div className={styles.summaryMeta}>
          <span>{t('aiSummary.generated')} {new Date(resource.ai_summary_generated_at).toLocaleString()}</span>
        </div>
      </>
    );
  };
  
  return (
    <div className={styles.summaryContainer}>
      <div className={styles.summaryCard}>
        <div className={styles.summaryHeader}>
          <h3>{t('aiSummary.title')}</h3>
          <div className={styles.headerActions}>
            {hasSummary && (
              <button 
                onClick={toggleSummary} 
                className={styles.toggleButton}
              >
                {showSummary ? t('aiSummary.hide') : t('aiSummary.show')}
              </button>
            )}
            {!hasSummary && (
              <button 
                onClick={handleGenerateSummary} 
                disabled={isLoading || !resource?.id}
                className={`${styles.generateButton} ${isLoading ? styles.loading : ''}`}
              >
                {isLoading ? t('aiSummary.generating') : t('aiSummary.generate')}
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
            <p>{t('aiSummary.hiddenMessage')}</p>
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
