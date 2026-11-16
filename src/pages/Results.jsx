import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { SPORTS } from '../lib/sports'
import { MATCH_SELECT, dparts } from '../lib/prices'
import Bg from '../components/Bg'
import SportTabs from '../components/SportTabs'
import Social from '../components/Social'

export default function Results() {
  const [tab, setTab] = useState('all')
  const [list, setList] = useState([])
  useEffect(() => {
    supabase.from('tn_challenges').select(MATCH_SELECT).eq('status', 'played')
      .order('match_date', { ascending: false }).limit(60).then(({ data }) => setList(data || []))
  }, [])
  const ids = tab === 'all' ? Object.keys(SPORTS) : [tab]
  return (
    <div className="wrap">
      <Bg name="results" />
      <h1>Results</h1>
      <SportTabs all value={tab} onChange={setTab} />
      {ids.map(id => {
        const items = list.filter(c => c.sport === id)
        return (
          <section key={id}>
            <h2 style={{ margin: '18px 0 10px' }}>{SPORTS[id].icon} {SPORTS[id].name}</h2>
            {items.length === 0 && <p className="muted">No results yet.</p>}
            {items.map(c => {
              const [day, mon] = dparts(c.match_date)
              return (
                <div key={c.id} style={{ marginBottom: 14 }}>
                  <div className="card match mag" style={{ marginBottom: 0 }}>
                    <div className="date"><b>{day}</b>{mon}</div>
                    <span className="t">{c.home?.name}</span>
                    <div className="sc"><span>{c.home_score}</span><span>{c.away_score}</span></div>
                    <span className="t r">{c.away?.name}</span>
                  </div>
                  <p className="match-meta">{c.field?.name}</p>
                  <Social type="match" id={c.id} />
                </div>
              )
            })}
          </section>
        )
      })}
    </div>
  )
}