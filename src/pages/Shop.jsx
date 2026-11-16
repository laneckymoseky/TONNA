import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useCart } from '../context/CartContext'
import { SPORTS } from '../lib/sports'
import Bg from '../components/Bg'
import SportTabs from '../components/SportTabs'

export default function Shop() {
  const { add } = useCart()
  const [tab, setTab] = useState('all')
  const [list, setList] = useState([])
  const [size, setSize] = useState({})
  const [note, setNote] = useState({})

  useEffect(() => {
    supabase.from('tn_products').select('*').eq('active', true).order('created_at', { ascending: false })
      .then(({ data }) => setList(data || []))
  }, [])

  const shown = list.filter(p => tab === 'all' || !p.sport || p.sport === tab)
  function addToCart(p) {
    const needs = p.sizes?.length > 0
    if (needs && !size[p.id]) return setNote(n => ({ ...n, [p.id]: 'Choose a size' }))
    add(p, size[p.id] || '')
    setNote(n => ({ ...n, [p.id]: 'Added ✓' }))
  }

  return (
    <div className="wrap">
      <Bg name="news" />
      <h1>Shop</h1>
      <SportTabs all value={tab} onChange={setTab} />
      {shown.length === 0 && <p className="muted">Nothing here yet.</p>}
      <div className="pgrid">
        {shown.map(p => (
          <div className="card prod" key={p.id}>
            {p.image_url && <img src={p.image_url} alt={p.name} />}
            <b>{p.name}</b>{p.sport && <span className="muted"> {SPORTS[p.sport]?.icon}</span>}
            <div className="price">KES {p.price.toLocaleString()}</div>
            {p.description && <p className="muted" style={{ margin: '4px 0 8px' }}>{p.description}</p>}
            {p.stock > 0 && p.stock <= 5 && <p className="muted">Only {p.stock} left</p>}
            {p.stock > 0 && p.sizes?.length > 0 && (
              <select value={size[p.id] || ''} onChange={e => setSize({ ...size, [p.id]: e.target.value })}>
                <option value="">Size</option>
                {p.sizes.map(s => <option key={s}>{s}</option>)}
              </select>
            )}
            <button style={{ width: '100%' }} disabled={p.stock < 1} onClick={() => addToCart(p)}>
              {p.stock < 1 ? 'SOLD OUT' : 'ADD TO CART'}
            </button>
            {note[p.id] && <p className={note[p.id] === 'Added ✓' ? 'ok' : 'err'} style={{ marginTop: 6 }}>{note[p.id]}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}