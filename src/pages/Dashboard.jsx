import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useSport } from '../context/SportContext'
import { SPORTS } from '../lib/sports'
import { MATCH_SELECT, dparts } from '../lib/prices'
import Bg from '../components/Bg'
import Standings from '../components/Standings'

export default function Dashboard() {
  const { sport: id } = useParams()
  const sp = SPORTS[id]
  const { setSport } = useSport()
  const [matches, setMatches] = useState([])
  const [teams, setTeams] = useState(0)
  const [players, setPlayers] = useState(0)
  const [stats, setStats] = useState([])

  useEffect(() => {
    if (!sp) return
    setSport(id)
    supabase.from('tn_challenges').select(MATCH_SELECT).eq('sport', id).in('status', ['accepted', 'played'])
      .order('match_date').then(({ data }) => setMatches(data || []))
    supabase.from('tn_teams').select('id', { count: 'exact', head: true }).eq('sport', id).then(({ count }) => setTeams(count || 0))
    supabase.from('tn_roster').select('id, tn_teams!inner(sport)', { count: 'exact', head: true })
      .eq('status', 'active').eq('tn_teams.sport', id).then(({ count }) => setPlayers(count || 0))
    supabase.from('tn_stats').select('roster_id, data, tn_roster(player_name, tn_teams(name)), tn_challenges!inner(sport)')
      .eq('tn_challenges.sport', id).then(({ data }) => setStats(data || []))
  }, [id])

  const today = new Date().toISOString().slice(0, 10)
  const played = matches.filter(c => c.status === 'played')
  const next = matches.find(c => c.status === 'accepted' && c.match_date >= today)

  const leaders = useMemo(() => {
    if (!sp) return []
    return Object.entries(sp.stats).slice(0, 3).map(([k, label]) => {
      const tot = {}
      stats.forEach(r => {
        const v = r.data?.[k] || 0
        if (!v) return
        const o = (tot[r.roster_id] ??= { name: r.tn_roster?.player_name, team: r.tn_roster?.tn_teams?.name, v: 0 })
        o.v += v
      })
      return { label, rows: Object.values(tot).sort((a, b) => b.v - a.v).slice(0, 5) }
    })
  }, [stats, id])

  if (!sp) return <p className="wrap muted">Unknown sport.</p>
  const recent = [...played].reverse().slice(0, 5)

  return (
    <div className="wrap">
      <Bg name={id} plain />
      <div className="ph">
        <div className="first">{sp.icon} Dashboard</div>
        <div className="last">{sp.name}</div>
      </div>

      <div className="card stats">
        <div className="stat"><b>{teams}</b><span className="muted">Teams</span></div>
        <div className="stat"><b>{players}</b><span className="muted">Players</span></div>
        <div className="stat"><b>{played.length}</b><span className="muted">Played</span></div>
      </div>

      <h2 style={{ margin: '18px 0 10px' }}>Next game</h2>
      {next ? (
        <>
          <div className="card match mag">
            <div className="date"><b>{dparts(next.match_date)[0]}</b>{dparts(next.match_date)[1]}</div>
            <span className="t">{next.home?.name}</span><span className="vs">VS</span><span className="t r">{next.away?.name}</span>
          </div>
          <p className="match-meta">{next.match_time?.slice(0, 5)} · {next.field?.name}</p>
        </>
      ) : <p className="muted">No upcoming games.</p>}

      <h2 style={{ margin: '18px 0 10px' }}>Standings</h2>
      <Standings sport={id} />

      <h2 style={{ margin: '18px 0 10px' }}>Leaders</h2>
      <div className="grid">
        {leaders.map(l => (
          <div className="card" key={l.label}>
            <b>{l.label}</b>
            {l.rows.length === 0 && <p className="muted">No stats yet.</p>}
            {l.rows.map((r, i) => (
              <div className="row" key={i}><span>{i + 1}. {r.name} <span className="muted">{r.team}</span></span><b>{r.v}</b></div>
            ))}
          </div>
        ))}
      </div>

      <h2 style={{ margin: '18px 0 10px' }}>Recent results</h2>
      {recent.length === 0 && <p className="muted">No results yet.</p>}
      {recent.map(c => (
        <div className="card match mag" key={c.id}>
          <span className="t">{c.home?.name}</span>
          <div className="sc"><span>{c.home_score}</span><span>{c.away_score}</span></div>
          <span className="t r">{c.away?.name}</span>
        </div>
      ))}
    </div>
  )
}