// Service for handling CSRF tokens
import { getCsrfToken } from '../hooks/useCSRF';

/**
 * Fetch the CSRF token synchronously
 * Re-exports the function from useCSRF hook
 * 
 * @returns {string|null} The CSRF token or null if not found
 */
export { getCsrfToken };

export default { fetchCsrfToken: getCsrfToken };
