import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { FaBrain, FaSpinner, FaPlus, FaEye } from 'react-icons/fa';
import { findResources } from '../../api/aiResources';
import { getActiveProviderConfig } from '../../config/aiConfig';
import s from './AIResourceFinderButton.module.css';

/**
 * AIResourceFinderButton component - initiates AI search for learning resources
 * 
 * @param {Object} props Component props
 * @param {string} props.title Page title to search resources for
 * @param {string} props.pageSlug Page slug for storing persistent suggestions
 * @param {boolean} props.compact Whether to show the button in compact mode
 * @param {Function} props.onResourcesFound Callback when resources are found
 * @param {Function} props.onClick Additional click handler for authentication checks
 * @param {boolean} props.usePersistentSuggestions Whether to use persistent suggestions (default: true)
 * @param {boolean} props.hasPersistentSuggestions Whether there are already persistent suggestions
 * @param {string} props.buttonMode Button display mode ('find', 'more', or 'show')
 * @param {Function} props.onShowSuggestions Callback to show existing suggestions
 */
const AIResourceFinderButton = ({ 
  title, 
  pageSlug, 
  compact = false, 
  onResourcesFound, 
  onClick,
  usePersistentSuggestions = true,
  hasPersistentSuggestions = false,
  buttonMode = 'find', // 'find', 'more', or 'show'
  onShowSuggestions
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFindResources = async () => {
    // If we're just showing existing suggestions, call the callback and return
    if (buttonMode === 'show' && onShowSuggestions) {
      onShowSuggestions();
      return;
    }

    // Call the additional click handler if provided (e.g., for auth checks)
    if (onClick) {
      // If the handler returns false, stop processing
      if (onClick() === false) return;
    }
    if (!title) {
      setError('No topic provided for search');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Get active provider configuration
      const providerConfig = {
        ...getActiveProviderConfig(),
      };
      
      let resources;
      
      if (usePersistentSuggestions && pageSlug) {
        // Call the AI service to find learning resources with persistent storage
        resources = await findResources(title, pageSlug, providerConfig);
      } else {
        // Call the AI service without persistent storage
        resources = await findResources(title, null, { 
          ...providerConfig, 
          storePersistent: false 
        });
      }
      
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

  // Get button content based on mode
  const getButtonContent = () => {
    if (loading) {
      return (
        <>
          <FaSpinner className={s.Spinner} aria-hidden="true" />
          <span>{compact ? 'Searching...' : 'Finding resources...'}</span>
        </>
      );
    }

    switch (buttonMode) {
      case 'more':
        return (
          <>
            <FaPlus className={s.Icon} aria-hidden="true" />
            <span>{compact ? 'More AI ✨' : 'Find More AI Resources ✨'}</span>
          </>
        );
      case 'show':
        return (
          <>
            <FaEye className={s.Icon} aria-hidden="true" />
            <span>{compact ? 'Show AI' : 'Show AI Suggestions'}</span>
          </>
        );
      case 'find':
      default:
        return (
          <>
            <FaBrain className={s.Icon} aria-hidden="true" />
            <span>{compact ? 'AI Find ✨' : 'Find AI-Recommended Resources ✨'}</span>
          </>
        );
    }
  };

  // Get appropriate aria-label based on mode
  const getAriaLabel = () => {
    switch (buttonMode) {
      case 'more': return "Find more AI-recommended learning resources";
      case 'show': return "Show existing AI suggestions";
      default: return "Find AI-recommended learning resources";
    }
  };

  // Render the button in different states
  return (
    <div className={s.Container}>
      <button 
        className={`${s.Button} ${compact ? s.CompactButton : ''} ${loading ? s.Loading : ''} ${buttonMode === 'show' ? s.ShowButton : ''}`}
        onClick={handleFindResources}
        disabled={loading}
        aria-label={getAriaLabel()}
      >
        {getButtonContent()}
      </button>
      
      {error && <div className={s.Error}>{error}</div>}
    </div>
  );
};

AIResourceFinderButton.propTypes = {
  title: PropTypes.string.isRequired,
  pageSlug: PropTypes.string,
  compact: PropTypes.bool,
  onResourcesFound: PropTypes.func.isRequired,
  onClick: PropTypes.func,
  usePersistentSuggestions: PropTypes.bool,
  hasPersistentSuggestions: PropTypes.bool,
  buttonMode: PropTypes.oneOf(['find', 'more', 'show']),
  onShowSuggestions: PropTypes.func,
};

export default AIResourceFinderButton;
