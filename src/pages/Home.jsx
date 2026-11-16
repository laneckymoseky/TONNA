import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { SPORTS } from '../lib/sports'
import { MATCH_SELECT, dparts } from '../lib/prices'
import Bg from '../components/Bg'
import SportTabs from '../components/SportTabs'
import NewsCard from '../components/NewsCard'

export default function Home() {
  const { name, role, session } = useAuth()
  const [tab, setTab] = useState('all')
  const [list, setList] = useState([])
  const [posts, setPosts] = useState([])
  const [err, setErr] = useState('')

  const loadPosts = () => supabase.from('tn_news').select('*, tn_teams(name)')
    .order('created_at', { ascending: false }).limit(40).then(({ data }) => setPosts(data || []))
  useEffect(() => {
    supabase.from('tn_challenges').select(MATCH_SELECT).eq('status', 'accepted')
      .gte('match_date', new Date().toISOString().slice(0, 10))
      .order('match_date').order('match_time').then(({ data }) => setList(data || []))
    loadPosts()
  }, [])

  async function del(id) {
    if (!confirm('Delete this post and its comments?')) return
    const { error } = await supabase.rpc('tn_delete_news', { p_id: id })
    error ? setErr(error.message) : loadPosts()
  }
  const canDelete = p => role === 'admin' || p.author_id === session?.user?.id
  const ids = tab === 'all' ? Object.keys(SPORTS) : [tab]
  const general = posts.filter(p => !p.sport)

  return (
    <div className="wrap">
      <Bg name="news" />
      <div className="ph">
        <div className="first">Welcome back</div>
        <div className="last">{name.split(' ')[0] || 'Player'}</div>
      </div>
      {role === 'new' && (
        <div className="card">You're not on a team yet.{' '}
          <Link to="/join" style={{ color: 'var(--red)' }}>Join one</Link>,{' '}
          <Link to="/agents" style={{ color: 'var(--red)' }}>get listed as a free agent</Link> or{' '}
          <Link to="/captain" style={{ color: 'var(--red)' }}>register your own</Link>.</div>
      )}
      {(role === 'admin' || role === 'captain') && <Link to="/news/new" className="btn" style={{ marginBottom: 10 }}>POST NEWS</Link>}
      <SportTabs all value={tab} onChange={setTab} />
      {err && <p className="err">{err}</p>}

      {general.length > 0 && <h2 style={{ margin: '18px 0 10px' }}>📣 Announcements</h2>}
      {general.map(p => <NewsCard key={p.id} post={p} canDelete={canDelete(p)} onDelete={del} />)}

      {ids.map(id => {
        const sp = SPORTS[id]
        const items = list.filter(c => c.sport === id)
        const sportPosts = posts.filter(p => p.sport === id)
        return (
          <section key={id}>
            <div className="row" style={{ margin: '18px 0 10px' }}>
              <h2>{sp.icon} {sp.name}</h2>
              <Link to={`/sport/${id}`} className="muted">Dashboard →</Link>
            </div>
            {sportPosts.map(p => <NewsCard key={p.id} post={p} canDelete={canDelete(p)} onDelete={del} />)}
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