import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Bg from '../components/Bg'
import Avatar from '../components/Avatar'
import StatsGrid from '../components/StatsGrid'

export default function Player() {
  const { id } = useParams()
  const { session } = useAuth()
  const nav = useNavigate()
  const [p, setP] = useState(undefined)
  const [rows, setRows] = useState([])
  const [err, setErr] = useState('')

  useEffect(() => {
    supabase.from('tn_roster').select('*, tn_teams(id, name)').eq('id', id).maybeSingle().then(({ data }) => setP(data))
    supabase.from('tn_stats')
      .select('*, tn_challenges(match_date, home:tn_teams!from_team(name), away:tn_teams!to_team(name))')
      .eq('roster_id', id).then(({ data }) =>
        setRows((data || []).sort((a, b) => (b.tn_challenges?.match_date || '').localeCompare(a.tn_challenges?.match_date || ''))))
  }, [id])

  async function chat() {
    setErr('')
    const { data, error } = await supabase.rpc('tn_open_dm', { p_user: p.user_id })
    error ? setErr(error.message) : nav('/chat/' + data)
  }

  if (p === undefined) return <p className="wrap muted">Loading…</p>
  if (!p) return <p className="wrap muted">Player not found.</p>

  const parts = p.player_name.split(' ')
  const first = parts.length > 1 ? parts[0] : p.pos
  const last = parts.length > 1 ? parts.slice(1).join(' ') : parts[0]

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
            {p.tn_teams && <Link to={`/team/${p.tn_teams.id}`}>{p.tn_teams.name}</Link>}
          </p>
        </div>
      </div>

      {p.user_id && p.user_id !== session.user.id && <button onClick={chat} style={{ marginBottom: 12 }}>CHAT WITH {first.toUpperCase()}</button>}
      {!p.user_id && <p className="muted" style={{ marginBottom: 12 }}>Hasn't signed up yet, so chat isn't available.</p>}
      {err && <p className="err">{err}</p>}

      <h2 style={{ margin: '10px 0' }}>Statistics</h2>
      <StatsGrid rows={rows} />

      <h2 style={{ margin: '18px 0 10px' }}>Match log</h2>
      {rows.length === 0 && <p className="muted">No stats recorded yet.</p>}
      {rows.map(r => (
        <div className="card" key={r.challenge_id}>
          <div className="row">
            <b>{r.tn_challenges?.home?.name} vs {r.tn_challenges?.away?.name}</b>
            <span className="muted">{r.tn_challenges?.match_date}</span>
          </div>
          <p className="muted">
            {r.played ? `${r.goals} goals · ${r.assists} assists · ${r.saves} saves · ${r.yellow} yellow · ${r.red} red` : 'Did not play'}
          </p>
        </div>
      ))}
    </div>
  )
}