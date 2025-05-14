import aiResourceFinder from '../services/aiResourceFinder';
import { httpPost } from '../utils/Http';

/**
 * Find learning resources using AI
 * 
 * @param {string} topic The topic to find resources for
 * @param {Object} options Configuration options
 * @param {string} options.provider AI provider to use ('openai', 'azure', 'google', 'together', 'tavily')
 * @param {boolean} options.useFunctionCalling Whether to use function calling approach (only for supported providers)
 * @returns {Promise<Array>} Array of learning resources
 */
export const findResources = async (topic, options = {}) => {
  try {
    // Get provider from options or environment
    const provider = options.provider || process.env.NEXT_PUBLIC_AI_PROVIDER || 'together';
    
    // Initialize apiConfig with the provider
    const apiConfig = { provider };
    
    // Set provider-specific API key
    switch (provider) {
      case 'tavily':
        apiConfig.apiKey = options.apiKey || process.env.NEXT_PUBLIC_TAVILY_API_KEY;
        break;
      case 'together':
        apiConfig.apiKey = options.apiKey || process.env.NEXT_PUBLIC_TOGETHER_AI_API_KEY;
        break;
      case 'azure':
        apiConfig.apiKey = options.apiKey || process.env.NEXT_PUBLIC_AZURE_OPENAI_API_KEY;
        apiConfig.endpoint = options.endpoint || process.env.NEXT_PUBLIC_AZURE_OPENAI_ENDPOINT;
        apiConfig.deploymentName = options.deploymentName || process.env.NEXT_PUBLIC_AZURE_OPENAI_DEPLOYMENT;
        break;
      case 'google':
        apiConfig.apiKey = options.apiKey || process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY;
        break;
      case 'openai':
        apiConfig.apiKey = options.apiKey || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
        break;
      default:
        // If provider is not recognized, default to Tavily
        apiConfig.provider = 'tavily';
        apiConfig.apiKey = options.apiKey || process.env.NEXT_PUBLIC_TAVILY_API_KEY;
    }
    
    // Use Tavily-specific method if the provider is Tavily
    if (apiConfig.provider === 'tavily') {
      return await aiResourceFinder.findLearningResourcesWithTavily(topic, apiConfig);
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
    // Use the httpPost utility which handles CSRF automatically
    return await httpPost('/api/learning-resources/', resourceData);
  } catch (error) {
    console.error('Error adding AI resource:', error);
    throw error;
  }
};

export default {
  findResources,
  addAIResource,
};
