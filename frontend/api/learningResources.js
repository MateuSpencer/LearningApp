import { httpGet, httpPost, httpPut, httpDelete } from '../utils/Http';

// Define correct API endpoint paths
const API_BASE = '/api/learning-resources';
const RESOURCES_ENDPOINT = `${API_BASE}/learning-resources`;
const ASSOCIATIONS_ENDPOINT = `${API_BASE}/resource-associations`;
const RESOURCE_URLS_ENDPOINT = `${API_BASE}/resource-urls`;

export const learningResources = {
    // Resource operations
    getAll: async (filters = {}) => {
        try {
            // Build query string from filters
            const queryParams = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    queryParams.append(key, value);
                }
            });
            
            const queryString = queryParams.toString();
            const url = queryString ? `${RESOURCES_ENDPOINT}/?${queryString}` : `${RESOURCES_ENDPOINT}/`;
            
            return await httpGet(url);
        } catch (error) {
            throw error;
        }
    },
    
    // Alias for getAll to match the function name used in the components
    getAllResources: async (filters = {}) => {
        try {
            // Handle when filters is a query string already
            if (typeof filters === 'string') {
                const url = `${RESOURCES_ENDPOINT}/?${filters}`;
                return await httpGet(url);
            }
            // Otherwise, treat as object and use getAll
            return learningResources.getAll(filters);
        } catch (error) {
            throw error;
        }
    },
    
    getById: async (id) => {
        try {
            return await httpGet(`${RESOURCES_ENDPOINT}/${id}/`);
        } catch (error) {
            throw error;
        }
    },
    
    create: async (resourceData) => {
        try {
            return await httpPost(`${RESOURCES_ENDPOINT}/`, resourceData);
        } catch (error) {
            throw error;
        }
    },
    
    // New method: Create a resource from URL
    createFromUrl: async ({ url, title, pageSlug, resourceType = 'website', language = 'en' }) => {
        try {
            // Ensure we're using the normalized URL from backend validation
            // The validation should have already occurred before submitting
            const payload = {
                url,
                title,
                page_slug: pageSlug,
                resource_type: resourceType,
                language
            };
            
            const response = await httpPost(`${RESOURCES_ENDPOINT}/`, payload);
            
            // Check if the response indicates a duplicate URL
            if (response.status === 'duplicate_url') {
                // Return a special result object instead of throwing an error
                return {
                    success: false,
                    status: 'duplicate_url',
                    message: response.message || 'This URL already exists in the system',
                    existingResource: response.resource
                };
            }
            
            // If successful, return the normal response
            return {
                success: true,
                resource: response
            };
        } catch (error) {
            // Handle specific error cases from HTTP errors
            if (error.data && error.data.url) {
                // If the error is specifically about the URL
                if (typeof error.data.url === 'string' && error.data.url.includes('already exists')) {
                    // Return a special result object instead of throwing an error
                    return {
                        success: false,
                        status: 'duplicate_url',
                        message: 'This URL already exists in the system',
                        error: error
                    };
                } else if (Array.isArray(error.data.url) && error.data.url.length > 0) {
                    const urlError = error.data.url[0];
                    if (urlError.includes('already exists')) {
                        // Return a special result object instead of throwing an error
                        return {
                            success: false,
                            status: 'duplicate_url',
                            message: 'This URL already exists in the system',
                            error: error
                        };
                    }
                }
            }
            
            // For other errors, log and re-throw
            throw error;
        }
    },
    
    // New method: Check if URL already exists
    checkUrlExists: async (url) => {
        try {
            // First normalize the URL to ensure consistent comparison
            // This should match the backend normalization
            const normalizedUrl = url;
            
            // Query for any URLs matching the provided one
            const queryParams = new URLSearchParams({
                url: normalizedUrl
            });
            
            const response = await httpGet(`${RESOURCE_URLS_ENDPOINT}/?${queryParams}`);
            
            // If any results are found, the URL exists
            return {
                exists: response.results && response.results.length > 0,
                resource: response.results && response.results.length > 0 ? 
                    response.results[0].learning_resource : null
            };
        } catch (error) {
            throw error;
        }
    },
    
    // New method: Validate URL using backend validation
    validateUrl: async (url) => {
        try {
            // Call the backend validation endpoint - use the correct endpoint path 
            const response = await httpPost(`${API_BASE}/validate_url/`, { url });
            
            // Check if the response contains error indicators that should be surfaced
            if (response.status === 'success' && response.content_status === 'error') {
                return {
                    status: 'error',
                    error_type: 'content_error',
                    message: response.content_message || 'Error page detected',
                    normalized_url: response.normalized_url,
                    original_url: url
                };
            }
            
            // Check for 404-specific patterns in content
            if (response.status === 'success' && response.html_content) {
                // Check for common 404 indicators in title or content
                const lowerContent = response.html_content.toLowerCase();
                const hasTitle = response.html_content.match(/<title[^>]*>(.*?)<\/title>/i);
                const title = hasTitle ? hasTitle[1].toLowerCase() : '';
                
                if (title.includes('404') || 
                    title.includes('not found') || 
                    (lowerContent.includes('not found') && lowerContent.includes('404'))) {
                    return {
                        status: 'error',
                        error_type: 'not_found',
                        message: 'This appears to be a 404 error page',
                        normalized_url: response.normalized_url,
                        original_url: url
                    };
                }
            }
            
            return response;
        } catch (error) {
            // Handle specific error cases
            if (error.status === 400 && error.data) {
                return {
                    status: 'error',
                    message: error.data.message || 'URL validation failed',
                    ...error.data
                };
            }
            // If the endpoint was not found (404), it might be using underscore instead of hyphen
            if (error.status === 404) {
                try {
                    // Try the alternate endpoint with underscore
                    const response = await httpPost(`${API_BASE}/validate_url/`, { url });
                    return response;
                } catch (fallbackError) {
                    return {
                        status: 'error',
                        message: 'URL validation failed: Invalid URL format or service not available',
                    };
                }
            }
            
            // For HTTP error codes like 404, 403, etc. from the target URL
            if (error.status && error.status >= 400) {
                return {
                    status: 'error',
                    error_type: error.status === 404 ? 'not_found' : 'http_error',
                    message: `URL validation failed: Server responded with ${error.status} ${error.statusText || ''}`,
                    http_status: error.status
                };
            }
            
            throw error;
        }
    },
    
    update: async (id, resourceData) => {
        try {
            return await httpPut(`${RESOURCES_ENDPOINT}/${id}/`, resourceData);
        } catch (error) {
            throw error;
        }
    },
    
    delete: async (id) => {
        try {
            return await httpDelete(`${RESOURCES_ENDPOINT}/${id}/`);
        } catch (error) {
            throw error;
        }
    },
    
    // Quality voting operations
    submitQualityVote: async (resourceId, rating) => {
        try {
            return await httpPost(`${RESOURCES_ENDPOINT}/${resourceId}/quality_vote/`, {
                rating
            });
        } catch (error) {
            throw error;
        }
    },
    
    // Difficulty voting operations
    submitDifficultyVote: async (resourceId, level) => {
        try {
            return await httpPost(`${RESOURCES_ENDPOINT}/${resourceId}/difficulty_vote/`, {
                level
            });
        } catch (error) {
            throw error;
        }
    },
    
    // URL operations
    addUrl: async (resourceId, url, isPrimary = false) => {
        try {
            const payload = {
                learning_resource: resourceId,
                url,
                is_primary: isPrimary
            };
            return await httpPost(`${RESOURCE_URLS_ENDPOINT}/`, payload);
        } catch (error) {
            throw error;
        }
    },
    
    // Page associations
    getAssociationsForPage: async (pageSlug) => {
        try {
            const url = `${ASSOCIATIONS_ENDPOINT}/?page_slug=${pageSlug}`;
            const response = await httpGet(url);
            return response;
        } catch (error) {
            throw error;
        }
    },
    
    // Method to fetch YouTube metadata by video ID
    getYoutubeMetadata: async (videoId) => {
        if (!videoId || videoId.length !== 11) {
            // Return empty metadata for invalid video IDs without making an API call
            return { 
                status: 'error',
                message: 'Invalid YouTube video ID',
                title: '',
                author: '',
                provider: 'YouTube'
            };
        }
        
        try {
            const response = await httpGet(`${API_BASE}/youtube-metadata/${videoId}/`);
            return response;
        } catch (error) {
            // Return empty metadata object instead of throwing or logging to console
            return { 
                status: 'error',
                message: 'This YouTube video could not be verified',
                title: '',
                author: '',
                provider: 'YouTube'
            };
        }
    },
    
    createAssociation: async (resourceId, pageSlug) => {
        try {
            // First check if this association already exists
            const existingAssociations = await httpGet(`${ASSOCIATIONS_ENDPOINT}/?resource_id=${resourceId}&page_slug=${pageSlug}`);
            
            // If the association already exists, return it instead of creating a new one
            if (existingAssociations.results && existingAssociations.results.length > 0) {
                return existingAssociations.results[0]; // Return the existing association
            }
            
            // Fix: Change parameter name from 'learning_resource' to 'resource_id' to match backend serializer
            const payload = {
                resource_id: resourceId,
                page_slug: pageSlug
            };
            
            // Create the association
            const result = await httpPost(`${ASSOCIATIONS_ENDPOINT}/`, payload);
            
            return result;
        } catch (error) {
            throw error;
        }
    },
    
    // Appropriateness voting
    upvoteAssociation: async (associationId) => {
        try {
            return await httpPost(`${ASSOCIATIONS_ENDPOINT}/${associationId}/upvote/`, {});
        } catch (error) {
            throw error;
        }
    },
    
    downvoteAssociation: async (associationId) => {
        try {
            return await httpPost(`${ASSOCIATIONS_ENDPOINT}/${associationId}/downvote/`, {});
        } catch (error) {
            throw error;
        }
    },

    // Get associated pages for a resource
    getAssociationsForResource: async (resourceId) => {
        try {
            // Updated to use resource_id parameter for consistency
            return await httpGet(`${ASSOCIATIONS_ENDPOINT}/?resource_id=${resourceId}`);
        } catch (error) {
            throw error;
        }
    },

    // AI Summary operations
    saveSummaryToResource: async (resourceId, summaryData) => {
        try {
            // Prepare the summary text - no complex formatting
            let summaryText = '';
            
            // If summaryData is already a string, use it directly
            if (typeof summaryData === 'string') {
                summaryText = summaryData;
            } else if (summaryData && typeof summaryData === 'object') {
                // Handle the response structure from generateSummary
                // The response has a 'data' property containing the actual summary data
                if (summaryData.data && summaryData.data.summary) {
                    summaryText = summaryData.data.summary;
                } else if (summaryData.summary) {
                    // Fallback for direct summary property
                    summaryText = summaryData.summary;
                } else {
                    summaryText = '';
                }
            } else {
                // Handle case where summaryData is null/undefined
                summaryText = '';
            }
            
            const summaryEndpoint = `${RESOURCES_ENDPOINT}/${resourceId}/set_ai_summary/`;
            
            try {
                // Make the API call to save the summary
                const result = await httpPost(summaryEndpoint, {
                    ai_summary: summaryText
                });
                
                return result;
            } catch (error) {
                throw error;
            }
        } catch (error) {
            throw error;
        }
    },

    getResourceSummary: async (resourceId) => {
        try {
            const endpoint = `${RESOURCES_ENDPOINT}/${resourceId}/ai_summary/`;
            return await httpGet(endpoint);
        } catch (error) {
            throw error;
        }
    }
};

export default learningResources;