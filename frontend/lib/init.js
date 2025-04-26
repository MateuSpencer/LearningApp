import { setup } from './allauth';
import { setupCSRFProtection } from './django';

export function init() {
  // Skip during SSR
  if (typeof window === 'undefined') return;

  // Setup CSRF protection for all fetch requests
  setupCSRFProtection();

  // Configure allauth client
  const apiUrl = process.env.API_BASE_URL || '/api';
  setup('browser', `${apiUrl}/_allauth/browser/v1`, true);
}

export default init;