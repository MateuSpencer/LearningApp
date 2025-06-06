/**
 * Backend service for communication with the server
 * 
 * This service integrates with the backend API endpoints that 
 * are not directly exposed through other API modules.
 */
import { httpGet, httpPost } from '../utils/Http';

/**
 * URL content analysis service
 */
export const analyzeUrlContent = async (url) => {
  try {
    // Send the URL to the backend for analysis
    const response = await httpPost('/api/learning-resources/analyze_url_content/', {
      url
    });
    
    return {
      success: true,
      ...response
    };
  } catch (error) {
    // If the specific endpoint is not available, fall back to the validate_url endpoint
    try {
      const fallbackResponse = await httpPost('/api/learning-resources/validate_url/', {
        url,
        analyze_content: true
      });
      
      // Process the response to extract content analysis information
      const isErrorPage = checkForErrorPage(fallbackResponse);
      
      return {
        success: true,
        is_error_page: isErrorPage.isError,
        message: isErrorPage.message,
        error_type: isErrorPage.errorType,
        content_status: isErrorPage.isError ? 'error' : 'success'
      };
      
    } catch (fallbackError) {
      return {
        success: false,
        message: `Content analysis failed: ${fallbackError.message || 'Unknown error'}`,
        is_error_page: false
      };
    }
  }
};

/**
 * Check if the response contains indicators of an error page
 * @param {Object} response - Response from the validation endpoint
 * @returns {Object} - Result indicating if it's an error page
 */
function checkForErrorPage(response) {
  // Default result
  const result = {
    isError: false,
    message: '',
    errorType: ''
  };
  
  // If no content to check
  if (!response || !response.html_content) {
    return result;
  }
  
  const content = response.html_content.toLowerCase();
  const url = response.original_url || '';
  
  // Error indicators in title
  const titleMatch = content.match(/<title[^>]*>(.*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].toLowerCase() : '';
  
  // Common error patterns
  const errorPatterns = [
    { pattern: /\b404\b/i, type: '404', message: 'Error 404: Page not found' },
    { pattern: /\bnot found\b/i, type: '404', message: 'Page not found' },
    { pattern: /\bpage (does not|doesn't) exist\b/i, type: '404', message: 'Page does not exist' },
    { pattern: /\berror\s+page\b/i, type: 'error', message: 'Error page detected' },
    { pattern: /\bpage not available\b/i, type: 'unavailable', message: 'Page not available' },
    { pattern: /\bcannot be found\b/i, type: '404', message: 'Page cannot be found' }
  ];
  
  // Check the title first - if the title contains error indicators, it's likely an error page
  for (const pattern of errorPatterns) {
    if (pattern.pattern.test(title)) {
      result.isError = true;
      result.message = pattern.message;
      result.errorType = pattern.type;
      return result;
    }
  }
  
  // Check for domain-specific patterns
  const domain = new URL(url).hostname.toLowerCase();
  
  
  
  // Check content for error patterns
  for (const pattern of errorPatterns) {
    if (pattern.pattern.test(content)) {
      result.isError = true;
      result.message = pattern.message;
      result.errorType = pattern.type;
      return result;
    }
  }
  
  return result;
}

export default {
  analyzeUrlContent
};
