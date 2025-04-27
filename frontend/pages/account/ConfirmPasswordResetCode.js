import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import FormErrors from '../../components/FormErrors'
import { getPasswordReset, Flows } from '../../lib/allauth'
import Button from '../../components/Button'
import { useAuthStatus } from '../../auth'

export default function ConfirmPasswordResetCode () {
  const [, authInfo] = useAuthStatus()
  const [code, setCode] = useState('')
  const [response, setResponse] = useState({ fetching: false, content: null })
  const router = useRouter()
  
  // Handle redirects with useEffect instead of Navigate
  useEffect(() => {
    if (response.content?.status === 409 || authInfo.pendingFlow?.id !== Flows.PASSWORD_RESET_BY_CODE) {
      router.push('/account/password/reset')
    } else if (response.content?.status === 200) {
      router.push({
        pathname: '/account/password/reset/complete',
        query: { resetKey: code }
      })
    }
  }, [response.content?.status, authInfo.pendingFlow?.id, code, router])

  function submit () {
    setResponse({ ...response, fetching: true })
    getPasswordReset(code).then((content) => {
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
      <h1>Enter Password Reset Code </h1>
      <p>
        The code expires shortly, so please enter it soon.
      </p>

      <FormErrors errors={response.content?.errors} />

      <div><label>Code <input value={code} onChange={(e) => setCode(e.target.value)} type='code' required /></label>
        <FormErrors param='key' errors={response.content?.errors} />
      </div>
      <Button disabled={response.fetching} onClick={() => submit()}>Confirm</Button>
    </div>
  )
}
