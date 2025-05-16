import { httpGet, httpPost, httpPut, httpDelete } from '../utils/Http';

const API_BASE_URL = '/api/posts';
const API_ASSOCIATIONS_URL = '/api/post-page-associations';

export const posts = {
    getAll: async (pageSlug) => {
        try {
            const queryParams = pageSlug ? `?page_slug=${encodeURIComponent(pageSlug)}` : '';
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
            // Only log actual errors, not 404s which are expected when a post doesn't exist
            if (!error.isNotFoundError) {
                console.error(`Error fetching post with id ${id}:`, error);
            }
            // Preserve the original error with its status code and message
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
    },
    
    // Post Page Association methods
    associateWithPage: async (postId, pageSlug) => {
        try {
            return await httpPost(`${API_ASSOCIATIONS_URL}/`, {
                post: postId,
                page_slug: pageSlug
            });
        } catch (error) {
            console.error(`Error associating post ${postId} with page ${pageSlug}:`, error);
            throw error;
        }
    },
    
    removePageAssociation: async (associationId) => {
        try {
            return await httpDelete(`${API_ASSOCIATIONS_URL}/${associationId}/`);
        } catch (error) {
            console.error(`Error removing page association ${associationId}:`, error);
            throw error;
        }
    },
    
    upvoteAssociation: async (associationId) => {
        try {
            return await httpPost(`${API_ASSOCIATIONS_URL}/${associationId}/upvote/`, {});
        } catch (error) {
            console.error(`Error upvoting association with id ${associationId}:`, error);
            throw error;
        }
    },
    
    downvoteAssociation: async (associationId) => {
        try {
            return await httpPost(`${API_ASSOCIATIONS_URL}/${associationId}/downvote/`, {});
        } catch (error) {
            console.error(`Error downvoting association with id ${associationId}:`, error);
            throw error;
        }
    }
};

export default posts;