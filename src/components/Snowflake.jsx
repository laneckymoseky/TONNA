export default function Snowflake({ size = 28, color }) {
  const arm = 'M0 0V-20M0 -12L-5 -17M0 -12L5 -17M0 -6L-3.5 -9.5M0 -6L3.5 -9.5'
  return (
    <svg width={size} height={size} viewBox="-22 -22 44 44" fill="none" stroke="currentColor"
      strokeWidth="2.2" strokeLinecap="round" style={color ? { color } : undefined}>
      {[0, 60, 120, 180, 240, 300].map(a => <path key={a} d={arm} transform={`rotate(${a})`} />)}
    </svg>
  )
}