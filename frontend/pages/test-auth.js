import React from 'react';
import AuthStatusTester from '../components/AuthStatusTester';
import ApiTester from '../components/ApiTester';
import { withAuthProtection } from '../utils/withAuth';

// This page is protected, so only authenticated users can access it
export const getServerSideProps = withAuthProtection();

const TestAuthPage = () => {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1>Authentication Integration Test</h1>
      
      <p>
        This page tests the integration between your Next.js frontend and Django backend.
        If you can see this page, server-side authentication protection is working!
      </p>
      
      <hr style={{ margin: '20px 0' }} />
      
      <h2>1. Authentication Status</h2>
      <p>This tests if you're properly authenticated with the Django backend:</p>
      <AuthStatusTester />
      
      <h2>2. Protected API Access</h2>
      <p>This tests if your API calls include proper authentication:</p>
      <ApiTester defaultEndpoint="/api/posts/" />
      
      <h2>How to use these tests</h2>
      <ul>
        <li>The Authentication Status panel should show you as authenticated (green)</li>
        <li>The Protected API Access panel should successfully retrieve data from your API</li>
        <li>Try different API endpoints in the input field to test other API routes</li>
        <li>Try logging out and accessing this page again - you should be redirected to login</li>
      </ul>
      
      <p>
        <strong>Note:</strong> If you're seeing errors, check your browser's network tab and console
        for more detailed information about what might be going wrong.
      </p>
    </div>
  );
};

export default TestAuthPage;