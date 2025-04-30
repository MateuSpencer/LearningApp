import { getCsrfToken } from '../hooks/useCSRF';

/**
 * Parse response as JSON if it has content, otherwise return empty object
 */
const parseJSON = (response) => {
  // Handle 204 No Content responses or empty responses
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return {};
  }
  return response.json();
};

/**
 * Default headers for all requests
 */
const defaultHeaders = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
};

// Store the csrf token once we've retrieved it
let cachedCsrfToken = null;

/**
 * Debug function to log all cookies available
 * Helps identify available cookies for troubleshooting
 */
const debugCookies = () => {
    console.log('All cookies available:', document.cookie);
    const cookieList = document.cookie.split('; ').map(cookie => {
        const parts = cookie.split('=');
        return { name: parts[0], value: parts[1] };
    });
    console.table(cookieList);
};

/**
 * Get CSRF token from DOM (meta tags or form fields)
 * This bypasses HttpOnly cookie restrictions
 */
const getCSRFTokenFromDOM = () => {
    // First check for Django's standard CSRF token in meta tags
    const metaTags = [
        'meta[name="csrf-token"]',
        'meta[name="csrftoken"]',
        'meta[name="csrf_token"]',
        'meta[name="csrf"]'
    ];
    
    for (const selector of metaTags) {
        const metaTag = document.querySelector(selector);
        if (metaTag) {
            const token = metaTag.getAttribute('content');
            console.log(`Found CSRF token in meta tag (${selector}):`, token);
            return token;
        }
    }
    
    // Then check for Django's CSRF token in form fields (common in Django templates)
    const formFields = document.querySelectorAll('input[name="csrfmiddlewaretoken"]');
    if (formFields.length > 0) {
        const token = formFields[0].value;
        console.log('Found CSRF token in form field:', token);
        return token;
    }
    
    // Finally, check for an element with ID 'csrf-token' (sometimes used for passing tokens)
    const csrfElement = document.getElementById('csrf-token');
    if (csrfElement) {
        const token = csrfElement.textContent || csrfElement.getAttribute('data-token');
        if (token) {
            console.log('Found CSRF token in DOM element with ID csrf-token:', token);
            return token;
        }
    }
    
    return null;
};

/**
 * Explicitly fetch the CSRF token from the auth status API
 * This is the most reliable method as it bypasses HttpOnly cookie restrictions
 */
const fetchCsrfTokenFromApi = async () => {
    try {
        console.log('Fetching CSRF token from /api/auth/status/ endpoint...');
        const response = await fetch('/api/auth/status/', {
            credentials: 'include',
            cache: 'no-store'
        });
        
        if (!response.ok) {
            throw new Error(`Failed to fetch CSRF token: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data && data.csrfToken) {
            console.log('Successfully received CSRF token from API:', data.csrfToken.substring(0, 5) + '...');
            cachedCsrfToken = data.csrfToken;
            return data.csrfToken;
        } else {
            console.error('Auth status response did not contain csrfToken:', data);
            throw new Error('CSRF token not found in API response');
        }
    } catch (err) {
        console.error('Error fetching CSRF token from API:', err);
        throw err;
    }
};

/**
 * Ensures that a CSRF token is available and returns it
 * Makes a preflight request to get a token if needed
 * 
 * @returns {Promise<string>} Promise resolving to CSRF token
 */
const ensureCsrfToken = async () => {
    // First, check if we've already cached the token
    if (cachedCsrfToken) {
        console.log('Using cached CSRF token');
        return cachedCsrfToken;
    }
    
    // Then try to get the token from the DOM
    let token = getCSRFTokenFromDOM();
    
    // If not found in DOM, try from cookie (will work only for non-HttpOnly cookies)
    if (!token) {
        token = getCsrfToken();
        if (token) {
            console.log('Found CSRF token in cookie');
            cachedCsrfToken = token;
            return token;
        }
    } else {
        cachedCsrfToken = token;
        return token;
    }
    
    // If no token found locally, explicitly fetch it from the API
    try {
        token = await fetchCsrfTokenFromApi();
        return token;
    } catch (err) {
        console.error('Failed to get CSRF token:', err);
        throw new Error('Unable to obtain CSRF token. Please refresh the page and try again.');
    }
};

/**
 * Builds headers for any request, automatically including CSRF token for non-GET methods
 * 
 * @param {string} method - HTTP method (GET, POST, PUT, DELETE, etc.)
 * @param {string} [token] - Optional CSRF token to use
 * @returns {Object} Headers object with appropriate CSRF token for non-GET requests
 */
const buildHeaders = (method = 'GET', token) => {
    const headers = { ...defaultHeaders };
    
    // Add CSRF token for non-GET requests
    if (method !== 'GET' && token) {
        headers['X-CSRFToken'] = token;
        console.log(`Added CSRF token to ${method} request headers`);
    }
    
    return headers;
};

// The rest of the HTTP utility functions remain unchanged
const checkStatus = (response) => {
    if (response.status >= 200 && response.status < 300) {
        return response;
    }

    const error = new Error(response.statusText || `HTTP Error ${response.status}`);
    error.response = response;
    error.status = response.status;
    
    // Try to parse the error message from the response if possible
    return response.text().then(text => {
        try {
            const data = JSON.parse(text);
            error.data = data;
            error.message = data.detail || data.message || error.message;
        } catch (e) {
            // If the response is not JSON, use the text as the error message
            if (text && text.length < 100) {
                error.message = text;
            }
        }
        throw error;
    }).catch(() => {
        throw error;
    });
};

const httpGet = (url) =>
    fetch(url, {
        headers: buildHeaders('GET'),
        credentials: 'same-origin',
    })
    .then(checkStatus)
    .then(parseJSON);

/**
 * Performs a POST request with automatic CSRF token
 * 
 * @param {string} url - URL to fetch
 * @param {Object} data - Data to send in request body
 * @returns {Promise<Object>} Promise resolving to parsed JSON response
 */
const httpPost = async (url, data) => {
    // Ensure we have a CSRF token before making a POST request
    const token = await ensureCsrfToken();
    
    return fetch(url, {
        method: 'POST',
        headers: buildHeaders('POST', token),
        body: JSON.stringify(data),
        credentials: 'same-origin',
    })
    .then(checkStatus)
    .then(parseJSON);
};

/**
 * Performs a PUT request with automatic CSRF token
 * 
 * @param {string} url - URL to fetch
 * @param {Object} data - Data to send in request body
 * @returns {Promise<Object>} Promise resolving to parsed JSON response
 */
const httpPut = async (url, data) => {
    // Ensure we have a CSRF token before making a PUT request
    const token = await ensureCsrfToken();
    
    return fetch(url, {
        method: 'PUT',
        headers: buildHeaders('PUT', token),
        body: JSON.stringify(data),
        credentials: 'same-origin',
    })
    .then(checkStatus)
    .then(parseJSON);
};

/**
 * Performs a DELETE request with automatic CSRF token
 * 
 * @param {string} url - URL to fetch
 * @returns {Promise<Object>} Promise resolving to parsed JSON response
 */
const httpDelete = async (url) => {
    // Ensure we have a CSRF token before making a DELETE request
    const token = await ensureCsrfToken();
    
    return fetch(url, {
        method: 'DELETE',
        headers: buildHeaders('DELETE', token),
        credentials: 'same-origin',
    })
    .then(checkStatus)
    .then(parseJSON);
};

export { httpGet, httpPost, httpPut, httpDelete };
