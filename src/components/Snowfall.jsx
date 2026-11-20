import { useMemo } from 'react'

const ARM = 'M0 0V-20M0 -12L-5 -17M0 -12L5 -17M0 -6L-3.5 -9.5M0 -6L3.5 -9.5'

// mode: 'fixed' = behind the page, 'area' = inside its container, 'over' = in front of the page
export default function Snowfall({ mode = 'fixed', count = 36 }) {
  const flakes = useMemo(() => Array.from({ length: count }, (_, i) => {
    const r = n => { const x = Math.sin(i * 12.9898 + n * 78.233) * 43758.5453; return x - Math.floor(x) }
    const flake = i % 4 === 0
    return {
      flake,
      left: r(1) * 100,
      size: flake ? 9 + r(2) * 9 : 2 + r(2) * 4,
      dur: 9 + r(3) * 12,
      delay: -r(4) * 20,
      drift: (r(5) - 0.5) * 120,
      op: 0.35 + r(6) * 0.5,
    }
  }), [count])

  return (
    <div className={'snowfall ' + mode} aria-hidden="true">
      {flakes.map((f, i) => (
        <span key={i} className={(f.flake ? 'sf flake' : 'sf dot') + (i % 2 ? ' sm-hide' : '')}
          style={{
            left: `${f.left}%`, width: f.size, height: f.size, opacity: f.op,
            animationDuration: `${f.dur}s`, animationDelay: `${f.delay}s`, '--d': `${f.drift}px`,
          }}>
          {f.flake && (
            <svg viewBox="-22 -22 44 44" width="100%" height="100%" fill="none" stroke="#cfeaff" strokeWidth="2.6" strokeLinecap="round">
              {[0, 60, 120, 180, 240, 300].map(a => <path key={a} d={ARM} transform={`rotate(${a})`} />)}
            </svg>
          )}
        </span>
      ))}
    </div>
  )
}