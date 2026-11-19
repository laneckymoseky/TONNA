import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useSport } from '../context/SportContext'
import { SPORTS } from '../lib/sports'

export default function TeamSearch() {
  const nav = useNavigate()
  const { mySports } = useSport()
  const [teams, setTeams] = useState([])
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const box = useRef()

  useEffect(() => {
    supabase.from('tn_teams').select('id, name, sport, town, county').order('name').then(({ data }) => setTeams(data || []))
  }, [])
  useEffect(() => {
    const close = e => { if (box.current && !box.current.contains(e.target)) setOpen(false) }
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [])

  const needle = q.trim().toLowerCase()
  const list = teams
    .filter(t => mySports.includes(t.sport) && `${t.name} ${t.town || ''} ${t.county || ''}`.toLowerCase().includes(needle))
    .slice(0, 12)
  const go = id => { setOpen(false); setQ(''); nav(`/team/${id}`) }

  return (
    <div className="tsearch" ref={box}>
      <input placeholder="🔎 Search a team…" value={q} onFocus={() => setOpen(true)}
        onChange={e => { setQ(e.target.value); setOpen(true) }} />
      {open && (
        <div className="tsearch-list">
          {list.length === 0 && <p className="muted" style={{ padding: 10 }}>No teams found.</p>}
          {list.map(t => (
            <button key={t.id} onClick={() => go(t.id)}>
              <span>{SPORTS[t.sport]?.icon} <b>{t.name}</b></span>
              <span className="muted">{[t.town, t.county].filter(Boolean).join(', ')}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}