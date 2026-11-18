import { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext'

const Ctx = createContext({ items: [], count: 0, total: 0, add() {}, setQty() {}, clear() {} })
export const useCart = () => useContext(Ctx)
const read = k => { try { return JSON.parse(localStorage.getItem(k) || '[]') } catch { return [] } }

export function CartProvider({ children }) {
  const { session } = useAuth()
  const key = 'cart:' + (session?.user?.id || 'guest')
  const [items, setItems] = useState([])
  const [loaded, setLoaded] = useState('')

  useEffect(() => { setItems(read(key)); setLoaded(key) }, [key])
  useEffect(() => { if (loaded === key) { try { localStorage.setItem(key, JSON.stringify(items)) } catch {} } }, [items, loaded, key])
  useEffect(() => { try { localStorage.removeItem('cart') } catch {} }, [])

  const add = (p, size) => setItems(list => {
    const k = p.id + '|' + (size || '')
    const f = list.find(i => i.k === k)
    if (f) return list.map(i => (i.k === k ? { ...i, qty: Math.min(10, i.qty + 1) } : i))
    return [...list, { k, id: p.id, name: p.name, price: p.price, image: p.image_url, size: size || '', qty: 1 }]
  })
  const setQty = (k, qty) => setItems(l => (qty < 1 ? l.filter(i => i.k !== k) : l.map(i => (i.k === k ? { ...i, qty: Math.min(10, qty) } : i))))
  const clear = () => setItems([])
  const count = items.reduce((a, i) => a + i.qty, 0)
  const total = items.reduce((a, i) => a + i.qty * i.price, 0)
  return <Ctx.Provider value={{ items, add, setQty, clear, count, total }}>{children}</Ctx.Provider>
}