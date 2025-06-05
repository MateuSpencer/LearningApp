import aiResourceFinder from '../services/aiResourceFinder';
import { learningResources } from './learningResources';
import { httpPost } from '../utils/Http';
import urlValidationService from '../services/urlValidationService';

/**
 * Find learning resources using AI
 * 
 * @param {string} topic The topic to find resources for
 * @param {Object} options Configuration options
 * @param {string} options.provider AI provider to use ('openai', 'azure', 'google', 'together', 'tavily')
 * @param {boolean} options.useFunctionCalling Whether to use function calling approach (only for supported providers)
 * @param {boolean} options.filterInvalidUrls Whether to filter out invalid URLs (default: true)
 * @param {boolean} options.fullValidation Whether to use full URL validation including backend checks (default: true)
 * @returns {Promise<Array>} Array of learning resources with valid URLs
 */
export const findResources = async (topic, options = {}) => {
  try {
    // Get provider from options or environment
    const provider = options.provider || process.env.NEXT_PUBLIC_AI_PROVIDER || 'together';
    const filterInvalidUrls = options.filterInvalidUrls !== false; // Default to true
    const fullValidation = options.fullValidation !== false; // Default to true
    
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
    
    // Get raw resources from AI
    let resources;
    
    // Use Tavily-specific method if the provider is Tavily
    if (apiConfig.provider === 'tavily') {
      resources = await aiResourceFinder.findLearningResourcesWithTavily(topic, apiConfig);
    } else {
      // Choose the appropriate method based on function calling preference and provider support
      const useFunctionCalling = options.useFunctionCalling && 
        ['openai', 'azure', 'google'].includes(apiConfig.provider);
      
      // Call the appropriate method
      if (useFunctionCalling) {
        resources = await aiResourceFinder.findResourcesWithFunctionCalling(topic, apiConfig);
      } else {
        resources = await aiResourceFinder.findLearningResources(topic, apiConfig);
      }
    }
    
    // Filter out invalid URLs if requested
    if (filterInvalidUrls && Array.isArray(resources)) {
      console.log(`Filtering ${resources.length} AI-generated resources for valid URLs...`);
      
      // Use full URL validation to ensure AI resources pass the same checks as manual entries
      const validResources = await urlValidationService.filterValidResources(resources, {
        formatOnly: !fullValidation // Use full validation by default, format-only if explicitly requested
      });
      
      console.log(`Filtered to ${validResources.length} resources with valid URLs.`);
      
      if (validResources.length < resources.length) {
        const filteredCount = resources.length - validResources.length;
        console.warn(`Filtered out ${filteredCount} resources with invalid URLs (failed validation checks).`);
      }
      
      return validResources;
    }
    
    return resources || [];
  } catch (error) {
    console.error('Error finding resources:', error);
    throw error;
  }
};

/**
 * Function to add a learning resource from AI recommendations
 * 
 * @param {Object} resourceData The resource data to add
 * @param {boolean} validateUrl Whether to validate the URL before adding (default: true)
 * @returns {Promise<Object>} The created resource
 */
export const addAIResource = async (resourceData, validateUrl = true) => {
  try {
    // Make sure we have all required fields
    if (!resourceData.title || !resourceData.url || !resourceData.page_slug) {
      throw new Error('Missing required fields: title, url, or page_slug');
    }
    
    // Validate URL if requested
    if (validateUrl) {
      const validationResult = await urlValidationService.validateUrlFormat(resourceData.url);
      
      if (!validationResult.isValid) {
        throw new Error(`Invalid URL: ${validationResult.error}`);
      }
      
      // Use normalized URL if available
      const urlToUse = validationResult.normalizedUrl || resourceData.url;
      
      // Use the learningResources.createFromUrl method with normalized URL
      return await learningResources.createFromUrl({
        url: urlToUse,
        title: resourceData.title,
        pageSlug: resourceData.page_slug,
        resourceType: validationResult.resourceType || resourceData.resource_type || 'website'
      });
    } else {
      // Use the learningResources.createFromUrl method without validation
      return await learningResources.createFromUrl({
        url: resourceData.url,
        title: resourceData.title,
        pageSlug: resourceData.page_slug,
        resourceType: resourceData.resource_type || 'website'
      });
    }
  } catch (error) {
    console.error('Error adding AI resource:', error);
    throw error;
  }
};

export default {
  findResources,
  addAIResource,
};
