import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useSport } from '../context/SportContext'
import { SPORTS } from '../lib/sports'
import { MATCH_SELECT, dparts } from '../lib/prices'
import Bg from '../components/Bg'

export default function Dashboard() {
  const { sport: id } = useParams()
  const sp = SPORTS[id]
  const { setSport } = useSport()
  const [matches, setMatches] = useState([])
  const [teams, setTeams] = useState([])
  const [players, setPlayers] = useState(0)
  const [stats, setStats] = useState([])

  useEffect(() => {
    if (!sp) return
    setSport(id)
    supabase.from('tn_challenges').select(MATCH_SELECT).eq('sport', id).in('status', ['accepted', 'played'])
      .order('match_date').then(({ data }) => setMatches(data || []))
    supabase.from('tn_teams').select('id, name').eq('sport', id).then(({ data }) => setTeams(data || []))
    supabase.from('tn_roster').select('id, tn_teams!inner(sport)', { count: 'exact', head: true })
      .eq('status', 'active').eq('tn_teams.sport', id).then(({ count }) => setPlayers(count || 0))
    supabase.from('tn_stats').select('roster_id, data, tn_roster(player_name, tn_teams(name)), tn_challenges!inner(sport)')
      .eq('tn_challenges.sport', id).then(({ data }) => setStats(data || []))
  }, [id])

  const today = new Date().toISOString().slice(0, 10)
  const played = matches.filter(c => c.status === 'played')
  const upcoming = matches.filter(c => c.status === 'accepted' && c.match_date >= today)

  const table = useMemo(() => {
    if (!sp) return []
    const t = {}
    const row = (tid, n) => (t[tid] ??= { name: n, P: 0, W: 0, D: 0, L: 0, GF: 0, GA: 0, Pts: 0 })
    teams.forEach(tm => row(tm.id, tm.name))
    played.forEach(c => {
      const h = row(c.from_team, c.home?.name), a = row(c.to_team, c.away?.name)
      const hs = c.home_score ?? 0, as = c.away_score ?? 0
      h.P++; a.P++; h.GF += hs; h.GA += as; a.GF += as; a.GA += hs
      if (hs > as) { h.W++; a.L++; h.Pts += sp.pts.win; a.Pts += sp.pts.loss }
      else if (hs < as) { a.W++; h.L++; a.Pts += sp.pts.win; h.Pts += sp.pts.loss }
      else { h.D++; a.D++; h.Pts += sp.pts.draw; a.Pts += sp.pts.draw }
    })
    return Object.values(t).sort((x, y) => y.Pts - x.Pts || (y.GF - y.GA) - (x.GF - x.GA) || y.GF - x.GF)
  }, [matches, teams, id])

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
  const next = upcoming[0]
  const recent = [...played].reverse().slice(0, 5)

  return (
    <div className="wrap">
      <Bg name={id} />
      <div className="ph">
        <div className="first">{sp.icon} Dashboard</div>
        <div className="last">{sp.name}</div>
      </div>

      <div className="card stats">
        <div className="stat"><b>{teams.length}</b><span className="muted">Teams</span></div>
        <div className="stat"><b>{players}</b><span className="muted">Players</span></div>
        <div className="stat"><b>{played.length}</b><span className="muted">Played</span></div>
      </div>

      <h2 style={{ margin: '18px 0 10px' }}>Next game</h2>
      {next ? (
        <div className="card match mag">
          <div className="date"><b>{dparts(next.match_date)[0]}</b>{dparts(next.match_date)[1]}</div>
          <span className="t">{next.home?.name}</span><span className="vs">VS</span><span className="t r">{next.away?.name}</span>
        </div>
      ) : <p className="muted">No upcoming games.</p>}
      {next && <p className="match-meta">{next.match_time?.slice(0, 5)} · {next.field?.name}</p>}

      <h2 style={{ margin: '18px 0 10px' }}>Standings</h2>
      <div className="card" style={{ overflowX: 'auto' }}>
        <table className="tbl">
          <thead><tr><th>Team</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GF</th><th>GA</th><th>Pts</th></tr></thead>
          <tbody>
            {table.map(r => (
              <tr key={r.name}><td>{r.name}</td><td>{r.P}</td><td>{r.W}</td><td>{r.D}</td><td>{r.L}</td>
                <td>{r.GF}</td><td>{r.GA}</td><td><b>{r.Pts}</b></td></tr>
            ))}
            {table.length === 0 && <tr><td colSpan="8" className="muted">No teams yet.</td></tr>}
          </tbody>
        </table>
        <p className="muted" style={{ marginTop: 8, fontSize: 14 }}>
          Win {sp.pts.win} · Draw {sp.pts.draw} · Loss {sp.pts.loss}
        </p>
      </div>

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