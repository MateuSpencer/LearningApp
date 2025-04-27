import React, { useState } from 'react';
import useProtectedApiTest from '../utils/useProtectedApiTest';

const ApiTester = ({ defaultEndpoint = '/api/posts/' }) => {
  const [endpoint, setEndpoint] = useState(defaultEndpoint);
  const [testUrl, setTestUrl] = useState(defaultEndpoint);
  const { loading, data, error, status } = useProtectedApiTest(testUrl);

  const handleSubmit = (e) => {
    e.preventDefault();
    setTestUrl(endpoint);
  };

  return (
    <div style={{ 
      border: '1px solid #ccc', 
      padding: '15px', 
      margin: '15px 0',
      borderRadius: '4px',
      backgroundColor: '#f5f5f5'
    }}>
      <h3>Protected API Test</h3>
      <form onSubmit={handleSubmit} style={{ marginBottom: '15px' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input 
            type="text" 
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
            style={{ flex: 1, padding: '5px' }}
            placeholder="Enter API endpoint to test (e.g., /api/posts/)"
          />
          <button 
            type="submit"
            style={{ 
              backgroundColor: '#0070f3', 
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '5px 10px'
            }}
          >
            Test
          </button>
        </div>
      </form>

      {loading ? (
        <div>Testing API endpoint...</div>
      ) : (
        <div style={{ 
          backgroundColor: status === 'success' ? '#e6ffe6' : '#ffe6e6',
          padding: '10px',
          borderRadius: '4px'
        }}>
          <p><strong>Status:</strong> {status === 'success' ? 'Success ✅' : 'Error ❌'}</p>
          
          {error && (
            <div>
              <p><strong>Error:</strong> {error}</p>
              {status === 401 && (
                <p>Authentication error: You need to be logged in to access this API.</p>
              )}
            </div>
          )}
          
          {data && (
            <div>
              <p><strong>Data:</strong></p>
              <pre style={{ 
                overflow: 'auto', 
                backgroundColor: '#f8f8f8', 
                padding: '10px',
                maxHeight: '200px'
              }}>
                {JSON.stringify(data, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ApiTester;