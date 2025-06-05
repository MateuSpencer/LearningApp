import learningResources from '../api/learningResources';
import { normalizeUrl, validateUrl } from '../utils/urlUtils';

/**
 * URL Validation Service
 * 
 * Provides reusable URL validation functionality extracted from NewLearningResourceForm.
 * This service handles basic format validation, YouTube-specific validation, 
 * backend validation, and URL normalization.
 */

/**
 * Validation result structure
 * @typedef {Object} ValidationResult
 * @property {boolean} isValid - Whether the URL is valid
 * @property {string|null} error - Error message if validation failed
 * @property {string|null} normalizedUrl - Normalized URL if validation succeeded
 * @property {string|null} suggestedUrl - Alternative URL suggestion if available
 * @property {string|null} resourceType - Detected resource type (e.g., 'youtube', 'website')
 * @property {Object|null} metadata - Additional metadata (e.g., YouTube video info)
 */

/**
 * Basic URL format validation
 * @param {string} url - URL to validate
 * @returns {boolean} - Whether the URL has a valid format
 */
export const isValidUrlFormat = (url) => {
  if (!url) return false;
  
  // Basic URL validation pattern
  const urlPattern = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/;
  return urlPattern.test(url);
};

/**
 * YouTube URL validation and video ID extraction
 * @param {string} url - URL to validate
 * @returns {Object} - Validation result with video ID if valid
 */
export const validateYouTubeUrl = (url) => {
  const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(youtubeRegex);
  
  const isYoutubeUrl = url.includes('youtube.com') || url.includes('youtu.be');
  
  if (isYoutubeUrl && (!match || !match[1])) {
    return {
      isValid: false,
      error: 'Invalid YouTube URL: Missing or malformed video ID. YouTube video IDs are 11 characters long.',
      videoId: null
    };
  }
  
  if (match && match[1]) {
    const videoId = match[1];
    if (videoId.length !== 11) {
      return {
        isValid: false,
        error: 'Invalid YouTube video ID. YouTube video IDs must be 11 characters long.',
        videoId: null
      };
    }
    
    return {
      isValid: true,
      error: null,
      videoId: videoId,
      normalizedUrl: `https://www.youtube.com/watch?v=${videoId}`
    };
  }
  
  return {
    isValid: true,
    error: null,
    videoId: null
  };
};

/**
 * Normalize URL by adding protocol if missing
 * @param {string} url - URL to normalize
 * @returns {string} - Normalized URL
 */
