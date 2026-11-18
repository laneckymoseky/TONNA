export const SPORTS = {
  football: {
    name: 'Football', icon: '⚽', color: '#e11d2e', surface: 'football',
    brand: { short: 'FPL', long: 'Fantasy Premier League' },
    positions: { GK: 'Goalkeeper', DEF: 'Defender', MID: 'Midfielder', FWD: 'Forward' },
    rows: [['FWD'], ['MID'], ['DEF'], ['GK']],
    formats: { 5: ['5-a-side', 8], 7: ['7-a-side', 10], 8: ['8-a-side', 12], 11: ['11-a-side', 18] },
    stats: { goals: 'Goals', assists: 'Assists', saves: 'Saves', yellow: 'Yellow cards', red: 'Red cards' },
    pts: { win: 3, draw: 1, loss: 0 },
  },
  basketball: {
    name: 'Basketball', icon: '🏀', color: '#ff7a18', surface: 'basketball',
    brand: { short: 'FBA', long: 'Fantasy Basketball Association' },
    positions: { PG: 'Point guard', SG: 'Shooting guard', SF: 'Small forward', PF: 'Power forward', C: 'Center' },
    rows: [['C'], ['PF', 'SF'], ['SG', 'PG']],
    formats: { 3: ['3x3', 4], 5: ['5-a-side', 12] },
    stats: { points: 'Points', rebounds: 'Rebounds', assists: 'Assists', steals: 'Steals', blocks: 'Blocks', fouls: 'Fouls' },
    pts: { win: 2, draw: 0, loss: 1 },
  },
  rugby: {
    name: 'Rugby', icon: '🏉', color: '#3b82f6', surface: 'rugby',
    brand: { short: 'FRA', long: 'Fantasy Rugby Association' },
    positions: { FR: 'Front row', LK: 'Lock', BR: 'Back row', HB: 'Half-back', CT: 'Centre', B3: 'Back three' },
    rows: [['B3'], ['CT'], ['HB'], ['BR'], ['LK'], ['FR']],
    formats: { 7: ['Sevens', 12], 10: ['Tens', 14], 15: ['15-a-side', 23] },
    stats: { tries: 'Tries', conversions: 'Conversions', penalties: 'Penalties', tackles: 'Tackles', yellow: 'Yellow cards', red: 'Red cards' },
    pts: { win: 4, draw: 2, loss: 0 },
  },
}
export const fmtLabel = (sport, size) => SPORTS[sport]?.formats[size]?.[0] || `${size}-a-side`