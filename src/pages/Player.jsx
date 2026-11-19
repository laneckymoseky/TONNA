import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { SPORTS } from '../lib/sports'
import Bg from '../components/Bg'
import Avatar from '../components/Avatar'
import StatusBar from '../components/StatusBar'
import Portfolio from '../components/Portfolio'
import PlayerStats from '../components/PlayerStats'

export default function Player() {
  const { id } = useParams()
  const { session, team } = useAuth()
  const nav = useNavigate()
  const [p, setP] = useState(undefined)
  const [err, setErr] = useState('')

  useEffect(() => {
    supabase.from('tn_roster').select('*, tn_teams(id, name, sport)').eq('id', id).maybeSingle().then(({ data }) => setP(data))
  }, [id])

  async function chat() {
    setErr('')
    const { data, error } = await supabase.rpc('tn_open_dm', { p_user: p.user_id })
    error ? setErr(error.message) : nav('/chat/' + data)
  }
  async function offer() {
    const message = window.prompt('Message to the player (optional)')
    if (message === null) return
    setErr('')
    const { error } = await supabase.rpc('tn_offer_transfer', { p_slot: p.id, p_pos: p.pos, p_message: message })
    error ? setErr(error.message) : nav('/transfers')
  }

  if (p === undefined) return <p className="wrap muted">Loading…</p>
  if (!p) return <p className="wrap muted">This profile is private or doesn't exist.</p>

  const sp = SPORTS[p.tn_teams?.sport] || SPORTS.football
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
            <span className="tag">Worth {Number(p.worth || 0).toFixed(1)}m</span>{' '}
            {p.status === 'left' && <><span className="tag">Former player</span>{' '}</>}
            {p.tn_teams && <Link to={`/team/${p.tn_teams.id}`}>{sp.icon} {p.tn_teams.name}</Link>}
          </p>
        </div>
      </div>

      {p.status === 'active' && <StatusBar rosterId={p.id} />}
      {p.status === 'active' && p.user_id && p.user_id !== session.user.id &&
        <button onClick={chat} style={{ marginBottom: 12 }}>CHAT WITH {first.toUpperCase()}</button>}
      {team && p.status === 'active' && p.user_id && p.tn_teams?.id !== team.id && p.tn_teams?.sport === team.sport &&
        <button className="ghost" style={{ margin: '0 0 12px 8px' }} onClick={offer}>MAKE TRANSFER OFFER</button>}
      {!p.user_id && <p className="muted" style={{ marginBottom: 12 }}>Hasn't signed up yet, so chat isn't available.</p>}
      {err && <p className="err">{err}</p>}

      <PlayerStats userId={p.user_id} slotId={p.id} sport={p.tn_teams?.sport} />
      <Portfolio userId={p.user_id} slotId={p.id} />
    </div>
  )
}