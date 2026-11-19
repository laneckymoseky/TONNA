import { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext'
import { supabase } from '../lib/supabase'
import { SPORTS } from '../lib/sports'

const ALL = Object.keys(SPORTS)
const Ctx = createContext({ sport: 'football', setSport() {}, brand: SPORTS.football.brand, mySports: ALL, ready: true, reloadSports() {} })
export const useSport = () => useContext(Ctx)

export function SportProvider({ children }) {
  const { session, team, slot, role, loading } = useAuth()
  const uid = session?.user?.id
  const [pick, setPick] = useState(() => { try { return localStorage.getItem('sport') || '' } catch { return '' } })
  const [mine, setMine] = useState({ uid: null, list: [] })
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!uid) return
    supabase.from('tn_people').select('sports').eq('user_id', uid).maybeSingle()
      .then(({ data }) => setMine({ uid, list: data?.sports || [] }))
  }, [uid, tick])

  const ready = !loading && (!uid || mine.uid === uid)
  const own = [team?.sport, slot?.tn_teams?.sport].filter(s => SPORTS[s])
  let mySports = ALL
  if (uid && role !== 'admin') {
    mySports = [...new Set([...mine.list, ...own].filter(s => SPORTS[s]))]
    if (!mySports.length) mySports = ['football']
  }
  const sport = mySports.includes(pick) ? pick : (mySports.includes(own[0]) ? own[0] : mySports[0])
  const brand = SPORTS[sport].brand

  useEffect(() => {
    document.documentElement.style.setProperty('--red', SPORTS[sport].color)
    document.title = 'Flake City'
  }, [sport])

  const setSport = s => { setPick(s); try { localStorage.setItem('sport', s) } catch {} }
  const reloadSports = () => setTick(t => t + 1)
  return <Ctx.Provider value={{ sport, setSport, brand, mySports, ready, reloadSports }}>{children}</Ctx.Provider>
}