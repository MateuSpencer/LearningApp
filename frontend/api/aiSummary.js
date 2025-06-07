// API for generating AI summaries (content generation only)
import aiSummaryGenerator from '../services/aiSummaryGenerator';
import { getActiveProviderConfig } from '../config/aiConfig';

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
 * @returns {Promise<Object>} Generated summary object
 */
export const generateSummary = async (resourceData, options = {}) => {
  try {
    // Validate input data
    if (!resourceData || !resourceData.id || !resourceData.url || !resourceData.title) {
      throw new Error("Resource ID, URL, and title are required");
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
    
    // Generate the summary
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
    } catch (generationError) {
      // Create a fallback summary
      summaryResult = {
        summary: "Unable to generate a summary at this time. The service may be temporarily unavailable or the URL content could not be properly analyzed."
      };
    }
    
    return {
      summary: typeof summaryResult === 'string' ? summaryResult : (summaryResult.summary || ''),
    };
  } catch (error) {
    throw error;
  }
};

export default {
  generateSummary
};
