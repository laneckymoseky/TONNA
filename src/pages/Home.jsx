import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { SPORTS } from '../lib/sports'
import { MATCH_SELECT, dparts } from '../lib/prices'
import Bg from '../components/Bg'
import SportTabs from '../components/SportTabs'

export default function Home() {
  const { name, role } = useAuth()
  const [tab, setTab] = useState('all')
  const [list, setList] = useState([])
  useEffect(() => {
    supabase.from('tn_challenges').select(MATCH_SELECT).eq('status', 'accepted')
      .gte('match_date', new Date().toISOString().slice(0, 10))
      .order('match_date').order('match_time').then(({ data }) => setList(data || []))
  }, [])
  const ids = tab === 'all' ? Object.keys(SPORTS) : [tab]
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
      <SportTabs all value={tab} onChange={setTab} />
      {ids.map(id => {
        const sp = SPORTS[id]
        const items = list.filter(c => c.sport === id)
        return (
          <section key={id}>
            <div className="row" style={{ margin: '18px 0 10px' }}>
              <h2>{sp.icon} {sp.name}</h2>
              <Link to={`/sport/${id}`} className="muted">Dashboard →</Link>
            </div>
            {items.length === 0 && <p className="muted">No upcoming {sp.name.toLowerCase()} games.</p>}
            {items.map(c => {
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
          </section>
        )
      })}
    </div>
  )
}