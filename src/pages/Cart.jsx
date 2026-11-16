import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useCart } from '../context/CartContext'
import Bg from '../components/Bg'

export default function Cart() {
  const { items, setQty, clear, total } = useCart()
  const nav = useNavigate()
  const [instr, setInstr] = useState('')
  const [f, setF] = useState({ phone: '', note: '', ref: '' })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    supabase.from('tn_settings').select('value').eq('key', 'mpesa_instructions').maybeSingle()
      .then(({ data }) => setInstr(data?.value || ''))
  }, [])

  async function order(e) {
    e.preventDefault(); setErr(''); setBusy(true)
    const { error } = await supabase.rpc('tn_place_order', {
      p_items: items.map(i => ({ id: i.id, size: i.size, qty: i.qty })),
      p_phone: f.phone, p_note: f.note, p_ref: f.ref,
    })
    setBusy(false)
    if (error) return setErr(error.message)
    clear(); nav('/shop/orders')
  }

  if (items.length === 0) return <div className="wrap"><Bg name="news" /><h1>Cart</h1><p className="muted">Your cart is empty.</p></div>
  return (
    <div className="wrap">
      <Bg name="news" />
      <h1>Cart</h1>
      {items.map(i => (
        <div className="card row" key={i.k}>
          <span><b>{i.name}</b>{i.size && <span className="tag" style={{ marginLeft: 8 }}>{i.size}</span>}<br />
            <span className="muted">KES {i.price.toLocaleString()} each</span></span>
          <span>
            <button className="ghost" onClick={() => setQty(i.k, i.qty - 1)}>−</button>
            <b style={{ margin: '0 10px' }}>{i.qty}</b>
            <button className="ghost" onClick={() => setQty(i.k, i.qty + 1)}>+</button>
          </span>
        </div>
      ))}
      <div className="card row"><b>Total</b><b className="price">KES {total.toLocaleString()}</b></div>

      <form className="card" onSubmit={order}>
        <h2 style={{ fontSize: 18, marginBottom: 8 }}>Pay with M-Pesa</h2>
        <p style={{ whiteSpace: 'pre-wrap', marginBottom: 12 }}>{instr}</p>
        <input placeholder="Your phone number" value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} required />
        <input placeholder="Pickup point or delivery area" value={f.note} onChange={e => setF({ ...f, note: e.target.value })} />
        <input placeholder="M-Pesa confirmation code" maxLength={12} value={f.ref} onChange={e => setF({ ...f, ref: e.target.value.toUpperCase() })} required />
        {err && <p className="err">{err}</p>}
        <button disabled={busy} style={{ width: '100%' }}>{busy ? '…' : 'PLACE ORDER'}</button>
        <p className="muted" style={{ marginTop: 8, fontSize: 14 }}>Prices are checked again when you place the order.</p>
      </form>
    </div>
  )
}