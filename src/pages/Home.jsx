import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { MATCH_SELECT, dparts } from '../lib/prices'
import Bg from '../components/Bg'

export default function Home() {
  const { name, role } = useAuth()
  const [list, setList] = useState([])
  useEffect(() => {
    supabase.from('tn_challenges').select(MATCH_SELECT).eq('status', 'accepted')
      .gte('match_date', new Date().toISOString().slice(0, 10))
      .order('match_date').order('match_time').then(({ data }) => setList(data || []))
  }, [])
  return (
    <div className="wrap">
      <Bg name="news" />
      <div className="ph">
        <div className="first">Welcome back</div>
        <div className="last">{name.split(' ')[0] || 'Player'}</div>
      </div>
      {role === 'new' && (
        <div className="card">You're not on a team yet.{' '}
          <Link to="/join" style={{ color: 'var(--red)' }}>Join one</Link> or{' '}
          <Link to="/captain" style={{ color: 'var(--red)' }}>register your own</Link>.</div>
      )}
      <h2 style={{ margin: '18px 0 12px' }}>Upcoming tournaments</h2>
      {list.length === 0 && <p className="muted">Nothing scheduled yet.</p>}
      {list.map(c => {
        const [day, mon] = dparts(c.match_date)
        return (
          <div key={c.id}>
            <div className="card match mag">
              <div className="date"><b>{day}</b>{mon}</div>
              <span className="t">{c.home?.name}</span>
              <span className="vs">VS</span>
              <span className="t r">{c.away?.name}</span>
            </div>
            <p className="match-meta">{c.match_time?.slice(0, 5)} · {c.field?.name}</p>
          </div>
        )
      })}
    </div>
  )
}