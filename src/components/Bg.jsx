export default function Bg({ name }) {
  return <div className="pg-bg" style={{ backgroundImage: `url(/images/bg-${name}.jpg)` }} />
}