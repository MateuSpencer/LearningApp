import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useConfig, useAuth } from '../../../auth/hooks';
import { verifyEmail, getEmailVerification } from '../../../lib/allauth';

export default function VerifyEmail() {
  const router = useRouter();
  const { key } = router.query;
  const [auth] = useAuth();
  const [config] = useConfig();
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  // If there's a key in the URL, this is a verification attempt
  // Otherwise, this is just the verification info page
  useEffect(() => {
    if (!key) return;
    
    async function verifyEmailWithKey() {
      try {
        setStatus('loading');
        const result = await verifyEmail({ key });
        
        if (result.status === 200) {
          setStatus('success');
          setMessage(result.detail || 'Your email has been successfully verified!');
          
          // Redirect to home page after successful verification (optional)
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

  // If this is just the verification info page (no key)
  if (!key) {
    return (
      <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">Verify Your Email</h1>
        <p className="mb-4">
          We've sent a verification email to your email address. Please check your
          inbox and click on the verification link to complete the registration process.
        </p>
        <p className="mb-4">
          If you don't see the email in your inbox, please check your spam folder.
        </p>
      </div>
    );
  }

  // If this is a verification attempt with a key
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