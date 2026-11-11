import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { MATCH_SELECT } from '../lib/prices'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const tally = arr => Object.entries(
  arr.filter(Boolean).reduce((o, k) => ((o[k] = (o[k] || 0) + 1), o), {})
).sort((a, b) => b[1] - a[1])

function Top({ title, rows }) {
  return (
    <div className="card">
      <h2 style={{ fontSize: 16, marginBottom: 8 }}>{title}</h2>
      {rows.slice(0, 5).map(([k, n]) => <div className="row" key={k}><span>{k}</span><b>{n}</b></div>)}
      {rows.length === 0 && <p className="muted">No data yet</p>}
    </div>
  )
}

function MatchRow({ c, onSaved }) {
  const [h, setH] = useState(c.home_score ?? '')
  const [a, setA] = useState(c.away_score ?? '')
  async function save() {
    await supabase.from('tn_challenges').update({ home_score: +h, away_score: +a, status: 'played' }).eq('id', c.id)
    onSaved()
  }
  return (
    <div className="card">
      <b>{c.home?.name} vs {c.away?.name}</b>
      <p className="muted">{c.match_date} · {c.match_time?.slice(0, 5)} · {c.field?.name} · {c.status}</p>
      <div className="row" style={{ justifyContent: 'flex-start', marginTop: 8 }}>
        <input className="score" type="number" min="0" value={h} onChange={e => setH(e.target.value)} />
        <span>-</span>
        <input className="score" type="number" min="0" value={a} onChange={e => setA(e.target.value)} />
        <button onClick={save} disabled={h === '' || a === ''}>{c.status === 'played' ? 'UPDATE' : 'SAVE RESULT'}</button>
      </div>
    </div>
  )
}

export default function Admin() {
  const { role, loading } = useAuth()
  const nav = useNavigate()
  const [ch, setCh] = useState([])
  const [people, setPeople] = useState([])
  const [more, setMore] = useState(false)
  const [q, setQ] = useState('')
  const [err, setErr] = useState('')

  function load() {
    supabase.from('tn_challenges').select(MATCH_SELECT).in('status', ['accepted', 'played'])
      .order('match_date', { ascending: false }).then(({ data }) => setCh(data || []))
    supabase.rpc('tn_admin_people').then(({ data }) => setPeople(data || []))
  }
  useEffect(() => { if (role === 'admin') load() }, [role])

  if (loading) return <p className="wrap muted">Loading…</p>
  if (role !== 'admin') return <p className="wrap err">Admins only.</p>

  async function chat(uid) {
    setErr('')
    const { data, error } = await supabase.rpc('tn_open_direct', { p_user: uid })
    if (error) return setErr(error.message)
    nav('/chat/' + data)
  }

  const shown = people.filter(p => (p.person + ' ' + p.team).toLowerCase().includes(q.toLowerCase()))
  const count = k => people.filter(p => p.kind === k).length

  return (
    <div className="wrap">
      <h1>Admin</h1>
      <div className="row" style={{ gap: 12, marginBottom: 12 }}>
        <div className="card" style={{ flex: 1 }}><span className="muted">Players</span><h1>{count('player')}</h1></div>
        <div className="card" style={{ flex: 1 }}><span className="muted">Captains</span><h1>{count('captain')}</h1></div>
        <div className="card" style={{ flex: 1 }}><span className="muted">Matches</span><h1>{ch.length}</h1></div>
      </div>
      <Top title="Busiest days" rows={tally(ch.map(c => DAYS[new Date(c.match_date + 'T00:00').getDay()]))} />
      <Top title="Busiest times" rows={tally(ch.map(c => c.match_time?.slice(0, 2) + ':00'))} />
      <Top title="Most booked venues" rows={tally(ch.map(c => c.field?.name))} />
      <p className="muted">Revenue: coming later.</p>
      {err && <p className="err">{err}</p>}

      <button className="ghost" onClick={() => setMore(!more)} style={{ margin: '12px 0' }}>{more ? 'HIDE' : 'VIEW MORE'}</button>
      {more && (
        <>
          <h2 style={{ margin: '8px 0' }}>Tournaments and results</h2>
          {ch.map(c => <MatchRow key={c.id} c={c} onSaved={load} />)}
          <h2 style={{ margin: '16px 0 8px' }}>People</h2>
          <input placeholder="Search players or captains" value={q} onChange={e => setQ(e.target.value)} />
          {shown.map(p => (
            <div className="card row" key={p.uid + p.kind}>
              <span><b>{p.person}</b> <span className="tag">{p.kind}</span> <span className="muted">{p.team}</span></span>
              <button onClick={() => chat(p.uid)}>CHAT</button>
            </div>
          ))}
        </>
      )}
    </div>
  )
}