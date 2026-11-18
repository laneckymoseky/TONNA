import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function WorthPanel({ slots, onSaved }) {
  const [vals, setVals] = useState({})
  const [err, setErr] = useState('')
  useEffect(() => { setVals(Object.fromEntries(slots.map(s => [s.id, s.worth ?? 0]))) }, [slots])
  const left = 100 - slots.reduce((a, s) => a + (+vals[s.id] || 0), 0)

  async function save(s) {
    const { error } = await supabase.rpc('tn_set_worth', { p_slot: s.id, p_worth: +vals[s.id] || 0 })
    setErr(error ? error.message : ''); if (!error) onSaved()
  }
  return (
    <>
      <h2 style={{ margin: '18px 0 6px' }}>Player worth</h2>
      <p className="muted" style={{ marginBottom: 10 }}>
        Budget left: <b style={{ color: left < 0 ? 'var(--red)' : '#3ddc84' }}>{left.toFixed(1)}m</b> of 100m. Spread it across your squad.
      </p>
      {err && <p className="err">{err}</p>}
      {slots.map(s => (
        <div className="card row" key={s.id}>
          <span><b>{s.player_name}</b> <span className="tag">{s.pos}</span></span>
          <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input style={{ width: 90, margin: 0 }} type="number" min="0" max="100" step="0.5"
              value={vals[s.id] ?? 0} onChange={e => setVals({ ...vals, [s.id]: e.target.value })} />m
            <button onClick={() => save(s)}>SAVE</button>
          </span>
        </div>
      ))}
    </>
  )
}