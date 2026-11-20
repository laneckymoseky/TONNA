import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Bg from '../components/Bg'
import PushToggle from '../components/PushToggle'

export default function Notifications() {
  const nav = useNavigate()
  const [list, setList] = useState([])
  const load = () => supabase.from('tn_notifications').select('*').order('created_at', { ascending: false }).limit(50)
    .then(({ data }) => setList(data || []))
  useEffect(() => { load() }, [])

  async function open(n) {
    if (!n.read) { await supabase.from('tn_notifications').update({ read: true }).eq('id', n.id); window.dispatchEvent(new Event('notif')) }
    if (n.link) nav(n.link); else load()
  }
  async function readAll() {
    await supabase.from('tn_notifications').update({ read: true }).eq('read', false)
    window.dispatchEvent(new Event('notif')); load()
  }
  return (
    <div className="wrap">
      <Bg name="news" />
      <div className="row"><h1>Notifications</h1><button className="ghost" onClick={readAll}>MARK ALL READ</button></div>
      <PushToggle />
      {list.length === 0 && <p className="muted">Nothing yet.</p>}
      {list.map(n => (
        <div key={n.id} className="card mag" style={{ cursor: 'pointer', borderColor: n.read ? undefined : 'var(--red)' }} onClick={() => open(n)}>
          <p>{!n.read && '● '}{n.body}</p>
          <p className="muted" style={{ fontSize: 13 }}>{new Date(n.created_at).toLocaleString()}</p>
        </div>
      ))}
    </div>
  )
}