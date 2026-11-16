import { useSport } from '../context/SportContext'

export default function Bg({ name, plain }) {
  const { sport } = useSport()
  const layers = plain
    ? [`url(/images/bg-${name}.jpg)`]
    : [`url(/images/bg-${name}-${sport}.jpg)`, `url(/images/bg-${name}.jpg)`]
  return (
    <div className="pg-bg" style={{
      backgroundImage: layers.join(','),
      '--ball': `url(/images/ball-${sport}.png), url(/images/ball.png)`,
    }} />
  )
}