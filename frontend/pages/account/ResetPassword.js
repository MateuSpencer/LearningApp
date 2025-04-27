import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import FormErrors from '../../components/FormErrors'
import { getPasswordReset, resetPassword } from '../../lib/allauth'
import Button from '../../components/Button'

// In Next.js, we'll use getServerSideProps instead of the React Router loader
export async function getServerSideProps(context) {
  const { key } = context.query;
  if (key) {
    try {
      const resp = await getPasswordReset(key);
      return {
        props: {
          resetKey: key,
          resetKeyResponse: resp
        }
      };
    } catch (error) {
      console.error("Error fetching password reset data:", error);
      return { props: {} };
    }
  }
  
  // Check if we have query params for resetKey (for code flow)
  const { resetKey, resetKeyResponse } = context.query;
  if (resetKey && resetKeyResponse) {
    return {
      props: {
        resetKey,
        resetKeyResponse: JSON.parse(resetKeyResponse)
      }
    };
  }
  
  return { props: {} };
}

export default function ResetPassword({ resetKey, resetKeyResponse }) {
  const [password1, setPassword1] = useState('')
  const [password2, setPassword2] = useState('')
  const [password2Errors, setPassword2Errors] = useState([])
  const [response, setResponse] = useState({ fetching: false, content: null })
  const router = useRouter()
  
  // Handle redirects with useEffect
  useEffect(() => {
    // Redirect if we don't have required props and came from code flow
    if (!resetKey && !resetKeyResponse && router.pathname.includes('complete')) {
      router.push('/account/password/reset')
    }
    
    // Redirect after successful password reset
    if ([200, 401].includes(response.content?.status)) {
      router.push('/account/login')
    }
  }, [resetKey, resetKeyResponse, response.content?.status, router])

  function submit() {
    if (password2 !== password1) {
      setPassword2Errors([{ param: 'password2', message: 'Password does not match.' }])
      return
    }
    setPassword2Errors([])
    setResponse({ ...response, fetching: true })
    resetPassword({ key: resetKey, password: password1 }).then((resp) => {
      setResponse((r) => { return { ...r, content: resp } })
    }).catch((e) => {
      console.error(e)
      window.alert(e)
    }).then(() => {
      setResponse((r) => { return { ...r, fetching: false } })
    })
  }

  let body
  if (resetKeyResponse?.status !== 200) {
    body = <FormErrors param='key' errors={resetKeyResponse?.errors} />
  } else if (response.content?.errors?.filter(e => e.param === 'key')) {
    body = <FormErrors param='key' errors={response.content?.errors} />
  } else {
    body = (
      <>
        <div><label>Password: <input autoComplete='new-password' value={password1} onChange={(e) => setPassword1(e.target.value)} type='password' required /></label>
          <FormErrors param='password' errors={response.content?.errors} />
        </div>
        <div><label>Password (again): <input value={password2} onChange={(e) => setPassword2(e.target.value)} type='password' required /></label>
          <FormErrors param='password2' errors={password2Errors} />
        </div>

        <Button disabled={response.fetching} onClick={() => submit()}>Reset</Button>
      </>
    )
  }

  return (
    <div>
      <h1>Reset Password</h1>
      <p>
        Remember your password? <Link href='/account/login'>Back to login.</Link>
      </p>
      {body}
    </div>
  )
}
