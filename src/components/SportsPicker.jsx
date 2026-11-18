import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useSport } from '../context/SportContext'
import { SPORTS } from '../lib/sports'

export default function SportsPicker() {
  const { role, team, slot } = useAuth()
  const { mySports, reloadSports } = useSport()
  const locked = new Set([team?.sport, slot?.tn_teams?.sport].filter(Boolean))
  const [sel, setSel] = useState(new Set(mySports))
  const [msg, setMsg] = useState('')
  useEffect(() => { setSel(new Set(mySports)) }, [mySports.join()])
  if (role === 'admin') return null

  const toggle = id => {
    if (locked.has(id)) return
    setSel(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  }
  async function save() {
    const { error } = await supabase.rpc('tn_set_sports', { p_sports: [...sel] })
    setMsg(error ? error.message : 'Saved ✓')
    if (!error) reloadSports()
  }
  return (
    <div className="card">
      <b>My sports</b>
      <p className="muted" style={{ margin: '4px 0 8px' }}>You only see dashboards, news and tabs for these. A sport with your team in it can't be removed.</p>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 10 }}>
        {Object.entries(SPORTS).map(([id, s]) => (
          <label key={id}><input type="checkbox" checked={sel.has(id)} disabled={locked.has(id)} onChange={() => toggle(id)} />{s.icon} {s.name}</label>
        ))}
      </div>
      <button onClick={save}>SAVE</button> {msg && <span className="muted">{msg}</span>}
    </div>
  )
}