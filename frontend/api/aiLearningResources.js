/**
 * API service for AI Learning Resources
 */

const API_BASE_URL = '/api/learning-resources/ai-suggestions';

/**
 * Get CSRF token from the DOM
 */
const getCSRFToken = () => {
    return document.querySelector('[name=csrfmiddlewaretoken]')?.value || 
           document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ||
           '';
};

/**
 * Base fetch wrapper with common headers and error handling
 */
const apiFetch = async (url, options = {}) => {
    const defaultHeaders = {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCSRFToken(),
    };

    const response = await fetch(url, {
        credentials: 'include',
        headers: {
            ...defaultHeaders,
            ...options.headers,
        },
        ...options,
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
};

/**
 * Add an AI suggestion to learning resources
 */
export const addSuggestionToResources = async (suggestionId) => {
    return apiFetch(`${API_BASE_URL}/${suggestionId}/add_to_resources/`, {
        method: 'POST',
    });
};

/**
 * Generate AI suggestions for an article
 */
export const generateAISuggestions = async (pageSlug, articleTitle = '', count = 5) => {
    return apiFetch(`${API_BASE_URL}/generate_for_article/`, {
        method: 'POST',
        body: JSON.stringify({
            page_slug: pageSlug,
            article_title: articleTitle,
            count,
        }),
    });
};

/**
 * Find more AI suggestions for an article
 */
export const findMoreSuggestions = async (pageSlug, articleTitle = '', count = 3) => {
    return apiFetch(`${API_BASE_URL}/find_more/`, {
        method: 'POST',
        body: JSON.stringify({
            page_slug: pageSlug,
            article_title: articleTitle,
            count,
        }),
    });
};

/**
 * Clean up suggestions that already exist as resources
 */
export const cleanupSuggestions = async (pageSlug) => {
    return apiFetch(`${API_BASE_URL}/cleanup_for_page/`, {
        method: 'POST',
        body: JSON.stringify({
            page_slug: pageSlug,
        }),
    });
};

/**
 * Get statistics about suggestions for a page
 */
export const getSuggestionStats = async (pageSlug) => {
    return apiFetch(`${API_BASE_URL}/stats_for_page/?page_slug=${encodeURIComponent(pageSlug)}`, {
        method: 'GET',
    });
};

/**
 * Get AI suggestions for a page with filtering
 */
export const getAISuggestions = async (pageSlug, isAdded = false, filterExisting = true) => {
    const params = new URLSearchParams({
        page_slug: pageSlug,
        is_added: isAdded.toString(),
        filter_existing: filterExisting.toString(),
    });
    
    return apiFetch(`${API_BASE_URL}/?${params}`, {
        method: 'GET',
    });
};
