import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useSport } from '../context/SportContext'
import { SPORTS, fmtLabel } from '../lib/sports'
import { useBooked } from '../lib/useBooked'
import Bg from '../components/Bg'
import Pitch from '../components/Pitch'
import DynamicFields from '../components/DynamicFields'
import WorthPanel from '../components/WorthPanel'
import LineupWarning from '../components/LineupWarning'


export default function Captain() {
  const { session, refresh } = useAuth()
  const { setSport } = useSport()
  const [team, setTeam] = useState(null)
  const [slots, setSlots] = useState([])
  const [venues, setVenues] = useState([])
  const [loading, setLoading] = useState(true)
  const [f, setF] = useState({ name: '', sport: 'football', format: 11, county: '', town: '', home: '' })
  const [answers, setAnswers] = useState({})
  const [name, setName] = useState('')
  const [pos, setPos] = useState('')
  const [msg, setMsg] = useState('')
  const { booked, next } = useBooked(team?.id)

  async function load() {
    const { data: t } = await supabase.from('tn_teams').select('*').eq('captain_id', session.user.id).maybeSingle()
    setTeam(t)
    const { data: v } = await supabase.from('tn_fields').select('id, name, sports').order('name')
    setVenues(v || [])
    if (t) {
      const { data } = await supabase.from('tn_roster').select('*').eq('team_id', t.id).neq('status', 'left').order('created_at')
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

  async function createTeam(e) {
    e.preventDefault(); setMsg('')
    const { error } = await supabase.rpc('tn_register_team', {
      p_name: f.name, p_sport: f.sport, p_format: f.format,
      p_county: f.county, p_town: f.town, p_home: f.home || null, p_answers: answers,
    })
    if (error) return setMsg(error.message)
    setSport(f.sport); await refresh(); load()
  }

  if (loading) return <p className="wrap muted">Loading…</p>

  if (!team) return (
    <form className="narrow" onSubmit={createTeam}>
      <Bg name="team" />
      <h1>Register your team</h1>
      <input placeholder="Team name" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} required />
      <select value={f.sport} onChange={e => {
        const s = e.target.value
        setF({ ...f, sport: s, format: +Object.keys(SPORTS[s].formats)[0], home: '' })
      }}>
        {Object.entries(SPORTS).map(([id, s]) => <option key={id} value={id}>{s.icon} {s.name}</option>)}
      </select>
      <select value={f.format} onChange={e => setF({ ...f, format: +e.target.value })}>
        {Object.entries(SPORTS[f.sport].formats).map(([size, [label, max]]) =>
          <option key={size} value={size}>{label} · up to {max} players</option>)}
      </select>
      <input placeholder="County" value={f.county} onChange={e => setF({ ...f, county: e.target.value })} />
      <input placeholder="Town / area" value={f.town} onChange={e => setF({ ...f, town: e.target.value })} />
      <select value={f.home} onChange={e => setF({ ...f, home: e.target.value })}>
        <option value="">Home ground (optional)</option>
        {venues.filter(v => v.sports?.includes(f.sport)).map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
      </select>
      <DynamicFields scope="team" value={answers} onChange={setAnswers} />
      <p className="muted" style={{ marginBottom: 10 }}>Sport and format can't be changed later.</p>
      {msg && <p className="err">{msg}</p>}
      <button style={{ width: '100%' }}>CREATE TEAM</button>
    </form>
  )

  const sp = SPORTS[team.sport] || SPORTS.football
  const max = sp.formats[team.format]?.[1] || 13
  const posList = Object.entries(sp.positions)
  const home = venues.find(v => v.id === team.home_field_id)?.name
  const pending = slots.filter(s => s.status === 'pending')
  const onPitch = slots.filter(s => s.status !== 'pending')

  const addPlayer = e => {
    e.preventDefault()
    run(supabase.from('tn_roster').insert({ team_id: team.id, player_name: name.trim(), pos: pos || posList[0][0] }), () => setName(''))
  }
  const answer = (id, ok) => run(supabase.rpc('tn_answer_claim', { p_slot: id, p_approve: ok }))
  const remove = id => { if (confirm('Remove this player? Their stats and history are kept.')) run(supabase.rpc('tn_remove_player', { p_slot: id })) }

  return (
    <div className="wrap">
      <Bg name="team" />
      <div className="row">
        <h1 style={{ marginBottom: 4 }}>{team.name}</h1>
        <Link to="/stats" className="btn">ADD MATCH STATS</Link>
      </div>
      <p className="muted" style={{ marginBottom: 12 }}>
        {sp.icon} {sp.name} · {fmtLabel(team.sport, team.format)} · ROSTER {slots.length}/{max}
        {(team.town || team.county) && <> · {[team.town, team.county].filter(Boolean).join(', ')}</>}
        {home && <> · Home: {home}</>}
      </p>
      {msg && <p className="err">{msg}</p>}
      <LineupWarning teamId={team.id} />

      {slots.length < max && (
        <form className="card row" onSubmit={addPlayer} style={{ flexWrap: 'wrap' }}>
          <input style={{ flex: 2, margin: 0 }} placeholder="Player name (exact spelling)" value={name} onChange={e => setName(e.target.value)} required />
          <select style={{ flex: 1, margin: 0 }} value={pos || posList[0][0]} onChange={e => setPos(e.target.value)}>
            {posList.map(([k, l]) => <option key={k} value={k}>{k} · {l}</option>)}
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

      {next ? (
  <div className="card row">
    <span><b>Next game:</b> {next.home?.name} vs {next.away?.name}<br />
      <span className="muted">{next.match_date} · {next.match_time?.slice(0, 5)}</span></span>
    <Link to={`/squad/${next.id}`} className="btn">PICK SQUAD</Link>
  </div>
) : <p className="muted">No upcoming game. Accepted challenges show up here.</p>}
<div className="legend">
  <span><i style={{ background: '#3ddc84' }} />Booked for next game</span>
  <span><i style={{ background: '#f5b301' }} />Not booked</span>
  <span>✓ signed up</span>
</div>
<Pitch slots={onPitch} onRemove={remove} sport={team.sport} booked={booked} />
<WorthPanel slots={onPitch} onSaved={load} />
    </div>
  )
}