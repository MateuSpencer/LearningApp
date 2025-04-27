import { useEffect, useState } from 'react';
import { getAuth } from '../lib/allauth';

/**
 * A hook to test authentication status with the backend
 * Use this to verify that authentication is working correctly
 */
export const useAuthTest = () => {
  const [status, setStatus] = useState({
    isLoading: true,
    isAuthenticated: false,
    user: null,
    error: null
  });

  useEffect(() => {
    const testAuth = async () => {
      try {
        const authResponse = await getAuth();
        
        if (authResponse.status === 200) {
          setStatus({
            isLoading: false,
            isAuthenticated: true,
            user: authResponse.data.user,
            error: null
          });
          console.log('Authentication successful:', authResponse.data.user);
        } else if (authResponse.status === 401 && authResponse.meta?.is_authenticated) {
          // This case handles when the user is authenticated but needs additional verification
          setStatus({
            isLoading: false,
            isAuthenticated: true,
            user: authResponse.data?.user || null,
            error: 'Additional verification required'
          });
          console.log('User authenticated but needs additional verification');
        } else {
          setStatus({
            isLoading: false,
            isAuthenticated: false,
            user: null,
            error: authResponse.errors || 'Not authenticated'
          });
          console.log('Not authenticated', authResponse);
        }
      } catch (error) {
        setStatus({
          isLoading: false,
          isAuthenticated: false,
          user: null,
          error: error.message
        });
        console.error('Authentication test failed:', error);
      }
    };

    testAuth();
  }, []);

  return status;
};

export default useAuthTest;