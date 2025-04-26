import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { verifyEmail } from '../../../lib/allauth';

// This page handles the verification link that users click in their emails
// URL pattern: /account/verify-email/[key]
export default function VerifyEmailWithKey() {
  const router = useRouter();
  const { key } = router.query;
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Only attempt verification if we have a key and we're on the client
    if (!key || typeof window === 'undefined') return;
    
    async function verifyEmailWithKey() {
      try {
        setStatus('loading');
        console.log('Verifying email with key:', key);
        
        const result = await verifyEmail({ key });
        
        if (result.status === 200) {
          setStatus('success');
          setMessage(result.detail || 'Your email has been successfully verified!');
          
          // Redirect to account page after successful verification
          setTimeout(() => {
            router.push('/account');
          }, 3000);
        } else {
          setStatus('error');
          setMessage(result.detail || 'Email verification failed.');
        }
      } catch (error) {
        setStatus('error');
        setMessage('An error occurred during verification. Please try again.');
        console.error('Email verification error:', error);
      }
    }
    
    verifyEmailWithKey();
  }, [key, router]);

  // Show a loading state if the key isn't available yet
  if (!key) {
    return (
      <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">Email Verification</h1>
        <p>Loading verification...</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-4">Email Verification</h1>
      
      {status === 'loading' && (
        <p className="text-gray-600">Verifying your email...</p>
      )}
      
      {status === 'success' && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          <p>{message}</p>
          <p className="mt-2">Redirecting you to your account page...</p>
        </div>
      )}
      
      {status === 'error' && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{message}</p>
          <p className="mt-2">
            Please try again or contact support if the problem persists.
          </p>
        </div>
      )}
    </div>
  );
}