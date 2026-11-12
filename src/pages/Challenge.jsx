import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { MATCH_SELECT, dparts } from '../lib/prices'
import Bg from '../components/Bg'

export default function Challenge() {
  const { session } = useAuth()
  const [myTeam, setMyTeam] = useState(null)
  const [teams, setTeams] = useState([])
  const [fields, setFields] = useState([])
  const [incoming, setIncoming] = useState([])
  const [f, setF] = useState({ to: '', field: '', date: '', time: '' })
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const set = k => e => setF({ ...f, [k]: e.target.value })

  async function load() {
    const { data: t } = await supabase.from('tn_teams').select('*').eq('captain_id', session.user.id).maybeSingle()
    setMyTeam(t)
    const { data: all } = await supabase.from('tn_teams').select('id, name').order('name')
    setTeams((all || []).filter(x => x.id !== t?.id))
    const { data: fl } = await supabase.from('tn_fields').select('*').order('name')
    setFields(fl || [])
    if (t) {
      const { data: inc } = await supabase.from('tn_challenges').select(MATCH_SELECT).eq('to_team', t.id).eq('status', 'pending')
      setIncoming(inc || [])
    }
  }
  useEffect(() => { load() }, [])

  async function send(e) {
    e.preventDefault(); setMsg(''); setErr('')
    const { error } = await supabase.from('tn_challenges').insert({
      from_team: myTeam.id, to_team: f.to, field_id: f.field, match_date: f.date, match_time: f.time,
    })
    error ? setErr(error.message) : setMsg('Challenge sent ✓')
  }
  async function answer(id, ok) {
    setErr('')
    const { error } = ok
      ? await supabase.rpc('tn_accept_challenge', { p_id: id })
      : await supabase.from('tn_challenges').update({ status: 'declined' }).eq('id', id)
    error ? setErr(error.message) : load()
  }

  if (!myTeam) return <p className="wrap muted">Register your team first (My Team).</p>
  return (
    <div className="wrap">
      <Bg name="challenge" />
      <h1>Challenge a team</h1>
      <form className="card" onSubmit={send}>
        <select value={f.to} onChange={set('to')} required>
          <option value="">Opponent</option>
          {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select value={f.field} onChange={set('field')} required>
          <option value="">Football field</option>
          {fields.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
        </select>
        <input type="date" value={f.date} onChange={set('date')} required />
        <input type="time" value={f.time} onChange={set('time')} required />
        <button style={{ width: '100%' }}>SEND CHALLENGE</button>
      </form>
      {msg && <p className="ok">{msg}</p>}
      {err && <p className="err">{err}</p>}

      <h2 style={{ margin: '18px 0 10px' }}>Incoming challenges</h2>
      {incoming.length === 0 && <p className="muted">None.</p>}
      {incoming.map(c => {
        const [day, mon] = dparts(c.match_date)
        return (
          <div className="card match mag" key={c.id}>
            <div className="date"><b>{day}</b>{mon}</div>
            <span className="t">{c.home?.name}
              <span className="muted" style={{ display: 'block', fontWeight: 500, letterSpacing: 0, fontSize: 14 }}>
                {c.match_time?.slice(0, 5)} · {c.field?.name}</span></span>
            <span>
              <button onClick={() => answer(c.id, true)}>ACCEPT</button>{' '}
              <button className="ghost" onClick={() => answer(c.id, false)}>DECLINE</button>
            </span>
          </div>
        )
      })}
    </div>
  )
}