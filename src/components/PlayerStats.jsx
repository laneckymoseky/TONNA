import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { SPORTS } from '../lib/sports'
import StatsGrid from './StatsGrid'

const SEL = '*, tn_roster(team_id, tn_teams(name)), tn_challenges(sport, season_id, match_date, status, from_team, home_score, away_score, home:tn_teams!from_team(name), away:tn_teams!to_team(name))'

export default function PlayerStats({ userId, slotId, sport = 'football' }) {
  const { role } = useAuth()
  const sp = SPORTS[sport] || SPORTS.football
  const [rows, setRows] = useState([])
  const [seasons, setSeasons] = useState([])
  const [sel, setSel] = useState('all')
  const [err, setErr] = useState('')

  async function load() {
    let ids = slotId ? [slotId] : []
    if (userId) {
      const { data } = await supabase.from('tn_roster').select('id').eq('user_id', userId)
      ids = [...new Set([...ids, ...(data || []).map(r => r.id)])]
    }
    if (!ids.length) { setRows([]); return }
    const { data } = await supabase.from('tn_stats').select(SEL).in('roster_id', ids)
    const list = (data || []).filter(r => r.tn_challenges?.sport === sport)
      .sort((a, b) => (b.tn_challenges?.match_date || '').localeCompare(a.tn_challenges?.match_date || ''))
    setRows(list)
    const sids = [...new Set(list.map(r => r.tn_challenges?.season_id).filter(Boolean))]
    if (sids.length) {
      const { data: s } = await supabase.from('tn_seasons').select('id, name').in('id', sids).order('starts', { ascending: false })
      setSeasons(s || [])
    } else setSeasons([])
  }
  useEffect(() => { load() }, [userId, slotId, sport])

  const hasNone = rows.some(r => !r.tn_challenges?.season_id)
  const shown = rows.filter(r => sel === 'all' || (sel === 'none' ? !r.tn_challenges?.season_id : r.tn_challenges?.season_id === sel))

  const result = r => {
    const c = r.tn_challenges
    if (!c || c.status !== 'played') return ''
    const home = c.from_team === r.tn_roster?.team_id
    const [x, y] = home ? [c.home_score, c.away_score] : [c.away_score, c.home_score]
    return `${x > y ? 'W' : x < y ? 'L' : 'D'} ${x}–${y} · `
  }

  async function clear() {
    if (!confirm(`Delete the ${shown.length} match stat rows shown here? This cannot be undone.`)) return
    const { error } = await supabase.from('tn_stats').delete()
      .in('challenge_id', shown.map(r => r.challenge_id)).in('roster_id', [...new Set(shown.map(r => r.roster_id))])
    error ? setErr(error.message) : load()
  }

  return (
    <>
      <div className="row" style={{ margin: '14px 0 10px' }}>
        <h2>Statistics</h2>
        <select style={{ width: 'auto', margin: 0 }} value={sel} onChange={e => setSel(e.target.value)}>
          <option value="all">All time</option>
          {seasons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          {hasNone && <option value="none">No season</option>}
        </select>
      </div>
      <StatsGrid rows={shown} sport={sport} />
      {err && <p className="err">{err}</p>}
      {role === 'admin' && shown.length > 0 && <button className="ghost" onClick={clear}>ADMIN: CLEAR THESE STATS</button>}

      <h2 style={{ margin: '18px 0 10px' }}>Match log</h2>
      {shown.length === 0 && <p className="muted">No stats recorded yet.</p>}
      {shown.map(r => (
        <div className="card" key={r.challenge_id + r.roster_id}>
          <div className="row">
            <b>{r.tn_challenges?.home?.name} vs {r.tn_challenges?.away?.name}</b>
            <span className="muted">{r.tn_challenges?.match_date}</span>
          </div>
          <p className="muted">
            {r.tn_roster?.tn_teams?.name && `For ${r.tn_roster.tn_teams.name} · `}
            {r.played
              ? result(r) + Object.entries(sp.stats).map(([k, l]) => `${r.data?.[k] || 0} ${l.toLowerCase()}`).join(' · ')
              : 'Did not play'}
          </p>
        </div>
      ))}
    </>
  )
}