import { useEffect, useState } from 'react'
import { disablePush, enablePush, pushState } from '../lib/push'

const WHY = {
  key: 'Phone notifications are not switched on for this version of the app yet.',
  https: 'Open the site with https:// to use notifications.',
  worker: 'This browser can\'t run background notifications. Try Chrome.',
  push: 'This browser can\'t show phone notifications. Try Chrome, or install the app to your Home Screen.',
}

export default function PushToggle({ prompt = false }) {
  const [st, setSt] = useState('')
  const [err, setErr] = useState('')
  const [dismissed, setDismissed] = useState(() => { try { return localStorage.getItem('push:dismiss') === '1' } catch { return false } })
  const refresh = () => pushState().then(setSt)
  useEffect(() => { refresh() }, [])

  async function on() { setErr(''); try { await enablePush() } catch (e) { setErr(e.message) } refresh() }
  async function off() { await disablePush(); refresh() }
  const dismiss = () => { setDismissed(true); try { localStorage.setItem('push:dismiss', '1') } catch {} }

  if (!st) return null
  const bad = st.startsWith('unsupported')
  const code = bad ? st.split(':')[1] : ''
  const state = bad ? 'unsupported' : st
  if (prompt && (state !== 'off' || dismissed)) return null
  const ios = /iphone|ipad/i.test(navigator.userAgent)
  const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone

  return (
    <div className="card row">
      <span>
        🔔 <b>{state === 'on' ? 'Phone notifications are on' : 'Get alerts on your phone'}</b><br />
        <span className="muted" style={{ fontSize: 14 }}>
          {state === 'off' && 'Challenges, invites, line-up reminders, scores and orders, even when the app is closed.'}
          {state === 'on' && 'You will get a pop-up when something needs you.'}
          {state === 'denied' && 'Notifications are blocked. Allow them in your browser\'s site settings, then come back.'}
          {state === 'unsupported' && (ios && !standalone && code === 'push'
            ? 'On iPhone: tap Share → Add to Home Screen, open Flake City from the Home Screen, then turn this on.'
            : WHY[code])}
        </span>
        {bad && <><br /><span className="muted" style={{ fontSize: 12 }}>code: {code}</span></>}
        {err && <><br /><span className="err">{err}</span></>}
      </span>
      <span>
        {state === 'off' && <button onClick={on}>TURN ON</button>}
        {state === 'on' && <button className="ghost" onClick={off}>TURN OFF</button>}
        {prompt && state === 'off' && <button className="ghost" style={{ marginLeft: 6 }} onClick={dismiss}>LATER</button>}
      </span>
    </div>
  )
}