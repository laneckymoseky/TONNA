import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { SPORTS } from '../lib/sports'

export default function AdminSeasons() {
  const [list, setList] = useState([])
  const [f, setF] = useState({ sport: 'football', name: '', starts: '', ends: '' })
  const [err, setErr] = useState('')
  const load = () => supabase.from('tn_seasons').select('*').order('sport').order('starts', { ascending: false })
    .then(({ data }) => setList(data || []))
  useEffect(() => { load() }, [])

  async function add(e) {
    e.preventDefault()
    const { error } = await supabase.rpc('tn_create_season', { p_sport: f.sport, p_name: f.name, p_starts: f.starts, p_ends: f.ends })
    setErr(error ? error.message : '')
    if (!error) { setF({ ...f, name: '' }); load() }
  }
  async function toggle(s) { await supabase.from('tn_seasons').update({ active: !s.active }).eq('id', s.id); load() }

  return (
    <>
      <h2 style={{ margin: '8px 0 10px' }}>Seasons</h2>
      {err && <p className="err">{err}</p>}
      {list.map(s => (
        <div className="card row" key={s.id} style={{ opacity: s.active ? 1 : .5 }}>
          <span>{SPORTS[s.sport]?.icon} <b>{s.name}</b> <span className="muted">{s.starts} → {s.ends}</span></span>
          <button className="ghost" onClick={() => toggle(s)}>{s.active ? 'CLOSE' : 'REOPEN'}</button>
        </div>
      ))}
      <form className="card" onSubmit={add}>
        <select value={f.sport} onChange={e => setF({ ...f, sport: e.target.value })}>
          {Object.entries(SPORTS).map(([id, s]) => <option key={id} value={id}>{s.icon} {s.name}</option>)}
        </select>
        <input placeholder="Season name (e.g. Summer Cup 2027)" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} required />
        <input type="date" value={f.starts} onChange={e => setF({ ...f, starts: e.target.value })} required />
        <input type="date" value={f.ends} onChange={e => setF({ ...f, ends: e.target.value })} required />
        <button style={{ width: '100%' }}>CREATE SEASON</button>
        <p className="muted" style={{ marginTop: 8 }}>Matches inside these dates move into the new season.</p>
      </form>
    </>
  )
}