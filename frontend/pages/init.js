import { setup } from '../lib/allauth'

export function init() {
  // Adjust this path to match your backend's URL structure
  setup('browser', '/api/allauth', true)
  
  // Or use environment variables for flexibility:
  // const apiBaseUrl = process.env.NEXT_PUBLIC_ALLAUTH_API_URL || '/api/allauth'
  // setup('browser', apiBaseUrl, true)
}