import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { SPORTS } from '../lib/sports'
import { uploadPublic } from '../lib/upload'

const NEXT = [['paid', 'MARK PAID'], ['ready', 'READY'], ['delivered', 'DELIVERED']]

function ProductRow({ p, onSaved }) {
  const [price, setPrice] = useState(p.price)
  const [stock, setStock] = useState(p.stock)
  async function save() {
    await supabase.from('tn_products').update({ price: +price || 0, stock: +stock || 0 }).eq('id', p.id); onSaved()
  }
  async function toggle() { await supabase.from('tn_products').update({ active: !p.active }).eq('id', p.id); onSaved() }
  return (
    <div className="card" style={{ opacity: p.active ? 1 : .5 }}>
      <div className="row"><b>{p.name}</b><button className="ghost" onClick={toggle}>{p.active ? 'HIDE' : 'SHOW'}</button></div>
      <div className="sgrid">
        <label><small>Price (KES)</small><input type="number" min="0" value={price} onChange={e => setPrice(e.target.value)} /></label>
        <label><small>Stock</small><input type="number" min="0" value={stock} onChange={e => setStock(e.target.value)} /></label>
      </div>
      <button style={{ width: '100%', marginTop: 8 }} onClick={save}>SAVE</button>
    </div>
  )
}

