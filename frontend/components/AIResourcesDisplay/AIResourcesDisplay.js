import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { FaTimes, FaCheck, FaExternalLinkAlt } from 'react-icons/fa';
import s from './AIResourcesDisplay.module.css';

/**
 * Component to display AI-found resources and allow user to add them
 * 
 * @param {Object} props Component props
 * @param {Array} props.resources Array of resources found by AI
 * @param {Function} props.onAddResource Callback when user adds a resource
 * @param {Function} props.onClose Callback when user closes the display
 * @param {string} props.pageSlug Current page slug for associating resources
 */
const AIResourcesDisplay = ({ resources, onAddResource, onClose, pageSlug }) => {
  // Track which resources are being added (for UI feedback)
  const [addingResources, setAddingResources] = useState({});
  // Track which resources have been added successfully
  const [addedResources, setAddedResources] = useState({});

  // Handle adding a resource
  const handleAddResource = async (resource) => {
    // Mark resource as being added (show loading state)
    setAddingResources(prev => ({ ...prev, [resource.url]: true }));
    
    try {
      // Format the resource data for API
      const resourceData = {
        title: resource.title,
        resource_type: resource.resourceType,
        url_list: [resource.url],
        description: resource.description,
        page_slug: pageSlug
      };
      
      // Call the callback function to add the resource
      if (onAddResource) {
        await onAddResource(resourceData);
        
        // Mark as successfully added
        setAddedResources(prev => ({ ...prev, [resource.url]: true }));
      }
    } catch (error) {
      console.error('Error adding resource:', error);
    } finally {
      // Clear the adding state
      setAddingResources(prev => {
        const newState = { ...prev };
        delete newState[resource.url];
        return newState;
      });
    }
  };

  // Get the appropriate icon for a resource's state
  const getActionIcon = (resource) => {
    if (addingResources[resource.url]) {
      return <span className={s.Loading}></span>;
    } else if (addedResources[resource.url]) {
      return <FaCheck className={s.AddedIcon} />;
    } else {
      return 'Add';
    }
  };

  // Render each resource type with an appropriate icon
  const getResourceTypeIcon = (type) => {
    switch (type) {
      case 'video': return '🎬';
      case 'article': return '📝';
      case 'website': return '🌐';
      case 'pdf': return '📄';
      case 'image': return '🖼️';
      default: return '📚';
    }
  };

  return (
    <div className={s.Container}>
      <div className={s.Header}>
        <h3 className={s.Title}>AI-Recommended Learning Resources</h3>
        <button className={s.CloseButton} onClick={onClose} aria-label="Close">
          <FaTimes />
        </button>
      </div>
      
      {resources && resources.length > 0 ? (
        <ul className={s.ResourceList}>
          {resources.map((resource, index) => (
            <li key={`${resource.url}-${index}`} className={s.ResourceItem}>
              <div className={s.ResourceContent}>
                <div className={s.ResourceHeader}>
                  <span className={s.ResourceType}>
                    {getResourceTypeIcon(resource.resourceType)} {resource.resourceType}
                  </span>
                  <a 
                    href={resource.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={s.ExternalLink}
                    aria-label={`Open ${resource.title} in new tab`}
                  >
                    <FaExternalLinkAlt />
                  </a>
                </div>
                <h4 className={s.ResourceTitle}>{resource.title}</h4>
                <p className={s.ResourceDescription}>{resource.description}</p>
                <div className={s.ResourceUrl}>{resource.url}</div>
              </div>
              <div className={s.ResourceActions}>
                <button 
                  className={`${s.AddButton} ${addedResources[resource.url] ? s.Added : ''}`}
                  onClick={() => handleAddResource(resource)}
                  disabled={addingResources[resource.url] || addedResources[resource.url]}
                >
                  {getActionIcon(resource)}
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className={s.EmptyState}>No resources found.</div>
      )}
    </div>
  );
};

AIResourcesDisplay.propTypes = {
  resources: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      url: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
      resourceType: PropTypes.string.isRequired,
    })
  ).isRequired,
  onAddResource: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  pageSlug: PropTypes.string.isRequired,
};

export default AIResourcesDisplay;
