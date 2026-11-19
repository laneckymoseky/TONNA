import { useEffect, useState } from 'react'
import { matchPath, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSport } from '../context/SportContext'
import { SPORTS } from '../lib/sports'

const ROUTES = [
  ['/home', 'news'], ['/sport/:sport', 'dash'], ['/results', 'results'], ['/profile', 'profile'],
  ['/captain', 'captain'], ['/team/:teamId', 'team'], ['/player/:id', 'player'], ['/challenge', 'challenge'],
  ['/scores', 'scores'], ['/squad/:cid', 'squad'], ['/stats', 'stats'], ['/agents', 'agents'],
  ['/transfers', 'transfers'], ['/notifications', 'notifs'], ['/rooms', 'rooms'], ['/chat/:roomId', 'chat'],
  ['/shop', 'shop'], ['/cart', 'cart'], ['/shop/orders', 'orders'], ['/news/new', 'post'],
  ['/admin', 'admin'], ['/admin/tools', 'tools'], ['/admin/shop', 'adminshop'], ['/join', 'join'],
]

function tipFor(key, role, sp) {
  const cap = role === 'captain'
  const adm = role === 'admin'
  const T = {
    news: { icon: '📰', title: 'News', text: 'Announcements and upcoming matches, grouped by sport.', points: [
      'Use the tabs at the top to filter by sport.',
      'Tap 👕 Line-ups under a match to see who is playing.',
      'React and comment on posts.',
      'Search any team to see its squad.',
      ...(cap || adm ? ['Use POST NEWS to share an update.'] : []),
    ] },
    dash: { icon: sp.icon, title: `${sp.name} dashboard`, text: `Everything happening in ${sp.name.toLowerCase()} in one place.`, points: [
      'Standings update when captains confirm scores. Use the dropdown to change season.',
      'Tap a team to see its squad and tap a player for career stats.',
      'Leaders show the top players in each stat.',
      'Switch sport with the dropdown at the top.',
    ] },
    results: { icon: '🏁', title: 'Results', text: 'Final scores for every finished match.', points: [
      'A result appears once both captains confirm the score.',
      'Tap Reactions & comments under a result to join in.',
    ] },
    profile: { icon: '🙋', title: 'Your profile', text: 'Your photo, privacy, sports and stats.', points: [
      'Add a portrait photo with ADD PHOTO.',
      'Profile visibility decides who can see you: Public, My team only or Private.',
      'My sports controls which sports you see around the app.',
      'Your stats stay with you if you change teams.',
      ...(role === 'player' ? ['LEAVE TEAM makes you a free agent.'] : []),
    ] },
    captain: cap
      ? { icon: '📋', title: 'My Team', text: 'Build and run your squad.', points: [
          'Add players with their exact name and position. They join using that name and you approve them.',
          'Give each player a worth. You have 100m to share.',
          'PICK SQUAD chooses who is booked for your next game (green ring).',
          'ADD MATCH STATS after a game feeds player profiles.',
        ] }
      : { icon: '🧢', title: 'Be a captain', text: 'Register your own team.', points: [
          'Pick the sport and format. These cannot be changed later.',
          'Add your location and home ground.',
          'You then add players and approve join requests.',
        ] },
    team: { icon: '🏟️', title: 'Team squad', text: 'The squad laid out on the pitch.', points: [
      'Green ring means booked for the next game, yellow means not booked, and a ✓ means signed up.',
      'Tap a player or STATS to see their career stats.',
      'Captains of the same sport also get an OFFER button for transfers.',
    ] },
    player: { icon: '⭐', title: 'Player profile', text: 'Career numbers, across every team they have played for.', points: [
      'Use the season dropdown to filter their stats.',
      'The status bar shows whether they are booked for a game.',
      'CHAT starts a direct message. Captains can make a transfer offer.',
    ] },
    challenge: { icon: '⚔️', title: 'Challenge a team', text: 'Ask another team to play.', points: [
      'You can only challenge teams of your sport and format.',
      'Pick a venue, date and time. A venue cannot be double-booked.',
      'When they accept, the match shows in News and a captains\' chat room opens.',
      'Incoming challenges appear at the bottom for you to accept or decline.',
    ] },
    scores: { icon: '🧾', title: 'Match scores', text: 'Report the final score after a game.', points: [
      'One captain submits the score and the other confirms it.',
      'If you disagree, tap DISPUTE and an admin decides.',
      'Confirmed scores go to Results and the standings.',
    ] },
    squad: { icon: '✅', title: 'Pick your squad', text: 'Choose who plays in this game.', points: [
      'Tick every player who is booked, then save.',
      'Booked players get a green ring, and everyone can see the line-up under the match in News.',
    ] },
    stats: { icon: '📊', title: 'Match stats', text: 'Record how each player did.', points: [
      'Choose a finished match, untick anyone who did not play, and enter their numbers.',
      'Saved stats go onto each player\'s career profile.',
      'You can come back and edit them.',
    ] },
    agents: cap
      ? { icon: '🔎', title: 'Free agents', text: 'Players looking for a team in your sport.', points: [
          'Filter by position and area.',
          'Choose the position you want them to play, then INVITE.',
          'Cancel pending invites at the bottom.',
        ] }
      : { icon: '🙌', title: 'Free agents', text: 'Get noticed by captains.', points: [
          'List yourself with your sport, position and area.',
          'Captains who invite you appear here. Tap JOIN to accept.',
          'Remove yourself from the pool at any time.',
        ] },
    transfers: { icon: '🔁', title: 'Transfers', text: 'Offers for players moving between teams.', points: [
      'Captains make offers from a player\'s page or from a team page.',
      'Both the player and their current captain must accept before the move happens.',
      'You can cancel your own offers while they are pending.',
    ] },
    notifs: { icon: '🔔', title: 'Notifications', text: 'Invites, challenges, scores to confirm, transfers and order updates.', points: [
      'Tap one to jump to the right page.',
      'MARK ALL READ clears the red badge.',
    ] },
    rooms: { icon: '💬', title: 'Chat rooms', text: 'Your conversations.', points: [
      'Team rooms are for your squad.',
      'Captains\' rooms open when a challenge is accepted.',
      'Direct messages start from a player\'s profile.',
    ] },
    chat: { icon: '💬', title: 'Chat', text: 'Messages arrive live. Type below and press SEND.' },
    shop: { icon: '🛍️', title: 'Shop', text: 'Club gear and merchandise.', points: [
      'Pick a size if one is needed, then ADD TO CART.',
      'Use the tabs to filter by sport.',
      'Pay with M-Pesa at checkout.',
    ] },
    cart: { icon: '🛒', title: 'Cart and checkout', text: 'Pay with M-Pesa, then confirm here.', points: [
      'Follow the payment instructions shown, then type your phone number and the M-Pesa confirmation code.',
      'We verify the payment and update your order status.',
      'Follow it in My orders.',
    ] },
    orders: { icon: '📦', title: 'My orders', text: 'Track what you bought.', points: [
      'Status goes from Awaiting payment check to Paid, Ready and Delivered.',
      'You can cancel while it is still awaiting the payment check.',
    ] },
    post: { icon: '✍️', title: 'Post news', text: 'Share an update.', points: [
      cap ? 'Choose My team only or Everyone.' : 'Choose a sport and Everyone or Captains only.',
      'A photo is optional.',
    ] },
    admin: { icon: '🛠️', title: 'Admin', text: 'Run the league.', points: [
      'Enter or correct match scores. Disputed scores are flagged.',
      'Search any player or captain and start a chat.',
      'Open Admin tools or Shop admin for more.',
    ] },
    tools: { icon: '⚙️', title: 'Admin tools', text: 'Settings that shape the app.', points: [
      'Venues, seasons and extra registration fields.',
      'The About page on the front page.',
      'The audit log shows who changed what and when.',
    ] },
    adminshop: { icon: '🧾', title: 'Shop admin', text: 'Orders, products and payment.', points: [
      'Check each M-Pesa code, then mark the order Paid, Ready or Delivered.',
      'Add products with photo, price, stock and sizes.',
      'Payment holds the instructions buyers see at checkout.',
    ] },
    join: { icon: '🤝', title: 'Join a team', text: 'Pick your team and type the exact name your captain registered you with.', points: [
      'Your captain then approves you.',
      'No team yet? List yourself under Free agents.',
    ] },
  }
  return T[key]
}