export default function AdminShop() {
  const { role, loading, session } = useAuth()
  const nav = useNavigate()
  const [tab, setTab] = useState('orders')
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [instr, setInstr] = useState('')
  const [flt, setFlt] = useState('pending')
  const [np, setNp] = useState({ name: '', description: '', price: '', stock: '', sizes: '', sport: '' })
  const [file, setFile] = useState(null)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  async function load() {
    const { data: o } = await supabase.from('tn_orders').select('*, tn_order_items(*)').order('created_at', { ascending: false }).limit(100)
    setOrders(o || [])
    const { data: p } = await supabase.from('tn_products').select('*').order('created_at', { ascending: false })
    setProducts(p || [])
    const { data: s } = await supabase.from('tn_settings').select('value').eq('key', 'mpesa_instructions').maybeSingle()
    setInstr(s?.value || '')
  }
  useEffect(() => { if (role === 'admin') load() }, [role])

  if (loading) return <p className="wrap muted">Loading…</p>
  if (role !== 'admin') return <p className="wrap err">Admins only.</p>

  async function setStatus(id, st) {
    if (st === 'cancelled' && !confirm('Cancel this order and return the items to stock?')) return
    const { error } = await supabase.rpc('tn_set_order_status', { p_order: id, p_status: st })
    setErr(error ? error.message : ''); if (!error) load()
  }
  async function chat(uid) {
    const { data, error } = await supabase.rpc('tn_open_direct', { p_user: uid })
    error ? setErr(error.message) : nav('/chat/' + data)
  }
  async function addProduct(e) {
    e.preventDefault(); setErr(''); setMsg('')
    try {
      const image_url = file ? await uploadPublic('shop', file, session.user.id) : null
      const sizes = np.sizes.split(',').map(s => s.trim()).filter(Boolean)
      const { error } = await supabase.from('tn_products').insert({
        name: np.name.trim(), description: np.description.trim() || null, price: +np.price || 0, stock: +np.stock || 0,
        sizes: sizes.length ? sizes : null, sport: np.sport || null, image_url,
      })
      if (error) throw error
      setNp({ name: '', description: '', price: '', stock: '', sizes: '', sport: '' }); setFile(null); setMsg('Product added ✓'); load()
    } catch (x) { setErr(x.message) }
  }
  async function saveInstr() {
    const { error } = await supabase.from('tn_settings').upsert({ key: 'mpesa_instructions', value: instr })
    setErr(error ? error.message : ''); setMsg(error ? '' : 'Saved ✓')
  }

  const shown = orders.filter(o => flt === 'all' || o.status === flt)
  const pending = orders.filter(o => o.status === 'pending').length
  return (
    <div className="wrap">
      <h1>Shop admin</h1>
      <div className="tabs">
        <button className={tab === 'orders' ? 'on' : ''} onClick={() => setTab('orders')}>Orders {pending > 0 && `(${pending})`}</button>
        <button className={tab === 'products' ? 'on' : ''} onClick={() => setTab('products')}>Products</button>
        <button className={tab === 'settings' ? 'on' : ''} onClick={() => setTab('settings')}>Payment</button>
      </div>
      {err && <p className="err">{err}</p>}
      {msg && <p className="ok">{msg}</p>}

      {tab === 'orders' && (
        <>
          <select value={flt} onChange={e => setFlt(e.target.value)}>
            {['pending', 'paid', 'ready', 'delivered', 'cancelled', 'all'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {shown.length === 0 && <p className="muted">No orders here.</p>}
          {shown.map(o => (
            <div className="card" key={o.id}>
              <div className="row"><b>{o.buyer_name} · KES {o.total.toLocaleString()}</b><span className="tag">{o.status}</span></div>
              <p className="muted">{new Date(o.created_at).toLocaleString()}</p>
              <p>Phone: <b>{o.phone}</b> · M-Pesa: <b>{o.mpesa_ref}</b></p>
              {o.note && <p>Pickup/delivery: {o.note}</p>}
              {o.tn_order_items.map(i => <p key={i.id}>{i.qty} × {i.name}{i.size && ` (${i.size})`}</p>)}
              {o.status !== 'cancelled' && (
                <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {NEXT.map(([st, l]) => <button key={st} className={o.status === st ? 'ghost' : ''} onClick={() => setStatus(o.id, st)}>{l}</button>)}
                  <button className="ghost" onClick={() => setStatus(o.id, 'cancelled')}>CANCEL</button>
                  <button className="ghost" onClick={() => chat(o.user_id)}>CHAT</button>
                </div>
              )}
            </div>
          ))}
        </>
      )}

      {tab === 'products' && (
        <>
          <form className="card" onSubmit={addProduct}>
            <input placeholder="Product name" value={np.name} onChange={e => setNp({ ...np, name: e.target.value })} required />
            <textarea placeholder="Description (optional)" style={{ minHeight: 70 }} value={np.description} onChange={e => setNp({ ...np, description: e.target.value })} />
            <div className="sgrid">
              <label><small>Price (KES)</small><input type="number" min="0" value={np.price} onChange={e => setNp({ ...np, price: e.target.value })} required /></label>
              <label><small>Stock</small><input type="number" min="0" value={np.stock} onChange={e => setNp({ ...np, stock: e.target.value })} required /></label>
            </div>
            <input placeholder="Sizes, separated by commas (leave blank if none)" value={np.sizes} onChange={e => setNp({ ...np, sizes: e.target.value })} />
            <select value={np.sport} onChange={e => setNp({ ...np, sport: e.target.value })}>
              <option value="">All sports</option>
              {Object.entries(SPORTS).map(([id, s]) => <option key={id} value={id}>{s.icon} {s.name}</option>)}
            </select>
            <label className="muted">Photo<input type="file" accept="image/*" onChange={e => setFile(e.target.files[0] || null)} style={{ marginTop: 6 }} /></label>
            <button style={{ width: '100%' }}>ADD PRODUCT</button>
          </form>
          {products.map(p => <ProductRow key={p.id + p.price + p.stock + p.active} p={p} onSaved={load} />)}
        </>
      )}

      {tab === 'settings' && (
        <div className="card">
          <p className="muted" style={{ marginBottom: 8 }}>Shown to buyers at checkout. Include your Till or Paybill number and account name.</p>
          <textarea value={instr} onChange={e => setInstr(e.target.value)} />
          <button style={{ width: '100%' }} onClick={saveInstr}>SAVE</button>
        </div>
      )}
    </div>
  )
}