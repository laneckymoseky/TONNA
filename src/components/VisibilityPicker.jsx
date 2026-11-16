import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function VisibilityPicker() {
  const { session } = useAuth()
  const [v, setV] = useState('public')
  const [msg, setMsg] = useState('')
  useEffect(() => {
    supabase.from('tn_people').select('visibility').eq('user_id', session.user.id).maybeSingle()
      .then(({ data }) => data && setV(data.visibility))
  }, [])
  async function change(e) {
    const nv = e.target.value
    setV(nv)
    const { error } = await supabase.rpc('tn_set_visibility', { p_vis: nv })
    setMsg(error ? error.message : 'Saved ✓')
  }
  return (
    <div className="card row">
      <span><b>Profile visibility</b><br />
        <span className="muted">Private hides you from other teams, the pool and the market. Your captain and admins still see you. {msg}</span></span>
      <select style={{ width: 'auto', margin: 0 }} value={v} onChange={change}>
        <option value="public">Public</option>
        <option value="team">My team only</option>
        <option value="private">Private</option>
      </select>
    </div>
  )
}