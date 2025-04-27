import { useState } from 'react'
import FormErrors from '../../components/FormErrors'
import { login } from '../../lib/allauth'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useConfig } from '../../auth'
import ProviderList from '../../socialaccount/ProviderList'
import Button from '../../components/Button'
import WebAuthnLoginButton from '../../mfa/WebAuthnLoginButton'
import { withAnonymousProtection } from '../../utils/withAuth'

export const getServerSideProps = withAnonymousProtection();

export default function Login () {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [response, setResponse] = useState({ fetching: false, content: null })
  const config = useConfig()
  const router = useRouter()
  const hasProviders = config?.data?.socialaccount?.providers?.length > 0
  const loginByCodeEnabled = config?.data?.account?.login_by_code_enabled

  function submit () {
    setResponse({ ...response, fetching: true })
    login({ email, password }).then((content) => {
      setResponse((r) => { return { ...r, content } })
      // If login was successful, no need to do anything as AuthChangeRedirector will handle the redirect
    }).catch((e) => {
      console.error(e)
      window.alert(e)
    }).then(() => {
      setResponse((r) => { return { ...r, fetching: false } })
    })
  }
  
  return (
    <div>
      <h1>Login</h1>
      <p>
        No account? <Link href='/account/signup'>Sign up here.</Link>
      </p>

      <FormErrors errors={response.content?.errors} />

      <div><label>Email <input value={email} onChange={(e) => setEmail(e.target.value)} type='email' required /></label>
        <FormErrors param='email' errors={response.content?.errors} />
      </div>
      <div><label>Password: <input value={password} onChange={(e) => setPassword(e.target.value)} type='password' required /></label>
        <Link href='/account/password/reset'>Forgot your password?</Link>
        <FormErrors param='password' errors={response.content?.errors} />
      </div>
      <Button disabled={response.fetching} onClick={() => submit()}>Login</Button>
      {loginByCodeEnabled && (
        <Link href='/account/login/code' className='btn btn-secondary'>
          Send me a sign-in code
        </Link>
      )}
      <WebAuthnLoginButton>Sign in with a passkey</WebAuthnLoginButton>
      {hasProviders && (
        <>
          <h2>Or use a third-party</h2>
          <ProviderList callbackURL='/account/provider/callback' />
        </>
      )}
    </div>
  )
}
