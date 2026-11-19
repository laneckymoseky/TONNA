import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useSport } from '../context/SportContext'
import { SPORTS } from '../lib/sports'
import { MATCH_SELECT } from '../lib/prices'
import Snowflake from '../components/Snowflake'

const ICE = '#1ea7ff'
const DEFAULTS = {
  tagline: 'Discipline Builds Freedom', motto: 'Empower • Build • Lead', motto2: 'Youth-driven. Community-powered.',
  mission: '', story: '', pillars: [], people: [], contacts: {}, socials: {},
}
const SOCIALS = [['instagram', 'Instagram'], ['facebook', 'Facebook'], ['tiktok', 'TikTok'], ['x', 'X'], ['youtube', 'YouTube']]
const safe = u => (/^https:\/\//i.test(u || '') ? u : null)

function useCountdown(target) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => { const i = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(i) }, [])
  const d = Math.max(0, target - now)
  return [Math.floor(d / 864e5), Math.floor(d / 36e5) % 24, Math.floor(d / 6e4) % 60, Math.floor(d / 1e3) % 60]
}

export default function Index() {
  const { session, role } = useAuth()
  const { sport } = useSport()
  const [a, setA] = useState(DEFAULTS)
  const [next, setNext] = useState(null)
  const sp = SPORTS[sport]

  useEffect(() => {
    document.documentElement.style.setProperty('--red', ICE)
    return () => document.documentElement.style.setProperty('--red', SPORTS[sport].color)
  }, [sport])

  useEffect(() => {
    supabase.from('tn_settings').select('value').eq('key', 'about').maybeSingle().then(({ data }) => {
      try { setA({ ...DEFAULTS, ...JSON.parse(data?.value || '{}') }) } catch {}
    })
  }, [])

  useEffect(() => {
    setNext(null)
    const today = new Date().toISOString().slice(0, 10)
    supabase.from('tn_challenges').select(MATCH_SELECT).eq('sport', sport).eq('status', 'accepted').gte('match_date', today)
      .order('match_date').order('match_time').limit(1).then(({ data }) => setNext(data?.[0] || null))
  }, [sport])

  const target = next ? new Date(`${next.match_date}T${next.match_time}`).getTime() : 0
  const [d, h, m, s] = useCountdown(target)
  const c = a.contacts || {}
  const soc = a.socials || {}
  const pillars = a.pillars || []
  const people = a.people || []
  const wa = (c.whatsapp || '').replace(/\D/g, '')
  const tel = (c.phone || '').replace(/[^\d+]/g, '')
  const hasContact = c.phone || c.email || wa || c.address || c.hours
  const hasSocial = SOCIALS.some(([k]) => safe(soc[k]))
  const empty = !a.mission && !a.story && !pillars.length && !people.length && !hasContact && !hasSocial
  const enter = session ? '/home' : '/league'

  return (
    <div className="ix">
      <div className="ix-bg" />
      <div key={sport} className="ix-top"
        style={{ backgroundImage: `url(/images/index-hero-${sport}.jpg), url(/images/index-hero.jpg)` }} />

      <div className="ix-in">
        <header className="ice ix-head">
          <Snowflake size={84} color={ICE} />
          <div>
            <h1>FLAKE CITY<br />BEYOND CONSTRUCTION</h1>
            <p className="ix-tag">{a.tagline}</p>
          </div>
        </header>

        <section className="ice ix-next">
          <div className="ix-kick">{sp.icon} {sp.name} league</div>
          {next ? (
            <>
              <h2>NEXT GAME {next.match_time?.slice(0, 5)}</h2>
              <div className="ix-vs">{next.home?.name} VS {next.away?.name}</div>
              <div className="ix-count">
                {[['Days', d], ['Hr', h], ['Min', m], ['Sec', s]].map(([l, v]) => (
                  <div key={l}><b>{String(v).padStart(2, '0')}</b><small>{l}</small></div>
                ))}
              </div>
              <p className="muted">{next.match_date} · {next.field?.name}</p>
            </>
          ) : (
            <>
              <h2>JOIN THE CREW</h2>
              <p className="muted">No {sp.name.toLowerCase()} games scheduled yet. Be one of the first teams in.</p>
            </>
          )}
        </section>

        <div className="ix-btns">
          <Link className="btn ghost" to={enter}>MATCH DETAILS ›</Link>
          <Link className="btn" to={session ? '/join' : '/signup'}>JOIN CREW</Link>
        </div>

        {pillars.length > 0 && (
          <>
            <h2 className="ix-h">What we do</h2>
            <div className="grid">
              {pillars.map(p => (
                <div className="ice" key={p.title}>
                  <Snowflake size={28} color={ICE} />
                  <b style={{ display: 'block', margin: '8px 0 4px', fontSize: 20 }}>{p.title}</b>
                  <p className="muted">{p.text}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {(a.mission || a.story) && (
          <section className="ice">
            <h2 className="ix-h" style={{ marginTop: 0 }}>Our story</h2>
            {a.story && <p style={{ whiteSpace: 'pre-wrap', marginBottom: 10 }}>{a.story}</p>}
            {a.mission && <p className="muted" style={{ whiteSpace: 'pre-wrap' }}><b>Mission:</b> {a.mission}</p>}
          </section>
        )}

        {people.length > 0 && (
          <>
            <h2 className="ix-h">Who created Flake City</h2>
            <div className="grid">
              {people.map(p => (
                <div className="ice" key={p.name}>
                  <b style={{ fontSize: 20 }}>{p.name}</b>
                  {p.role && <p style={{ color: ICE, fontWeight: 700 }}>{p.role}</p>}
                  {p.bio && <p className="muted" style={{ marginTop: 6 }}>{p.bio}</p>}
                </div>
              ))}
            </div>
          </>
        )}

        {(hasContact || hasSocial) && (
          <section className="ice">
            <h2 className="ix-h" style={{ marginTop: 0 }}>Get in touch</h2>
            {c.phone && <p>📞 <a href={`tel:${tel}`}>{c.phone}</a></p>}
            {wa && <p>💬 <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer">WhatsApp us</a></p>}
            {c.email && <p>✉️ <a href={`mailto:${c.email}`}>{c.email}</a></p>}
            {c.address && <p>📍 {c.address}</p>}
            {c.hours && <p>🕒 {c.hours}</p>}
            {hasSocial && (
              <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {SOCIALS.map(([k, label]) => safe(soc[k]) && (
                  <a key={k} className="pill" href={soc[k]} target="_blank" rel="noopener noreferrer">{label}</a>
                ))}
              </div>
            )}
          </section>
        )}

        {empty && role === 'admin' && (
          <div className="ice">Admin: add your story, team, contacts and socials in <b>Admin → Admin tools → About page</b>. Empty sections stay hidden.</div>
        )}

        <section className="ice ix-motto">
          <b>{a.motto}</b>
          <p className="muted">{a.motto2}</p>
        </section>

        <div className="ix-btns">
          <Link className="btn" to={enter}>{session ? 'OPEN THE LEAGUE' : 'ENTER THE LEAGUE'}</Link>
        </div>
      </div>
    </div>
  )
}