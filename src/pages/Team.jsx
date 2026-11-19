import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { SPORTS, fmtLabel } from '../lib/sports'
import { useBooked } from '../lib/useBooked'
import Bg from '../components/Bg'
import Pitch from '../components/Pitch'

export default function Team() {
  const { teamId } = useParams()
  const { team: myTeam } = useAuth()
  const nav = useNavigate()
  const [team, setTeam] = useState(null)
  const [slots, setSlots] = useState([])
  const [err, setErr] = useState('')
  const { booked } = useBooked(teamId)

  useEffect(() => {
    supabase.from('tn_teams').select('name, sport, format, town, county').eq('id', teamId).maybeSingle().then(({ data }) => setTeam(data))
    supabase.from('tn_roster').select('*').eq('team_id', teamId).in('status', ['active', 'open'])
      .order('created_at').then(({ data }) => setSlots(data || []))
  }, [teamId])

  const scouting = !!myTeam && myTeam.id !== teamId && myTeam.sport === team?.sport
  const sp = SPORTS[team?.sport] || SPORTS.football

  async function offer(s) {
    const message = window.prompt('Message to the player (optional)')
    if (message === null) return
    setErr('')
    const { error } = await supabase.rpc('tn_offer_transfer', { p_slot: s.id, p_pos: s.pos, p_message: message })
    error ? setErr(error.message) : nav('/transfers')
  }

  return (
    <div className="wrap">
      <Bg name="team" />
      <h1 style={{ marginBottom: 4 }}>{team?.name || 'Team'}</h1>
      <p className="muted" style={{ marginBottom: 12 }}>
        {sp.icon} {sp.name}{team && <> · {fmtLabel(team.sport, team.format)}</>}
        {(team?.town || team?.county) && <> · {[team.town, team.county].filter(Boolean).join(', ')}</>}
      </p>
      {err && <p className="err">{err}</p>}

      <div className="legend">
        <span><i style={{ background: '#3ddc84' }} />Booked for next game</span>
        <span><i style={{ background: '#f5b301' }} />Not booked</span>
        <span>✓ signed up</span>
      </div>
      <Pitch slots={slots} sport={team?.sport} booked={booked} />

      <h2 style={{ margin: '18px 0 10px' }}>Squad</h2>
      {slots.length === 0 && <p className="muted">No players to show.</p>}
      {slots.map(s => (
        <div className="card row" key={s.id}>
          <span><b>{s.player_name}</b> <span className="tag">{s.pos}</span>{' '}
            <span className="muted">Worth {Number(s.worth || 0).toFixed(1)}m</span></span>
          <span>
            <Link to={`/player/${s.id}`} className="btn ghost">STATS</Link>
            {scouting && s.status === 'active' && s.user_id && <button onClick={() => offer(s)}>OFFER</button>}
          </span>
        </div>
      ))}
      {myTeam && myTeam.id !== teamId && !scouting && team &&
        <p className="muted" style={{ marginTop: 12 }}>This team plays a different sport, so transfer offers aren't available.</p>}
    </div>
  )
}