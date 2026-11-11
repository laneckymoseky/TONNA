import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Bg from '../components/Bg'

const label = { team: 'Team', challenge: 'Captains', direct: 'Admin' }

export default function Rooms() {
  const [rooms, setRooms] = useState([])
  useEffect(() => {
    supabase.from('tn_rooms').select('*').order('created_at', { ascending: false }).then(({ data }) => setRooms(data || []))
  }, [])
  return (
    <div className="wrap">
      <Bg name="chat" />
      <h1>Chat rooms</h1>
      {rooms.length === 0 && <p className="muted">No rooms yet. Your team chat appears once you're on a team.</p>}
      {rooms.map(r => (
        <Link key={r.id} to={`/chat/${r.id}`} className="card row mag">
          <b>{r.title}</b><span className="tag">{label[r.type]}</span>
        </Link>
      ))}
    </div>
  )
}