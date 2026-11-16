import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { SPORTS } from '../lib/sports'
import { MATCH_SELECT } from '../lib/prices'

export default function Standings({ sport }) {
  const sp = SPORTS[sport]
  const [seasons, setSeasons] = useState([])
  const [season, setSeason] = useState('all')
  const [teams, setTeams] = useState([])
  const [played, setPlayed] = useState([])

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10)
    supabase.from('tn_seasons').select('*').eq('sport', sport).order('starts', { ascending: false }).then(({ data }) => {
      const list = data || []
      setSeasons(list)
      const cur = list.find(s => s.active && s.starts <= today && today <= s.ends) || list.find(s => s.active)
      setSeason(cur ? cur.id : 'all')
    })
    supabase.from('tn_teams').select('id, name').eq('sport', sport).then(({ data }) => setTeams(data || []))
    supabase.from('tn_challenges').select(MATCH_SELECT).eq('sport', sport).eq('status', 'played')
      .then(({ data }) => setPlayed(data || []))
  }, [sport])

  const table = useMemo(() => {
    const t = {}
    const row = (id, n) => (t[id] ??= { name: n, P: 0, W: 0, D: 0, L: 0, GF: 0, GA: 0, Pts: 0 })
    if (season === 'all') teams.forEach(tm => row(tm.id, tm.name))
    played.filter(c => season === 'all' || c.season_id === season).forEach(c => {
      const h = row(c.from_team, c.home?.name), a = row(c.to_team, c.away?.name)
      const hs = c.home_score ?? 0, as = c.away_score ?? 0
      h.P++; a.P++; h.GF += hs; h.GA += as; a.GF += as; a.GA += hs
      if (hs > as) { h.W++; a.L++; h.Pts += sp.pts.win; a.Pts += sp.pts.loss }
      else if (hs < as) { a.W++; h.L++; a.Pts += sp.pts.win; h.Pts += sp.pts.loss }
      else { h.D++; a.D++; h.Pts += sp.pts.draw; a.Pts += sp.pts.draw }
    })
    return Object.values(t).sort((x, y) => y.Pts - x.Pts || (y.GF - y.GA) - (x.GF - x.GA) || y.GF - x.GF)
  }, [played, teams, season, sport])

  return (
    <div className="card" style={{ overflowX: 'auto' }}>
      <select value={season} onChange={e => setSeason(e.target.value)}>
        <option value="all">All time</option>
        {seasons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>
      <table className="tbl">
        <thead><tr><th>Team</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GF</th><th>GA</th><th>GD</th><th>Pts</th></tr></thead>
        <tbody>
          {table.map(r => (
            <tr key={r.name}><td>{r.name}</td><td>{r.P}</td><td>{r.W}</td><td>{r.D}</td><td>{r.L}</td>
              <td>{r.GF}</td><td>{r.GA}</td><td>{r.GF - r.GA}</td><td><b>{r.Pts}</b></td></tr>
          ))}
          {table.length === 0 && <tr><td colSpan="9" className="muted">No results in this season yet.</td></tr>}
        </tbody>
      </table>
      <p className="muted" style={{ marginTop: 8, fontSize: 14 }}>
        Win {sp.pts.win} · Draw {sp.pts.draw} · Loss {sp.pts.loss}
      </p>
    </div>
  )
}