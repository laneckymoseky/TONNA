import { SPORTS } from '../lib/sports'

export default function SportTabs({ value, onChange, all }) {
  return (
    <div className="tabs">
      {all && <button className={value === 'all' ? 'on' : ''} onClick={() => onChange('all')}>All</button>}
      {Object.entries(SPORTS).map(([id, s]) => (
        <button key={id} className={value === id ? 'on' : ''} onClick={() => onChange(id)}>{s.icon} {s.name}</button>
      ))}
    </div>
  )
}