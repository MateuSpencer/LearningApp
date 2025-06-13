// Constants for AI Summary validation and error handling

/**
 * Common patterns that indicate a failed summary generation
 * These patterns help identify when the AI model has returned an error response
 * instead of a valid summary
 */
export const AI_ERROR_INDICATORS = [
  'unable to',
  'could not',
  'failed to', 
  'error',
  'please try again',
  'technical difficulties',
  'service may be temporarily unavailable',
  'encountered an issue',
  'generation failed'
];

/**
 * Minimum length for a valid summary
 */
export const MIN_SUMMARY_LENGTH = 10;

/**
 * Response status constants
 */
export const RESPONSE_STATUS = {
  SUCCESS: 'success',
  ERROR: 'error',
  VALIDATION_FAILED: 'validation_failed'
};

/**
 * Validates if a summary text appears to be a legitimate summary or an error message
 * @param {string} summaryText - The text to validate
 * @returns {boolean} - true if it appears to be a valid summary, false if it looks like an error
 */
export const isValidSummary = (summaryText) => {
  if (!summaryText || typeof summaryText !== 'string') {
    return false;
  }
  
  const text = summaryText.trim();
  
  // Check minimum length
  if (text.length < MIN_SUMMARY_LENGTH) {
    return false;
  }
  
  // Check for error indicators
  const lowerText = text.toLowerCase();
  const hasErrorIndicators = AI_ERROR_INDICATORS.some(pattern => 
    lowerText.includes(pattern)
  );
  
  return !hasErrorIndicators;
};

/**
 * Creates a standardized error response
 * @param {string} message - The error message
 * @returns {Object} - Standardized error response object
 */
export const createErrorResponse = (message) => ({
  success: false,
  error: message || "An unexpected error occurred"
});

/**
 * Creates a standardized success response
 * @param {Object} data - The success data
 * @returns {Object} - Standardized success response object
 */
export const createSuccessResponse = (data) => ({
  success: true,
  data
});
