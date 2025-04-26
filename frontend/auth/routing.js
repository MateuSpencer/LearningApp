import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useAuthChange, AuthChangeEvent, useAuthStatus } from './hooks';
import { Flows, AuthenticatorType } from '../lib/allauth';

export const URLs = Object.freeze({
  LOGIN_URL: '/account/login',
  LOGIN_REDIRECT_URL: '/calculator',
  LOGOUT_REDIRECT_URL: '/'
});

const flow2path = {};
flow2path[Flows.LOGIN] = '/account/login';
flow2path[Flows.LOGIN_BY_CODE] = '/account/login/code/confirm';
flow2path[Flows.SIGNUP] = '/account/signup';
flow2path[Flows.VERIFY_EMAIL] = '/account/verify-email';
flow2path[Flows.PASSWORD_RESET_BY_CODE] = '/account/password/reset/confirm';
flow2path[Flows.PROVIDER_SIGNUP] = '/account/provider/signup';
flow2path[Flows.REAUTHENTICATE] = '/account/reauthenticate';
flow2path[Flows.MFA_TRUST] = '/account/2fa/trust';
flow2path[`${Flows.MFA_AUTHENTICATE}:${AuthenticatorType.TOTP}`] = '/account/authenticate/totp';
flow2path[`${Flows.MFA_AUTHENTICATE}:${AuthenticatorType.RECOVERY_CODES}`] = '/account/authenticate/recovery-codes';
flow2path[`${Flows.MFA_AUTHENTICATE}:${AuthenticatorType.WEBAUTHN}`] = '/account/authenticate/webauthn';
flow2path[`${Flows.MFA_REAUTHENTICATE}:${AuthenticatorType.TOTP}`] = '/account/reauthenticate/totp';
flow2path[`${Flows.MFA_REAUTHENTICATE}:${AuthenticatorType.RECOVERY_CODES}`] = '/account/reauthenticate/recovery-codes';
flow2path[`${Flows.MFA_REAUTHENTICATE}:${AuthenticatorType.WEBAUTHN}`] = '/account/reauthenticate/webauthn';
flow2path[Flows.MFA_WEBAUTHN_SIGNUP] = '/account/signup/passkey/create';

export function pathForFlow(flow, typ) {
  let key = flow.id;
  if (typeof flow.types !== 'undefined') {
    typ = typ ?? flow.types[0];
    key = `${key}:${typ}`;
  }
  const path = flow2path[key] ?? flow2path[flow.id];
  if (!path) {
    throw new Error(`Unknown path for flow: ${flow.id}`);
  }
  return path;
}

export function pathForPendingFlow(auth) {
  const flow = auth.data.flows.find(flow => flow.is_pending);
  if (flow) {
    return pathForFlow(flow);
  }
  return null;
}

function navigateToPendingFlow(auth, router) {
  const path = pathForPendingFlow(auth);
  if (path) {
    router.push(path);
    return true;
  }
  return false;
}

export function AuthenticatedRoute({ children }) {
  const router = useRouter();
  const [, status] = useAuthStatus();
  
  useEffect(() => {
    if (!status.isAuthenticated) {
      const currentPath = router.asPath;
      const next = `next=${encodeURIComponent(currentPath)}`;
      router.push(`${URLs.LOGIN_URL}?${next}`);
    }
  }, [status.isAuthenticated, router]);

  if (!status.isAuthenticated) {
    return null;
  }
  
  return children;
}

export function AnonymousRoute({ children }) {
  const router = useRouter();
  const [, status] = useAuthStatus();
  
  useEffect(() => {
    if (status.isAuthenticated) {
      router.push(URLs.LOGIN_REDIRECT_URL);
    }
  }, [status.isAuthenticated, router]);

  if (status.isAuthenticated) {
    return null;
  }
  
  return children;
}

export function AuthChangeRedirector() {
  const [auth, event] = useAuthChange();
  const router = useRouter();
  
  useEffect(() => {
    if (!event) return;
    
    switch (event) {
      case AuthChangeEvent.LOGGED_OUT:
        router.push(URLs.LOGOUT_REDIRECT_URL);
        break;
      case AuthChangeEvent.LOGGED_IN:
        router.push(URLs.LOGIN_REDIRECT_URL);
        break;
      case AuthChangeEvent.REAUTHENTICATED:
        {
          const params = new URLSearchParams(window.location.search);
          const next = params.get('next') || '/';
          router.push(next);
        }
        break;
      case AuthChangeEvent.REAUTHENTICATION_REQUIRED:
        {
          const currentPath = router.asPath;
          const next = `next=${encodeURIComponent(currentPath)}`;
          const path = pathForFlow(auth.data.flows[0]);
          router.push({
            pathname: path,
            query: { next: encodeURIComponent(currentPath) },
          }, undefined, { 
            shallow: true,
            state: { reauth: auth }
          });
        }
        break;
      case AuthChangeEvent.FLOW_UPDATED:
        const redirected = navigateToPendingFlow(auth, router);
        if (!redirected) {
          console.error('No pending flow to navigate to');
        }
        break;
      default:
        break;
    }
  }, [event, auth, router]);

  return null;
}
