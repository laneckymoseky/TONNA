import { useEffect, useState } from 'react'
import { disablePush, enablePush, pushState } from '../lib/push'

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
  if (prompt && (st !== 'off' || dismissed)) return null
  const ios = /iphone|ipad/i.test(navigator.userAgent)
  const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone

  return (
    <div className="card row">
      <span>
        🔔 <b>{st === 'on' ? 'Phone notifications are on' : 'Get alerts on your phone'}</b><br />
        <span className="muted" style={{ fontSize: 14 }}>
          {st === 'off' && 'Challenges, invites, line-up reminders, scores and orders, even when the app is closed.'}
          {st === 'on' && 'You will get a pop-up when something needs you.'}
          {st === 'denied' && 'Notifications are blocked. Allow them in your browser\'s site settings, then come back.'}
          {st === 'unsupported' && (ios && !standalone
            ? 'On iPhone: tap Share → Add to Home Screen, open Flake City from the Home Screen, then turn this on.'
            : 'This browser can\'t show phone notifications.')}
        </span>
        {err && <><br /><span className="err">{err}</span></>}
      </span>
      <span>
        {st === 'off' && <button onClick={on}>TURN ON</button>}
        {st === 'on' && <button className="ghost" onClick={off}>TURN OFF</button>}
        {prompt && st === 'off' && <button className="ghost" style={{ marginLeft: 6 }} onClick={dismiss}>LATER</button>}
      </span>
    </div>
  )
}