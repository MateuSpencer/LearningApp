import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { getEmailVerification, verifyEmail } from '../../lib/allauth'
import Button from '../../components/Button'

// Next.js equivalent of the React Router loader
export async function getServerSideProps(context) {
  const { key } = context.params || {}
  
  if (key) {
    try {
      const resp = await getEmailVerification(key)
      return {
        props: { 
          key, 
          verification: resp 
        }
      }
    } catch (error) {
      console.error("Error fetching email verification:", error)
      return { 
        props: { 
          key: key || "",
          verification: { status: 400, errors: [{ message: "Error fetching verification data" }] }
        } 
      }
    }
  }
  
  return { 
    props: { 
      key: "",
      verification: { status: 400, errors: [{ message: "No verification key provided" }] }
    } 
  }
}

export default function VerifyEmail({ key, verification }) {
  const router = useRouter()
  const [response, setResponse] = useState({ fetching: false, content: null })
  
  // Handle redirects with useEffect
  useEffect(() => {
    if ([200, 401].includes(response.content?.status)) {
      router.push('/account/email')
    }
  }, [response.content?.status, router])

  function submit() {
    setResponse({ ...response, fetching: true })
    verifyEmail(key).then((content) => {
      setResponse((r) => { return { ...r, content } })
    }).catch((e) => {
      console.error(e)
      window.alert(e)
    }).then(() => {
      setResponse((r) => { return { ...r, fetching: false } })
    })
  }

  let body = null
  if (verification?.status === 200) {
    body = (
      <>
        <p>Please confirm that <a href={'mailto:' + verification.data.email}>{verification.data.email}</a> is an email address for user {verification.data.user.str}.</p>
        <Button disabled={response.fetching} onClick={() => submit()}>Confirm</Button>
      </>
    )
  } else if (!verification?.data?.email) {
    body = <p>Invalid verification link.</p>
  } else {
    body = <p>Unable to confirm email <a href={'mailto:' + verification.data.email}>{verification.data.email}</a> because it is already confirmed.</p>
  }
  
  return (
    <div>
      <h1>Confirm Email Address</h1>
      {body}
    </div>
  )
}
