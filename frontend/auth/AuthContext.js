import { useEffect, createContext, useState } from 'react';
import { getAuth, getConfig } from '../lib/allauth';
import { setupCSRFProtection } from '../lib/django';

export const AuthContext = createContext(null);

function Loading() {
  return <div>Starting...</div>;
}

function LoadingError() {
  return <div>Loading error!</div>;
}

export function AuthContextProvider({ children }) {
  const [auth, setAuth] = useState(undefined);
  const [config, setConfig] = useState(undefined);
  const [event, setEvent] = useState(null);

  useEffect(() => {
    // Skip during SSR
    if (typeof window === 'undefined') return;

    // Setup CSRF protection
    setupCSRFProtection();

    function onAuthChanged(e) {
      setAuth(auth => {
        if (typeof auth === 'undefined') {
          console.log('Authentication status loaded');
        } else {
          console.log('Authentication status updated');
        }
        return e.detail;
      });
      // Set the event type to trigger redirects
      setEvent(e.detail?.meta?.is_authenticated ? 'LOGGED_IN' : 'LOGGED_OUT');
    }

    document.addEventListener('allauth.auth.change', onAuthChanged);
    
    // Initial auth and config fetch
    getAuth()
      .then(data => setAuth(data))
      .catch((e) => {
        console.error(e);
        setAuth(false);
      });
      
    getConfig()
      .then(data => setConfig(data))
      .catch((e) => {
        console.error(e);
      });
      
    return () => {
      document.removeEventListener('allauth.auth.change', onAuthChanged);
    };
  }, []);

  // Reset event after it's been processed
  useEffect(() => {
    if (event) {
      const timer = setTimeout(() => setEvent(null), 100);
      return () => clearTimeout(timer);
    }
  }, [event]);

  const loading = (typeof auth === 'undefined') || config?.status !== 200;
  
  return (
    <AuthContext.Provider value={{ auth, config, event }}>
      {loading
        ? <Loading />
        : (auth === false
            ? <LoadingError />
            : children)}
    </AuthContext.Provider>
  );
}
