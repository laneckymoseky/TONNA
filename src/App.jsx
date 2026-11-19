import { useEffect, useState } from 'react'
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { useSport } from './context/SportContext'
import { useCart } from './context/CartContext'
import { SPORTS } from './lib/sports'
import { supabase } from './lib/supabase'
import Snowflake from './components/Snowflake'
import Bell from './components/Bell'
import Index from './pages/Index'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Join from './pages/Join'
import Home from './pages/Home'
import Results from './pages/Results'
import Profile from './pages/Profile'
import Captain from './pages/Captain'
import Challenge from './pages/Challenge'
import Rooms from './pages/Rooms'
import Chat from './pages/Chat'
import Admin from './pages/Admin'
import AdminTools from './pages/AdminTools'
import Player from './pages/Player'
import Team from './pages/Team'
import Stats from './pages/Stats'
import Dashboard from './pages/Dashboard'
import Scores from './pages/Scores'
import Squad from './pages/Squad'
import FreeAgents from './pages/FreeAgents'
import Shop from './pages/Shop'
import Cart from './pages/Cart'
import Orders from './pages/Orders'
import PostNews from './pages/PostNews'
import AdminShop from './pages/AdminShop'
import Notifications from './pages/Notifications'
import Transfers from './pages/Transfers'
import PageTips from './components/PageTips'

function Private({ children }) {
  const { session, loading } = useAuth()
  if (loading) return <p className="wrap muted">Loading…</p>
  return session ? children : <Navigate to="/login" replace />
}

function Nav() {
  const { session, role, slot } = useAuth()
  const { sport, setSport, mySports } = useSport()
  const { count } = useCart()
  const nav = useNavigate()
  const loc = useLocation()
  const [open, setOpen] = useState(false)

  useEffect(() => { setOpen(false) }, [loc.pathname])
  useEffect(() => {
    if (!open) return
    const close = e => { if (!e.target.closest('.more')) setOpen(false) }
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [open])

  const logout = async () => { await supabase.auth.signOut(); nav('/') }
  const isPlayer = role === 'player' && slot
  const teamLink = isPlayer ? `/team/${slot.team_id}` : '/captain'
  const teamLabel = isPlayer || role === 'captain' ? 'My Team' : 'Be a Captain'

  return (
    <header className="nav">
      <Link to="/" className="logo"><Snowflake size={24} />FLAKE<span>CITY</span></Link>
      <nav>
        <select className="sportsel" value={sport} onChange={e => {
          setSport(e.target.value)
          if (loc.pathname.startsWith('/sport/')) nav(`/sport/${e.target.value}`)
          }}>
          {mySports.map(id => <option key={id} value={id}>{SPORTS[id].icon} {SPORTS[id].name}</option>)}
        </select>
        {session ? (
          <>
            <Link to="/home">News</Link>
            <Link to={`/sport/${sport}`}>Dashboard</Link>
            <Link to={teamLink}>{teamLabel}</Link>
            <Link to="/rooms">Chat</Link>
            <Bell />
            <Link to="/cart">🛒{count > 0 && <span className="badge">{count}</span>}</Link>
            <div className="more">
              <button className="ghost" onClick={() => setOpen(o => !o)}>More ▾</button>
              {open && (
                <div className="more-menu">
                  <Link to="/profile">Profile</Link>
                  <Link to="/results">Results</Link>
                  <Link to="/shop">Shop</Link>
                  <Link to="/shop/orders">My orders</Link>
                  <Link to="/agents">Free agents</Link>
                  <Link to="/transfers">Transfers</Link>
                  {role === 'captain' && (
                    <>
                      <Link to="/challenge">Challenge</Link>
                      <Link to="/scores">Scores</Link>
                      <Link to="/stats">Match stats</Link>
                    </>
                  )}
                  {role === 'admin' && <Link to="/admin">Admin</Link>}
                  <button className="ghost" onClick={() => { setOpen(false); window.dispatchEvent(new Event('resettips')) }}>Show page tips</button>
                  <button className="ghost" onClick={logout}>Logout</button>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <Link to="/shop">Shop</Link>
            <Link to="/results">Results</Link>
            <Link to="/login">Login</Link>
          </>
        )}
      </nav>
    </header>
  )
}

export default function App() {
  return (
    <>
      <Nav />
      <PageTips />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/league" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/results" element={<Results />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/join" element={<Private><Join /></Private>} />
        <Route path="/home" element={<Private><Home /></Private>} />
        <Route path="/sport/:sport" element={<Private><Dashboard /></Private>} />
        <Route path="/profile" element={<Private><Profile /></Private>} />
        <Route path="/captain" element={<Private><Captain /></Private>} />
        <Route path="/team/:teamId" element={<Private><Team /></Private>} />
        <Route path="/player/:id" element={<Private><Player /></Private>} />
        <Route path="/challenge" element={<Private><Challenge /></Private>} />
        <Route path="/scores" element={<Private><Scores /></Private>} />
        <Route path="/squad/:cid" element={<Private><Squad /></Private>} />
        <Route path="/stats" element={<Private><Stats /></Private>} />
        <Route path="/agents" element={<Private><FreeAgents /></Private>} />
        <Route path="/transfers" element={<Private><Transfers /></Private>} />
        <Route path="/notifications" element={<Private><Notifications /></Private>} />
        <Route path="/cart" element={<Private><Cart /></Private>} />
        <Route path="/shop/orders" element={<Private><Orders /></Private>} />
        <Route path="/news/new" element={<Private><PostNews /></Private>} />
        <Route path="/rooms" element={<Private><Rooms /></Private>} />
        <Route path="/chat/:roomId" element={<Private><Chat /></Private>} />
        <Route path="/admin" element={<Private><Admin /></Private>} />
        <Route path="/admin/tools" element={<Private><AdminTools /></Private>} />
        <Route path="/admin/shop" element={<Private><AdminShop /></Private>} />
      </Routes>
    </>
  )
}