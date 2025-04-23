import { httpGet, httpPost, httpDelete } from '../utils/Http';

const API_BASE_URL = '/api/auth';

export const auth = {
    login: async (credentials) => {
        try {
            return await httpPost(`${API_BASE_URL}/login/`, credentials);
        } catch (error) {
            // Extract specific error messages from the response
            if (error.response) {
                // Handle based on status code
                if (error.response.status === 403 || error.response.status === 401) {
                    throw new Error('Invalid username or password');
                }
                
                // Extract any specific error messages from the response data
                if (error.response.data) {
                    const errorData = error.response.data;
                    
                    // Format error messages
                    let errorMessage = '';
                    
                    // Handle field-specific errors
                    if (typeof errorData === 'object') {
                        const fields = Object.keys(errorData);
                        
                        if (fields.length > 0) {
                            errorMessage = fields.map(field => {
                                const fieldError = Array.isArray(errorData[field]) 
                                    ? errorData[field].join(' ')
                                    : errorData[field];
                                return `${field}: ${fieldError}`;
                            }).join('\n');
                        }
                    } else if (typeof errorData === 'string') {
                        errorMessage = errorData;
                    }
                    
                    // If we have a formatted error message, throw it
                    if (errorMessage) {
                        const enhancedError = new Error(errorMessage);
                        enhancedError.fieldErrors = errorData;
                        throw enhancedError;
                    }
                }
            }
            
            // If we couldn't parse specific errors, re-throw the original error
            throw new Error('Login failed. Please try again.');
        }
    },
    
    logout: async () => {
        return httpPost(`${API_BASE_URL}/logout/`, {});
    },
    
    register: async (userData) => {
        try {
            return await httpPost(`${API_BASE_URL}/register/`, userData);
        } catch (error) {
            // Extract specific error messages from the response
            if (error.response && error.response.data) {
                const errorData = error.response.data;
                
                // Format error messages
                let errorMessage = '';
                
                // Handle field-specific errors
                if (typeof errorData === 'object') {
                    const fields = Object.keys(errorData);
                    
                    if (fields.length > 0) {
                        errorMessage = fields.map(field => {
                            // Handle both array and string error formats
                            const fieldError = Array.isArray(errorData[field]) 
                                ? errorData[field].join(' ')
                                : errorData[field];
                            
                            // Enhance specific error messages for clarity
                            if (field === 'username' && fieldError.includes('already exists')) {
                                return `Username: This username is already taken. Please choose another one.`;
                            } else if (field === 'email' && fieldError.includes('already exists')) {
                                return `Email: This email is already registered. Try logging in instead.`;
                            }
                            
                            return `${field}: ${fieldError}`;
                        }).join('\n');
                    }
                } else if (typeof errorData === 'string') {
                    errorMessage = errorData;
                }
                
                // If we have a formatted error message, throw it
                if (errorMessage) {
                    const enhancedError = new Error(errorMessage);
                    enhancedError.fieldErrors = errorData;
                    throw enhancedError;
                }
            }
            
            // If we couldn't parse specific errors, provide a more helpful generic message
            throw new Error('Registration failed. The username or email may already be in use. Please try different credentials.');
        }
    },
    
    getCurrentUser: async () => {
        try {
            return await httpGet(`${API_BASE_URL}/user/`);
        } catch (error) {
            // If 401 or 403, user is not authenticated
            if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                return null;
            }
            throw error;
        }
    },
    
    changePassword: async (passwordData) => {
        try {
            return await httpPost(`${API_BASE_URL}/change-password/`, passwordData);
        } catch (error) {
            // Extract specific error messages from the response
            if (error.response && error.response.data) {
                const errorData = error.response.data;
                
                // Format error messages
                let errorMessage = '';
                
                // Handle field-specific errors
                if (typeof errorData === 'object') {
                    const fields = Object.keys(errorData);
                    
                    if (fields.length > 0) {
                        errorMessage = fields.map(field => {
                            const fieldError = Array.isArray(errorData[field]) 
                                ? errorData[field].join(' ')
                                : errorData[field];
                            return `${field}: ${fieldError}`;
                        }).join('\n');
                    }
                } else if (typeof errorData === 'string') {
                    errorMessage = errorData;
                }
                
                // If we have a formatted error message, throw it
                if (errorMessage) {
                    const enhancedError = new Error(errorMessage);
                    enhancedError.fieldErrors = errorData;
                    throw enhancedError;
                }
            }
            
            // If we couldn't parse specific errors, provide a generic message
            throw new Error('Password change failed. Please check your current password and try again.');
        }
    },
    
    deleteAccount: async () => {
        try {
            return await httpDelete(`${API_BASE_URL}/user/`);
        } catch (error) {
            // Handle specific error cases
            if (error.response && error.response.data) {
                const errorData = error.response.data;
                if (typeof errorData === 'string') {
                    throw new Error(errorData);
                }
            }
            
            // Default error message
            throw new Error('Failed to delete your account. Please try again later.');
        }
    }
};

export default auth;