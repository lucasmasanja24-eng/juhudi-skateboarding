import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ─── AUTH ────────────────────────────────────────────────
export async function signUp({ email, password, fullName, dob, gender, status }) {
  const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } })
  if (error) throw error
  if (data.user) {
    await supabase.from('profiles').update({
      full_name: fullName, date_of_birth: dob, gender, status,
      student: status === 'Student' || status === 'Both',
      working: status === 'Working' || status === 'Both',
    }).eq('id', data.user.id)
  }
  return data
}

export async function signIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signOut() { await supabase.auth.signOut() }

export async function getSession() {
  const { data } = await supabase.auth.getSession()
  return data.session
}

export async function getCurrentProfile() {
  const session = await getSession()
  if (!session) return null
  const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
  return data
}

// ─── MEMBERS ─────────────────────────────────────────────
export async function getApprovedMembers() {
  const { data, error } = await supabase.from('profiles').select('*')
    .eq('is_approved', true).eq('is_visible', true).order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function getAllMembers() {
  const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function getPendingUsers() {
  const { data, error } = await supabase.from('profiles').select('*')
    .eq('is_approved', false).order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function approveUser(id) {
  const { error } = await supabase.from('profiles').update({ is_approved: true }).eq('id', id)
  if (error) throw error
}

export async function rejectUser(id) {
  await supabase.from('profiles').delete().eq('id', id)
}

export async function updateProfile(id, updates) {
  const { error } = await supabase.from('profiles').update(updates).eq('id', id)
  if (error) throw error
}

export async function toggleMemberVisibility(id, visible) {
  await supabase.from('profiles').update({ is_visible: visible }).eq('id', id)
}

export async function deleteMember(id) {
  await supabase.from('profiles').delete().eq('id', id)
}

// ─── PROFILE PHOTO ───────────────────────────────────────
export async function uploadProfilePhoto(userId, file) {
  const ext = file.name.split('.').pop()
  const filename = `${userId}.${ext}`
  const { error } = await supabase.storage.from('profiles').upload(filename, file, { upsert: true })
  if (error) throw error
  const { data: { publicUrl } } = supabase.storage.from('profiles').getPublicUrl(filename)
  return publicUrl
}

// ─── GALLERY ─────────────────────────────────────────────
export async function getGallery() {
  const { data, error } = await supabase.from('gallery').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function uploadGalleryImage(file, caption, title) {
  const ext = file.name.split('.').pop()
  const filename = `${Date.now()}.${ext}`
  const { error: upErr } = await supabase.storage.from('gallery').upload(filename, file)
  if (upErr) throw upErr
  const { data: { publicUrl } } = supabase.storage.from('gallery').getPublicUrl(filename)
  const { error } = await supabase.from('gallery').insert({ title, caption, image_url: publicUrl })
  if (error) throw error
}

export async function deleteGalleryItem(id) {
  await supabase.from('gallery').delete().eq('id', id)
}

// ─── POSTS ───────────────────────────────────────────────
export async function getPosts() {
  const { data, error } = await supabase.from('posts').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createPost({ title, content, mediaFile }) {
  let media_url = null, media_type = null
  if (mediaFile) {
    const ext = mediaFile.name.split('.').pop()
    const filename = `${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage.from('posts').upload(filename, mediaFile)
    if (!upErr) {
      const { data: { publicUrl } } = supabase.storage.from('posts').getPublicUrl(filename)
      media_url = publicUrl
      media_type = mediaFile.type.startsWith('video') ? 'video' : 'image'
    }
  }
  const { error } = await supabase.from('posts').insert({ title, content, media_url, media_type })
  if (error) throw error
}

export async function deletePost(id) {
  await supabase.from('posts').delete().eq('id', id)
}

// ─── BOOKINGS ────────────────────────────────────────────
export async function createBooking(booking) {
  const session = await getSession()
  const { error } = await supabase.from('bookings').insert({ ...booking, user_id: session?.user?.id || null })
  if (error) throw error
}

export async function getAllBookings() {
  const { data, error } = await supabase.from('bookings').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function updateBookingStatus(id, status) {
  const { error } = await supabase.from('bookings').update({ status }).eq('id', id)
  if (error) throw error
}
