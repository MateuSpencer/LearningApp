import { getCSRFToken } from '../lib/django';
import { getAuth, getSessionToken } from '../lib/allauth';

const parseJSON = (response) => {
    // Handle empty responses (like 204 No Content)
    if (response.status === 204 || response.headers.get('content-length') === '0') {
        return Promise.resolve({});
    }
    return response.json();
};

const defaultHeaders = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
};

// Build headers with CSRF token and authentication tokens
const buildHeaders = () => {
    const headers = { ...defaultHeaders };
    
    // Add CSRF token if available
    const csrfToken = getCSRFToken();
    if (csrfToken) {
        headers['X-CSRFToken'] = csrfToken;
    }
    
    // Add session token if available (for non-cookie auth scenarios)
    const sessionToken = getSessionToken();
    if (sessionToken) {
        headers['X-Session-Token'] = sessionToken;
    }
    
    return headers;
};

const checkStatus = (response) => {
    if (response.status >= 200 && response.status < 300) {
        return response;
    }

    const error = new Error(response.statusText);
    error.response = response;
    error.status = response.status;
    throw error;
};

// Handle authentication errors - redirects to login if needed
const handleAuthError = (error) => {
    // Redirect to login page if we get a 401 Unauthorized error
    if (error.status === 401 && typeof window !== 'undefined') {
        // Save the current path to redirect back after login
        const currentPath = window.location.pathname;
        window.location.href = `/account/login?next=${encodeURIComponent(currentPath)}`;
    }
    throw error;
};

// Get current user using allauth
export const getCurrentUser = async () => {
    try {
        const authResponse = await getAuth();
        if (authResponse.status === 200 && authResponse.data?.user) {
            return authResponse.data.user;
        }
        return null;
    } catch (error) {
        console.error('Error getting current user:', error);
        return null;
    }
};

// Basic HTTP methods that use proper CSRF handling and authentication
export const httpGet = (url) =>
    fetch(url, {
        headers: buildHeaders(),
        credentials: 'same-origin',
    })
    .then(checkStatus)
    .then(parseJSON)
    .catch(handleAuthError);

export const httpPost = async (url, data) => {
    return fetch(url, {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify(data),
        credentials: 'same-origin',
    })
    .then(checkStatus)
    .then(parseJSON)
    .catch(handleAuthError);
};

export const httpPut = async (url, data) => {
    return fetch(url, {
        method: 'PUT',
        headers: buildHeaders(),
        body: JSON.stringify(data),
        credentials: 'same-origin',
    })
    .then(checkStatus)
    .then(parseJSON)
    .catch(handleAuthError);
};

export const httpDelete = async (url) => {
    return fetch(url, {
        method: 'DELETE',
        headers: buildHeaders(),
        credentials: 'same-origin',
    })
    .then(checkStatus)
    .then(parseJSON)
    .catch(handleAuthError);
};