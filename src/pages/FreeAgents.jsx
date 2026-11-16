import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { SPORTS } from '../lib/sports'
import Bg from '../components/Bg'

function PlayerView() {
  const { session, slot, refresh } = useAuth()
  const nav = useNavigate()
  const [mine, setMine] = useState(null)
  const [invites, setInvites] = useState([])
  const [f, setF] = useState({ sport: 'football', pos: 'GK', county: '', town: '', note: '' })
  const [err, setErr] = useState('')

  async function load() {
    const uid = session.user.id
    const { data: a } = await supabase.from('tn_free_agents').select('*').eq('user_id', uid).maybeSingle()
    setMine(a)
    if (a) setF({ sport: a.sport, pos: a.pos, county: a.county || '', town: a.town || '', note: a.note || '' })
    else {
      const { data: p } = await supabase.from('tn_people').select('county, town, sport').eq('user_id', uid).maybeSingle()
      if (p) { const s = SPORTS[p.sport] ? p.sport : 'football'
        setF(x => ({ ...x, sport: s, pos: Object.keys(SPORTS[s].positions)[0], county: p.county || '', town: p.town || '' })) }
    }
    const { data: iv } = await supabase.from('tn_invites').select('*, tn_teams(name, sport, town, county)')
      .eq('user_id', uid).eq('status', 'pending')
    setInvites(iv || [])
  }
  useEffect(() => { load() }, [])

  async function run(p, after) {
    setErr('')
    const { error } = await p
    if (error) return setErr(error.message)
    after ? await after() : load()
  }
  const list = e => { e.preventDefault(); run(supabase.rpc('tn_list_free_agent', { p_sport: f.sport, p_pos: f.pos, p_county: f.county, p_town: f.town, p_note: f.note })) }
  const answer = (id, ok) => run(supabase.rpc('tn_answer_invite', { p_invite: id, p_accept: ok }),
    async () => { if (ok) { await refresh(); nav('/home') } else load() })

  if (slot) return <div className="card">You're already on a team, so you don't need the pool.</div>
  return (
    <>
      {err && <p className="err">{err}</p>}
      {invites.length > 0 && <h2 style={{ margin: '8px 0 10px', color: 'var(--red)' }}>Invites</h2>}
      {invites.map(i => (
        <div className="card" key={i.id}>
          <div className="row">
            <span>{SPORTS[i.tn_teams?.sport]?.icon} <b>{i.tn_teams?.name}</b> <span className="tag">{i.pos}</span></span>
            <span><button onClick={() => answer(i.id, true)}>JOIN</button>{' '}
              <button className="ghost" onClick={() => answer(i.id, false)}>NO THANKS</button></span>
          </div>
          {i.message && <p className="muted" style={{ marginTop: 6 }}>"{i.message}"</p>}
        </div>
      ))}

      <h2 style={{ margin: '12px 0 10px' }}>{mine?.active ? "You're listed" : 'Looking for a team?'}</h2>
      <form className="card" onSubmit={list}>
        <select value={f.sport} onChange={e => setF({ ...f, sport: e.target.value, pos: Object.keys(SPORTS[e.target.value].positions)[0] })}>
          {Object.entries(SPORTS).map(([id, s]) => <option key={id} value={id}>{s.icon} {s.name}</option>)}
        </select>
        <select value={f.pos} onChange={e => setF({ ...f, pos: e.target.value })}>
          {Object.entries(SPORTS[f.sport].positions).map(([k, l]) => <option key={k} value={k}>{k} · {l}</option>)}
        </select>
        <input placeholder="County" value={f.county} onChange={e => setF({ ...f, county: e.target.value })} />
        <input placeholder="Town / area" value={f.town} onChange={e => setF({ ...f, town: e.target.value })} />
        <input placeholder="Note to captains (optional)" value={f.note} onChange={e => setF({ ...f, note: e.target.value })} />
        <button style={{ width: '100%' }}>{mine?.active ? 'UPDATE LISTING' : 'LIST ME'}</button>
        {mine?.active && <button type="button" className="ghost" style={{ width: '100%', marginTop: 10 }}
          onClick={() => run(supabase.rpc('tn_unlist_free_agent'))}>REMOVE ME FROM THE POOL</button>}
      </form>
      <p className="muted">Only captains can see the pool.</p>
    </>
  )
}

