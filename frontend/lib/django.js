/**
 * Utilities for interacting with Django backend, particularly CSRF token handling
 * with support for both client and server-side rendering in Next.js
 */

/**
 * Gets the CSRF token from cookies for use in AJAX requests
 * Works on both client and server side in Next.js
 */
export function getCSRFToken() {
  if (typeof window === 'undefined') {
    // Server-side rendering - return placeholder
    // The actual token will be obtained on the client side
    return '';
  }

  // Client-side rendering
  function getCookieValue(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return '';
  }

  // Look for Django's CSRF cookie
  return getCookieValue('csrftoken') || '';
}

/**
 * Sets up CSRF protection for all AJAX requests
 * Should be called during app initialization
 */
export function setupCSRFProtection() {
  if (typeof window === 'undefined') {
    return; // No need on server side
  }

  // Add CSRF token to all fetch requests
  const originalFetch = window.fetch;
  window.fetch = function(url, options = {}) {
    // Only add CSRF token to same-origin requests
    const sameOrigin = url.startsWith('/') || url.startsWith(window.location.origin);
    
    if (sameOrigin && options.method && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(options.method.toUpperCase())) {
      options.headers = options.headers || {};
      
      // Don't override if already set
      if (!options.headers['X-CSRFToken']) {
        options.headers['X-CSRFToken'] = getCSRFToken();
      }
    }
    
    return originalFetch(url, options);
  };
}

/**
 * Gets CSRF middleware token from the DOM for form submissions
 * Falls back to cookie value if not found in DOM
 */
export function getCSRFMiddlewareToken() {
  if (typeof window === 'undefined') {
    return ''; // Server-side rendering - placeholder
  }
  
  // Try to find the token in a hidden input (Django's common pattern)
  const tokenElement = document.querySelector('input[name="csrfmiddlewaretoken"]');
  if (tokenElement) {
    return tokenElement.value;
  }
  
  // Fall back to cookie
  return getCSRFToken();
}