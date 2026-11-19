import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { PRICES, BUDGET } from '../lib/prices'
import Bg from '../components/Bg'
import Avatar from '../components/Avatar'
import StatsGrid from '../components/StatsGrid'
import StatusBar from '../components/StatusBar'
import Portfolio from '../components/Portfolio'
import VisibilityPicker from '../components/VisibilityPicker'
import { useNavigate } from 'react-router-dom'
import { uploadPublic } from '../lib/upload'
import SportsPicker from '../components/SportsPicker'
import PlayerStats from '../components/PlayerStats'

export default function Profile() {
  const { profile, session, team, slot, role, name, refresh } = useAuth()
  const [mine, setMine] = useState([])
  const [market, setMarket] = useState([])
  const [rows, setRows] = useState([])
  const [tab, setTab] = useState('GK')
  const [msg, setMsg] = useState('')
  const nav = useNavigate()

  async function load() {
    const { data: s } = await supabase.from('tn_squad')
      .select('tn_roster(id, player_name, pos, tn_teams(name))').eq('user_id', session.user.id)
    setMine((s || []).map(x => x.tn_roster).filter(Boolean))
    const { data: m } = await supabase.from('tn_roster')
    .select('id, player_name, pos, tn_teams!inner(name, sport)').eq('status', 'active').eq('tn_teams.sport', 'football')
    setMarket(m || [])
    if (slot) {
      const { data: st } = await supabase.from('tn_stats').select('*').eq('roster_id', slot.id)
      setRows(st || [])
    }
  }
  useEffect(() => { load() }, [slot?.id])

  const spent = mine.reduce((a, p) => a + PRICES[p.pos], 0)
  const owned = new Set(mine.map(p => p.id))
  const teamName = team?.name || slot?.tn_teams?.name
  const photo = slot?.photo_url || team?.captain_photo
  const parts = (name || '').split(' ')
  const first = parts[0]
  const last = parts.slice(1).join(' ')

  async function upload(e) {
  const file = e.target.files[0]
  if (!file) return
  setMsg('Uploading…')
  try {
    const url = await uploadPublic('avatars', file, session.user.id, 900)
    const { error } = await supabase.rpc('tn_set_photo', { p_url: url })
    if (error) throw error
    setMsg(''); refresh()
  } catch (x) { setMsg(x.message) }
}
async function leave() {
  if (!confirm('Leave your team? You will become a free agent.')) return
  const { error } = await supabase.rpc('tn_leave_team')
  if (error) return setMsg(error.message)
  await refresh(); nav('/agents')
}

  async function buy(p) {
    const { error } = await supabase.from('tn_squad').insert({ user_id: session.user.id, roster_id: p.id })
    setMsg(error ? error.message : ''); load()
  }
  async function sell(p) {
    await supabase.from('tn_squad').delete().eq('user_id', session.user.id).eq('roster_id', p.id); load()
  }

  return (
    <div className="wrap">
      <Bg name="profile" />
      <div className="pbanner">
        <div>
          <Avatar url={photo} name={name} />
          <label className="btn ghost" style={{ cursor: 'pointer', display: 'block', textAlign: 'center', marginTop: 12 }}>
            {photo ? 'CHANGE PHOTO' : 'ADD PHOTO'}
            <input type="file" accept="image/*" hidden onChange={upload} />
          </label>
        </div>
        <div className="ph">
          <div className="first">{last ? first : (profile?.username ? '@' + profile.username : role)}</div>
          <div className="last">{last || first}</div>
          <p className="muted" style={{ marginTop: 8 }}>
            <span className="tag">{role}</span>
            {slot && <> <span className="tag">{slot.pos}</span></>}
            {teamName && <> · {teamName}</>}
          </p>
        </div>
      </div>
      {msg && <p className="err">{msg}</p>}
      {slot && <StatusBar rosterId={slot.id} />}
      <VisibilityPicker />
      <SportsPicker />
      {slot && <button className="ghost" style={{ marginBottom: 12 }} onClick={leave}>LEAVE TEAM</button>}
      {slot && <Portfolio userId={session.user.id} />}

     <PlayerStats userId={session.user.id} slotId={slot?.id} sport={slot?.tn_teams?.sport || team?.sport || 'football'} />

      <h2 style={{ margin: '18px 0 10px' }}>Fantasy budget</h2>
      <div className="card stats">
        <div className="stat"><b>{BUDGET - spent}</b><span className="muted">Left</span></div>
        <div className="stat"><b>{mine.length}</b><span className="muted">Squad</span></div>
        <div className="stat"><b>{spent}</b><span className="muted">Spent</span></div>
      </div>

      <h2 style={{ margin: '18px 0 10px' }}>My squad</h2>
      {mine.length === 0 && <p className="muted">No players yet. Buy from the market below.</p>}
      <div className="pcards">
        {mine.map(p => (
          <div className="pcard mag" key={p.id}>
            <span className="big">{PRICES[p.pos]}</span>
            <span className="pos">{p.pos}</span>
            <b>{p.player_name}</b>
            <small>{p.tn_teams?.name}</small>
            <button className="ghost" onClick={() => sell(p)}>SELL</button>
          </div>
        ))}
      </div>

      <h2 style={{ margin: '24px 0 4px' }}>Market</h2>
      <div className="tabs">
        {['GK', 'DEF', 'MID', 'FWD'].map(p => (
          <button key={p} className={tab === p ? 'on' : ''} onClick={() => setTab(p)}>{p} · {PRICES[p]}</button>
        ))}
      </div>
      <div className="pcards">
        {market.filter(p => p.pos === tab && !owned.has(p.id)).map(p => (
          <div className="pcard mag" key={p.id}>
            <span className="big">{PRICES[p.pos]}</span>
            <span className="pos">{p.pos}</span>
            <b>{p.player_name}</b>
            <small>{p.tn_teams?.name}</small>
            <button onClick={() => buy(p)}>BUY</button>
          </div>
        ))}
      </div>
    </div>
  )
}