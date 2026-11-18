import { supabase } from './supabase'

export async function resizeImage(file, maxSide = 1200, quality = 0.82) {
  const bmp = await createImageBitmap(file)
  const k = Math.min(1, maxSide / Math.max(bmp.width, bmp.height))
  const c = document.createElement('canvas')
  c.width = Math.round(bmp.width * k)
  c.height = Math.round(bmp.height * k)
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height)
  return new Promise((res, rej) =>
    c.toBlob(b => (b ? res(b) : rej(new Error('Could not process that image'))), 'image/jpeg', quality))
}

export async function uploadPublic(bucket, file, uid, maxSide = 1400) {
  if (!file.type.startsWith('image/')) throw new Error('Please choose an image')
  if (file.size > 10 * 1024 * 1024) throw new Error('Image must be under 10MB')
  const blob = await resizeImage(file, maxSide)
  const path = `${uid}/${Date.now()}.jpg`
  const { error } = await supabase.storage.from(bucket).upload(path, blob, { contentType: 'image/jpeg' })
  if (error) throw error
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl
}