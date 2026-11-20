import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function LineupWarning({ teamId }) {
  const [m, setM] = useState(null)
  const [picked, setPicked] = useState(false)
  const [dl, setDl] = useState(30)
  const [now, setNow] = useState(Date.now())

  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(t) }, [])
  useEffect(() => {
    if (!teamId) return
    supabase.from('tn_settings').select('value').eq('key', 'lineup_deadline_min').maybeSingle()
      .then(({ data }) => setDl(parseInt(data?.value, 10) || 30))
    const today = new Date().toISOString().slice(0, 10)
    supabase.from('tn_challenges').select('id, match_date, match_time, home:tn_teams!from_team(name), away:tn_teams!to_team(name)')
      .or(`from_team.eq.${teamId},to_team.eq.${teamId}`).eq('status', 'accepted').gte('match_date', today)
      .order('match_date').order('match_time').limit(1).then(async ({ data }) => {
        const next = data?.[0] || null
        setM(next)
        if (!next) return
        const { count } = await supabase.from('tn_match_squad').select('roster_id, tn_roster!inner(team_id)', { count: 'exact', head: true })
          .eq('challenge_id', next.id).eq('tn_roster.team_id', teamId)
        setPicked((count || 0) > 0)
      })
  }, [teamId])

  if (!m) return null
  const kick = new Date(`${m.match_date}T${m.match_time}`).getTime()
  if (kick < now) return null
  const deadline = kick - dl * 60000
  const left = Math.max(0, Math.round((deadline - now) / 60000))
  const hhmm = new Date(deadline).toTimeString().slice(0, 5)
  const vs = `${m.home?.name} vs ${m.away?.name}`

  if (picked) return (
    <div className="card" style={{ borderColor: '#3ddc84' }}>✅ Line-up set for {vs}. You can still change it until kickoff.</div>
  )
  const late = now >= deadline
  return (
    <div className="card row" style={{ borderColor: late ? 'var(--red)' : '#f5b301' }}>
      <span>
        {late ? '⏰ ' : '⚠️ '}<b>{late ? 'Line-up deadline passed' : `Pick your line-up by ${hhmm}`}</b> · {vs}<br />
        <span className="muted" style={{ fontSize: 14 }}>
          {late ? `The deadline was ${dl} minutes before kickoff. Pick it now.`
                : `Deadline is ${dl} minutes before kickoff. Time left: ${Math.floor(left / 60)}h ${left % 60}m.`}
        </span>
      </span>
      <Link to={`/squad/${m.id}`} className="btn" style={{ margin: 0, whiteSpace: 'nowrap' }}>PICK SQUAD</Link>
    </div>
  )
}