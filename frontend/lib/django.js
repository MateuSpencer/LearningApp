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
    return '';
  }

  // Get token from memory first (for cases where cookie isn't set but we have a token)
  if (window.__CSRF_TOKEN__) {
    return window.__CSRF_TOKEN__;
  }

  // Simple cookie getter
  function getCookieValue(name) {
    if (document.cookie && document.cookie !== '') {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        // Does this cookie string begin with the name we want?
        if (cookie.substring(0, name.length + 1) === (name + '=')) {
          return decodeURIComponent(cookie.substring(name.length + 1));
        }
      }
    }
    return '';
  }

  // This gets the CSRF token from the cookie
  return getCookieValue('csrftoken');
}

/**
 * Sets up CSRF protection for all AJAX requests
 * Should be called during app initialization
 */
export function setupCSRFProtection() {
  if (typeof window === 'undefined') {
    return; // No need on server side
  }

  console.log('🔒 DEBUG: Setting up CSRF protection');

  // Fetch a CSRF token and store it for use in requests
  const fetchCSRFToken = async () => {
    console.log('🔒 DEBUG: Fetching CSRF token from server');
    
    try {
      // Make a GET request to fetch a token
      const response = await fetch('/api/auth/csrf-token/', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store'
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('🔒 DEBUG: Received token from server:', data.csrfToken ? 'Valid token' : 'No token');
        
        // Store token in global variable for immediate use
        if (data && data.csrfToken) {
          window.__CSRF_TOKEN__ = data.csrfToken;
          console.log('🔒 DEBUG: Stored token in memory for requests', data.csrfToken.substring(0, 5) + '...');
          return data.csrfToken;
        }
      } else {
        console.warn('🔒 DEBUG: Failed to fetch CSRF token, status:', response.status);
      }
    } catch (error) {
      console.error('🔒 DEBUG: Error fetching CSRF token:', error);
    }
    
    return null;
  };

  // Patch the fetch function to include the CSRF token in headers
  const patchFetch = () => {
    const originalFetch = window.fetch;
    
    window.fetch = async function(url, options = {}) {
      options = options || {};
      options.headers = options.headers || {};
      
      // Only add CSRF token to same-origin POST, PUT, PATCH, DELETE requests
      const sameOrigin = url.startsWith('/') || url.startsWith(window.location.origin);
      const needsToken = sameOrigin && 
                       (options.method && 
                       ['POST', 'PUT', 'PATCH', 'DELETE'].includes(options.method.toUpperCase()));
      
      if (needsToken) {
        // Get token from either cookie or memory
        let token = getCSRFToken();
        
        // If no token available, try to fetch it
        if (!token) {
          console.log('🔒 DEBUG: No token found, fetching new one before request');
          token = await fetchCSRFToken();
        }
        
        if (token) {
          console.log(`🔒 DEBUG: Adding CSRF token to ${options.method} request to ${url}`, token.substring(0, 5) + '...');
          options.headers['X-CSRFToken'] = token;
        } else {
          console.warn('🔒 DEBUG: No CSRF token available for request');
        }
      }
      
      // Always include credentials for API requests
      if (sameOrigin && !options.credentials) {
        options.credentials = 'include';
      }
      
      return originalFetch(url, options);
    };
    
    console.log('🔒 DEBUG: Patched fetch to include CSRF tokens');
  };

  // Initialize
  const init = async () => {
    // Get token once and store it in memory
    const token = await fetchCSRFToken();
    
    // Create a global memory token holder
    window.__CSRF_TOKEN__ = token;
    
    // Set up the patched fetch function
    patchFetch();
    
    console.log('🔒 DEBUG: CSRF protection setup complete');
    return token;
  };
  
  // Run initialization and return the promise
  return init();
}