import { httpGet, httpPost, httpPut, httpDelete } from '../utils/Http';

const API_BASE_URL = '/api/learning-resources/learning-resources';
const ASSOCIATIONS_URL = '/api/learning-resources/resource-associations';
const RESOURCE_URLS_URL = '/api/learning-resources/resource-urls';

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
            const url = queryString ? `${API_BASE_URL}/?${queryString}` : `${API_BASE_URL}/`;
            
            return await httpGet(url);
        } catch (error) {
            console.error('Error fetching learning resources:', error);
            throw error;
        }
    },
    
    // Alias for getAll to match the function name used in the components
    getAllResources: async (filters = {}) => {
        return learningResources.getAll(filters);
    },
    
    getById: async (id) => {
        try {
            return await httpGet(`${API_BASE_URL}/${id}/`);
        } catch (error) {
            console.error(`Error fetching learning resource with id ${id}:`, error);
            throw error;
        }
    },
    
    create: async (resourceData) => {
        try {
            return await httpPost(`${API_BASE_URL}/`, resourceData);
        } catch (error) {
            console.error('Error creating learning resource:', error);
            throw error;
        }
    },
    
    // New method: Create a resource from URL
    createFromUrl: async ({ url, title, pageSlug, resourceType = 'website' }) => {
        try {
            const payload = {
                url,
                title,
                page_slug: pageSlug,
                resource_type: resourceType
            };
            
            return await httpPost(`${API_BASE_URL}/`, payload);
        } catch (error) {
            console.error('Error creating resource from URL:', error);
            throw error;
        }
    },
    
    // New method: Check if URL already exists
    checkUrlExists: async (url) => {
        try {
            // Query for any URLs matching the provided one
            const queryParams = new URLSearchParams({
                url: url
            });
            
            const response = await httpGet(`${RESOURCE_URLS_URL}/?${queryParams}`);
            
            // If any results are found, the URL exists
            return {
                exists: response.results && response.results.length > 0,
                resource: response.results && response.results.length > 0 ? 
                    response.results[0].learning_resource : null
            };
        } catch (error) {
            console.error('Error checking if URL exists:', error);
            throw error;
        }
    },
    
    update: async (id, resourceData) => {
        try {
            return await httpPut(`${API_BASE_URL}/${id}/`, resourceData);
        } catch (error) {
            console.error(`Error updating learning resource with id ${id}:`, error);
            throw error;
        }
    },
    
    delete: async (id) => {
        try {
            return await httpDelete(`${API_BASE_URL}/${id}/`);
        } catch (error) {
            console.error(`Error deleting learning resource with id ${id}:`, error);
            throw error;
        }
    },
    
    // Quality voting operations
    submitQualityVote: async (resourceId, rating) => {
        try {
            return await httpPost(`${API_BASE_URL}/${resourceId}/quality-vote/`, {
                rating
            });
        } catch (error) {
            console.error(`Error submitting quality vote for resource ${resourceId}:`, error);
            throw error;
        }
    },
    
    // Accessibility voting operations
    submitAccessibilityVote: async (resourceId, level) => {
        try {
            return await httpPost(`${API_BASE_URL}/${resourceId}/accessibility-vote/`, {
                level
            });
        } catch (error) {
            console.error(`Error submitting accessibility vote for resource ${resourceId}:`, error);
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
            return await httpPost(RESOURCE_URLS_URL + '/', payload);
        } catch (error) {
            console.error(`Error adding URL to resource ${resourceId}:`, error);
            throw error;
        }
    },
    
    // Page associations
    getAssociationsForPage: async (pageSlug) => {
        try {
            const url = `${ASSOCIATIONS_URL}/?page_slug=${pageSlug}`;
            const response = await httpGet(url);
            return response;
        } catch (error) {
            console.error(`Error fetching associations for page ${pageSlug}:`, error);
            throw error;
        }
    },
    
    createAssociation: async (resourceId, pageSlug) => {
        try {
            // First check if this association already exists
            const existingAssociations = await httpGet(`${ASSOCIATIONS_URL}/?resource_id=${resourceId}&page_slug=${pageSlug}`);
            
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
            const result = await httpPost(ASSOCIATIONS_URL + '/', payload);
            
            return result;
        } catch (error) {
            console.error(`Error creating association between resource ${resourceId} and page ${pageSlug}:`, error);
            throw error;
        }
    },
    
    // Appropriateness voting
    upvoteAssociation: async (associationId) => {
        try {
            return await httpPost(`${ASSOCIATIONS_URL}/${associationId}/upvote/`, {});
        } catch (error) {
            console.error(`Error upvoting association ${associationId}:`, error);
            throw error;
        }
    },
    
    downvoteAssociation: async (associationId) => {
        try {
            return await httpPost(`${ASSOCIATIONS_URL}/${associationId}/downvote/`, {});
        } catch (error) {
            console.error(`Error downvoting association ${associationId}:`, error);
            throw error;
        }
    },

    // Get associated pages for a resource
    getAssociationsForResource: async (resourceId) => {
        try {
            // Updated to use resource_id parameter for consistency
            return await httpGet(`${ASSOCIATIONS_URL}/?resource_id=${resourceId}`);
        } catch (error) {
            console.error(`Error fetching associations for resource ${resourceId}:`, error);
            throw error;
        }
    }
};

export default learningResources;