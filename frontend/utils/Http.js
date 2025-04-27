import { getCSRFToken } from '../lib/django';
import { getAuth } from '../lib/allauth';

const parseJSON = (response) => response.json();

const defaultHeaders = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
};

// Build headers with CSRF token from django.js
const buildHeaders = () => {
    const headers = { ...defaultHeaders };
    const csrfToken = getCSRFToken();
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

// Basic HTTP methods that use proper CSRF handling
export const httpGet = (url) =>
    fetch(url, {
        headers: buildHeaders(),
        credentials: 'same-origin',
    })
    .then(checkStatus)
    .then(parseJSON);

export const httpPost = async (url, data) => {
    return fetch(url, {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify(data),
        credentials: 'same-origin',
    })
    .then(checkStatus)
    .then(parseJSON);
};

export const httpPut = async (url, data) => {
    return fetch(url, {
        method: 'PUT',
        headers: buildHeaders(),
        body: JSON.stringify(data),
        credentials: 'same-origin',
    })
    .then(checkStatus)
    .then(parseJSON);
};

export const httpDelete = async (url) => {
    return fetch(url, {
        method: 'DELETE',
        headers: buildHeaders(),
        credentials: 'same-origin',
    })
    .then(checkStatus)
    .then(response => {
        // DELETE might return 204 No Content
        return response.status === 204 ? {} : parseJSON(response);
    });
};