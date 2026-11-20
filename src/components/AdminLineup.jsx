import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function AdminLineup() {
  const [msg, setMsg] = useState('')
  const [mins, setMins] = useState('30')
  const [flags, setFlags] = useState([])
  const [note, setNote] = useState('')

  useEffect(() => {
    supabase.from('tn_settings').select('key, value').in('key', ['lineup_missed_message', 'lineup_deadline_min']).then(({ data }) => {
      for (const r of data || []) {
        if (r.key === 'lineup_missed_message') setMsg(r.value)
        if (r.key === 'lineup_deadline_min') setMins(r.value)
      }
    })
    supabase.from('tn_lineup_flags')
      .select('*, tn_teams(name), tn_challenges(match_date, match_time, home:tn_teams!from_team(name), away:tn_teams!to_team(name))')
      .eq('kind', 'missed').order('at', { ascending: false }).limit(30).then(({ data }) => setFlags(data || []))
  }, [])

  async function save() {
    const n = Math.min(180, Math.max(5, parseInt(mins, 10) || 30))
    const { error } = await supabase.from('tn_settings').upsert([
      { key: 'lineup_missed_message', value: msg.trim() },
      { key: 'lineup_deadline_min', value: String(n) },
    ])
    setMins(String(n)); setNote(error ? error.message : 'Saved ✓')
  }

  return (
    <>
      <h2 style={{ margin: '8px 0 10px' }}>Line-up deadline</h2>
      <div className="card">
        <label className="muted">Minutes before kickoff
          <input type="number" min="5" max="180" value={mins} onChange={e => setMins(e.target.value)} style={{ marginTop: 6 }} /></label>
        <label className="muted">Message sent to a captain who misses it (same for every team)
          <textarea style={{ minHeight: 90, marginTop: 6 }} value={msg} onChange={e => setMsg(e.target.value)} /></label>
        <button style={{ width: '100%' }} onClick={save}>SAVE</button>
        {note && <p className="ok" style={{ marginTop: 8 }}>{note}</p>}
      </div>
      <b>Recent missed line-ups</b>
      {flags.length === 0 && <p className="muted" style={{ margin: '6px 0 16px' }}>None yet.</p>}
      {flags.map(f => (
        <div className="card" key={f.challenge_id + f.team_id} style={{ marginTop: 8 }}>
          <b>{f.tn_teams?.name}</b> <span className="muted">· {f.tn_challenges?.home?.name} vs {f.tn_challenges?.away?.name}</span>
          <p className="muted">{f.tn_challenges?.match_date} {f.tn_challenges?.match_time?.slice(0, 5)} · flagged {new Date(f.at).toLocaleString()}</p>
        </div>
      ))}
    </>
  )
}