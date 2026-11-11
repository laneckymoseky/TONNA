import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function Signup() {
  const [f, setF] = useState({ name: '', username: '', email: '', pw: '' })
  const [taken, setTaken] = useState(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const nav = useNavigate()
  const { refresh } = useAuth()
  const set = k => e => setF({ ...f, [k]: e.target.value })

  useEffect(() => {
    if (f.username.trim().length < 3) return setTaken(null)
    const t = setTimeout(async () => {
      const { data } = await supabase.rpc('username_taken', { p_username: f.username.trim() })
      setTaken(!!data)
    }, 500)
    return () => clearTimeout(t)
  }, [f.username])

  async function submit(e) {
    e.preventDefault()
    if (taken) return setErr('Username already taken')
    setErr(''); setBusy(true)
    const { data, error } = await supabase.auth.signUp({ email: f.email.trim(), password: f.pw })
    if (error) { setBusy(false); return setErr(error.message) }
    const { error: e2 } = await supabase.rpc('create_player_profile', {
      p_id: data.user.id, p_full_name: f.name.trim(), p_username: f.username.trim().toLowerCase(),
      p_avatar_url: null, p_position1: 'MID', p_position2: null,
    })
    setBusy(false)
    if (e2) return setErr(e2.message)
    await refresh()
    nav('/join')
  }

  return (
    <form className="narrow" onSubmit={submit}>
      <h1>Create account</h1>
      <input placeholder="Full name (exactly as your captain registered you)" value={f.name} onChange={set('name')} required />
      <input placeholder="Username" value={f.username} onChange={set('username')} required minLength={3} />
      {taken === true && <p className="err">✗ Username already taken</p>}
      {taken === false && <p className="ok">✓ Username available</p>}
      <input type="email" placeholder="Email" value={f.email} onChange={set('email')} required />
      <input type="password" placeholder="Password (min 6)" value={f.pw} onChange={set('pw')} required minLength={6} />
      {err && <p className="err">{err}</p>}
      <button disabled={busy || taken} style={{ width: '100%' }}>{busy ? '…' : 'SIGN UP'}</button>
      <p className="muted" style={{ marginTop: 16 }}>Have an account? <Link to="/login" style={{ color: 'var(--red)' }}>Sign in</Link></p>
    </form>
  )
}