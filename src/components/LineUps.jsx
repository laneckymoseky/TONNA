import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Pitch from './Pitch'

export default function LineUps({ match }) {
  const [open, setOpen] = useState(false)
  const [sq, setSq] = useState(null)

  useEffect(() => {
    if (!open || sq) return
    supabase.from('tn_match_squad').select('tn_roster(id, player_name, pos, photo_url, status, team_id)')
      .eq('challenge_id', match.id)
      .then(({ data }) => setSq((data || []).map(x => x.tn_roster).filter(Boolean)))
  }, [open])

  const booked = new Set((sq || []).map(s => s.id))
  const side = (teamId, name) => {
    const list = (sq || []).filter(s => s.team_id === teamId)
    return (
      <div key={teamId}>
        <h3 style={{ margin: '12px 0 8px' }}>{name}</h3>
        {list.length
          ? <Pitch slots={list} sport={match.sport} booked={booked} />
          : <p className="muted">Line-up not announced yet.</p>}
      </div>
    )
  }

  return (
    <div style={{ marginBottom: 14 }}>
      <button className="ghost" onClick={() => setOpen(!open)}>{open ? 'HIDE LINE-UPS' : '👕 LINE-UPS'}</button>
      {open && (sq === null
        ? <p className="muted" style={{ marginTop: 8 }}>Loading…</p>
        : <>{side(match.from_team, match.home?.name)}{side(match.to_team, match.away?.name)}</>)}
    </div>
  )
}