import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Bg from '../components/Bg'

const LABEL = { pending: 'Awaiting payment check', paid: 'Paid', ready: 'Ready', delivered: 'Delivered', cancelled: 'Cancelled' }

export default function Orders() {
  const [list, setList] = useState([])
  const [err, setErr] = useState('')
  const load = () => supabase.from('tn_orders').select('*, tn_order_items(*)').order('created_at', { ascending: false })
    .then(({ data }) => setList(data || []))
  useEffect(() => { load() }, [])

  async function cancel(id) {
    if (!confirm('Cancel this order?')) return
    const { error } = await supabase.rpc('tn_cancel_my_order', { p_order: id })
    error ? setErr(error.message) : load()
  }

  return (
    <div className="wrap">
      <Bg name="news" />
      <h1>My orders</h1>
      {err && <p className="err">{err}</p>}
      {list.length === 0 && <p className="muted">No orders yet. <Link to="/shop" style={{ color: 'var(--red)' }}>Visit the shop</Link></p>}
      {list.map(o => (
        <div className="card" key={o.id}>
          <div className="row">
            <b>KES {o.total.toLocaleString()}</b><span className="tag">{LABEL[o.status]}</span>
          </div>
          <p className="muted">{new Date(o.created_at).toLocaleString()} · M-Pesa {o.mpesa_ref}</p>
          {o.tn_order_items.map(i => (
            <p key={i.id}>{i.qty} × {i.name}{i.size && ` (${i.size})`}</p>
          ))}
          {o.status === 'pending' && <button className="ghost" style={{ marginTop: 8 }} onClick={() => cancel(o.id)}>CANCEL ORDER</button>}
        </div>
      ))}
    </div>
  )
}