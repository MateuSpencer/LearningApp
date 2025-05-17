import { httpGet, httpPost, httpDelete } from '../utils/Http';

const API_BASE_URL = '/api/posts/associations';

export const postAssociations = {
    getAll: async (pageSlug) => {
        try {
            const queryParams = pageSlug ? `?page_slug=${encodeURIComponent(pageSlug)}` : '';
            return await httpGet(`${API_BASE_URL}/${queryParams}`);
        } catch (error) {
            throw error;
        }
    },
    
    getById: async (id) => {
        try {
            return await httpGet(`${API_BASE_URL}/${id}/`);
        } catch (error) {
            throw error;
        }
    },
    
    create: async (associationData) => {
        try {
            return await httpPost(`${API_BASE_URL}/`, associationData);
        } catch (error) {
            throw error;
        }
    },
    
    delete: async (id) => {
        try {
            return await httpDelete(`${API_BASE_URL}/${id}/`);
        } catch (error) {
            throw error;
        }
    },
    
    // Methods for post-page association votes
    upvote: async (id) => {
        try {
            return await httpPost(`${API_BASE_URL}/${id}/upvote/`, {});
        } catch (error) {
            throw error;
        }
    },
    
    downvote: async (id) => {
        try {
            return await httpPost(`${API_BASE_URL}/${id}/downvote/`, {});
        } catch (error) {
            throw error;
        }
    }
};

export default postAssociations;
