import { getCookie } from './Cookie';

const parseJSON = (response) => response.json();

const defaultHeaders = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
};

// Build headers with optional CSRF token
const buildHeaders = (csrfToken = null) => {
    const headers = { ...defaultHeaders };
    if (csrfToken) {
        headers['X-CSRFToken'] = csrfToken;
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

// Define httpGet without exporting it directly
const httpGet = (url) =>
    fetch(url, {
        headers: buildHeaders(),
        credentials: 'same-origin',
    })
        .then(checkStatus)
        .then(parseJSON);

// Enhance fetchCsrfToken for context provider use
const fetchCsrfToken = async () => {
    try {
        const response = await fetch('/api/auth/csrf-token/', {
            method: 'GET',
            credentials: 'same-origin',
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch CSRF token');
        }
        
        const data = await response.json();
        return data.csrfToken;
    } catch (error) {
        console.error('Error fetching CSRF token:', error);
        throw error;
    }
};

// Update httpPost to accept csrfToken directly
const httpPost = async (url, data, csrfToken = null) => {
    // If no token is provided and URL is an API endpoint, try to fetch one
    if (!csrfToken && url.startsWith('/api/')) {
        try {
            csrfToken = await fetchCsrfToken();
        } catch (e) {
            console.warn('Could not fetch CSRF token, proceeding without it');
        }
    }
    
    return fetch(url, {
        method: 'POST',
        headers: buildHeaders(csrfToken),
        body: JSON.stringify(data),
        credentials: 'same-origin',
    })
    .then(checkStatus)
    .then(parseJSON);
};

// Add httpPut with csrfToken support
const httpPut = async (url, data, csrfToken = null) => {
    // If no token is provided and URL is an API endpoint, try to fetch one
    if (!csrfToken && url.startsWith('/api/')) {
        try {
            csrfToken = await fetchCsrfToken();
        } catch (e) {
            console.warn('Could not fetch CSRF token, proceeding without it');
        }
    }
    
    return fetch(url, {
        method: 'PUT',
        headers: buildHeaders(csrfToken),
        body: JSON.stringify(data),
        credentials: 'same-origin',
    })
    .then(checkStatus)
    .then(parseJSON);
};

// Add httpDelete with csrfToken support
const httpDelete = async (url, csrfToken = null) => {
    // If no token is provided and URL is an API endpoint, try to fetch one
    if (!csrfToken && url.startsWith('/api/')) {
        try {
            csrfToken = await fetchCsrfToken();
        } catch (e) {
            console.warn('Could not fetch CSRF token, proceeding without it');
        }
    }
    
    return fetch(url, {
        method: 'DELETE',
        headers: buildHeaders(csrfToken),
        credentials: 'same-origin',
    })
    .then(checkStatus)
    .then(response => {
        // DELETE might return 204 No Content
        return response.status === 204 ? {} : parseJSON(response);
    });
};

// Keep for backward compatibility - will be removed once all components are migrated
const httpPostWithCsrfToken = (url, data) =>
    fetch(url, {
        method: 'POST',
        headers: buildHeaders(getCookie('csrftoken')),
        body: JSON.stringify(data),
        credentials: 'same-origin',
    })
        .then(checkStatus)
        .then(parseJSON);

// Export all functions in a single export statement
export { httpGet, httpPost, httpPut, httpDelete, fetchCsrfToken, httpPostWithCsrfToken };