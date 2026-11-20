const ALL_SPORTS = {
  football: {
    name: 'Football', icon: '⚽', color: '#1ea7ff', surface: 'football',
    brand: { short: 'FPL', long: 'Fantasy Premier League' },
    positions: { GK: 'Goalkeeper', DEF: 'Defender', MID: 'Midfielder', FWD: 'Forward' },
    rows: [['FWD'], ['MID'], ['DEF'], ['GK']],
    formats: { 5: ['5-a-side', 8], 7: ['7-a-side', 10], 8: ['8-a-side', 12], 11: ['11-a-side', 18] },
    stats: { goals: 'Goals', assists: 'Assists', saves: 'Saves', yellow: 'Yellow cards', red: 'Red cards' },
    pts: { win: 3, draw: 1, loss: 0 },
    history: {
    text: 'The modern game took shape in London in 1863, when the Football Association wrote the first common rules. The first FIFA World Cup followed in 1930 in Uruguay, and today football is played in almost every country on earth.',
    quote: "Some people think football is a matter of life and death. I assure you, it's much more serious than that.", by: 'Bill Shankly',},
  },
  basketball: {
    name: 'Basketball', icon: '🏀', color: '#0889dfe5', surface: 'basketball',
    brand: { short: 'FBA', long: 'Fantasy Basketball Association' },
    positions: { PG: 'Point guard', SG: 'Shooting guard', SF: 'Small forward', PF: 'Power forward', C: 'Center' },
    rows: [['C'], ['PF', 'SF'], ['SG', 'PG']],
    formats: { 3: ['3x3', 4], 5: ['5-a-side', 12] },
    stats: { points: 'Points', rebounds: 'Rebounds', assists: 'Assists', steals: 'Steals', blocks: 'Blocks', fouls: 'Fouls' },
    pts: { win: 2, draw: 0, loss: 1 },
    history: {
    text: 'Basketball was invented in December 1891 by James Naismith in Springfield, Massachusetts, who hung peach baskets from a gym balcony. It became an Olympic sport at the 1936 Games in Berlin, and 3x3 joined the Olympic programme at Tokyo 2020.',
    quote: "I can accept failure, everyone fails at something. But I can't accept not trying.", by: 'Michael Jordan',},
  },
  rugby: {
    name: 'Rugby', icon: '🏉', color: '#3b82f6',enabled: false, surface: 'rugby',
    brand: { short: 'FRA', long: 'Fantasy Rugby Association' },
    positions: { FR: 'Front row', LK: 'Lock', BR: 'Back row', HB: 'Half-back', CT: 'Centre', B3: 'Back three' },
    rows: [['B3'], ['CT'], ['HB'], ['BR'], ['LK'], ['FR']],
    formats: { 7: ['Sevens', 12], 10: ['Tens', 14], 15: ['15-a-side', 23] },
    stats: { tries: 'Tries', conversions: 'Conversions', penalties: 'Penalties', tackles: 'Tackles', yellow: 'Yellow cards', red: 'Red cards' },
    pts: { win: 4, draw: 2, loss: 0 },
    history: {
      text: 'Legend says William Webb Ellis picked up the ball and ran with it at Rugby School in 1823, though historians doubt the story. The Rugby Football Union formed in 1871, and the seven-a-side game was born in Melrose, Scotland, in 1883.',
      quote: 'with a fine disregard for the rules of football as played in his time', by: 'Plaque at Rugby School',},
  },
}
export const SPORTS = Object.fromEntries(Object.entries(ALL_SPORTS).filter(([, s]) => s.enabled !== false))

export const fmtLabel = (sport, size) => SPORTS[sport]?.formats[size]?.[0] || `${size}-a-side`