import { supabase } from './supabase'

const KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY
const toBytes = s => {
  const pad = '='.repeat((4 - (s.length % 4)) % 4)
  const raw = atob((s + pad).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)))
}

export function pushIssue() {
  if (!KEY) return 'key'
  if (!window.isSecureContext) return 'https'
  if (!('serviceWorker' in navigator)) return 'worker'
  if (!('PushManager' in window) || !('Notification' in window)) return 'push'
  return ''
}
export const pushSupported = () => pushIssue() === ''

export async function pushState() {
  const issue = pushIssue()
  if (issue) return 'unsupported:' + issue
  if (Notification.permission === 'denied') return 'denied'
  const reg = await navigator.serviceWorker.getRegistration()
  const sub = await reg?.pushManager.getSubscription()
  return sub && Notification.permission === 'granted' ? 'on' : 'off'
}

export async function enablePush() {
  const perm = await Notification.requestPermission()
  if (perm !== 'granted') throw new Error('Notifications were not allowed on this device')
  await navigator.serviceWorker.register('/sw.js')
  const reg = await navigator.serviceWorker.ready
  const sub = (await reg.pushManager.getSubscription())
    || (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: toBytes(KEY) }))
  const j = sub.toJSON()
  const { error } = await supabase.rpc('tn_save_push', { p_endpoint: j.endpoint, p_p256dh: j.keys.p256dh, p_auth: j.keys.auth })
  if (error) throw error
}

export async function disablePush() {
  const reg = await navigator.serviceWorker.getRegistration()
  const sub = await reg?.pushManager.getSubscription()
  if (sub) { await supabase.rpc('tn_remove_push', { p_endpoint: sub.endpoint }); await sub.unsubscribe() }
}

export async function forgetPush() {
  try {
    const reg = await navigator.serviceWorker.getRegistration()
    const sub = await reg?.pushManager.getSubscription()
    if (sub) await supabase.rpc('tn_remove_push', { p_endpoint: sub.endpoint })
  } catch {}
}