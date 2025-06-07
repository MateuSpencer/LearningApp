import learningResources from '../api/learningResources';
import { normalizeUrl, validateUrl } from '../utils/urlUtils';
import backendService from './backendService';

/**
 * URL Validation Service
 * 
 * Provides reusable URL validation functionality extracted from NewLearningResourceForm.
 * This service handles basic format validation, YouTube-specific validation, 
 * backend validation, URL normalization, and content-based validation to detect error pages.
 */

/**
 * Common error patterns that indicate an error page despite HTTP 200 OK status
 * @type {Array<{pattern: RegExp, message: string}>}
 */
const ERROR_PATTERNS = [
  { pattern: /\b404\b/i, message: 'Error 404: Page not found' },
  { pattern: /\bnot found\b/i, message: 'Page not found' },
  { pattern: /\bpage (does not|doesn't) exist\b/i, message: 'Page does not exist' },
  { pattern: /\berror\s+page\b/i, message: 'Error page detected' },
  { pattern: /\bpage not available\b/i, message: 'Page not available' },
  { pattern: /\bcannot be found\b/i, message: 'Page cannot be found' },
  { pattern: /\bno longer available\b/i, message: 'Page is no longer available' },
  { pattern: /\bmoved permanently\b/i, message: 'Page has moved permanently' }
];

/**
 * Check if the content appears to be an error page based on patterns
 * @param {string} content - The HTML content of the page
 * @param {string} url - The URL being validated
 * @returns {Object} - Result with error status and message if error detected
 */
export const detectErrorPage = (content, url = '') => {
  if (!content || typeof content !== 'string') {
    return { isErrorPage: false };
  }
  
  // Extract the page title if possible
  let pageTitle = '';
  const titleMatch = content.match(/<title[^>]*>(.*?)<\/title>/i);
  if (titleMatch && titleMatch[1]) {
    pageTitle = titleMatch[1].trim();
  }
  
  // Check for specific domains that are known to return custom error pages
  const domain = new URL(url).hostname.toLowerCase();
  
  // Check for common error patterns in the title
  for (const errorPattern of ERROR_PATTERNS) {
    if (pageTitle.match(errorPattern.pattern)) {
      return {
        isErrorPage: true,
        errorType: '404', // Assuming most are 404-like errors
        message: `Error page detected: ${errorPattern.message} in page title`
      };
    }
  }
  
  // Check for common error patterns in the content (focusing on headings and important sections)
  const headings = content.match(/<h[1-3][^>]*>(.*?)<\/h[1-3]>/gi) || [];
  
  for (const heading of headings) {
    const cleanHeading = heading.replace(/<\/?[^>]+(>|$)/g, ''); // Remove HTML tags
    
    for (const errorPattern of ERROR_PATTERNS) {
      if (cleanHeading.match(errorPattern.pattern)) {
        return {
          isErrorPage: true,
          errorType: '404', // Assuming most are 404-like errors
          message: `Error page detected: ${errorPattern.message} in page heading`
        };
      }
    }
  }
  
  // Check for common error patterns in the overall content
  for (const errorPattern of ERROR_PATTERNS) {
    if (content.match(errorPattern.pattern)) {
      return {
        isErrorPage: true,
        errorType: '404', // Assuming most are 404-like errors
        message: `Error page detected: ${errorPattern.message} in page content`
      };
    }
  }
  
  // Check for extremely minimal content which might indicate an error page
  const textContent = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (textContent.length < 50 && !url.endsWith('.jpg') && !url.endsWith('.png') && !url.endsWith('.gif')) {
    return {
      isErrorPage: true,
      errorType: 'minimal_content',
      message: 'Suspiciously minimal content detected - this may be an error page'
    };
  }
  
  return { isErrorPage: false };
};

// Function to analyze response content for error indicators
export const analyzeUrlContent = async (url) => {
  try {
    // Use the backend service to analyze content
    const analysis = await backendService.analyzeUrlContent(url);
    
    return {
      success: analysis.success,
      message: analysis.message,
      isErrorPage: analysis.is_error_page,
      errorType: analysis.error_type,
      contentAnalyzed: true,
      ...analysis
    };
  } catch (err) {
    // Error analysis failed, return neutral result
    return {
      success: false,
      message: `Could not analyze content: ${err.message}`,
      isErrorPage: false,
      contentAnalyzed: false
    };
  }
};

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
 * Full URL validation including backend verification and content analysis
 * @param {string} url - URL to validate
 * @param {Object} options - Validation options
 * @param {boolean} options.skipContentCheck - Skip content-based error detection
 * @returns {Promise<ValidationResult>} - Validation result
 */
export const validateUrlFull = async (url, options = {}) => {
  const { skipContentCheck = false } = options;
  
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
      
      // For non-YouTube URLs, perform content analysis if enabled
      if (!skipContentCheck && validationResult.url_type !== 'youtube') {
        try {
          // Analyze content to detect error pages that return HTTP 200
          const contentAnalysis = await analyzeUrlContent(validationResult.normalized_url || processedUrl);
          
          // If the URL points to an error page despite HTTP 200 status
          if (contentAnalysis.success && contentAnalysis.isErrorPage) {
            return {
              isValid: false,
              error: contentAnalysis.message || 'This URL appears to be an error page',
              normalizedUrl: null,
              suggestedUrl: null,
              resourceType: null,
              metadata: { contentAnalysis }
            };
          }
          
          // If the content contains specific error indicators for this domain
          if (validationResult.html_content) {
            const errorDetection = detectErrorPage(validationResult.html_content, processedUrl);
            if (errorDetection.isErrorPage) {
              return {
                isValid: false,
                error: errorDetection.message || 'This URL appears to be an error page',
                normalizedUrl: null,
                suggestedUrl: null,
                resourceType: null,
                metadata: { errorDetection }
              };
            }
          }
        } catch (contentErr) {
          // Content analysis failed, but we'll continue with the validation
          console.warn('Content analysis failed:', contentErr);
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
    } else if (validationResult.status === 'error' && validationResult.error_type === 'not_found') {
      // Specific handling for 404 errors
      return {
        isValid: false,
        error: validationResult.message || 'The page could not be found (404)',
        normalizedUrl: null,
        suggestedUrl: null,
        resourceType: null,
        metadata: null
      };
    } else if (validationResult.status === 'error' && validationResult.error_type === 'content_error') {
      // Specific handling for content errors (404 pages that return 200 etc.)
      return {
        isValid: false,
        error: validationResult.message || 'The page appears to be an error page',
        normalizedUrl: null,
        suggestedUrl: null,
        resourceType: null,
        metadata: null
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
 * @param {boolean} options.skipContentCheck - Skip content-based error detection
 * @returns {Promise<Array<{url: string, result: ValidationResult}>>} - Array of validation results
 */
export const validateUrlsBatch = async (urls, options = {}) => {
  const { formatOnly = false, filterInvalid = false, skipContentCheck = false } = options;
  
  if (!Array.isArray(urls)) {
    throw new Error('URLs must be an array');
  }
  
  const validationPromises = urls.map(async (url) => {
    try {
      const result = formatOnly ? 
        validateUrlFormat(url) : 
        await validateUrlFull(url, { skipContentCheck });
        
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
 * @param {boolean} options.skipContentCheck - Skip content-based error detection
 * @returns {Promise<Array<Object>>} - Filtered resources with valid URLs
 */
export const filterValidResources = async (resources, options = {}) => {
  if (!Array.isArray(resources)) {
    return [];
  }
  
  const { formatOnly = true, skipContentCheck = true } = options; // Default to format-only for AI filtering
  
  // Extract URLs from resources
  const urls = resources.map(resource => resource.url);
  
  // Validate URLs
  const validationResults = await validateUrlsBatch(urls, { 
    formatOnly, 
    skipContentCheck,
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
  filterValidResources,
  detectErrorPage,
  analyzeUrlContent
};
