import aiResourceFinder from '../services/aiResourceFinder';
import { learningResources } from './learningResources';
import { httpPost, httpGet, httpDelete } from '../utils/Http';
import urlValidationService from '../services/urlValidationService';

/**
 * Find learning resources using AI and store them as persistent suggestions
 * 
 * @param {string} topic The topic to find resources for
 * @param {string} pageSlug The page slug to associate suggestions with
 * @param {Object} options Configuration options
 * @param {string} options.provider AI provider to use ('openai', 'azure', 'google', 'together', 'tavily')
 * @param {boolean} options.useFunctionCalling Whether to use function calling approach (only for supported providers)
 * @param {boolean} options.filterInvalidUrls Whether to filter out invalid URLs (default: true)
 * @param {boolean} options.fullValidation Whether to use full URL validation including backend checks (default: true)
 * @param {boolean} options.storePersistent Whether to store suggestions persistently in the backend (default: true)
 * @returns {Promise<Array>} Array of learning resources with valid URLs
 */
export const findResources = async (topic, pageSlug, options = {}) => {
  try {
    // Get provider from options or environment
    const provider = options.provider || process.env.NEXT_PUBLIC_AI_PROVIDER || 'together';
    const filterInvalidUrls = options.filterInvalidUrls !== false; // Default to true
    const fullValidation = options.fullValidation !== false; // Default to true
    const storePersistent = options.storePersistent !== false; // Default to true
    
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
        formatOnly: !fullValidation, // Use full validation by default, format-only if explicitly requested
        skipContentCheck: false // Perform content checking to detect 404 pages and similar errors
      });
      
      console.log(`Filtered to ${validResources.length} resources with valid URLs.`);
      
      if (validResources.length < resources.length) {
        const filteredCount = resources.length - validResources.length;
        console.warn(`Filtered out ${filteredCount} resources with invalid URLs (failed validation checks).`);
      }
      
      resources = validResources;
    }

    // Store suggestions persistently if requested and pageSlug is provided
    if (storePersistent && pageSlug && Array.isArray(resources) && resources.length > 0) {
      try {
        await storeSuggestionsForPage(pageSlug, resources);
        console.log(`Stored ${resources.length} AI suggestions persistently for page: ${pageSlug}`);
      } catch (error) {
        console.warn('Failed to store AI suggestions persistently:', error);
        // Continue with non-persistent suggestions if storage fails
      }
    }
    
    return resources || [];
  } catch (error) {
    console.error('Error finding resources:', error);
    throw error;
  }
};

/**
 * Store AI-generated suggestions persistently for a page
 * 
 * @param {string} pageSlug The page slug to store suggestions for
 * @param {Array} suggestions Array of AI-generated resource suggestions
 * @returns {Promise<Array>} Array of stored suggestion objects
 */
export const storeSuggestionsForPage = async (pageSlug, suggestions) => {
  try {
    const storedSuggestions = [];
    
    for (const suggestion of suggestions) {
      try {
        const response = await httpPost('/api/learning-resources/ai-suggestions/', {
          page_slug: pageSlug,
          title: suggestion.title,
          url: suggestion.url,
          resource_type: suggestion.resource_type || suggestion.type || 'website',
          description: suggestion.description || ''
        });
        
        storedSuggestions.push(response);
      } catch (error) {
        console.warn(`Failed to store suggestion for ${suggestion.title}:`, error);
        // Continue with other suggestions even if one fails
      }
    }
    
    return storedSuggestions;
  } catch (error) {
    console.error('Error storing AI suggestions:', error);
    throw error;
  }
};

/**
 * Get persistent AI suggestions for a page
 * 
 * @param {string} pageSlug The page slug to get suggestions for
 * @param {Object} options Filter options
 * @param {boolean} options.filterExisting Whether to filter out existing resources (default: true)
 * @param {boolean} options.onlyNotAdded Whether to only return suggestions not yet added as resources (default: true)
 * @returns {Promise<Array>} Array of persistent AI suggestions
 */
export const getPersistentSuggestionsForPage = async (pageSlug, options = {}) => {
  try {
    const { filterExisting = true, onlyNotAdded = true } = options;
    
    const params = new URLSearchParams({
      page_slug: pageSlug,
      filter_existing: filterExisting.toString(),
      is_added: (!onlyNotAdded).toString()
    });
    
    const response = await httpGet(`/api/learning-resources/ai-suggestions/?${params}`);
    return response.results || response;
  } catch (error) {
    console.error('Error fetching persistent AI suggestions:', error);
    throw error;
  }
};

/**
 * Delete a persistent AI suggestion
 * 
 * @param {string} suggestionId The ID of the suggestion to delete
 * @returns {Promise<void>}
 */
export const deletePersistentSuggestion = async (suggestionId) => {
  try {
    await httpDelete(`/api/learning-resources/ai-suggestions/${suggestionId}/`);
  } catch (error) {
    console.error('Error deleting AI suggestion:', error);
    throw error;
  }
};

/**
 * Add a persistent AI suggestion to learning resources
 * 
 * @param {string} suggestionId The ID of the suggestion to add as a resource
 * @returns {Promise<Object>} Response with resource details
 */
export const addSuggestionToResources = async (suggestionId) => {
  try {
    const response = await httpPost(`/api/learning-resources/ai-suggestions/${suggestionId}/add_to_resources/`);
    return response;
  } catch (error) {
    console.error('Error adding suggestion to resources:', error);
    throw error;
  }
};

/**
 * Generate fresh AI suggestions for a page and store them persistently
 * 
 * @param {string} pageSlug The page slug to generate suggestions for
 * @param {string} articleTitle The title of the article/page
 * @param {string} articleContent Optional content snippet for better suggestions
 * @param {number} count Number of suggestions to generate (default: 5)
 * @returns {Promise<Array>} Array of generated and stored suggestions
 */
export const generatePersistentSuggestionsForPage = async (pageSlug, articleTitle, articleContent = '', count = 5) => {
  try {
    const response = await httpPost('/api/learning-resources/ai-suggestions/generate_for_article/', {
      page_slug: pageSlug,
      article_title: articleTitle,
      article_content: articleContent,
      count: count
    });
    
    return response.suggestions || [];
  } catch (error) {
    console.error('Error generating persistent AI suggestions:', error);
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
  storeSuggestionsForPage,
  getPersistentSuggestionsForPage,
  deletePersistentSuggestion,
  addSuggestionToResources,
  generatePersistentSuggestionsForPage,
};
