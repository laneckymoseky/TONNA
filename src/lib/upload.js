import { supabase } from './supabase'

export async function uploadPublic(bucket, file, uid) {
  if (!file.type.startsWith('image/')) throw new Error('Please choose an image')
  if (file.size > 3 * 1024 * 1024) throw new Error('Image must be under 3MB')
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
  const path = `${uid}/${Date.now()}.${ext}`
  const { error } = await supabase.storage.from(bucket).upload(path, file, { contentType: file.type })
  if (error) throw error
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl
}