import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import FormErrors from '../../components/FormErrors';
import { signUp } from '../../lib/allauth';
import { useConfig } from '../../auth';
import ProviderList from '../../socialaccount/ProviderList';
import { getCSRFToken, setupCSRFProtection } from '../../lib/django';
import init from '../../lib/init';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password1, setPassword1] = useState('');
  const [password2, setPassword2] = useState('');
  const [password2Errors, setPassword2Errors] = useState([]);
  const [response, setResponse] = useState({ fetching: false, content: null });
  const [csrfInitialized, setCsrfInitialized] = useState(false);
  const [csrfInitializing, setCsrfInitializing] = useState(true);
  const config = useConfig();
  const hasProviders = config?.data?.socialaccount?.providers?.length > 0;

  // Ensure CSRF protection is initialized
  useEffect(() => {
    async function initializeCsrf() {
      console.log('🔑 DEBUG: Initializing CSRF protection');
      
      try {
        // setupCSRFProtection now returns the initialization promise
        const token = await setupCSRFProtection();
        
        if (token) {
          console.log('🔑 DEBUG: CSRF token successfully initialized:', token.substring(0, 5) + '...');
          setCsrfInitialized(true);
        } else {
          console.warn('🔑 DEBUG: Failed to get CSRF token during initialization');
          setCsrfInitialized(false);
        }
      } catch (error) {
        console.error('🔑 DEBUG: Error during CSRF initialization:', error);
        setCsrfInitialized(false);
      } finally {
        setCsrfInitializing(false);
      }
    }

    // Initialize allauth and CSRF protection
    init();
    initializeCsrf();
  }, []);

  // Function to retry CSRF initialization if it failed
  const retryInitialization = async () => {
    setCsrfInitializing(true);
    
    try {
      // setupCSRFProtection returns a promise with the token
      const token = await setupCSRFProtection();
      
      if (token) {
        console.log('🔑 DEBUG: CSRF token successfully initialized on retry:', token.substring(0, 5) + '...');
        setCsrfInitialized(true);
        return true;
      } else {
        console.warn('🔑 DEBUG: Failed to get CSRF token during retry');
        setCsrfInitialized(false);
        return false;
      }
    } catch (error) {
      console.error('🔑 DEBUG: Error during CSRF initialization retry:', error);
      setCsrfInitialized(false);
      return false;
    } finally {
      setCsrfInitializing(false);
    }
  };

  async function submit() {
    if (password2 !== password1) {
      setPassword2Errors([{ param: 'password2', message: 'Password does not match.' }]);
      return;
    }
    
    // Make sure we have a CSRF token before proceeding
    if (!csrfInitialized) {
      // Try one last time to get a token
      console.log('🔑 DEBUG: No CSRF token before submit, trying one last time');
      const success = await retryInitialization();
      
      if (!success) {
        setResponse({ 
          fetching: false, 
          content: { errors: [{ param: 'global', message: 'Security token initialization failed. Please reload the page and try again.' }] } 
        });
        return;
      }
    }
    
    // Get current token (should be available in window.__CSRF_TOKEN__ even if cookie isn't set)
    const token = getCSRFToken();
    console.log('🔑 DEBUG: Token before submission:', token ? `${token.substring(0, 5)}... (length: ${token.length})` : 'None');
    
    setPassword2Errors([]);
    setResponse({ ...response, fetching: true });
    
    try {
      console.log('🔑 DEBUG: Calling signUp function with data');
      const content = await signUp({ 
        email, 
        password: password1 
      });
      console.log('🔑 DEBUG: SignUp response:', content);
      setResponse(r => ({ ...r, content }));
    } catch (e) {
      console.error('🔑 DEBUG: Signup error:', e);
      setResponse(r => ({ 
        ...r, 
        content: { 
          errors: [{ param: 'global', message: 'Failed to register. Please try again or contact support.' }] 
        } 
      }));
    } finally {
      setResponse(r => ({ ...r, fetching: false }));
    }
  }

  return (
    <div>
      <h1>Sign Up</h1>
      <p>
        Already have an account? <Link href='/account/login'>Login here.</Link>
      </p>

      {csrfInitializing && <p>Initializing security... please wait</p>}
      {!csrfInitialized && !csrfInitializing && (
        <div style={{color: 'red', marginBottom: '1rem'}}>
          <p>Security initialization failed. <button onClick={retryInitialization}>Retry</button></p>
        </div>
      )}

      <FormErrors errors={response.content?.errors} />

      <div><label>Email <input value={email} onChange={(e) => setEmail(e.target.value)} type='email' required /></label>
        <FormErrors param='email' errors={response.content?.errors} />
      </div>
      <div><label>Password: <input autoComplete='new-password' value={password1} onChange={(e) => setPassword1(e.target.value)} type='password' required /></label>
        <FormErrors param='password' errors={response.content?.errors} />
      </div>
      <div><label>Password (again): <input value={password2} onChange={(e) => setPassword2(e.target.value)} type='password' required /></label>
        <FormErrors param='password2' errors={password2Errors} />
      </div>
      <button 
        disabled={response.fetching || !csrfInitialized || csrfInitializing} 
        onClick={submit}
      >
        {response.fetching ? 'Signing up...' : 'Sign Up'}
      </button>
      <Link href='/account/signup/passkey'>Sign up using a passkey</Link>

      {hasProviders && (
        <>
          <h2>Or use a third-party</h2>
          <ProviderList callbackURL='/account/provider/callback' />
        </>
      )}
    </div>
  );
}