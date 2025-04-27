import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import FormErrors from '../../components/FormErrors'
import { requestLoginCode } from '../../lib/allauth'
import Button from '../../components/Button'

export default function RequestLoginCode () {
  const [email, setEmail] = useState('')
  const [response, setResponse] = useState({ fetching: false, content: null })
  const router = useRouter()
  
  // Handle redirects with useEffect
  useEffect(() => {
    if (response.content?.status === 401) {
      router.push('/account/login/code/confirm')
    }
  }, [response.content?.status, router])

  function submit () {
    setResponse({ ...response, fetching: true })
    requestLoginCode(email).then((content) => {
      setResponse((r) => { return { ...r, content } })
    }).catch((e) => {
      console.error(e)
      window.alert(e)
    }).then(() => {
      setResponse((r) => { return { ...r, fetching: false } })
    })
  }

  return (
    <div>
      <h1>Send me a sign-in code</h1>
      <p>
        You will receive an email containing a special code for a password-free sign-in.
      </p>

      <FormErrors errors={response.content?.errors} />

      <div><label>Email <input value={email} onChange={(e) => setEmail(e.target.value)} type='email' required /></label>
        <FormErrors param='email' errors={response.content?.errors} />
      </div>
      <Button disabled={response.fetching} onClick={() => submit()}>Request Code</Button>
    </div>
  )
}
