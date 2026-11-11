import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { MATCH_SELECT, dparts } from '../lib/prices'
import Bg from '../components/Bg'

export default function Results() {
  const [list, setList] = useState([])
  useEffect(() => {
    supabase.from('tn_challenges').select(MATCH_SELECT).eq('status', 'played')
      .order('match_date', { ascending: false }).then(({ data }) => setList(data || []))
  }, [])
  return (
    <div className="wrap">
      <Bg name="results" />
      <h1>Results</h1>
      {list.length === 0 && <p className="muted">No results yet.</p>}
      {list.map(c => {
        const [day, mon] = dparts(c.match_date)
        return (
          <div key={c.id}>
            <div className="card match mag">
              <div className="date"><b>{day}</b>{mon}</div>
              <span className="t">{c.home?.name}</span>
              <div className="sc"><span>{c.home_score}</span><span>{c.away_score}</span></div>
              <span className="t r">{c.away?.name}</span>
            </div>
            <p className="match-meta">{c.field?.name}</p>
          </div>
        )
      })}
    </div>
  )
}