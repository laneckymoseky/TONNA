export default function StatsGrid({ rows }) {
  const sum = k => rows.reduce((a, r) => a + (r[k] || 0), 0)
  const items = [
    ['Appearances', rows.filter(r => r.played).length],
    ['Goals', sum('goals')], ['Assists', sum('assists')], ['Saves', sum('saves')],
    ['Yellow cards', sum('yellow')], ['Red cards', sum('red')],
  ]
  return (
    <div className="card stats6">
      {items.map(([l, v]) => <div className="stat" key={l}><b>{v}</b><span className="muted">{l}</span></div>)}
    </div>
  )
}