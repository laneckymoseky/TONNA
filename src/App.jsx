import { Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { useSport } from './context/SportContext'
import { SPORTS } from './lib/sports'
import { supabase } from './lib/supabase'
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

function Private({ children }) {
  const { session, loading } = useAuth()
  if (loading) return <p className="wrap muted">Loading…</p>
  return session ? children : <Navigate to="/login" replace />
}

function Nav() {
  const { session, role, slot } = useAuth()
  const { sport, setSport } = useSport()
  const nav = useNavigate()
  const logout = async () => { await supabase.auth.signOut(); nav('/') }
  return (
    <header className="nav">
      <Link to="/" className="logo">LOCAL<span>FPL</span></Link>
      <nav>
        <select className="sportsel" value={sport} onChange={e => { setSport(e.target.value); nav(`/sport/${e.target.value}`) }}>
          {Object.entries(SPORTS).map(([id, s]) => <option key={id} value={id}>{s.icon} {s.name}</option>)}
        </select>
        <Link to="/results">Results</Link>
        {session ? (
          <>
            <Link to="/home">News</Link>
            <Link to={`/sport/${sport}`}>Dashboard</Link>
            <Link to="/profile">Profile</Link>
            <Link to="/rooms">Chat</Link>
            {role === 'player' && slot
              ? <Link to={`/team/${slot.team_id}`}>My Team</Link>
              : <Link to="/captain">{role === 'captain' ? 'My Team' : 'Be a Captain'}</Link>}
            {role === 'captain' && <><Link to="/challenge">Challenge</Link><Link to="/stats">Stats</Link></>}
            {role === 'admin' && <Link to="/admin">Admin</Link>}
            <button className="ghost" onClick={logout}>Logout</button>
          </>
        ) : <Link to="/login">Login</Link>}
      </nav>
    </header>
  )
}

export default function App() {
  return (
    <>
      <Nav />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/results" element={<Results />} />
        <Route path="/join" element={<Private><Join /></Private>} />
        <Route path="/home" element={<Private><Home /></Private>} />
        <Route path="/sport/:sport" element={<Private><Dashboard /></Private>} />
        <Route path="/profile" element={<Private><Profile /></Private>} />
        <Route path="/captain" element={<Private><Captain /></Private>} />
        <Route path="/team/:teamId" element={<Private><Team /></Private>} />
        <Route path="/player/:id" element={<Private><Player /></Private>} />
        <Route path="/challenge" element={<Private><Challenge /></Private>} />
        <Route path="/stats" element={<Private><Stats /></Private>} />
        <Route path="/rooms" element={<Private><Rooms /></Private>} />
        <Route path="/chat/:roomId" element={<Private><Chat /></Private>} />
        <Route path="/admin" element={<Private><Admin /></Private>} />
        <Route path="/admin/tools" element={<Private><AdminTools /></Private>} />
      </Routes>
    </>
  )
}