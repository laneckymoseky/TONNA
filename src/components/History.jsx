import { SPORTS } from '../lib/sports'

export default function History({ sport }) {
  const h = SPORTS[sport]?.history
  if (!h) return null
  return (
    <>
      <h2 style={{ margin: '18px 0 10px' }}>📜 A bit of history</h2>
      <div className="card">
        <p>{h.text}</p>
        <blockquote className="quote">“{h.quote}”<footer>— {h.by}</footer></blockquote>
      </div>
    </>
  )
}