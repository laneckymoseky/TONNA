import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Bg from '../components/Bg'

const SEL = '*, buyer:tn_teams!buyer_team(name), seller:tn_teams!seller_team(name), slot:tn_roster!slot_id(player_name)'
const mark = v => (v === true ? '✅' : v === false ? '❌' : '⏳')

export default function Transfers() {
  const { session, team } = useAuth()
  const uid = session.user.id
  const [list, setList] = useState([])
  const [err, setErr] = useState('')
  const load = () => supabase.from('tn_transfers').select(SEL).order('created_at', { ascending: false }).limit(60)
    .then(({ data }) => setList(data || []))
  useEffect(() => { load() }, [])

  async function run(p) { setErr(''); const { error } = await p; error ? setErr(error.message) : load() }
  const answer = (id, ok) => run(supabase.rpc('tn_answer_transfer', { p_id: id, p_ok: ok }))
  const cancel = id => run(supabase.rpc('tn_cancel_transfer', { p_id: id }))

  const forMe = list.filter(t => t.user_id === uid)
  const forMyPlayers = team ? list.filter(t => t.seller_team === team.id && t.user_id !== uid) : []
  const mine = team ? list.filter(t => t.buyer_team === team.id) : []

  const Row = ({ t, who }) => (
    <div className="card">
      <div className="row">
        <b>{t.slot?.player_name} → {t.buyer?.name}</b><span className="tag">{t.status}</span>
      </div>
      <p className="muted">From {t.seller?.name} · as {t.pos} · {new Date(t.created_at).toLocaleDateString()}</p>
      {t.message && <p>"{t.message}"</p>}
      <p className="muted">Player {mark(t.player_ok)} · Current captain {mark(t.captain_ok)}</p>
      {t.status === 'pending' && who === 'player' && t.player_ok === null && (
        <div style={{ marginTop: 8 }}><button onClick={() => answer(t.id, true)}>ACCEPT</button>{' '}
          <button className="ghost" onClick={() => answer(t.id, false)}>REJECT</button></div>)}
      {t.status === 'pending' && who === 'captain' && t.captain_ok === null && (
        <div style={{ marginTop: 8 }}><button onClick={() => answer(t.id, true)}>APPROVE</button>{' '}
          <button className="ghost" onClick={() => answer(t.id, false)}>BLOCK</button></div>)}
      {t.status === 'pending' && who === 'buyer' && (
        <button className="ghost" style={{ marginTop: 8 }} onClick={() => cancel(t.id)}>CANCEL OFFER</button>)}
    </div>
  )

  return (
    <div className="wrap">
      <Bg name="team" />
      <h1>Transfers</h1>
      {err && <p className="err">{err}</p>}
      {list.length === 0 && <p className="muted">No transfer activity yet. Captains can make an offer from a player's profile.</p>}
      {forMe.length > 0 && <h2 style={{ margin: '12px 0 8px' }}>Offers for you</h2>}
      {forMe.map(t => <Row key={t.id} t={t} who="player" />)}
      {forMyPlayers.length > 0 && <h2 style={{ margin: '16px 0 8px' }}>Offers for your players</h2>}
      {forMyPlayers.map(t => <Row key={t.id} t={t} who="captain" />)}
      {mine.length > 0 && <h2 style={{ margin: '16px 0 8px' }}>Your offers</h2>}
      {mine.map(t => <Row key={t.id} t={t} who="buyer" />)}
    </div>
  )
}