const get = k => { try { return localStorage.getItem(k) } catch { return null } }
const put = (k, v) => { try { localStorage.setItem(k, v) } catch {} }

export default function PageTips() {
  const { session, role, loading } = useAuth()
  const { sport } = useSport()
  const { pathname } = useLocation()
  const uid = session?.user?.id || 'guest'
  const key = ROUTES.find(([p]) => matchPath({ path: p, end: true }, pathname))?.[1]
  const [open, setOpen] = useState(false)
  const [off, setOff] = useState(false)

  useEffect(() => { setOff(get(`tips:off:${uid}`) === '1') }, [uid])

  useEffect(() => {
    setOpen(false)
    if (!key || loading) return
    if (get(`tips:off:${uid}`) === '1' || get(`tip:${uid}:${key}`)) return
    const t = setTimeout(() => setOpen(true), 700)
    return () => clearTimeout(t)
  }, [key, uid, loading])

  useEffect(() => {
    const reset = () => {
      try {
        Object.keys(localStorage).filter(k => k.startsWith(`tip:${uid}:`)).forEach(k => localStorage.removeItem(k))
        localStorage.removeItem(`tips:off:${uid}`)
      } catch {}
      setOff(false); setOpen(true)
    }
    window.addEventListener('resettips', reset)
    return () => window.removeEventListener('resettips', reset)
  }, [uid])

  if (!key) return null
  const tip = tipFor(key, role, SPORTS[sport])
  if (!tip) return null

  const gotIt = () => { put(`tip:${uid}:${key}`, '1'); setOpen(false) }
  const turnOff = () => { put(`tips:off:${uid}`, '1'); setOff(true); setOpen(false) }
  const turnOn = () => { try { localStorage.removeItem(`tips:off:${uid}`) } catch {} setOff(false); setOpen(false) }

  return (
    <>
      {open && (
        <div className="ptip" role="dialog" aria-label="Page tip">
          <h3><span>{tip.icon}</span>{tip.title}</h3>
          <p>{tip.text}</p>
          {tip.points && <ul>{tip.points.map(p => <li key={p}>{p}</li>)}</ul>}
          <div className="pb"><button onClick={gotIt}>GOT IT</button></div>
          {off
            ? <button className="off" onClick={turnOn}>Turn page tips back on</button>
            : <button className="off" onClick={turnOff}>Turn off page tips</button>}
        </div>
      )}
      <button className="phelp" title="What is this page?" aria-label="Explain this page" onClick={() => setOpen(o => !o)}>?</button>
    </>
  )
}