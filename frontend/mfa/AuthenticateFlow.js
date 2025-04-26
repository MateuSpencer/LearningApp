import { useRouter } from 'next/router';
import Link from 'next/link';
import { useEffect } from 'react';
import { pathForFlow } from '../auth';
import { Flows, AuthenticatorType } from '../lib/allauth';
import { useAuthInfo } from '../auth/hooks';

const labels = {};
labels[AuthenticatorType.TOTP] = 'Use your authenticator app';
labels[AuthenticatorType.RECOVERY_CODES] = 'Use a recovery code';
labels[AuthenticatorType.WEBAUTHN] = 'Use security key';

export default function AuthenticateFlow(props) {
  const router = useRouter();
  const authInfo = useAuthInfo();

  useEffect(() => {
    if (authInfo?.pendingFlow?.id !== Flows.MFA_AUTHENTICATE) {
      router.push('/');
    }
  }, [authInfo, router]);

  if (authInfo?.pendingFlow?.id !== Flows.MFA_AUTHENTICATE) {
    return null; // Will redirect in useEffect
  }
  
  const flow = authInfo.pendingFlow;

  return (
    <section>
      <h1>Two-Factor Authentication</h1>
      <p>
        Your account is protected by two-factor authentication.
      </p>
      {props.children}

      {flow.types.length > 1 && (
        <>
          <h2>Alternative Options</h2>
          <ul>
            {flow.types.map(typ => (
              <li key={typ}>
                <Link href={pathForFlow(flow, typ)} replace>
                  {labels[typ]}
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
