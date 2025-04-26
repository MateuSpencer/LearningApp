import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import FormErrors from '../../components/FormErrors';
import { login } from '../../lib/allauth';
import { useConfig } from '../../auth';
import ProviderList from '../../socialaccount/ProviderList';
import WebAuthnLoginButton from '../../mfa/WebAuthnLoginButton';
import { getCSRFToken } from '../../lib/django';
import init from '../../lib/init';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [response, setResponse] = useState({ fetching: false, content: null });
  const [csrfInitialized, setCsrfInitialized] = useState(false);
  const config = useConfig();
  const hasProviders = config?.data?.socialaccount?.providers?.length > 0;

  // Ensure CSRF protection is initialized
  useEffect(() => {
    init();
    const token = getCSRFToken();
    if (token) {
      setCsrfInitialized(true);
    } else {
      // If token isn't available yet, check again after a short delay
      const timer = setTimeout(() => {
        setCsrfInitialized(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  function submit() {
    // Check if CSRF is initialized
    if (!csrfInitialized) {
      console.warn('CSRF protection not yet initialized, initializing now...');
      init();
    }
    
    setResponse({ ...response, fetching: true });
    login({ email, password }).then((content) => {
      setResponse((r) => { return { ...r, content }; });
    }).catch((e) => {
      console.error(e);
    }).finally(() => {
      setResponse((r) => { return { ...r, fetching: false }; });
    });
  }

  return (
    <div>
      <h1>Login</h1>
      <p>
        No account? <Link href='/account/signup'>Sign up here.</Link>
      </p>

      <FormErrors errors={response.content?.errors} />

      <div><label>Email <input value={email} onChange={(e) => setEmail(e.target.value)} type='email' required /></label>
        <FormErrors param='email' errors={response.content?.errors} />
      </div>
      <div><label>Password: <input value={password} onChange={(e) => setPassword(e.target.value)} type='password' required /></label>
        <Link href='/account/password/reset'>Forgot your password?</Link>
        <FormErrors param='password' errors={response.content?.errors} />
      </div>
      <button disabled={response.fetching || !csrfInitialized} onClick={() => submit()}>Login</button>
      {config?.data?.account?.login_by_code_enabled && (
        <Link href='/account/login/code' className='btn btn-secondary'>
          Send me a sign-in code
        </Link>
      )}
      <WebAuthnLoginButton>Sign in with a passkey</WebAuthnLoginButton>
      {hasProviders && (
        <>
          <h2>Or use a third-party</h2>
          <ProviderList callbackURL='/account/provider/callback' />
        </>
      )}
    </div>
  );
}