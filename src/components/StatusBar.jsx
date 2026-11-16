import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function StatusBar({ rosterId }) {
  const [m, setM] = useState(undefined)
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10)
    supabase.from('tn_match_squad')
      .select('tn_challenges!inner(match_date, match_time, status, home:tn_teams!from_team(name), away:tn_teams!to_team(name))')
      .eq('roster_id', rosterId).eq('tn_challenges.status', 'accepted').gte('tn_challenges.match_date', today)
      .then(({ data }) => {
        const list = (data || []).map(x => x.tn_challenges).sort((a, b) => a.match_date.localeCompare(b.match_date))
        setM(list[0] || null)
      })
  }, [rosterId])
  if (m === undefined) return null
  return (
    <div className="card status-bar">
      <i style={{ background: m ? '#3ddc84' : '#f5b301' }} />
      {m
        ? <span><b>Booked</b> · {m.home?.name} vs {m.away?.name} · {m.match_date} {m.match_time?.slice(0, 5)}</span>
        : <span><b>Not booked</b> for a game</span>}
    </div>
  )
}