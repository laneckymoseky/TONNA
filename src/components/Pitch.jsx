import { useNavigate } from 'react-router-dom'
import { SPORTS } from '../lib/sports'

function Chip({ s, onRemove, booked }) {
  const nav = useNavigate()
  const ini = s.player_name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  return (
    <div className="chip" onClick={() => nav(`/player/${s.id}`)}>
      {s.status === 'active' && <span className="tick" title="Signed up">✓</span>}
      <div className={'dot ' + (booked?.has(s.id) ? 'booked' : 'free')}
        style={s.photo_url ? { backgroundImage: `url(${s.photo_url})` } : undefined}>
        {!s.photo_url && ini}
      </div>
      <small>{s.player_name}</small>
      <span className="cpos">{s.pos}</span>
      {onRemove && <button className="x" title="Remove" onClick={e => { e.stopPropagation(); onRemove(s.id) }}>×</button>}
    </div>
  )
}

export default function Pitch({ slots, onRemove, sport = 'football', booked }) {
  const sp = SPORTS[sport] || SPORTS.football
  return (
    <div className={'pitch ' + sp.surface}>
      {sp.rows.map(row => {
        const list = slots.filter(s => row.includes(s.pos))
        return (
          <div className="pl-row" key={row.join()}>
            {list.length === 0 && <span className="empty">NO {row.join(' / ')}</span>}
            {list.map(s => <Chip key={s.id} s={s} onRemove={onRemove} booked={booked} />)}
          </div>
        )
      })}
    </div>
  )
}