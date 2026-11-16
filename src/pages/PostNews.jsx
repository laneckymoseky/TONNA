import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { SPORTS } from '../lib/sports'
import { uploadPublic } from '../lib/upload'
import Bg from '../components/Bg'

export default function PostNews() {
  const { role, team, session } = useAuth()
  const nav = useNavigate()
  const isAdmin = role === 'admin'
  const [f, setF] = useState({ title: '', body: '', sport: '', audience: isAdmin ? 'public' : 'team' })
  const [file, setFile] = useState(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  if (!isAdmin && !team) return <p className="wrap muted">Only captains and admins can post news.</p>

  async function submit(e) {
    e.preventDefault(); setErr(''); setBusy(true)
    try {
      const image = file ? await uploadPublic('news', file, session.user.id) : ''
      const { error } = await supabase.rpc('tn_post_news', {
        p_title: f.title, p_body: f.body, p_sport: isAdmin ? f.sport : '', p_audience: f.audience, p_image: image,
      })
      if (error) throw error
      nav('/home')
    } catch (x) { setErr(x.message); setBusy(false) }
  }

  return (
    <form className="narrow" onSubmit={submit}>
      <Bg name="news" />
      <h1>Post news</h1>
      <input placeholder="Title" maxLength={120} value={f.title} onChange={e => setF({ ...f, title: e.target.value })} required />
      <textarea placeholder="What's happening?" maxLength={4000} value={f.body} onChange={e => setF({ ...f, body: e.target.value })} required />
      {isAdmin && (
        <select value={f.sport} onChange={e => setF({ ...f, sport: e.target.value })}>
          <option value="">All sports (announcement)</option>
          {Object.entries(SPORTS).map(([id, s]) => <option key={id} value={id}>{s.icon} {s.name}</option>)}
        </select>
      )}
      <select value={f.audience} onChange={e => setF({ ...f, audience: e.target.value })}>
        {isAdmin
          ? <><option value="public">Everyone</option><option value="captains">Captains only</option></>
          : <><option value="team">My team only</option><option value="public">Everyone</option></>}
      </select>
      <label className="muted">Photo (optional)<input type="file" accept="image/*" onChange={e => setFile(e.target.files[0] || null)} style={{ marginTop: 6 }} /></label>
      {err && <p className="err">{err}</p>}
      <button disabled={busy} style={{ width: '100%' }}>{busy ? '…' : 'POST'}</button>
    </form>
  )
}