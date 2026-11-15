import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { SPORTS, fmtLabel } from '../lib/sports'
import Bg from '../components/Bg'
import Pitch from '../components/Pitch'

export default function Team() {
  const { teamId } = useParams()
  const [team, setTeam] = useState(null)
  const [slots, setSlots] = useState([])
  useEffect(() => {
    supabase.from('tn_teams').select('name, sport, format, town, county').eq('id', teamId).maybeSingle().then(({ data }) => setTeam(data))
    supabase.from('tn_roster').select('*').eq('team_id', teamId).in('status', ['active', 'open'])
      .order('created_at').then(({ data }) => setSlots(data || []))
  }, [teamId])
  const sp = SPORTS[team?.sport] || SPORTS.football
  return (
    <div className="wrap">
      <Bg name="team" />
      <h1 style={{ marginBottom: 4 }}>{team?.name || 'Team'}</h1>
      <p className="muted" style={{ marginBottom: 12 }}>
        {sp.icon} {sp.name}{team && <> · {fmtLabel(team.sport, team.format)}</>} · tap a player to open their profile
      </p>
      <Pitch slots={slots} sport={team?.sport} />
    </div>
  )
}