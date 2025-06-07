/**
 * Utility functions for URL validation and processing
 */

/**
 * Validate a YouTube URL and extract the video ID
 * @param {string} url - The URL to validate
 * @returns {Object} - Result containing validity and extracted video ID
 */
export const validateYoutubeUrl = (url) => {
  if (!url) {
    return { isValid: false, videoId: null };
  }
  
  try {
    // Match YouTube URL patterns and extract video ID
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(youtubeRegex);
    
    if (match && match[1]) {
      return { isValid: true, videoId: match[1] };
    }
    
    return { isValid: false, videoId: null };
  } catch (err) {
    return { isValid: false, videoId: null, error: err.message };
  }
};

/**
 * Clean a YouTube URL by removing parameters after the video ID
 * @param {string} url - The YouTube URL to clean
 * @returns {string} - Cleaned URL with only the video ID
 */
export const cleanYoutubeUrl = (url) => {
  const { isValid, videoId } = validateYoutubeUrl(url);
  
  if (isValid && videoId) {
    // Return standardized YouTube URL format with just the video ID
    return `https://www.youtube.com/watch?v=${videoId}`;
  }
  
  return url; // Return original if not a valid YouTube URL
};

/**
 * Normalize any URL for consistent storage and comparison
 * @param {string} url - The URL to normalize
 * @returns {Object} - Normalized URL info
 */
export const normalizeUrl = (url) => {
  if (!url) {
    return { 
      originalUrl: url,
      normalizedUrl: '',
      isModified: false,
      urlType: 'unknown',
      isValid: false
    };
  }
  
  // Add protocol if missing
  let processedUrl = url;
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    processedUrl = `https://${url}`;
  }
  
  try {
    // Check if it's a YouTube URL
    const { isValid, videoId } = validateYoutubeUrl(processedUrl);
    
    if (isValid && videoId) {
      // Standardize YouTube URLs to the same format, removing all parameters after video ID
      const normalizedUrl = `https://www.youtube.com/watch?v=${videoId}`;
      return {
        originalUrl: url,
        normalizedUrl,
        isModified: normalizedUrl !== url,
        urlType: 'youtube',
        isValid: true,
        videoId
      };
    }
    
    // For non-YouTube URLs
    const urlObj = new URL(processedUrl);
    
    // Normalize host (remove www. and convert to lowercase)
    let host = urlObj.hostname.toLowerCase();
    if (host.startsWith('www.')) {
      host = host.substring(4);
    }
    
    // Rebuild URL with https and without trailing slash
    const path = urlObj.pathname.endsWith('/') && urlObj.pathname !== '/' 
      ? urlObj.pathname.slice(0, -1) 
      : urlObj.pathname;
    
    // Include query parameters for non-YouTube URLs
    const queryString = urlObj.search;
      
    const normalizedUrl = `https://${host}${path}${queryString}`;
    
    return {
      originalUrl: url,
      normalizedUrl,
      isModified: normalizedUrl !== url,
      urlType: 'other',
      isValid: true
    };
  } catch (err) {
    return {
      originalUrl: url,
      normalizedUrl: '',
      isModified: false,
      urlType: 'unknown',
      isValid: false,
      error: err.message
    };
  }
};

/**
 * Check if a URL is reachable
 * This function calls the backend API to check URL availability
 * @param {string} url - The URL to check
 * @returns {Promise<Object>} - Result of URL availability check
 */
export const checkUrlAvailability = async (url) => {
  try {
    // Use the correct endpoint from the backend
    const response = await fetch('/api/learning-resources/learning-resources/validate_url/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });
    
    if (!response.ok) {
      throw new Error(`URL validation failed: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (err) {
    return {
      status: 'error',
      original_url: url,
      message: err.message,
      exists: false
    };
  }
};

/**
 * Comprehensive URL validation
 * Normalizes and validates a URL
 * @param {string} url - The URL to validate
 * @returns {Promise<Object>} - Validation result
 */
export const validateUrl = async (url) => {
  // First normalize the URL
  const normalized = normalizeUrl(url);
  
  if (!normalized.isValid) {
    return {
      isValid: false,
      originalUrl: url,
      message: 'Invalid URL format',
      suggestions: ['Make sure your URL starts with http:// or https://']
    };
  }
  
  // Check if the URL exists and is accessible using the backend validation
  const availability = await checkUrlAvailability(normalized.normalizedUrl);
  
  return {
    isValid: availability.status === 'success',
    originalUrl: url,
    normalizedUrl: normalized.normalizedUrl,
    recommendedUrl: availability.recommended_url || normalized.normalizedUrl,
    message: availability.message,
    exists: availability.exists,
    urlType: normalized.urlType,
    videoId: normalized.urlType === 'youtube' ? normalized.videoId : undefined,
    status: availability.status
  };
};

export default {
  validateYoutubeUrl,
  cleanYoutubeUrl,
  normalizeUrl,
  checkUrlAvailability,
  validateUrl
};
