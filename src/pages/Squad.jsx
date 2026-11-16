import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { MATCH_SELECT } from '../lib/prices'
import Bg from '../components/Bg'

export default function Squad() {
  const { cid } = useParams()
  const { session } = useAuth()
  const nav = useNavigate()
  const [c, setC] = useState(null)
  const [players, setPlayers] = useState([])
  const [pick, setPick] = useState(new Set())
  const [err, setErr] = useState('')

  useEffect(() => {
    (async () => {
      const { data: t } = await supabase.from('tn_teams').select('id').eq('captain_id', session.user.id).maybeSingle()
      const { data: m } = await supabase.from('tn_challenges').select(MATCH_SELECT).eq('id', cid).maybeSingle()
      setC(m)
      if (!t) return
      const { data: pl } = await supabase.from('tn_roster').select('id, player_name, pos')
        .eq('team_id', t.id).in('status', ['active', 'open']).order('created_at')
      setPlayers(pl || [])
      const { data: sq } = await supabase.from('tn_match_squad').select('roster_id').eq('challenge_id', cid)
      const mine = new Set((pl || []).map(p => p.id))
      setPick(new Set((sq || []).map(r => r.roster_id).filter(id => mine.has(id))))
    })()
  }, [cid])

  const toggle = id => setPick(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  async function save() {
    setErr('')
    const { error } = await supabase.rpc('tn_set_squad', { p_challenge: cid, p_roster: [...pick] })
    error ? setErr(error.message) : nav('/captain')
  }

  return (
    <div className="wrap">
      <Bg name="team" />
      <h1>Pick your squad</h1>
      {c && <p className="muted" style={{ marginBottom: 12 }}>{c.home?.name} vs {c.away?.name} · {c.match_date} {c.match_time?.slice(0, 5)}</p>}
      {players.map(p => (
        <label className="card row" key={p.id} style={{ cursor: 'pointer' }}>
          <span><b>{p.player_name}</b> <span className="tag">{p.pos}</span></span>
          <input type="checkbox" style={{ margin: 0 }} checked={pick.has(p.id)} onChange={() => toggle(p.id)} />
        </label>
      ))}
      {err && <p className="err">{err}</p>}
      <button style={{ width: '100%' }} onClick={save}>SAVE SQUAD ({pick.size} booked)</button>
    </div>
  )
}