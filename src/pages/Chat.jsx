import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Bg from '../components/Bg'

export default function Chat() {
  const { roomId } = useParams()
  const { session } = useAuth()
  const [msgs, setMsgs] = useState([])
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const bottom = useRef()

  useEffect(() => {
    supabase.from('tn_rooms').select('title').eq('id', roomId).maybeSingle().then(({ data }) => setTitle(data?.title || 'Chat'))
    supabase.from('tn_messages').select('*').eq('room_id', roomId).order('created_at')
      .then(({ data }) => setMsgs(data || []))
    const ch = supabase.channel('room-' + roomId)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'tn_messages', filter: `room_id=eq.${roomId}` },
        p => setMsgs(m => (m.some(x => x.id === p.new.id) ? m : [...m, p.new])))
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [roomId])

  useEffect(() => { bottom.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs])

  async function send(e) {
    e.preventDefault()
    const body = text.trim()
    if (!body) return
    setText('')
    const { data } = await supabase.from('tn_messages')
      .insert({ room_id: roomId, sender_id: session.user.id, body }).select().single()
    if (data) setMsgs(m => (m.some(x => x.id === data.id) ? m : [...m, data]))
  }

  return (
    <div className="wrap">
      <Bg name="chat" />
      <div className="chatbox">
        <div className="chat-head">
          <Link to="/rooms" className="muted">← Rooms</Link>
          <b>{title}</b>
        </div>
        <div className="msgs">
          {msgs.length === 0 && <p className="muted" style={{ margin: 'auto' }}>No messages yet. Say hi 👋</p>}
          {msgs.map(m => {
            const mine = m.sender_id === session.user.id
            return (
              <div key={m.id} className={'bubble' + (mine ? ' me' : '')}>
                {!mine && <small>{m.sender_name}</small>}
                {m.body}
              </div>
            )
          })}
          <div ref={bottom} />
        </div>
        <form className="chat-input" onSubmit={send}>
          <input placeholder="Type a message…" value={text} onChange={e => setText(e.target.value)} />
          <button>SEND</button>
        </form>
      </div>
    </div>
  )
}