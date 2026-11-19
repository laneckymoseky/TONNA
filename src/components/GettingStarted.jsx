import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSport } from '../context/SportContext'

export default function GettingStarted() {
  const { session, role, slot, team } = useAuth()
  const { sport } = useSport()
  const uid = session?.user?.id
  const fk = 'gs:' + uid
  const [flags, setFlags] = useState({})
  const [hidden, setHidden] = useState(true)

  useEffect(() => {
    try { setFlags(JSON.parse(localStorage.getItem(fk) || '{}')) } catch {}
    try { setHidden(localStorage.getItem(fk + ':hide') === '1') } catch { setHidden(false) }
  }, [uid])

  if (!uid || role === 'admin' || hidden) return null

  const mark = k => {
    const n = { ...flags, [k]: true }
    setFlags(n)
    try { localStorage.setItem(fk, JSON.stringify(n)) } catch {}
  }
  const hide = () => { setHidden(true); try { localStorage.setItem(fk + ':hide', '1') } catch {} }

  const photo = !!(slot?.photo_url || team?.captain_photo)
  const photoItem = { k: 'photo', title: 'Add a profile photo', text: 'A portrait photo shows on your profile and on the pitch.', to: '/profile', label: 'Profile', done: photo }
  const dash = { k: 'dash', title: 'Explore your sport\'s dashboard', text: 'Standings, top players and every team.', to: `/sport/${sport}`, label: 'Dashboard' }

  const items = role === 'captain' ? [
    { k: 'roster', title: 'Add players to your roster', text: 'Exact names and positions. They join using that name.', to: '/captain', label: 'My Team' },
    { k: 'chal', title: 'Challenge another team', text: 'Pick a venue, date and time.', to: '/challenge', label: 'Challenge' },
    photoItem, dash,
  ] : role === 'player' ? [
    { k: 'team', title: 'Check out your team', text: 'Tap a player to see their profile and stats.', to: slot ? `/team/${slot.team_id}` : '/home', label: 'My Team' },
    photoItem, dash,
    { k: 'chat', title: 'Say hi in your team chat', text: 'Your team room is waiting.', to: '/rooms', label: 'Chat' },
  ] : [
    { k: 'join', title: 'Get on a team', text: 'Join with the name your captain registered, get listed as a free agent, or register your own team.', to: '/join', label: 'Join a team', done: false },
    { k: 'agent', title: 'Or list yourself as a free agent', text: 'Captains can then invite you.', to: '/agents', label: 'Free agents' },
    photoItem, dash,
  ]

  const rows = items.map(it => ({ ...it, done: it.done ?? !!flags[it.k] }))
  const n = rows.filter(r => r.done).length
  if (n === rows.length) return null

  return (
    <div className="card">
      <div className="row">
        <b>🚀 Getting started · {n}/{rows.length}</b>
        <button className="ghost" style={{ padding: '4px 10px', fontSize: 12 }} onClick={hide}>HIDE</button>
      </div>
      {rows.map(r => (
        <div className="row" key={r.k} style={{ marginTop: 10, alignItems: 'flex-start' }}>
          <span style={{ opacity: r.done ? .55 : 1 }}>{r.done ? '✅' : '⬜'} <b>{r.title}</b><br />
            <span className="muted" style={{ fontSize: 14 }}>{r.text}</span></span>
          {!r.done && <Link className="btn" style={{ margin: 0, padding: '6px 12px', whiteSpace: 'nowrap' }} to={r.to} onClick={() => mark(r.k)}>{r.label} ›</Link>}
        </div>
      ))}
    </div>
  )
}