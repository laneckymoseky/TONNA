import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [id, setId] = useState('')
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const nav = useNavigate()

  async function submit(e) {
    e.preventDefault()
    setErr(''); setBusy(true)
    let email = id.trim()
    if (!email.includes('@')) {
      const { data } = await supabase.rpc('email_for_username', { p_username: email })
      if (!data) { setBusy(false); return setErr('No account with that username') }
      email = data
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password: pw })
    setBusy(false)
    if (error) return setErr('Wrong email/username or password')
    nav('/home')
  }

  return (
    <form className="narrow" onSubmit={submit}>
      <h1>Sign in</h1>
      <input placeholder="Email or username" value={id} onChange={e => setId(e.target.value)} required />
      <input type="password" placeholder="Password" value={pw} onChange={e => setPw(e.target.value)} required />
      {err && <p className="err">{err}</p>}
      <button disabled={busy} style={{ width: '100%' }}>{busy ? '…' : 'SIGN IN'}</button>
      <p className="muted" style={{ marginTop: 16 }}>No account? <Link to="/signup" style={{ color: 'var(--red)' }}>Sign up</Link></p>
    </form>
  )
}