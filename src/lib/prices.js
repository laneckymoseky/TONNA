export const PRICES = { GK: 4, DEF: 5, MID: 7, FWD: 9 }
export const BUDGET = 100
export const MATCH_SELECT = '*, home:tn_teams!from_team(name), away:tn_teams!to_team(name), field:tn_fields(name)'
export const dparts = d => {
  const x = new Date(d + 'T00:00')
  return [x.getDate(), x.toLocaleString('en', { month: 'short' })]
}