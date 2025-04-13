import { httpGet, httpPost, httpPut, httpDelete } from '../utils/Http';

const API_BASE_URL = '/api/posts';

export const posts = {
    getAll: async (pageSlug) => {
        try {
            const queryParams = pageSlug ? `?page=${encodeURIComponent(pageSlug)}` : '';
            return await httpGet(`${API_BASE_URL}/${queryParams}`);
        } catch (error) {
            console.error('Error fetching posts:', error);
            throw error;
        }
    },
    
    getById: async (id) => {
        try {
            return await httpGet(`${API_BASE_URL}/${id}/`);
        } catch (error) {
            console.error(`Error fetching post with id ${id}:`, error);
            throw error;
        }
    },
    
    create: async (postData) => {
        try {
            return await httpPost(`${API_BASE_URL}/`, postData);
        } catch (error) {
            console.error('Error creating post:', error);
            throw error;
        }
    },
    
    update: async (id, postData) => {
        try {
            return await httpPut(`${API_BASE_URL}/${id}/`, postData);
        } catch (error) {
            console.error(`Error updating post with id ${id}:`, error);
            throw error;
        }
    },
    
    delete: async (id) => {
        try {
            return await httpDelete(`${API_BASE_URL}/${id}/`);
        } catch (error) {
            console.error(`Error deleting post with id ${id}:`, error);
            throw error;
        }
    }
};

export default posts;