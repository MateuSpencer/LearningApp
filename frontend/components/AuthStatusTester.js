import React from 'react';
import useAuthTest from '../utils/useAuthTest';

const AuthStatusTester = () => {
  const { isLoading, isAuthenticated, user, error } = useAuthTest();

  if (isLoading) {
    return <div>Testing authentication...</div>;
  }

  return (
    <div style={{ 
      border: '1px solid #ccc', 
      padding: '15px', 
      margin: '15px 0',
      borderRadius: '4px',
      backgroundColor: isAuthenticated ? '#e6ffe6' : '#ffe6e6'
    }}>
      <h3>Authentication Status</h3>
      <ul>
        <li><strong>Authenticated:</strong> {isAuthenticated ? 'Yes ✅' : 'No ❌'}</li>
        {user && (
          <>
            <li><strong>User ID:</strong> {user.id || 'N/A'}</li>
            <li><strong>Email:</strong> {user.email || 'N/A'}</li>
            <li><strong>Username:</strong> {user.username || 'N/A'}</li>
          </>
        )}
        {error && <li><strong>Error:</strong> {JSON.stringify(error)}</li>}
      </ul>
    </div>
  );
};

export default AuthStatusTester;