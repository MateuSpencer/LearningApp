import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import FormErrors from '../../components/FormErrors';
import { requestPasswordReset } from '../../lib/allauth';

export default function RequestPasswordReset() {
  const [email, setEmail] = useState('');
  const [response, setResponse] = useState({ fetching: false, content: null });
  const router = useRouter();

  function submit() {
    setResponse({ ...response, fetching: true });
    requestPasswordReset(email).then((content) => {
      setResponse((r) => { return { ...r, content }; });
      if (content.status === 401) {
        router.push('/account/password/reset/confirm');
      }
    }).catch((e) => {
      console.error(e);
    }).finally(() => {
      setResponse((r) => { return { ...r, fetching: false }; });
    });
  }

  if (response.content?.status === 200) {
    return (
      <div>
        <h1>Reset Password</h1>
        <p>Password reset instructions have been sent to your email.</p>
      </div>
    );
  }

  return (
    <div>
      <h1>Reset Password</h1>
      <p>
        Remember your password? <Link href='/account/login'>Back to login.</Link>
      </p>

      <FormErrors errors={response.content?.errors} />

      <div><label>Email <input value={email} onChange={(e) => setEmail(e.target.value)} type='email' required /></label>
        <FormErrors param='email' errors={response.content?.errors} />
      </div>
      <button disabled={response.fetching} onClick={() => submit()}>Reset</button>
    </div>
  );
}