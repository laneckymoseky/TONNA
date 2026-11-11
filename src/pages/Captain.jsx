import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Bg from '../components/Bg'

const ROWS = ['FWD', 'MID', 'DEF', 'GK']

function Chip({ s, onRemove }) {
  const ini = s.player_name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  return (
    <div className="chip">
      <div className={'dot ' + s.status}>{ini}</div>
      <small>{s.player_name}</small>
      <button className="x" title="Remove" onClick={() => onRemove(s.id)}>×</button>
    </div>
  )
}

export default function Captain() {
  const { session, refresh } = useAuth()
  const [team, setTeam] = useState(null)
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(true)
  const [teamName, setTeamName] = useState('')
  const [name, setName] = useState('')
  const [pos, setPos] = useState('MID')
  const [msg, setMsg] = useState('')

  async function load() {
    const { data: t } = await supabase.from('tn_teams').select('*').eq('captain_id', session.user.id).maybeSingle()
    setTeam(t)
    if (t) {
      const { data } = await supabase.from('tn_roster').select('*').eq('team_id', t.id).order('created_at')
      setSlots(data || [])
    }
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function run(promise, after) {
    const { error } = await promise
    if (error) return setMsg(error.message)
    setMsg(''); after?.(); load()
  }

  const createTeam = e => { e.preventDefault(); run(supabase.rpc('tn_register_team', { p_name: teamName }), refresh) }
  const addPlayer = e => {
    e.preventDefault()
    run(supabase.from('tn_roster').insert({ team_id: team.id, player_name: name.trim(), pos }), () => setName(''))
  }
  const answer = (id, ok) => run(supabase.rpc('tn_answer_claim', { p_slot: id, p_approve: ok }))
  const remove = id => run(supabase.from('tn_roster').delete().eq('id', id))

  if (loading) return <p className="wrap muted">Loading…</p>

  if (!team) return (
    <form className="narrow" onSubmit={createTeam}>
      <Bg name="team" />
      <h1>Register your team</h1>
      <input placeholder="Team name" value={teamName} onChange={e => setTeamName(e.target.value)} required />
      {msg && <p className="err">{msg}</p>}
      <button style={{ width: '100%' }}>CREATE TEAM</button>
    </form>
  )

  const pending = slots.filter(s => s.status === 'pending')
  const onPitch = slots.filter(s => s.status !== 'pending')

  return (
    <div className="wrap">
      <Bg name="team" />
      <h1 style={{ marginBottom: 4 }}>{team.name}</h1>
      <p className="muted" style={{ marginBottom: 12 }}>ROSTER {slots.length}/13</p>
      {msg && <p className="err">{msg}</p>}

      {slots.length < 13 && (
        <form className="card row" onSubmit={addPlayer} style={{ flexWrap: 'wrap' }}>
          <input style={{ flex: 2, margin: 0 }} placeholder="Player name (exact spelling)" value={name} onChange={e => setName(e.target.value)} required />
          <select style={{ flex: 1, margin: 0 }} value={pos} onChange={e => setPos(e.target.value)}>
            <option value="GK">GK</option><option value="DEF">DEF</option><option value="MID">MID</option><option value="FWD">FWD</option>
          </select>
          <button>ADD</button>
        </form>
      )}

      {pending.length > 0 && <h2 style={{ margin: '16px 0 10px', color: 'var(--red)' }}>Join requests</h2>}
      {pending.map(s => (
        <div className="card row" key={s.id}>
          <span><b>{s.player_name}</b> <span className="tag">{s.pos}</span></span>
          <span>
            <button onClick={() => answer(s.id, true)}>APPROVE</button>{' '}
            <button className="ghost" onClick={() => answer(s.id, false)}>REJECT</button>
          </span>
        </div>
      ))}

      <div className="legend">
        <span><i style={{ background: '#3ddc84' }} />Signed up</span>
        <span><i style={{ background: '#f5b301' }} />Not signed up yet</span>
      </div>
      <div className="pitch">
        {ROWS.map(r => {
          const list = onPitch.filter(s => s.pos === r)
          return (
            <div className="pl-row" key={r}>
              {list.length === 0 && <span className="empty">NO {r}</span>}
              {list.map(s => <Chip key={s.id} s={s} onRemove={remove} />)}
            </div>
          )
        })}
      </div>
    </div>
  )
}