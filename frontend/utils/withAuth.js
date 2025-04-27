import { URLs } from '../auth/routing';
import { getAuth } from '../lib/allauth';

/**
 * Server-side authentication check for protected pages
 * Use this with getServerSideProps to protect routes for authenticated users only
 * 
 * @param {Function} gssp - Original getServerSideProps function (optional)
 * @returns {Function} - Enhanced getServerSideProps function with auth check
 */
export function withAuthProtection(gssp) {
  return async (context) => {
    const { req, resolvedUrl } = context;
    
    try {
      // Get auth session from server
      const authResponse = await getAuth({
        headers: {
          cookie: req.headers.cookie || '',
        },
      });
      
      // Check if user is authenticated
      const isAuthenticated = authResponse.status === 200 || 
        (authResponse.status === 401 && authResponse.meta?.is_authenticated);
      
      if (!isAuthenticated) {
        // If not authenticated, redirect to login
        const redirectUrl = `${URLs.LOGIN_URL}?next=${encodeURIComponent(resolvedUrl)}`;
        return {
          redirect: {
            destination: redirectUrl,
            permanent: false,
          },
        };
      }
      
      // If there is a gssp function, call it with the context
      if (gssp) {
        return await gssp(context);
      }
      
      // Otherwise, just return props
      return {
        props: {},
      };
    } catch (error) {
      console.error('Authentication check failed:', error);
      
      // In case of error, redirect to login (safer default)
      return {
        redirect: {
          destination: URLs.LOGIN_URL,
          permanent: false,
        },
      };
    }
  };
}

/**
 * Server-side check for anonymous-only pages
 * Use this with getServerSideProps to ensure only non-authenticated users can access
 * 
 * @param {Function} gssp - Original getServerSideProps function (optional)
 * @returns {Function} - Enhanced getServerSideProps function with auth check
 */
export function withAnonymousProtection(gssp) {
  return async (context) => {
    const { req } = context;
    
    try {
      // Get auth session from server
      const authResponse = await getAuth({
        headers: {
          cookie: req.headers.cookie || '',
        },
      });
      
      // Check if user is authenticated
      const isAuthenticated = authResponse.status === 200 || 
        (authResponse.status === 401 && authResponse.meta?.is_authenticated);
      
      if (isAuthenticated) {
        // If authenticated, redirect to default authenticated page
        return {
          redirect: {
            destination: URLs.LOGIN_REDIRECT_URL,
            permanent: false,
          },
        };
      }
      
      // If there is a gssp function, call it with the context
      if (gssp) {
        return await gssp(context);
      }
      
      // Otherwise, just return props
      return {
        props: {},
      };
    } catch (error) {
      console.error('Authentication check failed:', error);
      
      // In case of error, continue as anonymous (safer default for anonymous pages)
      return {
        props: {},
      };
    }
  };
}