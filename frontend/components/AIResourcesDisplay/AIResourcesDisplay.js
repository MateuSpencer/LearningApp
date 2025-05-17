import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FaTimes, FaCheck, FaExternalLinkAlt, FaPlus } from 'react-icons/fa';
import { addAIResource } from '../../api/aiResources';
import { httpGet } from '../../utils/Http';
import s from './AIResourcesDisplay.module.css';

/**
 * Component to display AI-found resources and allow user to add them
 * 
 * @param {Object} props Component props
 * @param {Array} props.resources Array of resources found by AI
 * @param {Function} props.onAddResource Callback when user adds a resource
 * @param {Function} props.onClose Callback when user closes the display
 * @param {string} props.pageSlug Current page slug for associating resources
 * @param {Array} props.existingResources Array of existing resources (optional)
 */
const AIResourcesDisplay = ({ resources, onAddResource, onClose, pageSlug, existingResources = [] }) => {
  // Track which resources are being added (for UI feedback)
  const [addingResources, setAddingResources] = useState({});
  // Track which resources have been added successfully
  const [addedResources, setAddedResources] = useState({});
  // Track existing resources on the page
  const [existingPageResources, setExistingPageResources] = useState([]);
  
  // Fetch existing resources on component mount
  useEffect(() => {
    const fetchExistingResources = async () => {
      try {
        // If existingResources were passed as a prop, use those
        if (existingResources && existingResources.length > 0) {
          processExistingResources(existingResources);
          return;
        }
        
        // Otherwise, fetch from API
        // URL encode the page slug to handle special characters and spaces
        const encodedPageSlug = encodeURIComponent(pageSlug);
        const response = await httpGet(`/api/learning-resources/resource-associations/?page_slug=${encodedPageSlug}`);
        if (response && response.results) {
          processExistingResources(response.results);
        }
      } catch (error) {
        console.error('Error fetching existing resources:', error);
      }
    };
    
    const processExistingResources = (resources) => {
      // Create a map of URL to true for quick lookups
      const existingUrls = {};
      resources.forEach(item => {
        // Handle both direct URLs and nested resource objects
        const resource = item.resource || item;
        if (resource.urls && resource.urls.length > 0) {
          resource.urls.forEach(urlObj => {
            existingUrls[urlObj.url] = true;
          });
        } else if (resource.primary_url) {
          existingUrls[resource.primary_url] = true;
        }
      });
      
      // Update state with existing resources
      setExistingPageResources(resources);
      setAddedResources(existingUrls);
    };
    
    fetchExistingResources();
  }, [pageSlug, existingResources]);

  // Handle adding a resource
  const handleAddResource = async (resource) => {
    // If already added, don't do anything
    if (addedResources[resource.url]) {
      return;
    }
    
    // Mark resource as being added (show loading state)
    setAddingResources(prev => ({ ...prev, [resource.url]: true }));
    
    try {
      // Format the resource data for API
      const resourceData = {
        title: resource.title,
        resource_type: resource.resourceType || 'website', // Ensure resourceType is properly formatted
        url: resource.url,
        description: resource.description || '',
        page_slug: pageSlug
      };
      
      // Call the API to add the resource
      const result = await addAIResource(resourceData);
      
      // Check if the operation was successful
      if (result.success === false) {
        console.log('Resource already exists:', result.message);
        // Still mark as added even if it already exists
        setAddedResources(prev => ({ ...prev, [resource.url]: true }));
      } else {
        // Mark as successfully added
        setAddedResources(prev => ({ ...prev, [resource.url]: true }));
        
        // Also call the callback if provided (for list refresh)
        if (onAddResource && result.resource) {
          onAddResource(result.resource);
        }
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
      return <><FaCheck className={s.AddedIcon} /> Added</>;
    } else {
      return <><FaPlus /> Add</>;
    }
  };
  
  // Check if a resource is already added
  const isResourceAdded = (resource) => {
    return addedResources[resource.url] === true;
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
      {/* No duplicate header needed - using the parent's header instead */}
      {/* No close button - using the parent's button instead */}
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
                  className={`${s.AddButton} ${isResourceAdded(resource) ? s.Added : ''}`}
                  onClick={() => handleAddResource(resource)}
                  disabled={addingResources[resource.url] || isResourceAdded(resource)}
                  aria-label={isResourceAdded(resource) ? "Resource already added" : "Add this resource"}
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
      description: PropTypes.string,
      resourceType: PropTypes.string,
    })
  ).isRequired,
  onAddResource: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  pageSlug: PropTypes.string.isRequired,
  existingResources: PropTypes.array,
};

export default AIResourcesDisplay;