function CaptainView({ team }) {
  const sp = SPORTS[team.sport]
  const [agents, setAgents] = useState([])
  const [sent, setSent] = useState([])
  const [flt, setFlt] = useState({ pos: '', area: '' })
  const [ipos, setIpos] = useState({})
  const [imsg, setImsg] = useState({})
  const [err, setErr] = useState('')

  async function load() {
    const { data: a } = await supabase.from('tn_free_agents').select('*').eq('active', true).eq('sport', team.sport).order('created_at', { ascending: false })
    setAgents(a || [])
    const { data: s } = await supabase.from('tn_invites').select('*').eq('team_id', team.id).eq('status', 'pending')
    setSent(s || [])
  }
  useEffect(() => { load() }, [])

  async function run(p) { setErr(''); const { error } = await p; error ? setErr(error.message) : load() }
  const invite = a => run(supabase.rpc('tn_invite_agent', { p_user: a.user_id, p_pos: ipos[a.user_id] || a.pos, p_message: imsg[a.user_id] || '' }))
  const invited = new Set(sent.map(s => s.user_id))
  const shown = agents.filter(a =>
    (!flt.pos || a.pos === flt.pos) &&
    (!flt.area || `${a.county || ''} ${a.town || ''}`.toLowerCase().includes(flt.area.toLowerCase())))

  return (
    <>
      <p className="muted" style={{ marginBottom: 12 }}>{sp.icon} {sp.name} players looking for a team</p>
      {err && <p className="err">{err}</p>}
      <div className="row" style={{ gap: 10 }}>
        <select value={flt.pos} onChange={e => setFlt({ ...flt, pos: e.target.value })}>
          <option value="">Any position</option>
          {Object.entries(sp.positions).map(([k, l]) => <option key={k} value={k}>{k} · {l}</option>)}
        </select>
        <input placeholder="Area (town or county)" value={flt.area} onChange={e => setFlt({ ...flt, area: e.target.value })} />
      </div>
      {shown.length === 0 && <p className="muted">Nobody matches right now.</p>}
      {shown.map(a => (
        <div className="card" key={a.user_id}>
          <div className="row">
            <span><b>{a.full_name}</b> <span className="tag">{a.pos}</span></span>
            <span className="muted">{[a.town, a.county].filter(Boolean).join(', ') || 'No area'}</span>
          </div>
          {a.note && <p className="muted" style={{ margin: '6px 0' }}>"{a.note}"</p>}
          {invited.has(a.user_id) ? <p className="ok" style={{ marginTop: 8 }}>Invite sent ✓</p> : (
            <div style={{ marginTop: 8 }}>
              <select value={ipos[a.user_id] || a.pos} onChange={e => setIpos({ ...ipos, [a.user_id]: e.target.value })}>
                {Object.entries(sp.positions).map(([k, l]) => <option key={k} value={k}>Play as {k} · {l}</option>)}
              </select>
              <input placeholder="Message (optional)" value={imsg[a.user_id] || ''} onChange={e => setImsg({ ...imsg, [a.user_id]: e.target.value })} />
              <button style={{ width: '100%' }} onClick={() => invite(a)}>INVITE</button>
            </div>
          )}
        </div>
      ))}
      {sent.length > 0 && <h2 style={{ margin: '18px 0 10px' }}>Pending invites</h2>}
      {sent.map(s => (
        <div className="card row" key={s.id}>
          <span><b>{s.full_name}</b> <span className="tag">{s.pos}</span></span>
          <button className="ghost" onClick={() => run(supabase.rpc('tn_cancel_invite', { p_invite: s.id }))}>CANCEL</button>
        </div>
      ))}
    </>
  )
}

export default function FreeAgents() {
  const { team } = useAuth()
  return (
    <div className="wrap">
      <Bg name="team" />
      <h1>Free agents</h1>
      {team ? <CaptainView team={team} /> : <PlayerView />}
    </div>
  )
}