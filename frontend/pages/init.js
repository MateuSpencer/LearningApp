import { setup } from '../lib/allauth'

export function init() {
  // Default development setup
  setup('browser', '/_allauth/browser/v1', true)
  
  // For production, you might want to use environment variables:
  // const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '/_allauth/browser/v1'
  // setup('browser', apiBaseUrl, true)
}