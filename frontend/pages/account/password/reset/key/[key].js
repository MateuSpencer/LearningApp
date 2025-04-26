import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import FormErrors from '../../../../components/FormErrors';
import { getPasswordReset, resetPassword } from '../../../../lib/allauth';

export default function ResetPasswordByKey() {
  const [password1, setPassword1] = useState('');
  const [password2, setPassword2] = useState('');
  const [password2Errors, setPassword2Errors] = useState([]);
  const [response, setResponse] = useState({ fetching: false, content: null });
  const [resetKeyResponse, setResetKeyResponse] = useState({ status: 'loading' });
  const router = useRouter();
  const { key } = router.query;

  useEffect(() => {
    // Only attempt to get the password reset when the key is available
    if (!key) return;

    const verifyResetKey = async () => {
      try {
        const resp = await getPasswordReset(key);
        setResetKeyResponse(resp);
      } catch (e) {
        console.error(e);
        setResetKeyResponse({ status: 'error', errors: [{ message: 'Invalid or expired reset key' }] });
      }
    };

    verifyResetKey();
  }, [key]);

  function submit() {
    if (password2 !== password1) {
      setPassword2Errors([{ param: 'password2', message: 'Password does not match.' }]);
      return;
    }
    setPassword2Errors([]);
    setResponse({ ...response, fetching: true });
    resetPassword({ key, password: password1 }).then((resp) => {
      setResponse((r) => { return { ...r, content: resp }; });
      if ([200, 401].includes(resp.status)) {
        router.push('/account/login');
      }
    }).catch((e) => {
      console.error(e);
    }).finally(() => {
      setResponse((r) => { return { ...r, fetching: false }; });
    });
  }

  // Show loading state
  if (!key || resetKeyResponse.status === 'loading') {
    return (
      <div>
        <h1>Reset Password</h1>
        <p>Verifying your password reset link...</p>
      </div>
    );
  }

  let body;
  if (resetKeyResponse.status !== 200) {
    body = <FormErrors errors={resetKeyResponse.errors || [{ message: 'Invalid or expired reset key' }]} />;
  } else if (response.content?.errors?.filter(e => e.param === 'key')) {
    body = <FormErrors param='key' errors={response.content?.errors} />;
  } else {
    body = (
      <>
        <div><label>Password: <input autoComplete='new-password' value={password1} onChange={(e) => setPassword1(e.target.value)} type='password' required /></label>
          <FormErrors param='password' errors={response.content?.errors} />
        </div>
        <div><label>Password (again): <input value={password2} onChange={(e) => setPassword2(e.target.value)} type='password' required /></label>
          <FormErrors param='password2' errors={password2Errors} />
        </div>

        <button disabled={response.fetching} onClick={() => submit()}>Reset</button>
      </>
    );
  }

  return (
    <div>
      <h1>Reset Password</h1>
      <p>
        Remember your password? <Link href='/account/login'>Back to login.</Link>
      </p>
      {body}
    </div>
  );
}