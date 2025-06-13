// API for generating AI summaries (content generation only)
import aiSummaryGenerator from '../services/aiSummaryGenerator';
import { getActiveProviderConfig } from '../config/aiConfig';
import { createErrorResponse, createSuccessResponse } from '../constants/aiSummaryConstants';

/**
 * Generate a summary for a learning resource
 * 
 * @param {Object} resourceData Data about the learning resource
 * @param {string} resourceData.id The resource ID
 * @param {string} resourceData.url The resource URL
 * @param {string} resourceData.title The resource title
 * @param {string} resourceData.resourceType The resource type (video, article, etc.)
 * @param {Object} options Configuration options
 * @param {Object} options.provider AI provider to use
 * @returns {Promise<Object>} Result object with success status
 * @returns {boolean} return.success Whether the summary generation was successful
 * @returns {string} return.summary The generated summary (only present if success is true)
 * @returns {string} return.error Error message (only present if success is false)
 */
export const generateSummary = async (resourceData, options = {}) => {
  try {
    // Validate input data
    if (!resourceData || !resourceData.id || !resourceData.url || !resourceData.title) {
      return createErrorResponse("Resource ID, URL, and title are required");
    }
    
    // Get provider from options or environment
    const provider = options.provider || process.env.NEXT_PUBLIC_AI_SUMMARY_PROVIDER || 
                     process.env.NEXT_PUBLIC_AI_PROVIDER || 'together';
    
    // Initialize apiConfig with the provider
    const apiConfig = { 
      provider,
      ...options.apiConfig
    };
    
    // If no explicit API config provided, use the default configuration
    if (!options.apiConfig) {
      Object.assign(apiConfig, getActiveProviderConfig());
    }
    
    // Choose the appropriate method based on function calling preference and provider support
    const useFunctionCalling = options.useFunctionCalling && 
      ['openai', 'azure', 'google'].includes(apiConfig.provider);
    
    // Generate the summary using the appropriate method
    let summaryResult;
    try {
      if (useFunctionCalling) {
        summaryResult = await aiSummaryGenerator.generateSummaryWithFunctionCalling(
          resourceData.url,
          resourceData.title,
          resourceData.resourceType,
          apiConfig
        );
      } else {
        summaryResult = await aiSummaryGenerator.generateResourceSummary(
          resourceData.url,
          resourceData.title,
          resourceData.resourceType,
          apiConfig
        );
      }
      
      // The service now returns a structured response, so we can directly use it
      if (!summaryResult.success) {
        return createErrorResponse(summaryResult.error || "Unable to generate a summary at this time.");
      }
      
      // Format the summary data for saving
      const summaryData = summaryResult.data;
      let formattedSummary = '';
      
      if (summaryData.summary) {
        formattedSummary = summaryData.summary;
        
        // Optionally include main parts and highlights if available
        if (summaryData.mainParts) {
          formattedSummary += `\n\n**Main Parts:**\n${summaryData.mainParts}`;
        }
        
        if (summaryData.highlights && summaryData.highlights.length > 0) {
          formattedSummary += `\n\n**Key Takeaways:**\n${summaryData.highlights.map(highlight => `• ${highlight}`).join('\n')}`;
        }
      }
      
      // Return successful result
      return createSuccessResponse({
        summary: formattedSummary || summaryData.summary,
        data: summaryData
      });
    } catch (generationError) {
      // Handle any unexpected errors from the generation process
      return createErrorResponse(generationError.message || "Unable to generate a summary at this time. The service may be temporarily unavailable.");
    }
  } catch (error) {
    return createErrorResponse(error.message || "An unexpected error occurred while preparing to generate the summary.");
  }
};

export default {
  generateSummary
};
