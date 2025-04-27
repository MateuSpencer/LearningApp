import { useEffect, useState } from 'react';
import { httpGet } from './Http';

/**
 * A hook to test if API calls are correctly authenticated
 * @param {string} endpoint - The API endpoint to test
 * @returns Object with loading, data, and error states
 */
export const useProtectedApiTest = (endpoint) => {
  const [state, setState] = useState({
    loading: true,
    data: null,
    error: null,
    status: null
  });

  useEffect(() => {
    const testApi = async () => {
      try {
        const data = await httpGet(endpoint);
        setState({
          loading: false,
          data,
          error: null,
          status: 'success'
        });
      } catch (error) {
        setState({
          loading: false,
          data: null,
          error: error.message || 'Error accessing protected API',
          status: error.status || 'error'
        });
      }
    };

    if (endpoint) {
      testApi();
    }
  }, [endpoint]);

  return state;
};

export default useProtectedApiTest;