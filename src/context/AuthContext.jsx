import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const Ctx = createContext(null)
export const useAuth = () => useContext(Ctx)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [team, setTeam] = useState(null)
  const [slot, setSlot] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  async function loadAll(user) {
    if (!user) { setProfile(null); setTeam(null); setSlot(null); setIsAdmin(false); return }
    const [p, t, s, a] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
      supabase.from('tn_teams').select('*').eq('captain_id', user.id).maybeSingle(),
      supabase.from('tn_roster').select('*, tn_teams(name)').eq('user_id', user.id).maybeSingle(),
      supabase.rpc('tn_is_admin'),
    ])
    setProfile(p.data); setTeam(t.data); setSlot(s.data); setIsAdmin(a.data === true)
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session)
      await loadAll(data.session?.user)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s)
      setTimeout(() => loadAll(s?.user), 0)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const role = isAdmin ? 'admin' : team ? 'captain' : slot ? 'player' : 'new'
  const name = profile?.full_name || session?.user?.email || ''

  return (
    <Ctx.Provider value={{ session, profile, team, slot, role, name, loading, refresh: () => loadAll(session?.user) }}>
      {children}
    </Ctx.Provider>
  )
}