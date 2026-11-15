import { SPORTS } from '../lib/sports'

export default function StatsGrid({ rows, sport = 'football' }) {
  const sp = SPORTS[sport] || SPORTS.football
  const sum = k => rows.reduce((a, r) => a + (r.data?.[k] || 0), 0)
  const items = [['Appearances', rows.filter(r => r.played).length],
    ...Object.entries(sp.stats).map(([k, l]) => [l, sum(k)])]
  return (
    <div className="card stats6">
      {items.map(([l, v]) => <div className="stat" key={l}><b>{v}</b><span className="muted">{l}</span></div>)}
    </div>
  )
}