import { useEffect, useState } from 'react'

const SPLASH_MS = 5000          // how long it must stay up
const EVERY_LOAD = false        // false = once each time the app is opened (per browser session). true = on every page load/refresh too
const ARM = 'M0 0V-20M0 -12L-5 -17M0 -12L5 -17M0 -6L-3.5 -9.5M0 -6L3.5 -9.5'
const FLAKES = Array.from({ length: 32 }, (_, i) => ({
  left: `${(i * 37 + 11) % 100}%`, size: 2 + (i % 4), dur: 3 + (i % 5) * 0.8, delay: -((i * 0.7) % 5), op: 0.35 + (i % 4) * 0.15,
}))

export default function Splash() {
  const [show, setShow] = useState(() => {
    if (EVERY_LOAD) return true
    try { return !sessionStorage.getItem('splash') } catch { return true }
  })
  const [fade, setFade] = useState(false)

  useEffect(() => {
    if (!show) return
    try { sessionStorage.setItem('splash', '1') } catch {}
    document.body.style.overflow = 'hidden'
    const t1 = setTimeout(() => setFade(true), SPLASH_MS)
    const t2 = setTimeout(() => setShow(false), SPLASH_MS + 450)
    return () => { clearTimeout(t1); clearTimeout(t2); document.body.style.overflow = '' }
  }, [show])

  if (!show) return null
  return (
    <div className={'splash' + (fade ? ' out' : '')} role="status" aria-label="Loading Flake City">
      {FLAKES.map((f, i) => (
        <span key={i} className="snow"
          style={{ left: f.left, width: f.size, height: f.size, opacity: f.op, animationDuration: `${f.dur}s`, animationDelay: `${f.delay}s` }} />
      ))}
      <div className="sflake">
        <svg viewBox="-22 -22 44 44" width="240" height="240" fill="none" stroke="#1ea7ff" strokeWidth="0.9" strokeLinecap="round">
          {[0, 60, 120, 180, 240, 300].map((a, i) => (
            <g key={a} transform={`rotate(${a})`}>
              <path d={ARM} pathLength="1" style={{ animationDelay: `${0.2 + i * 0.25}s` }} />
            </g>
          ))}
        </svg>
      </div>
      <h1 className="stitle">FLAKE CITY</h1>
      <p className="stag">Discipline Builds Freedom</p>
      <div className="sbar"><i style={{ animationDuration: `${SPLASH_MS}ms` }} /></div>
    </div>
  )
}