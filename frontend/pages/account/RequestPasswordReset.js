import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import FormErrors from '../../components/FormErrors'
import { requestPasswordReset, Flows } from '../../lib/allauth'
import Button from '../../components/Button'

export default function RequestPasswordReset () {
  const [email, setEmail] = useState('')
  const [response, setResponse] = useState({ fetching: false, content: null })
  const router = useRouter()
  
  // Handle redirects with useEffect instead of Navigate
  useEffect(() => {
    if (response.content?.status === 401) {
      router.push('/account/password/reset/confirm')
    }
  }, [response.content?.status, router])

  function submit () {
    setResponse({ ...response, fetching: true })
    requestPasswordReset(email).then((content) => {
      setResponse((r) => { return { ...r, content } })
    }).catch((e) => {
      console.error(e)
      window.alert(e)
    }).then(() => {
      setResponse((r) => { return { ...r, fetching: false } })
    })
  }

  if (response.content?.status === 200) {
    return (
      <div>
        <h1>Reset Password</h1>
        <p>Password reset sent.</p>
      </div>
    )
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
      <Button disabled={response.fetching} onClick={() => submit()}>Reset</Button>
    </div>
  )
}
