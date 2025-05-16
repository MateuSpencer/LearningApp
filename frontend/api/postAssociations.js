import { httpGet, httpPost, httpDelete } from '../utils/Http';

const API_BASE_URL = '/api/posts/associations';

export const postAssociations = {
    getAll: async (pageSlug) => {
        try {
            const queryParams = pageSlug ? `?page_slug=${encodeURIComponent(pageSlug)}` : '';
            return await httpGet(`${API_BASE_URL}/${queryParams}`);
        } catch (error) {
            console.error('Error fetching post associations:', error);
            throw error;
        }
    },
    
    getById: async (id) => {
        try {
            return await httpGet(`${API_BASE_URL}/${id}/`);
        } catch (error) {
            console.error(`Error fetching post association with id ${id}:`, error);
            throw error;
        }
    },
    
    create: async (associationData) => {
        try {
            return await httpPost(`${API_BASE_URL}/`, associationData);
        } catch (error) {
            console.error('Error creating post association:', error);
            throw error;
        }
    },
    
    delete: async (id) => {
        try {
            return await httpDelete(`${API_BASE_URL}/${id}/`);
        } catch (error) {
            console.error(`Error deleting post association with id ${id}:`, error);
            throw error;
        }
    },
    
    // Methods for post-page association votes
    upvote: async (id) => {
        try {
            return await httpPost(`${API_BASE_URL}/${id}/upvote/`, {});
        } catch (error) {
            console.error(`Error upvoting post association with id ${id}:`, error);
            throw error;
        }
    },
    
    downvote: async (id) => {
        try {
            return await httpPost(`${API_BASE_URL}/${id}/downvote/`, {});
        } catch (error) {
            console.error(`Error downvoting post association with id ${id}:`, error);
            throw error;
        }
    }
};

export default postAssociations;
