import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { SPORTS } from '../lib/sports'
import Bg from '../components/Bg'
import Avatar from '../components/Avatar'
import StatsGrid from '../components/StatsGrid'
import StatusBar from '../components/StatusBar'
import Portfolio from '../components/Portfolio'

export default function Player() {
  const { id } = useParams()
  const { session } = useAuth()
  const nav = useNavigate()
  const [p, setP] = useState(undefined)
  const [rows, setRows] = useState([])
  const [err, setErr] = useState('')

  useEffect(() => {
    supabase.from('tn_roster').select('*, tn_teams(id, name, sport)').eq('id', id).maybeSingle().then(({ data }) => setP(data))
    supabase.from('tn_stats')
      .select('*, tn_challenges(match_date, status, from_team, to_team, home_score, away_score, home:tn_teams!from_team(name), away:tn_teams!to_team(name))')
      .eq('roster_id', id).then(({ data }) =>
        setRows((data || []).sort((a, b) => (b.tn_challenges?.match_date || '').localeCompare(a.tn_challenges?.match_date || ''))))
  }, [id])

  async function chat() {
    setErr('')
    const { data, error } = await supabase.rpc('tn_open_dm', { p_user: p.user_id })
    error ? setErr(error.message) : nav('/chat/' + data)
  }

  if (p === undefined) return <p className="wrap muted">Loading…</p>
  if (!p) return <p className="wrap muted">This profile is private or doesn't exist.</p>

  const sp = SPORTS[p.tn_teams?.sport] || SPORTS.football
  const parts = p.player_name.split(' ')
  const first = parts.length > 1 ? parts[0] : p.pos
  const last = parts.length > 1 ? parts.slice(1).join(' ') : parts[0]

  const result = r => {
    const c = r.tn_challenges
    if (!c || c.status !== 'played') return ''
    const [a, b] = c.from_team === p.team_id ? [c.home_score, c.away_score] : [c.away_score, c.home_score]
    return `${a > b ? 'W' : a < b ? 'L' : 'D'} ${a}–${b} · `
  }

  return (
    <div className="wrap">
      <Bg name="profile" />
      <div className="pbanner">
        <Avatar url={p.photo_url} name={p.player_name} />
        <div className="ph">
          <div className="first">{first}</div>
          <div className="last">{last}</div>
          <p className="muted" style={{ marginTop: 8 }}>
            <span className="tag">{p.pos}</span>{' '}
            {p.status === 'left' && <><span className="tag">Former player</span>{' '}</>}
            {p.tn_teams && <Link to={`/team/${p.tn_teams.id}`}>{sp.icon} {p.tn_teams.name}</Link>}
          </p>
        </div>
      </div>

      {p.status === 'active' && <StatusBar rosterId={p.id} />}
      {p.status === 'active' && p.user_id && p.user_id !== session.user.id &&
        <button onClick={chat} style={{ marginBottom: 12 }}>CHAT WITH {first.toUpperCase()}</button>}
      {!p.user_id && <p className="muted" style={{ marginBottom: 12 }}>Hasn't signed up yet, so chat isn't available.</p>}
      {err && <p className="err">{err}</p>}

      <h2 style={{ margin: '10px 0' }}>Statistics</h2>
      <StatsGrid rows={rows} sport={p.tn_teams?.sport} />

      <Portfolio userId={p.user_id} slotId={p.id} />

      <h2 style={{ margin: '18px 0 10px' }}>Match log</h2>
      {rows.length === 0 && <p className="muted">No stats recorded yet.</p>}
      {rows.map(r => (
        <div className="card" key={r.challenge_id}>
          <div className="row">
            <b>{r.tn_challenges?.home?.name} vs {r.tn_challenges?.away?.name}</b>
            <span className="muted">{r.tn_challenges?.match_date}</span>
          </div>
          <p className="muted">
            {r.played
              ? result(r) + Object.entries(sp.stats).map(([k, l]) => `${r.data?.[k] || 0} ${l.toLowerCase()}`).join(' · ')
              : 'Did not play'}
          </p>
        </div>
      ))}
    </div>
  )
}