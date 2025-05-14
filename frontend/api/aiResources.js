import { fetchCsrfToken } from '../services/csrfToken';
import aiResourceFinder from '../services/aiResourceFinder';

/**
 * Find learning resources using AI
 * 
 * @param {string} topic The topic to find resources for
 * @param {Object} options Configuration options
 * @param {string} options.provider AI provider to use ('openai', 'azure', 'google', 'together')
 * @param {boolean} options.useFunctionCalling Whether to use function calling approach (only for supported providers)
 * @returns {Promise<Array>} Array of learning resources
 */
export const findResources = async (topic, options = {}) => {
  try {
    // Get API configuration from environment or options
    const apiConfig = {
      provider: options.provider || process.env.NEXT_PUBLIC_AI_PROVIDER || 'together',
      apiKey: options.apiKey || process.env.NEXT_PUBLIC_AI_API_KEY,
    };
    
    // Add provider-specific configuration
    if (apiConfig.provider === 'azure') {
      apiConfig.endpoint = options.endpoint || process.env.NEXT_PUBLIC_AZURE_OPENAI_ENDPOINT;
      apiConfig.deploymentName = options.deploymentName || process.env.NEXT_PUBLIC_AZURE_OPENAI_DEPLOYMENT_NAME;
    }
    
    // Choose the appropriate method based on function calling preference and provider support
    const useFunctionCalling = options.useFunctionCalling && 
      ['openai', 'azure', 'google'].includes(apiConfig.provider);
    
    // Call the appropriate method
    if (useFunctionCalling) {
      return await aiResourceFinder.findResourcesWithFunctionCalling(topic, apiConfig);
    } else {
      return await aiResourceFinder.findLearningResources(topic, apiConfig);
    }
  } catch (error) {
    console.error('Error finding resources:', error);
    throw error;
  }
};

/**
 * Function to add a learning resource from AI recommendations
 * 
 * @param {Object} resourceData The resource data to add
 * @returns {Promise<Object>} The created resource
 */
export const addAIResource = async (resourceData) => {
  try {
    // Get CSRF token for the request
    const csrfToken = await fetchCsrfToken();
    
    // Make the API request to create a resource and associate it with a page
    const response = await fetch('/api/learning-resources/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken,
      },
      body: JSON.stringify(resourceData),
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to add resource');
    }

    return await response.json();
  } catch (error) {
    console.error('Error adding AI resource:', error);
    throw error;
  }
};

export default {
  addAIResource,
};
