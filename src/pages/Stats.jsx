import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { MATCH_SELECT } from '../lib/prices'
import Bg from '../components/Bg'

const FIELDS = ['goals', 'assists', 'saves', 'yellow', 'red']
const blank = { played: true, goals: 0, assists: 0, saves: 0, yellow: 0, red: 0 }

export default function Stats() {
  const { session } = useAuth()
  const [team, setTeam] = useState(null)
  const [matches, setMatches] = useState([])
  const [players, setPlayers] = useState([])
  const [mid, setMid] = useState('')
  const [vals, setVals] = useState({})
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  useEffect(() => {
    (async () => {
      const { data: t } = await supabase.from('tn_teams').select('*').eq('captain_id', session.user.id).maybeSingle()
      setTeam(t)
      if (!t) return
      const today = new Date().toISOString().slice(0, 10)
      const { data: m } = await supabase.from('tn_challenges').select(MATCH_SELECT)
        .or(`from_team.eq.${t.id},to_team.eq.${t.id}`).in('status', ['accepted', 'played'])
        .lte('match_date', today).order('match_date', { ascending: false })
      setMatches(m || [])
      const { data: pl } = await supabase.from('tn_roster').select('id, player_name, pos')
        .eq('team_id', t.id).in('status', ['active', 'open']).order('created_at')
      setPlayers(pl || [])
    })()
  }, [])

  useEffect(() => {
    if (!mid) return
    setMsg(''); setErr('')
    supabase.from('tn_stats').select('*').eq('challenge_id', mid).then(({ data }) => {
      const saved = Object.fromEntries((data || []).map(r => [r.roster_id, r]))
      setVals(Object.fromEntries(players.map(p => [p.id, saved[p.id] ? { ...saved[p.id] } : { ...blank }])))
    })
  }, [mid, players])

  const setV = (id, k, v) => setVals(s => ({ ...s, [id]: { ...s[id], [k]: v } }))

  async function save() {
    setMsg(''); setErr('')
    const rows = players.map(p => {
      const v = vals[p.id] || blank
      return { roster_id: p.id, played: !!v.played, goals: +v.goals || 0, assists: +v.assists || 0,
               saves: +v.saves || 0, yellow: +v.yellow || 0, red: +v.red || 0 }
    })
    const { error } = await supabase.rpc('tn_save_stats', { p_challenge: mid, p_rows: rows })
    error ? setErr(error.message) : setMsg('Stats saved ✓')
  }

  if (!team) return <p className="wrap muted">Only captains can add stats.</p>
  return (
    <div className="wrap">
      <Bg name="team" />
      <h1>Match stats</h1>
      <select value={mid} onChange={e => setMid(e.target.value)}>
        <option value="">Choose a finished match</option>
        {matches.map(c => <option key={c.id} value={c.id}>{c.match_date} · {c.home?.name} vs {c.away?.name}</option>)}
      </select>
      {matches.length === 0 && <p className="muted">No matches played yet.</p>}

      {mid && players.map(p => {
        const v = vals[p.id] || blank
        return (
          <div className="card" key={p.id}>
            <div className="row">
              <span><b>{p.player_name}</b> <span className="tag">{p.pos}</span></span>
              <label><input type="checkbox" checked={!!v.played} onChange={e => setV(p.id, 'played', e.target.checked)} />Played</label>
            </div>
            {v.played && (
              <div className="sgrid">
                {FIELDS.map(k => (
                  <label key={k}><small>{k}</small>
                    <input type="number" min="0" value={v[k]} onChange={e => setV(p.id, k, e.target.value)} />
                  </label>
                ))}
              </div>
            )}
          </div>
        )
      })}
      {mid && <button onClick={save} style={{ width: '100%' }}>SAVE STATS</button>}
      {msg && <p className="ok" style={{ marginTop: 10 }}>{msg}</p>}
      {err && <p className="err" style={{ marginTop: 10 }}>{err}</p>}
    </div>
  )
}