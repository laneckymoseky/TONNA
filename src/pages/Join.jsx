import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Join() {
  const [teams, setTeams] = useState([])
  const [team, setTeam] = useState('')
  const [name, setName] = useState('')
  const [msg, setMsg] = useState('')
  const [done, setDone] = useState(false)
  const nav = useNavigate()
  useEffect(() => { supabase.from('tn_teams').select('id, name').order('name').then(({ data }) => setTeams(data || [])) }, [])

  async function submit(e) {
    e.preventDefault(); setMsg('')
    const { error } = await supabase.rpc('tn_claim', { p_team: team, p_name: name })
    if (error) return setMsg(error.message)
    setDone(true)
  }

  if (done) return (
    <div className="narrow">
      <h1>Request sent</h1>
      <p className="muted">Your captain needs to approve you. Your team chat appears once approved.</p>
      <button style={{ marginTop: 16 }} onClick={() => nav('/home')}>GO TO NEWS</button>
    </div>
  )
  return (
    <form className="narrow" onSubmit={submit}>
      <h1>Join a team</h1>
      <select value={team} onChange={e => setTeam(e.target.value)} required>
        <option value="">Choose your team</option>
        {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
      </select>
      <input placeholder="Name your captain registered you with" value={name} onChange={e => setName(e.target.value)} required />
      {msg && <p className="err">{msg}</p>}
      <button style={{ width: '100%' }}>REQUEST TO JOIN</button>
      <button type="button" className="ghost" style={{ width: '100%', marginTop: 10 }} onClick={() => nav('/home')}>SKIP FOR NOW</button>
    </form>
  )
}