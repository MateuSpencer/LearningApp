import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuthChange, AuthChangeEvent, useAuthStatus } from './hooks'
import { Flows, AuthenticatorType } from '../lib/allauth'

// Central configuration for authentication URLs
export const URLs = Object.freeze({
  LOGIN_URL: '/account/login',
  LOGIN_REDIRECT_URL: '/my-posts', // Redirect to My Posts after login
  LOGOUT_REDIRECT_URL: '/',
  DEFAULT_PROTECTED_FAILURE_URL: '/account/login', // Default URL for authentication failures
  DEFAULT_ANONYMOUS_FAILURE_URL: '/my-posts' // Default URL for when authenticated users try to access anonymous-only pages
})

// Define paths for each flow type
const flow2path = {}
flow2path[Flows.LOGIN] = '/account/login'
flow2path[Flows.LOGIN_BY_CODE] = '/account/login/code/confirm'
flow2path[Flows.SIGNUP] = '/account/signup'
flow2path[Flows.VERIFY_EMAIL] = '/account/verify-email'
flow2path[Flows.PASSWORD_RESET_BY_CODE] = '/account/password/reset/confirm'
flow2path[Flows.PROVIDER_SIGNUP] = '/account/provider/signup'
flow2path[Flows.REAUTHENTICATE] = '/account/reauthenticate'
flow2path[Flows.MFA_TRUST] = '/account/2fa/trust'
flow2path[`${Flows.MFA_AUTHENTICATE}:${AuthenticatorType.TOTP}`] = '/account/authenticate/totp'
flow2path[`${Flows.MFA_AUTHENTICATE}:${AuthenticatorType.RECOVERY_CODES}`] = '/account/authenticate/recovery-codes'
flow2path[`${Flows.MFA_AUTHENTICATE}:${AuthenticatorType.WEBAUTHN}`] = '/account/authenticate/webauthn'
flow2path[`${Flows.MFA_REAUTHENTICATE}:${AuthenticatorType.TOTP}`] = '/account/reauthenticate/totp'
flow2path[`${Flows.MFA_REAUTHENTICATE}:${AuthenticatorType.RECOVERY_CODES}`] = '/account/reauthenticate/recovery-codes'
flow2path[`${Flows.MFA_REAUTHENTICATE}:${AuthenticatorType.WEBAUTHN}`] = '/account/reauthenticate/webauthn'
flow2path[Flows.MFA_WEBAUTHN_SIGNUP] = '/account/signup/passkey/create'

export function pathForFlow(flow, typ) {
  let key = flow.id
  if (typeof flow.types !== 'undefined') {
    typ = typ ?? flow.types[0]
    key = `${key}:${typ}`
  }
  const path = flow2path[key] ?? flow2path[flow.id]
  if (!path) {
    throw new Error(`Unknown path for flow: ${flow.id}`)
  }
  return path
}

export function pathForPendingFlow(auth) {
  const flow = auth?.data?.flows?.find(flow => flow.is_pending)
  if (flow) {
    return pathForFlow(flow)
  }
  return null
}

// Next.js version of AuthenticatedRoute
export function AuthenticatedRoute({ children }) {
  const router = useRouter()
  const [, status] = useAuthStatus()
  
  useEffect(() => {
    if (!status.isAuthenticated && !status.isLoading) {
      const next = `next=${encodeURIComponent(router.asPath)}`
      router.push(`${URLs.LOGIN_URL}?${next}`)
    }
  }, [router, status.isAuthenticated, status.isLoading])
  
  if (status.isLoading) {
    return <div>Loading authentication status...</div>
  }
  
  return status.isAuthenticated ? children : null
}

// Next.js version of AnonymousRoute
export function AnonymousRoute({ children }) {
  const router = useRouter()
  const [, status] = useAuthStatus()
  
  useEffect(() => {
    if (status.isAuthenticated && !status.isLoading) {
      router.push(URLs.LOGIN_REDIRECT_URL)
    }
  }, [router, status.isAuthenticated, status.isLoading])
  
  if (status.isLoading) {
    return <div>Loading authentication status...</div>
  }
  
  return !status.isAuthenticated ? children : null
}

// Next.js version of AuthChangeRedirector
export function AuthChangeRedirector({ children }) {
  const router = useRouter()
  const [auth, event] = useAuthChange()
  
  useEffect(() => {
    if (!event) return

    switch (event) {
      case AuthChangeEvent.LOGGED_OUT:
        router.push(URLs.LOGOUT_REDIRECT_URL)
        break
      case AuthChangeEvent.LOGGED_IN:
        // Prioritize the 'next' parameter if available
        const nextUrl = router.query.next || URLs.LOGIN_REDIRECT_URL
        router.push(nextUrl)
        break
      case AuthChangeEvent.REAUTHENTICATED: {
        const next = router.query.next || '/'
        router.push(next)
        break
      }
      case AuthChangeEvent.REAUTHENTICATION_REQUIRED: {
        const next = `next=${encodeURIComponent(router.asPath)}`
        const path = pathForFlow(auth.data.flows[0])
        router.push(`${path}?${next}`)
        break
      }
      case AuthChangeEvent.FLOW_UPDATED: {
        const pendingPath = pathForPendingFlow(auth)
        if (pendingPath) {
          router.push(pendingPath)
        }
        break
      }
      default:
        break
    }
  }, [router, auth, event])
  
  return children
}