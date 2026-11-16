import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function AdminValues() {
  const [list, setList] = useState([])
  const [msg, setMsg] = useState('')
  useEffect(() => {
    supabase.from('tn_settings').select('value').eq('key', 'values').maybeSingle().then(({ data }) => {
      try { setList(JSON.parse(data?.value || '[]')) } catch { setList([]) }
    })
  }, [])
  const set = (i, k, v) => setList(l => l.map((x, j) => (j === i ? { ...x, [k]: v } : x)))

  async function save() {
    const clean = list.filter(v => v.title?.trim()).map(v => ({ title: v.title.trim(), text: (v.text || '').trim() }))
    const { error } = await supabase.from('tn_settings').upsert({ key: 'values', value: JSON.stringify(clean) })
    setMsg(error ? error.message : 'Saved ✓ (shows on the landing page)')
  }

  return (
    <>
      <h2 style={{ margin: '8px 0 10px' }}>What we stand for</h2>
      {list.map((v, i) => (
        <div className="card" key={i}>
          <input placeholder="Value (e.g. Unity)" value={v.title || ''} onChange={e => set(i, 'title', e.target.value)} />
          <textarea style={{ minHeight: 70 }} placeholder="A sentence about it" value={v.text || ''} onChange={e => set(i, 'text', e.target.value)} />
          <button className="ghost" onClick={() => setList(l => l.filter((_, j) => j !== i))}>REMOVE</button>
        </div>
      ))}
      <button className="ghost" onClick={() => setList(l => [...l, { title: '', text: '' }])}>+ ADD A VALUE</button>{' '}
      <button onClick={save}>SAVE</button>
      {msg && <p className="ok" style={{ marginTop: 8 }}>{msg}</p>}
    </>
  )
}