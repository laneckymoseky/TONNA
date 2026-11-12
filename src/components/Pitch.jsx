import { useNavigate } from 'react-router-dom'

const ROWS = ['FWD', 'MID', 'DEF', 'GK']

function Chip({ s, onRemove }) {
  const nav = useNavigate()
  const ini = s.player_name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  return (
    <div className="chip" onClick={() => nav(`/player/${s.id}`)}>
      <div className={'dot ' + s.status} style={s.photo_url ? { backgroundImage: `url(${s.photo_url})` } : undefined}>
        {!s.photo_url && ini}
      </div>
      <small>{s.player_name}</small>
      {onRemove && <button className="x" title="Remove" onClick={e => { e.stopPropagation(); onRemove(s.id) }}>×</button>}
    </div>
  )
}

export default function Pitch({ slots, onRemove }) {
  return (
    <div className="pitch">
      {ROWS.map(r => {
        const list = slots.filter(s => s.pos === r)
        return (
          <div className="pl-row" key={r}>
            {list.length === 0 && <span className="empty">NO {r}</span>}
            {list.map(s => <Chip key={s.id} s={s} onRemove={onRemove} />)}
          </div>
        )
      })}
    </div>
  )
}