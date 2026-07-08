import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function signUp({ email, password, fullName, dob, gender, category, school, grade, emergencyName, emergencyRelationship, emergencyPhone }) {
  const { data, error } = await supabase.auth.signUp({
    email, password,
    options: { data: { full_name: fullName } }
  })
  if (error) throw error
  await new Promise(r => setTimeout(r, 2000))
  if (data.user) {
    await supabase.from('profiles').update({
      full_name: fullName,
      date_of_birth: dob || null,
      gender: gender || 'Male',
      category: category || 'Student',
      student: category === 'Student',
      working: category === 'Working',
      school: school || null,
      grade: grade || null,
      emergency_name: emergencyName || null,
      emergency_relationship: emergencyRelationship || null,
      emergency_phone: emergencyPhone || null,
      is_visible: true,
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

export async function getApprovedMembers() {
  const { data, error } = await supabase
    .from('profiles').select('*')
    .eq('is_approved', true)
    .eq('is_visible', true)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data || []
}

export async function getAllMembers() {
  const { data, error } = await supabase
    .from('profiles').select('*')
    .order('created_at', { ascending: true })
  if (error) throw error
  return data || []
}

export async function getPendingUsers() {
  const { data, error } = await supabase
    .from('profiles').select('*')
    .eq('is_approved', false)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function approveUser(id) {
  const { error } = await supabase
    .from('profiles')
    .update({ is_approved: true, is_visible: true })
    .eq('id', id)
  if (error) throw error
}

export async function rejectUser(id) {
  await supabase.from('profiles').delete().eq('id', id)
}

export async function updateProfile(id, updates) {
  const { error } = await supabase.from('profiles').update(updates).eq('id', id)
  if (error) throw error
}

export async function deleteMember(id) {
  await supabase.from('profiles').delete().eq('id', id)
}

export async function toggleMemberVisibility(id, currentlyVisible) {
  await supabase.from('profiles').update({ is_visible: !currentlyVisible }).eq('id', id)
}

// THE ROOT CAUSE FIX
// Problem 1: extension was lowercased — .JPG became .jpg = different file = broken
// Problem 2: ?v=timestamp changed on every page load = constant re-fetch = flicker
// Problem 3: old files with different extensions piled up in storage
// FIX: keep original extension, stable URL, clean up old files first
export async function uploadProfilePhoto(userId, file) {
  // Keep original extension exactly — do NOT lowercase it
  const originalExt = file.name.split('.').pop()
  const newPath = `${userId}.${originalExt}`

  // Clean up all old versions of this person's photo silently
  const oldPaths = [
    `${userId}.jpg`, `${userId}.JPG`,
    `${userId}.jpeg`, `${userId}.JPEG`,
    `${userId}.png`, `${userId}.PNG`,
    `${userId}.webp`, `${userId}.WEBP`,
  ]
  try { await supabase.storage.from('profiles').remove(oldPaths) } catch(e) {}

  // Upload new photo — upsert overwrites if same name exists
  const { error } = await supabase.storage
    .from('profiles')
    .upload(newPath, file, { upsert: true, cacheControl: '3600' })
  if (error) throw error

  // Get stable public URL
  const { data } = supabase.storage.from('profiles').getPublicUrl(newPath)

  // Add version timestamp ONCE at upload time — stored in DB, stays stable after
  const stableUrl = `${data.publicUrl}?v=${Date.now()}`
  return stableUrl
}

export async function getGallery() {
  const { data, error } = await supabase
    .from('gallery').select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function uploadGalleryImage(file, caption, title) {
  const ext = file.name.split('.').pop()
  const filename = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
  const { error: upErr } = await supabase.storage.from('gallery').upload(filename, file)
  if (upErr) throw upErr
  const { data } = supabase.storage.from('gallery').getPublicUrl(filename)
  const { error } = await supabase.from('gallery').insert({ title, caption, image_url: data.publicUrl })
  if (error) throw error
}

export async function deleteGalleryItem(id) {
  await supabase.from('gallery').delete().eq('id', id)
}

export async function getPosts() {
  const { data, error } = await supabase
    .from('posts').select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function createPost({ title, content, mediaFile }) {
  let media_url = null, media_type = null
  if (mediaFile) {
    const ext = mediaFile.name.split('.').pop()
    const filename = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
    const { error: upErr } = await supabase.storage.from('posts').upload(filename, mediaFile)
    if (!upErr) {
      const { data } = supabase.storage.from('posts').getPublicUrl(filename)
      media_url = data.publicUrl
      media_type = mediaFile.type.startsWith('video') ? 'video' : 'image'
    }
  }
  const { error } = await supabase.from('posts').insert({ title, content, media_url, media_type })
  if (error) throw error
}

export async function deletePost(id) {
  await supabase.from('posts').delete().eq('id', id)
}

export async function createBooking(booking) {
  const session = await getSession()
  const { error } = await supabase.from('bookings').insert({
    ...booking, user_id: session?.user?.id || null
  })
  if (error) throw error
}

export async function getAllBookings() {
  const { data, error } = await supabase
    .from('bookings').select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function updateBookingStatus(id, status) {
  const { error } = await supabase.from('bookings').update({ status }).eq('id', id)
  if (error) throw error
}

export async function getTimetable() {
  const { data, error } = await supabase
    .from('timetable').select('*')
    .order('sort_order', { ascending: true })
  if (error) return []
  return data || []
}

export async function addTimetableSession(session) {
  const { error } = await supabase.from('timetable').insert(session)
  if (error) throw error
}

export async function updateTimetableSession(id, updates) {
  const { error } = await supabase.from('timetable').update(updates).eq('id', id)
  if (error) throw error
}

export async function deleteTimetableSession(id) {
  const { error } = await supabase.from('timetable').delete().eq('id', id)
  if (error) throw error
}

export async function getApprovedReviews() {
  const { data, error } = await supabase
    .from('reviews').select('*')
    .eq('is_approved', true)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function getAllReviews() {
  const { data, error } = await supabase
    .from('reviews').select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function approveReview(id) {
  const { error } = await supabase.from('reviews').update({ is_approved: true }).eq('id', id)
  if (error) throw error
}

export async function deleteReview(id) {
  const { error } = await supabase.from('reviews').delete().eq('id', id)
  if (error) throw error
}
