import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import FormErrors from '../../components/FormErrors'
import { confirmLoginCode, Flows } from '../../lib/allauth'
import Button from '../../components/Button'
import { useAuthStatus } from '../../auth'

export default function ConfirmLoginCode () {
  const [, authInfo] = useAuthStatus()
  const [code, setCode] = useState('')
  const [response, setResponse] = useState({ fetching: false, content: null })
  const router = useRouter()
  
  // Handle redirects with useEffect instead of Navigate
  useEffect(() => {
    if (response.content?.status === 409 || authInfo.pendingFlow?.id !== Flows.LOGIN_BY_CODE) {
      router.push('/account/login/code')
    }
  }, [response.content?.status, authInfo.pendingFlow?.id, router])

  function submit () {
    setResponse({ ...response, fetching: true })
    confirmLoginCode(code).then((content) => {
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
      <h1>Enter Sign-In Code </h1>
      <p>
        The code expires shortly, so please enter it soon.
      </p>

      <FormErrors errors={response.content?.errors} />

      <div><label>Code <input value={code} onChange={(e) => setCode(e.target.value)} type='code' required /></label>
        <FormErrors param='code' errors={response.content?.errors} />
      </div>
      <Button disabled={response.fetching} onClick={() => submit()}>Sign In</Button>
    </div>
  )
}
