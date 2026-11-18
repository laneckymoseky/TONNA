import { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext'
import { SPORTS } from '../lib/sports'

const Ctx = createContext({ sport: 'football', setSport: () => {}, brand: SPORTS.football.brand })
export const useSport = () => useContext(Ctx)

export function SportProvider({ children }) {
  const { team, slot } = useAuth()
  const [pick, setPick] = useState(() => { try { return localStorage.getItem('sport') || '' } catch { return '' } })
  const own = team?.sport || slot?.tn_teams?.sport
  const sport = SPORTS[pick] ? pick : (SPORTS[own] ? own : 'football')
  const brand = SPORTS[sport].brand

  useEffect(() => {
    document.documentElement.style.setProperty('--red', SPORTS[sport].color)
    document.title = `Local${brand.short}`
  }, [sport])

  const setSport = s => { setPick(s); try { localStorage.setItem('sport', s) } catch {} }
  return <Ctx.Provider value={{ sport, setSport, brand }}>{children}</Ctx.Provider>
}