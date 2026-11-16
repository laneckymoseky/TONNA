import { useEffect, useState } from 'react'
import { supabase } from './supabase'

export function useBooked(teamId) {
  const [state, setState] = useState({ booked: new Set(), next: null })
  useEffect(() => {
    if (!teamId) return
    const today = new Date().toISOString().slice(0, 10)
    supabase.from('tn_challenges')
      .select('id, match_date, match_time, home:tn_teams!from_team(name), away:tn_teams!to_team(name)')
      .or(`from_team.eq.${teamId},to_team.eq.${teamId}`).eq('status', 'accepted').gte('match_date', today)
      .order('match_date').order('match_time').limit(1)
      .then(async ({ data }) => {
        const next = data?.[0] || null
        if (!next) return setState({ booked: new Set(), next: null })
        const { data: sq } = await supabase.from('tn_match_squad').select('roster_id').eq('challenge_id', next.id)
        setState({ booked: new Set((sq || []).map(r => r.roster_id)), next })
      })
  }, [teamId])
  return state
}