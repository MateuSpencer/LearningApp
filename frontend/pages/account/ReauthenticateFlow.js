import { useRouter } from 'next/router'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { pathForFlow } from '../../auth'
import { Flows, AuthenticatorType } from '../../lib/allauth'

const flowLabels = {}
flowLabels[Flows.REAUTHENTICATE] = 'Use your password'
flowLabels[`${Flows.MFA_REAUTHENTICATE}:${AuthenticatorType.TOTP}`] = 'Use your authenticator app'
flowLabels[`${Flows.MFA_REAUTHENTICATE}:${AuthenticatorType.RECOVERY_CODES}`] = 'Use a recovery code'
flowLabels[`${Flows.MFA_REAUTHENTICATE}:${AuthenticatorType.WEBAUTHN}`] = 'Use security key'

function flowsToMethods (flows) {
  if (!flows) return []
  
  const methods = []
  flows.forEach(flow => {
    if (flow.id === Flows.MFA_REAUTHENTICATE) {
      flow.types?.forEach(typ => {
        const id = `${flow.id}:${typ}`
        methods.push({
          label: flowLabels[id],
          id,
          path: pathForFlow(flow, typ)
        })
      })
    } else {
      methods.push({
        label: flowLabels[flow.id] || flow.id,
        id: flow.id,
        path: pathForFlow(flow)
      })
    }
  })
  return methods
}

export default function ReauthenticateFlow (props) {
  const router = useRouter()
  const [methods, setMethods] = useState([])
  
  // Get reauth data from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const reauthData = localStorage.getItem('reauthData')
        if (reauthData) {
          const reauth = JSON.parse(reauthData)
          const calculatedMethods = flowsToMethods(reauth?.data?.flows)
          setMethods(calculatedMethods)
        }
      } catch (e) {
        console.error('Error parsing reauth data:', e)
      }
    }
  }, [])

  return (
    <div>
      <h1>Confirm Access</h1>
      <p>
        Please reauthenticate to safeguard your account.
      </p>
      {props.children}

      {methods.length > 1
        ? <><h2>Alternative Options</h2>
          <ul>
            {methods.filter(method => method.id !== props.method).map(method => {
              return (
                <li key={method.id}>
                  <Link 
                    href={{
                      pathname: method.path,
                      query: router.query
                    }}
                    replace
                  >
                    {method.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </>
        : null}
    </div>
  )
}
