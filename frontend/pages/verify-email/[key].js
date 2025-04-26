import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { getEmailVerification, verifyEmail } from '../../lib/allauth';

export default function VerifyEmail() {
  const router = useRouter();
  const { key } = router.query;
  const [verification, setVerification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [response, setResponse] = useState({ fetching: false, content: null });

  useEffect(() => {
    // Only attempt to verify the email when the key is available
    if (!key) return;

    const fetchVerification = async () => {
      try {
        const resp = await getEmailVerification(key);
        setVerification(resp);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchVerification();
  }, [key]);

  function submit() {
    setResponse({ ...response, fetching: true });
    verifyEmail(key).then((content) => {
      setResponse((r) => { return { ...r, content }; });
      if ([200, 401].includes(content.status)) {
        router.push('/account/email');
      }
    }).catch((e) => {
      console.error(e);
    }).finally(() => {
      setResponse((r) => { return { ...r, fetching: false }; });
    });
  }

  // Show loading state when the key is not yet available or verification is in progress
  if (!key || loading) {
    return (
      <div>
        <h1>Confirm Email Address</h1>
        <p>Verifying your email link...</p>
      </div>
    );
  }

  let body = null;
  if (verification?.status === 200) {
    body = (
      <>
        <p>Please confirm that <a href={'mailto:' + verification.data.email}>{verification.data.email}</a> is an email address for user {verification.data.user.str}.</p>
        <button disabled={response.fetching} onClick={() => submit()}>Confirm</button>
      </>
    );
  } else if (!verification?.data?.email) {
    body = <p>Invalid verification link.</p>;
  } else {
    body = <p>Unable to confirm email <a href={'mailto:' + verification.data.email}>{verification.data.email}</a> because it is already confirmed.</p>;
  }
  
  return (
    <div>
      <h1>Confirm Email Address</h1>
      {body}
    </div>
  );
}