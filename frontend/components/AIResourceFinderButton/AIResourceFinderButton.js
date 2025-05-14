import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { FaBrain, FaSpinner } from 'react-icons/fa';
import { findResources } from '../../api/aiResources';
import { getActiveProviderConfig } from '../../config/aiConfig';
import s from './AIResourceFinderButton.module.css';

/**
 * AIResourceFinderButton component - initiates AI search for learning resources
 * 
 * @param {Object} props Component props
 * @param {string} props.title Page title to search resources for
 * @param {boolean} props.compact Whether to show the button in compact mode
 * @param {Function} props.onResourcesFound Callback when resources are found
 */
const AIResourceFinderButton = ({ title, compact = false, onResourcesFound }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFindResources = async () => {
    if (!title) {
      setError('No topic provided for search');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Get active provider configuration - ensure we're using Tavily
      const providerConfig = {
        ...getActiveProviderConfig(),
        provider: 'tavily' // Force using Tavily regardless of environment settings
      };
      
      // Call the AI service to find learning resources
      const resources = await findResources(title, providerConfig);
      
      // Call the callback with the found resources
      if (onResourcesFound && resources) {
        onResourcesFound(resources);
      }
      
    } catch (err) {
      console.error('Error finding resources:', err);
      setError('Failed to find learning resources. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Render the button in different states
  return (
    <div className={s.Container}>
      <button 
        className={`${s.Button} ${compact ? s.CompactButton : ''} ${loading ? s.Loading : ''}`}
        onClick={handleFindResources}
        disabled={loading}
        aria-label="Find AI-recommended learning resources"
      >
        {loading ? (
          <>
            <FaSpinner className={s.Spinner} aria-hidden="true" />
            <span>{compact ? 'Searching...' : 'Finding resources...'}</span>
          </>
        ) : (
          <>
            <FaBrain className={s.Icon} aria-hidden="true" />
            <span>{compact ? 'AI Find' : 'Find AI-Recommended Resources'}</span>
          </>
        )}
      </button>
      
      {error && <div className={s.Error}>{error}</div>}
    </div>
  );
};

AIResourceFinderButton.propTypes = {
  title: PropTypes.string.isRequired,
  compact: PropTypes.bool,
  onResourcesFound: PropTypes.func.isRequired,
};

export default AIResourceFinderButton;
