import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const EMPTY = {
  tagline: 'Discipline Builds Freedom', motto: 'Empower • Build • Lead', motto2: 'Youth-driven. Community-powered.',
  mission: '', story: '', pillars: [], people: [],
  contacts: { phone: '', whatsapp: '', email: '', address: '', hours: '' },
  socials: { instagram: '', facebook: '', tiktok: '', x: '', youtube: '' },
}

export default function AdminAbout() {
  const [a, setA] = useState(EMPTY)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    supabase.from('tn_settings').select('value').eq('key', 'about').maybeSingle().then(({ data }) => {
      try {
        const p = JSON.parse(data?.value || '{}')
        setA({ ...EMPTY, ...p, contacts: { ...EMPTY.contacts, ...p.contacts }, socials: { ...EMPTY.socials, ...p.socials } })
      } catch {}
    })
  }, [])

  const set = (k, v) => setA(x => ({ ...x, [k]: v }))
  const setIn = (g, k, v) => setA(x => ({ ...x, [g]: { ...x[g], [k]: v } }))
  const setRow = (g, i, k, v) => setA(x => ({ ...x, [g]: x[g].map((r, j) => (j === i ? { ...r, [k]: v } : r)) }))
  const delRow = (g, i) => setA(x => ({ ...x, [g]: x[g].filter((_, j) => j !== i) }))

  async function save() {
    const socials = Object.fromEntries(Object.entries(a.socials).map(([k, v]) => [k, /^https:\/\//i.test(v.trim()) ? v.trim() : '']))
    const bad = Object.entries(a.socials).filter(([k, v]) => v.trim() && !socials[k]).map(([k]) => k)
    const value = JSON.stringify({
      ...a, socials,
      pillars: a.pillars.filter(p => p.title?.trim()),
      people: a.people.filter(p => p.name?.trim()),
    })
    const { error } = await supabase.from('tn_settings').upsert({ key: 'about', value })
    setMsg(error ? error.message : bad.length ? `Saved. Links must start with https:// (skipped: ${bad.join(', ')})` : 'Saved ✓')
  }

  return (
    <>
      <h2 style={{ margin: '8px 0 10px' }}>About page (index)</h2>
      <div className="card">
        <input placeholder="Tagline" value={a.tagline} onChange={e => set('tagline', e.target.value)} />
        <textarea placeholder="Our story" value={a.story} onChange={e => set('story', e.target.value)} />
        <textarea placeholder="Mission" style={{ minHeight: 70 }} value={a.mission} onChange={e => set('mission', e.target.value)} />
        <input placeholder="Motto line 1" value={a.motto} onChange={e => set('motto', e.target.value)} />
        <input placeholder="Motto line 2" value={a.motto2} onChange={e => set('motto2', e.target.value)} />
      </div>

      <b>What we do</b>
      {a.pillars.map((p, i) => (
        <div className="card" key={i} style={{ marginTop: 8 }}>
          <input placeholder="Title (e.g. Build)" value={p.title || ''} onChange={e => setRow('pillars', i, 'title', e.target.value)} />
          <textarea style={{ minHeight: 60 }} placeholder="Short description" value={p.text || ''} onChange={e => setRow('pillars', i, 'text', e.target.value)} />
          <button className="ghost" onClick={() => delRow('pillars', i)}>REMOVE</button>
        </div>
      ))}
      <button className="ghost" style={{ margin: '8px 0 16px' }} onClick={() => set('pillars', [...a.pillars, { title: '', text: '' }])}>+ ADD</button>

      <br /><b>Who created Flake City</b>
      {a.people.map((p, i) => (
        <div className="card" key={i} style={{ marginTop: 8 }}>
          <input placeholder="Name" value={p.name || ''} onChange={e => setRow('people', i, 'name', e.target.value)} />
          <input placeholder="Role" value={p.role || ''} onChange={e => setRow('people', i, 'role', e.target.value)} />
          <textarea style={{ minHeight: 60 }} placeholder="Short bio" value={p.bio || ''} onChange={e => setRow('people', i, 'bio', e.target.value)} />
          <button className="ghost" onClick={() => delRow('people', i)}>REMOVE</button>
        </div>
      ))}
      <button className="ghost" style={{ margin: '8px 0 16px' }} onClick={() => set('people', [...a.people, { name: '', role: '', bio: '' }])}>+ ADD PERSON</button>

      <div className="card">
        <b>Contacts</b>
        <input placeholder="Phone" value={a.contacts.phone} onChange={e => setIn('contacts', 'phone', e.target.value)} />
        <input placeholder="WhatsApp number (with country code, e.g. 2547...)" value={a.contacts.whatsapp} onChange={e => setIn('contacts', 'whatsapp', e.target.value)} />
        <input placeholder="Email" value={a.contacts.email} onChange={e => setIn('contacts', 'email', e.target.value)} />
        <input placeholder="Address / location" value={a.contacts.address} onChange={e => setIn('contacts', 'address', e.target.value)} />
        <input placeholder="Opening hours" value={a.contacts.hours} onChange={e => setIn('contacts', 'hours', e.target.value)} />
        <b>Socials (full links starting with https://)</b>
        {Object.keys(EMPTY.socials).map(k => (
          <input key={k} placeholder={k} value={a.socials[k]} onChange={e => setIn('socials', k, e.target.value)} />
        ))}
      </div>
      <button style={{ width: '100%' }} onClick={save}>SAVE ABOUT PAGE</button>
      {msg && <p className="ok" style={{ marginTop: 8 }}>{msg}</p>}
    </>
  )
}