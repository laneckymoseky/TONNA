import { SPORTS } from '../lib/sports'
import { useSport } from '../context/SportContext'

export default function SportTabs({ value, onChange, all }) {
  const { mySports } = useSport()
  return (
    <div className="tabs">
      {all && <button className={value === 'all' ? 'on' : ''} onClick={() => onChange('all')}>All</button>}
      {mySports.map(id => (
        <button key={id} className={value === id ? 'on' : ''} onClick={() => onChange(id)}>{SPORTS[id].icon} {SPORTS[id].name}</button>
      ))}
    </div>
  )
}