import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { SPORTS } from '../lib/sports'
import AdminSeasons from '../components/AdminSeasons'
import AdminValues from '../components/AdminValues'
import AdminAbout from '../components/AdminAbout'

export default function AdminTools() {
  const { role, loading } = useAuth()
  const [ff, setFf] = useState([])
  const [venues, setVenues] = useState([])
  const [log, setLog] = useState([])
  const [names, setNames] = useState({})
  const [nf, setNf] = useState({ scope: 'player', label: '', kind: 'text', options: '', required: false })
  const [nv, setNv] = useState({ name: '', sports: ['football'] })
  const [err, setErr] = useState('')

  async function load() {
    supabase.from('tn_form_fields').select('*').order('scope').order('sort').then(({ data }) => setFf(data || []))
    supabase.from('tn_fields').select('*').order('name').then(({ data }) => setVenues(data || []))
    const { data } = await supabase.from('tn_audit').select('*').order('at', { ascending: false }).limit(50)
    setLog(data || [])
    const ids = [...new Set((data || []).map(r => r.by_user).filter(Boolean))]
    if (ids.length) {
      const { data: p } = await supabase.from('profiles').select('id, full_name').in('id', ids)
      setNames(Object.fromEntries((p || []).map(x => [x.id, x.full_name])))
    }
  }
  useEffect(() => { if (role === 'admin') load() }, [role])

  if (loading) return <p className="wrap muted">Loading…</p>
  if (role !== 'admin') return <p className="wrap err">Admins only.</p>

  async function run(promise) {
    const { error } = await promise
    setErr(error ? error.message : ''); if (!error) load()
  }
  const addField = e => {
    e.preventDefault()
    run(supabase.from('tn_form_fields').insert({
      scope: nf.scope, label: nf.label.trim(), kind: nf.kind, required: nf.required, sort: ff.length + 1,
      options: nf.kind === 'select' ? nf.options.split(',').map(s => s.trim()).filter(Boolean) : null,
    })).then(() => setNf({ ...nf, label: '', options: '' }))
  }
  const addVenue = e => {
    e.preventDefault()
    run(supabase.from('tn_fields').insert({ name: nv.name.trim(), sports: nv.sports })).then(() => setNv({ ...nv, name: '' }))
  }
  const toggleSport = s => setNv(v => ({ ...v, sports: v.sports.includes(s) ? v.sports.filter(x => x !== s) : [...v.sports, s] }))

  return (
    <div className="wrap">
      <h1>Admin tools</h1>
      {err && <p className="err">{err}</p>}
<AdminAbout />    
<AdminValues/>     
<AdminSeasons/>
      <h2 style={{ margin: '8px 0 10px' }}>Registration fields</h2>
      {ff.map(f => (
        <div className="card row" key={f.id} style={{ opacity: f.active ? 1 : .5 }}>
          <span><b>{f.label}</b> <span className="tag">{f.scope}</span> <span className="muted">{f.kind}{f.required ? ' · required' : ''}</span></span>
          <span>
            <button className="ghost" onClick={() => run(supabase.from('tn_form_fields').update({ active: !f.active }).eq('id', f.id))}>{f.active ? 'HIDE' : 'SHOW'}</button>{' '}
            <button className="ghost" onClick={() => confirm('Delete this field?') && run(supabase.from('tn_form_fields').delete().eq('id', f.id))}>✕</button>
          </span>
        </div>
      ))}
      <form className="card" onSubmit={addField}>
        <select value={nf.scope} onChange={e => setNf({ ...nf, scope: e.target.value })}>
          <option value="player">Player registration</option><option value="team">Team registration</option>
        </select>
        <input placeholder="Field label (e.g. Jersey size)" value={nf.label} onChange={e => setNf({ ...nf, label: e.target.value })} required />
        <select value={nf.kind} onChange={e => setNf({ ...nf, kind: e.target.value })}>
          <option value="text">Text</option><option value="number">Number</option><option value="select">Dropdown</option>
        </select>
        {nf.kind === 'select' && <input placeholder="Options, separated by commas" value={nf.options} onChange={e => setNf({ ...nf, options: e.target.value })} required />}
        <label><input type="checkbox" checked={nf.required} onChange={e => setNf({ ...nf, required: e.target.checked })} />Required</label>
        <button style={{ width: '100%', marginTop: 10 }}>ADD FIELD</button>
      </form>

      <h2 style={{ margin: '20px 0 10px' }}>Venues</h2>
      {venues.map(v => (
        <div className="card row" key={v.id}>
          <b>{v.name}</b><span className="muted">{(v.sports || []).map(s => SPORTS[s]?.icon).join(' ')}</span>
        </div>
      ))}
      <form className="card" onSubmit={addVenue}>
        <input placeholder="Venue name" value={nv.name} onChange={e => setNv({ ...nv, name: e.target.value })} required />
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 10 }}>
          {Object.entries(SPORTS).map(([id, s]) => (
            <label key={id}><input type="checkbox" checked={nv.sports.includes(id)} onChange={() => toggleSport(id)} />{s.icon} {s.name}</label>
          ))}
        </div>
        <button style={{ width: '100%' }} disabled={nv.sports.length === 0}>ADD VENUE</button>
      </form>

      <h2 style={{ margin: '20px 0 10px' }}>Audit log (last 50 changes)</h2>
      {log.map(r => (
        <div className="card" key={r.id}>
          <div className="row"><b>{r.action} · {r.table_name.replace('tn_', '')}</b><span className="muted">{new Date(r.at).toLocaleString()}</span></div>
          <p className="muted">by {names[r.by_user] || 'system'} · {r.row_id}</p>
        </div>
      ))}
    </div>
  )
}