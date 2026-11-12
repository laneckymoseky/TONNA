export default function Avatar({ url, name }) {
  const ini = (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  return (
    <div className="avatar lg" style={url ? { backgroundImage: `url(${url})` } : undefined}>
      {!url && <span>{ini}</span>}
    </div>
  )
}