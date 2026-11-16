import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { SPORTS } from '../lib/sports'

export default function Portfolio({ userId, slotId }) {
  const [slots, setSlots] = useState([])
  const [venues, setVenues] = useState({})
  const [played, setPlayed] = useState(0)

  useEffect(() => {
    let q = supabase.from('tn_roster').select('id, pos, status, created_at, left_at, tn_teams(id, name, sport, home_field_id)')
    q = userId ? q.eq('user_id', userId) : q.eq('id', slotId)
    q.order('created_at', { ascending: false }).then(async ({ data }) => {
      setSlots(data || [])
      const ids = (data || []).map(s => s.id)
      if (ids.length) {
        const { count } = await supabase.from('tn_stats').select('*', { count: 'exact', head: true })
          .in('roster_id', ids).eq('played', true)
        setPlayed(count || 0)
      }
    })
    supabase.from('tn_fields').select('id, name').then(({ data }) =>
      setVenues(Object.fromEntries((data || []).map(v => [v.id, v.name]))))
  }, [userId, slotId])

  if (slots.length === 0) return null
  const current = slots.find(s => s.status === 'active') || slots[0]
  const home = venues[current.tn_teams?.home_field_id]
  const d = x => new Date(x).toLocaleDateString()

  return (
    <>
      <h2 style={{ margin: '18px 0 10px' }}>Portfolio</h2>
      <div className="card stats">
        <div className="stat"><b>{played}</b><span className="muted">Matches played</span></div>
        <div className="stat"><b>{slots.length}</b><span className="muted">Squads</span></div>
        <div className="stat"><b style={{ fontSize: 20 }}>{home || '—'}</b><span className="muted">Home ground</span></div>
      </div>
      {slots.map(s => (
        <div className="card row" key={s.id}>
          <span>{SPORTS[s.tn_teams?.sport]?.icon} <Link to={`/team/${s.tn_teams?.id}`}><b>{s.tn_teams?.name}</b></Link> <span className="tag">{s.pos}</span></span>
          <span className="muted">{d(s.created_at)} → {s.status === 'left' ? d(s.left_at) : 'now'}</span>
        </div>
      ))}
    </>
  )
}