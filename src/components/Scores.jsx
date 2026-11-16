import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { MATCH_SELECT } from '../lib/prices'
import Bg from '../components/Bg'

export default function Scores() {
  const { session } = useAuth()
  const [team, setTeam] = useState(null)
  const [list, setList] = useState([])
  const [v, setV] = useState({})
  const [err, setErr] = useState('')

  async function load() {
    const { data: t } = await supabase.from('tn_teams').select('id').eq('captain_id', session.user.id).maybeSingle()
    setTeam(t)
    if (!t) return
    const today = new Date().toISOString().slice(0, 10)
    const { data } = await supabase.from('tn_challenges').select(MATCH_SELECT)
      .or(`from_team.eq.${t.id},to_team.eq.${t.id}`).in('status', ['accepted', 'played'])
      .lte('match_date', today).order('match_date', { ascending: false })
    setList(data || [])
  }
  useEffect(() => { load() }, [])

  async function run(p) { setErr(''); const { error } = await p; error ? setErr(error.message) : load() }
  const set = (id, k, val) => setV(s => ({ ...s, [id]: { ...s[id], [k]: val } }))
  const submit = c => run(supabase.rpc('tn_submit_score', { p_challenge: c.id, p_home: +v[c.id].h, p_away: +v[c.id].a }))
  const respond = (c, ok) => run(supabase.rpc('tn_confirm_score', { p_challenge: c.id, p_ok: ok }))

  if (!team) return <p className="wrap muted">Only captains can enter scores.</p>
  return (
    <div className="wrap">
      <Bg name="results" />
      <h1>Match scores</h1>
      <p className="muted" style={{ marginBottom: 12 }}>One captain submits the score and the other confirms it. If you disagree, an admin decides.</p>
      {err && <p className="err">{err}</p>}
      {list.length === 0 && <p className="muted">No finished matches yet.</p>}
      {list.map(c => {
        const mine = c.sub_by === session.user.id
        return (
          <div className="card" key={c.id}>
            <div className="row">
              <b>{c.home?.name} vs {c.away?.name}</b><span className="muted">{c.match_date}</span>
            </div>
            {c.status === 'played' && <p style={{ marginTop: 8 }}>Final: <b>{c.home_score} - {c.away_score}</b></p>}
            {c.status === 'accepted' && c.sub_by && mine &&
              <p className="muted" style={{ marginTop: 8 }}>You submitted {c.sub_home} - {c.sub_away}. Waiting for the other captain to confirm.</p>}
            {c.status === 'accepted' && c.sub_by && !mine && (
              <div style={{ marginTop: 8 }}>
                <p>The other captain submitted <b>{c.sub_home} - {c.sub_away}</b></p>
                <button onClick={() => respond(c, true)}>CONFIRM</button>{' '}
                <button className="ghost" onClick={() => respond(c, false)}>DISPUTE</button>
              </div>
            )}
            {c.status === 'accepted' && !c.sub_by && (
              <div style={{ marginTop: 8 }}>
                {c.disputed && <p className="err">Disputed. Submit the agreed score, or wait for an admin.</p>}
                <div className="row">
                  <span style={{ flex: 1 }}>{c.home?.name}</span>
                  <input className="score" type="number" min="0" value={v[c.id]?.h ?? ''} onChange={e => set(c.id, 'h', e.target.value)} />
                  <span>-</span>
                  <input className="score" type="number" min="0" value={v[c.id]?.a ?? ''} onChange={e => set(c.id, 'a', e.target.value)} />
                  <span style={{ flex: 1, textAlign: 'right' }}>{c.away?.name}</span>
                </div>
                <button style={{ width: '100%', marginTop: 10 }} disabled={(v[c.id]?.h ?? '') === '' || (v[c.id]?.a ?? '') === ''}
                  onClick={() => submit(c)}>SUBMIT SCORE</button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}