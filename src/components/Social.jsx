import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const EMOJI = { like: '👍', love: '❤️', fire: '🔥', laugh: '😂', clap: '👏' }

export default function Social({ type, id, moderate = false }) {
  const { session, role } = useAuth()
  const [open, setOpen] = useState(false)
  const [rx, setRx] = useState([])
  const [cm, setCm] = useState([])
  const [text, setText] = useState('')
  const [err, setErr] = useState('')
  const uid = session?.user?.id

  async function load() {
    const [r, c] = await Promise.all([
      supabase.from('tn_reactions').select('user_id, emoji').eq('target_type', type).eq('target_id', id),
      supabase.from('tn_comments').select('*').eq('target_type', type).eq('target_id', id).order('created_at'),
    ])
    setRx(r.data || []); setCm(c.data || [])
  }
  useEffect(() => { if (open) load() }, [open])

  async function react(code) {
    setErr('')
    const mine = rx.find(r => r.user_id === uid)
    const { error } = mine?.emoji === code
      ? await supabase.from('tn_reactions').delete().eq('target_type', type).eq('target_id', id).eq('user_id', uid)
      : await supabase.from('tn_reactions').upsert({ target_type: type, target_id: id, user_id: uid, emoji: code })
    error ? setErr(error.message) : load()
  }
  async function send(e) {
    e.preventDefault()
    const body = text.trim()
    if (!body) return
    const { error } = await supabase.from('tn_comments').insert({ target_type: type, target_id: id, user_id: uid, body })
    if (error) return setErr(error.message)
    setText(''); load()
  }
  async function del(cid) {
    const { error } = await supabase.from('tn_comments').delete().eq('id', cid)
    error ? setErr(error.message) : load()
  }

  if (!session) return <p className="muted" style={{ marginTop: 8 }}>Log in to react and comment.</p>
  if (!open) return <button className="ghost" style={{ marginTop: 10 }} onClick={() => setOpen(true)}>💬 Reactions &amp; comments</button>

  const mineEmoji = rx.find(r => r.user_id === uid)?.emoji
  return (
    <div style={{ marginTop: 10 }}>
      {Object.entries(EMOJI).map(([code, ch]) => {
        const n = rx.filter(r => r.emoji === code).length
        return <button key={code} className={'rx' + (mineEmoji === code ? ' on' : '')} onClick={() => react(code)}>{ch} {n || ''}</button>
      })}
      {err && <p className="err">{err}</p>}
      <div className="cmts">
        {cm.map(c => (
          <div className="cmt" key={c.id}>
            <div className="row">
              <b>{c.author_name}</b>
              <span className="muted" style={{ fontSize: 13 }}>{new Date(c.created_at).toLocaleString()}</span>
            </div>
            <p style={{ whiteSpace: 'pre-wrap' }}>{c.body}</p>
            {(c.user_id === uid || role === 'admin' || moderate) &&
              <button className="ghost" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => del(c.id)}>DELETE</button>}
          </div>
        ))}
        {cm.length === 0 && <p className="muted">No comments yet.</p>}
      </div>
      <form className="row" onSubmit={send} style={{ marginTop: 8 }}>
        <input style={{ margin: 0 }} placeholder="Write a comment…" maxLength={500} value={text} onChange={e => setText(e.target.value)} />
        <button>POST</button>
      </form>
    </div>
  )
}