export const normalizeUrlProtocol = (url) => {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`;
  }
  return url;
};

/**
 * Validate URL format only (client-side validation)
 * @param {string} url - URL to validate
 * @returns {ValidationResult} - Validation result
 */
export const validateUrlFormat = (url) => {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return {
      isValid: false,
      error: 'URL is required',
      normalizedUrl: null,
      suggestedUrl: null,
      resourceType: null,
      metadata: null
    };
  }
  
  // Normalize URL
  const processedUrl = normalizeUrlProtocol(url.trim());
  
  // Basic format validation
  if (!isValidUrlFormat(processedUrl)) {
    return {
      isValid: false,
      error: 'Please enter a valid URL (e.g., https://example.com)',
      normalizedUrl: null,
      suggestedUrl: null,
      resourceType: null,
      metadata: null
    };
  }
  
  // YouTube-specific validation
  const youtubeValidation = validateYouTubeUrl(processedUrl);
  if (!youtubeValidation.isValid) {
    return {
      isValid: false,
      error: youtubeValidation.error,
      normalizedUrl: null,
      suggestedUrl: null,
      resourceType: null,
      metadata: null
    };
  }
  
  // Return successful format validation
  return {
    isValid: true,
    error: null,
    normalizedUrl: youtubeValidation.normalizedUrl || processedUrl,
    suggestedUrl: null,
    resourceType: youtubeValidation.videoId ? 'youtube' : 'website',
    metadata: youtubeValidation.videoId ? { videoId: youtubeValidation.videoId } : null
  };
};

/**
 * Full URL validation including backend verification
 * @param {string} url - URL to validate
 * @returns {Promise<ValidationResult>} - Validation result
 */
export const validateUrlFull = async (url) => {
  // First do format validation
  const formatResult = validateUrlFormat(url);
  if (!formatResult.isValid) {
    return formatResult;
  }
  
  try {
    const processedUrl = formatResult.normalizedUrl;
    
    // Validate URL with backend
    const validationResult = await learningResources.validateUrl(processedUrl);
    
    if (validationResult.status === 'success') {
      // For YouTube URLs, verify metadata
      if (validationResult.url_type === 'youtube') {
        const videoId = validationResult.youtube_video_id;
        
        if (!videoId || videoId.length !== 11) {
          return {
            isValid: false,
            error: 'Invalid YouTube video ID. YouTube video IDs must be 11 characters long.',
            normalizedUrl: null,
            suggestedUrl: null,
            resourceType: null,
            metadata: null
          };
        }
        
        // Try to get metadata to verify it's a valid video
        try {
          const youtubeData = await learningResources.getYoutubeMetadata(videoId);
          
          if (youtubeData.status === 'error' || !youtubeData.title) {
            return {
              isValid: false,
              error: `Invalid YouTube video: ${youtubeData.message}`,
              normalizedUrl: null,
              suggestedUrl: null,
              resourceType: null,
              metadata: null
            };
          }
          
          // Success with YouTube metadata
          return {
            isValid: true,
            error: null,
            normalizedUrl: validationResult.normalized_url || processedUrl,
            suggestedUrl: validationResult.recommended_url,
            resourceType: 'youtube',
            metadata: {
              videoId: videoId,
              title: youtubeData.title
            }
          };
        } catch (metadataErr) {
          return {
            isValid: false,
            error: 'Invalid YouTube video: Could not verify this video exists.',
            normalizedUrl: null,
            suggestedUrl: null,
            resourceType: null,
            metadata: null
          };
        }
      }
      
      // Success for non-YouTube URLs
      return {
        isValid: true,
        error: null,
        normalizedUrl: validationResult.normalized_url || processedUrl,
        suggestedUrl: validationResult.recommended_url,
        resourceType: validationResult.url_type || 'website',
        metadata: null
      };
    } else if (validationResult.status === 'duplicate') {
      // URL already exists in the system
      let errorMessage = validationResult.message || 'This URL already exists in the system';
      if (validationResult.existing_resource) {
        errorMessage += ` (Resource: ${validationResult.existing_resource.title})`;
      }
      
      return {
        isValid: false,
        error: errorMessage,
        normalizedUrl: null,
        suggestedUrl: validationResult.recommended_url,
        resourceType: null,
        metadata: { existingResource: validationResult.existing_resource }
      };
    } else {
      // Other validation error
      return {
        isValid: false,
        error: validationResult.message || 'URL validation failed',
        normalizedUrl: null,
        suggestedUrl: validationResult.recommended_url,
        resourceType: null,
        metadata: null
      };
    }
  } catch (err) {
    return {
      isValid: false,
      error: `URL validation failed: ${err.message || 'Unknown error'}`,
      normalizedUrl: null,
      suggestedUrl: null,
      resourceType: null,
      metadata: null
    };
  }
};

/**
 * Batch validate multiple URLs (useful for AI-generated resources)
 * @param {Array<string>} urls - Array of URLs to validate
 * @param {Object} options - Validation options
 * @param {boolean} options.formatOnly - Only do format validation (faster)
 * @param {boolean} options.filterInvalid - Return only valid URLs
 * @returns {Promise<Array<{url: string, result: ValidationResult}>>} - Array of validation results
 */
export const validateUrlsBatch = async (urls, options = {}) => {
  const { formatOnly = false, filterInvalid = false } = options;
  
  if (!Array.isArray(urls)) {
    throw new Error('URLs must be an array');
  }
  
  const validationPromises = urls.map(async (url) => {
    try {
      const result = formatOnly ? validateUrlFormat(url) : await validateUrlFull(url);
      return { url, result };
    } catch (error) {
      return {
        url,
        result: {
          isValid: false,
          error: `Validation error: ${error.message}`,
          normalizedUrl: null,
          suggestedUrl: null,
          resourceType: null,
          metadata: null
        }
      };
    }
  });
  
  const results = await Promise.all(validationPromises);
  
  if (filterInvalid) {
    return results.filter(({ result }) => result.isValid);
  }
  
  return results;
};

/**
 * Filter AI-generated resources to include only those with valid URLs
 * @param {Array<Object>} resources - AI-generated resources with url, title, description, resourceType
 * @param {Object} options - Filtering options
 * @param {boolean} options.formatOnly - Only do format validation (faster)
 * @returns {Promise<Array<Object>>} - Filtered resources with valid URLs
 */
export const filterValidResources = async (resources, options = {}) => {
  if (!Array.isArray(resources)) {
    return [];
  }
  
  const { formatOnly = true } = options; // Default to format-only for AI filtering
  
  // Extract URLs from resources
  const urls = resources.map(resource => resource.url);
  
  // Validate URLs
  const validationResults = await validateUrlsBatch(urls, { 
    formatOnly, 
    filterInvalid: false 
  });
  
  // Filter resources to include only those with valid URLs
  const validResources = [];
  
  for (let i = 0; i < resources.length; i++) {
    const resource = resources[i];
    const validation = validationResults[i];
    
    if (validation.result.isValid) {
      // Add normalized URL and detected resource type
      validResources.push({
        ...resource,
        url: validation.result.normalizedUrl || resource.url,
        resourceType: validation.result.resourceType || resource.resourceType
      });
    }
  }
  
  return validResources;
};

export default {
  isValidUrlFormat,
  validateYouTubeUrl,
  normalizeUrlProtocol,
  validateUrlFormat,
  validateUrlFull,
  validateUrlsBatch,
  filterValidResources
};
