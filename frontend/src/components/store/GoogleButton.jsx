import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'
import { toast } from '../../lib/alert'
import { useSettings } from '../../lib/queries'

/*
 * "Continue with Google" for customers (Google Identity Services).
 * Shown only when the store has a Google client ID (backend GOOGLE_CLIENT_ID); renders nothing otherwise.
 */

let gisPromise = null
const loadGis = () => {
  if (window.google?.accounts?.id) return Promise.resolve()
  gisPromise ??= new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://accounts.google.com/gsi/client'
    s.async = true
    s.onload = resolve
    s.onerror = () => { gisPromise = null; reject(new Error('Could not load Google sign-in.')) }
    document.head.appendChild(s)
  })
  return gisPromise
}

export function GoogleButton({ onDone, text = 'continue_with' }) {
  const clientId = useSettings().data?.auth?.google_client_id
  const { start } = useAuth()
  const box = useRef(null)
  const done = useRef(onDone)
  useEffect(() => { done.current = onDone })
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!clientId) return
    let gone = false
    loadGis().then(() => {
      if (gone || !box.current) return
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async ({ credential }) => {
          setBusy(true)
          try {
            start(await api.post('/auth/google', { credential, device_name: 'xerqo-web' }))
            done.current?.()
          } catch (err) {
            toast.error(err.fields?.credential || err.message)
          } finally {
            setBusy(false)
          }
        },
      })
      window.google.accounts.id.renderButton(box.current, { theme: 'outline', size: 'large', shape: 'rectangular', text, width: Math.min(box.current.offsetWidth || 360, 400) })
    }).catch((e) => toast.error(e.message))
    return () => { gone = true }
  }, [clientId, start, text])

  if (!clientId) return null
  return <div ref={box} className={busy ? 'pointer-events-none flex min-h-11 w-full justify-center opacity-60' : 'flex min-h-11 w-full justify-center'} aria-busy={busy} />
}

// "or" line between the phone sign-in and the Google button
export const OrDivider = () => (
  <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-mute"><span className="h-px flex-1 bg-line" />or<span className="h-px flex-1 bg-line" /></div>
)

// The divider + Google button, or nothing when Google sign-in isn't set up
export function GoogleSection({ onDone, text }) {
  const clientId = useSettings().data?.auth?.google_client_id
  if (!clientId) return null
  return <><OrDivider /><GoogleButton onDone={onDone} text={text} /></>
}
