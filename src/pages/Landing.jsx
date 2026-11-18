import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useSport } from '../context/SportContext'
import { MATCH_SELECT } from '../lib/prices'
import Snowflake from '../components/Snowflake'

const steps = [
  ['1', 'Captain registers the team', 'Add players with their exact names and positions.', '/images/captain.jpg'],
  ['2', 'Players sign up', 'Create an account, pick your team and enter the name your captain registered.', '/images/signup.jpg'],
  ['3', 'Captain approves', 'Your captain approves your request and you join the squad.', '/images/approve.jpg'],
  ['4', 'Challenge and play', 'Captains challenge each other and pick a venue, date and time.', '/images/match.jpg'],
  ['5', 'Build your fantasy squad', 'Buy players from the market. Price depends on position.', '/images/market.jpg'],
  ['6', 'Chat', 'Team chat for your squad and a private room for captains with an accepted challenge.', '/images/chat.jpg'],
]

function useCountdown(target) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => { const i = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(i) }, [])
  const d = Math.max(0, target - now)
  return [Math.floor(d / 864e5), Math.floor(d / 36e5) % 24, Math.floor(d / 6e4) % 60, Math.floor(d / 1e3) % 60]
}

export default function Landing() {
  const { session } = useAuth()
  const { sport, brand } = useSport()
  const [next, setNext] = useState(null)
  const [last, setLast] = useState(null)
  const [values, setValues] = useState([])

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10)
    supabase.from('tn_challenges').select(MATCH_SELECT).eq('sport', sport).eq('status', 'accepted').gte('match_date', today)
      .order('match_date').order('match_time').limit(1).then(({ data }) => setNext(data?.[0] || null))
    supabase.from('tn_challenges').select(MATCH_SELECT).eq('sport', sport).eq('status', 'played')
      .order('match_date', { ascending: false }).limit(1).then(({ data }) => setLast(data?.[0] || null))
  }, [sport])

  useEffect(() => {
    supabase.from('tn_settings').select('value').eq('key', 'values').maybeSingle().then(({ data }) => {
      try { setValues(JSON.parse(data?.value || '[]')) } catch { setValues([]) }
    })
  }, [])

  const target = next ? new Date(`${next.match_date}T${next.match_time}`).getTime() : 0
  const [d, h, m, s] = useCountdown(target)

  return (
    <>
      <section className="lp-hero">
        <div className="lp-bg" style={{
          '--hero': `url(/images/hero-${sport}.jpg), url(/images/hero.jpg)`,
          '--hero-m': `url(/images/hero-mobile-${sport}.jpg), url(/images/hero-mobile.jpg)`,
        }} />
        <div className="lp-flake"><Snowflake size={420} /></div>
        <div className="lp-inner">
          <div className="lp-kicker">{brand.long}</div>
          <h1 className="lp-title">LOCAL<br /><span>{brand.short}</span></h1>
          <p className="lp-sub">Register your team, challenge rivals, book a venue and build your fantasy squad.</p>
          {session
            ? <Link className="btn" to="/home">OPEN APP</Link>
            : <><Link className="btn" to="/signup">SIGN UP</Link><Link className="btn ghost" to="/login">LOGIN</Link></>}
        </div>
      </section>

      {next && (
        <div className="lp-strip">
          <div className="lp-next">
            <span className="lbl">Next game</span>
            <span className="lp-vs">{next.home?.name} <span className="muted">vs</span> {next.away?.name}</span>
            <span className="muted">{next.match_date} · {next.match_time?.slice(0, 5)} · {next.field?.name}</span>
          </div>
          <div className="lp-count">
            {[['Days', d], ['Hours', h], ['Mins', m], ['Secs', s]].map(([l, v]) => (
              <div key={l}><b>{String(v).padStart(2, '0')}</b><small>{l}</small></div>
            ))}
          </div>
        </div>
      )}

      {last && (
        <div className="lp-result">
          <h2>Latest result</h2>
          <div className="lp-board">
            <span className="team">{last.home?.name}</span>
            <div className="lp-score"><span>{last.home_score}</span><span>{last.away_score}</span></div>
            <span className="team">{last.away?.name}</span>
          </div>
          <p className="muted" style={{ marginTop: 8 }}>{last.match_date} · {last.field?.name}</p>
        </div>
      )}

      {values.length > 0 && (
        <section className="wrap" style={{ paddingTop: 50 }}>
          <h2 style={{ marginBottom: 16 }}>What we stand for</h2>
          <div className="grid">
            {values.map(v => (
              <div className="card" key={v.title}>
                <Snowflake size={30} color="var(--red)" />
                <b style={{ display: 'block', margin: '8px 0 4px', fontSize: 20 }}>{v.title}</b>
                <p className="muted">{v.text}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="lp-steps">
        <div className="wrap">
          <h2 style={{ marginBottom: 18 }}>How it works</h2>
          <div className="grid">
            {steps.map(([n, t, desc, img]) => (
              <div className="lp-card" key={n}>
                <span className="num">{n}</span>
                <img src={img} alt={t} onError={e => (e.target.style.display = 'none')} />
                <b>{t}</b>
                <p className="muted">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="lp-cta">
        <h2 style={{ marginBottom: 14 }}>Ready to play?</h2>
        <Link className="btn" to={session ? '/home' : '/signup'}>{session ? 'OPEN APP' : 'CREATE ACCOUNT'}</Link>
      </div>
    </>
  )
}