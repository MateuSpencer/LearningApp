import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { logout } from '../../lib/allauth'
import Button from '../../components/Button'

export default function Logout () {
  const [response, setResponse] = useState({ fetching: false, content: null })
  const router = useRouter()
  
  // Handle redirect after logout using useEffect
  useEffect(() => {
    if (response.content) {
      router.push('/')
    }
  }, [response.content, router])

  function submit () {
    setResponse({ ...response, fetching: true })
    logout().then((content) => {
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
      <h1>Logout</h1>
      <p>
        Are you sure you want to logout?
      </p>

      <Button disabled={response.fetching} onClick={() => submit()}>Logout</Button>
    </div>
  )
}
