import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function Bell() {
  const { session } = useAuth()
  const [n, setN] = useState(0)
  useEffect(() => {
    if (!session) return
    const load = () => supabase.from('tn_notifications').select('id', { count: 'exact', head: true })
      .eq('read', false).then(({ count }) => setN(count || 0))
    load()
    const t = setInterval(load, 30000)
    window.addEventListener('notif', load)
    return () => { clearInterval(t); window.removeEventListener('notif', load) }
  }, [session?.user?.id])
  if (!session) return null
  return <Link to="/notifications">🔔{n > 0 && <span className="badge">{n}</span>}</Link>
}