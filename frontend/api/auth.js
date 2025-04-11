import { httpGet, httpPost } from '../utils/Http';

const API_BASE_URL = '/api/auth';

export const auth = {
    login: async (credentials) => {
        return httpPost(`${API_BASE_URL}/login/`, credentials);
    },
    
    logout: async () => {
        return httpPost(`${API_BASE_URL}/logout/`, {});
    },
    
    register: async (userData) => {
        return httpPost(`${API_BASE_URL}/register/`, userData);
    },
    
    getCurrentUser: async () => {
        try {
            return await httpGet(`${API_BASE_URL}/user/`);
        } catch (error) {
            // If 401 or 403, user is not authenticated
            if (error.status === 401 || error.status === 403) {
                return null;
            }
            throw error;
        }
    }
};

export default auth;