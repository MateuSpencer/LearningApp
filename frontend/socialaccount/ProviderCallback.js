import { useRouter } from 'next/router'
import Link from 'next/link'
import { useEffect } from 'react'
import { URLs, pathForPendingFlow, useAuthStatus } from '../auth'

export default function ProviderCallback() {
  const router = useRouter()
  const { error } = router.query
  const [auth, status] = useAuthStatus()

  useEffect(() => {
    if (!error) {
      let url = URLs.LOGIN_URL
      if (status.isAuthenticated) {
        url = URLs.LOGIN_REDIRECT_URL
      } else {
        url = pathForPendingFlow(auth) || url
      }
      router.push(url)
    }
  }, [auth, error, router, status.isAuthenticated])

  if (error) {
    return (
      <>
        <h1>Third-Party Login Failure</h1>
        <p>Something went wrong.</p>
        <Link href={status.isAuthenticated ? URLs.LOGIN_REDIRECT_URL : URLs.LOGIN_URL}>
          Continue
        </Link>
      </>
    )
  }

  return <p>Redirecting...</p>
}
