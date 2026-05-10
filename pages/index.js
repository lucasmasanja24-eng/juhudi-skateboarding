import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Nav from '../../components/Nav'
import {
  getAllMembers, getPendingUsers, approveUser, rejectUser, updateProfile,
  deleteMember, toggleMemberVisibility, uploadProfilePhoto,
  getAllBookings, updateBookingStatus,
  getGallery, uploadGalleryImage, deleteGalleryItem,
  getPosts, createPost, deletePost,
  getTimetable, addTimetableSession, updateTimetableSession, deleteTimetableSession
} from '../../lib/supabase'
import { supabase } from '../../lib/supabase'

const CATEGORIES = ['Student', 'Working', 'Parent / Guardian', 'Sponsor', 'Volunteer', 'Coach', 'Other']
const LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Pro']
const STANCES = ['Regular', 'Goofy']
const ROLES = ['Member', 'Founder', 'Coach', 'Captain']
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const SESSION_TYPES = ['All Levels', 'Intermediate', 'Advanced', 'Girls Only', 'All Welcome', 'By Booking', 'Beginners']

export default function AdminDashboard({ session, profile, refreshProfile }) {
  const router = useRouter()
  const [sec, setSec] = useState('overview')
  const [pending, setPending] = useState([])
  const [members, setMembers] = useState([])
  const [bookings, setBookings] = useState([])
  const [gallery, setGallery] = useState([])
  const [posts, setPosts] = useState([])
  const [timetable, setTimetable] = useState([])
  const [toast, setToast] = useState('')
  const [editingMember, setEditingMember] = useState(null)
  const [addingMember, setAddingMember] = useState(false)
  const [editingSession, setEditingSession] = useState(null)
  const [addingSession, setAddingSession] = useState(false)
  const [postForm, setPostForm] = useState({ title: '', content: '' })
  const [postMedia, setPostMedia] = useState(null)
  const [galForm, setGalForm] = useState({ title: '', caption: '' })
  const [galFile, setGalFile] = useState(null)
  const [galLoading, setGalLoading] = useState(false)
  const [newMember, setNewMember] = useState({ full_name: '', date_of_birth: '', gender: 'Male', category: 'Student', stance: 'Regular', level: 'Beginner', favourite_trick: '', idol_skater: '', bio: '', role: 'Member' })
  const [newSession, setNewSession] = useState({ day: 'Monday', time: '', session_name: '', session_type: 'All Levels', notes: '', sort_order: 0 })

  useEffect(() => {
    if (!session) { router.push('/login'); return }
    if (profile && !profile.is_admin) { router.push('/'); return }
    loadAll()
  }, [session, profile])

  async function loadAll() {
    try {
      const [p, m, b, g, ps, tt] = await Promise.all([
        getPendingUsers(), getAllMembers(), getAllBookings(),
        getGallery(), getPosts(), getTimetable().catch(() => [])
      ])
      setPending(p || [])
      setMembers(m || [])
      setBookings(b || [])
      setGallery(g || [])
      setPosts(ps || [])
      setTimetable(tt || [])
    } catch (e) { showToast('Error loading data: ' + e.message) }
  }

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 3500) }

  function calcAge(dob) {
    if (!dob) return null
    const d = new Date(dob), n = new Date()
    let a = n.getFullYear() - d.getFullYear()
    if (n.getMonth() - d.getMonth() < 0 || (n.getMonth() - d.getMonth() === 0 && n.getDate() < d.getDate())) a--
    return a
  }

  async function handleApprove(id) {
    await approveUser(id)
    setPending(p => p.filter(u => u.id !== id))
    showToast('User approved!')
    loadAll()
  }

  async function handleReject(id) {
    if (!confirm('Reject and delete this user?')) return
    await rejectUser(id)
    setPending(p => p.filter(u => u.id !== id))
    showToast('User rejected.')
  }

  async function handleUpdateMember(id, updates) {
    await updateProfile(id, updates)
    setEditingMember(null)
    loadAll()
    showToast('Member updated!')
  }

  async function handleDeleteMember(id) {
    if (!confirm('Remove this member permanently?')) return
    await deleteMember(id)
    loadAll()
    showToast('Member removed.')
  }

  async function handleToggleVisible(id, visible) {
    await toggleMemberVisibility(id, !visible)
    loadAll()
    showToast('Visibility updated.')
  }

  async function handleProfilePhoto(id, file) {
    const url = await uploadProfilePhoto(id, file)
    await updateProfile(id, { photo_url: url })
    loadAll()
    showToast('Photo updated!')
  }

  async function handleAddMember(e) {
    e.preventDefault()
    if (!newMember.full_name) { showToast('Name is required'); return }
    try {
      const { error } = await supabase.from('profiles').insert({
        id: crypto.randomUUID(),
        email: newMember.email || `${Date.now()}@juhudi.local`,
        full_name: newMember.full_name,
        date_of_birth: newMember.date_of_birth || null,
        gender: newMember.gender,
        category: newMember.category,
        student: newMember.category === 'Student',
        working: newMember.category === 'Working',
        stance: newMember.stance,
        level: newMember.level,
        favourite_trick: newMember.favourite_trick,
        idol_skater: newMember.idol_skater,
        bio: newMember.bio,
        role: newMember.role,
        is_approved: true,
        is_visible: true,
        is_admin: false,
      })
      if (error) throw error
      setAddingMember(false)
      setNewMember({ full_name: '', date_of_birth: '', gender: 'Male', category: 'Student', stance: 'Regular', level: 'Beginner', favourite_trick: '', idol_skater: '', bio: '', role: 'Member' })
      loadAll()
      showToast('Member added!')
    } catch (err) { showToast('Error: ' + err.message) }
  }

  async function handleBookingStatus(id, status) {
    await updateBookingStatus(id, status)
    loadAll()
    showToast(`Booking ${status.toLowerCase()}.`)
  }

  async function handlePublishPost(e) {
    e.preventDefault()
    if (!postForm.title || !postForm.content) { showToast('Fill title and content'); return }
    await createPost({ title: postForm.title, content: postForm.content, mediaFile: postMedia })
    setPostForm({ title: '', content: '' })
    setPostMedia(null)
    loadAll()
    showToast('Post published!')
  }

  async function handleDeletePost(id) {
    if (!confirm('Delete this post?')) return
    await deletePost(id)
    loadAll()
    showToast('Post deleted.')
  }

  async function handleGalleryUpload(e) {
    e.preventDefault()
    if (!galFile) { showToast('Please select an image'); return }
    setGalLoading(true)
    try {
      await uploadGalleryImage(galFile, galForm.caption, galForm.title)
      setGalForm({ title: '', caption: '' })
      setGalFile(null)
      loadAll()
      showToast('Photo published!')
    } catch (err) { showToast('Upload failed: ' + err.message) }
    setGalLoading(false)
  }

  async function handleDeleteGallery(id) {
    if (!confirm('Remove this photo?')) return
    await deleteGalleryItem(id)
    loadAll()
    showToast('Photo removed.')
  }

  async function handleAddSession(e) {
    e.preventDefault()
    if (!newSession.time || !newSession.session_name) { showToast('Fill day, time and session name'); return }
    try {
      await addTimetableSession(newSession)
      setAddingSession(false)
      setNewSession({ day: 'Monday', time: '', session_name: '', session_type: 'All Levels', notes: '', sort_order: 0 })
      loadAll()
      showToast('Session added!')
    } catch (err) { showToast('Error: ' + err.message) }
  }

  async function handleUpdateSession(id, updates) {
    await updateTimetableSession(id, updates)
    setEditingSession(null)
    loadAll()
    showToast('Session updated!')
  }

  async function handleDeleteSession(id) {
    if (!confirm('Delete this session?')) return
    await deleteTimetableSession(id)
    loadAll()
    showToast('Session deleted.')
  }

  const navItems = [
    { id: 'overview', label: 'Overview' },
    { id: 'users', label: 'User Approvals', count: pending.length },
    { id: 'members', label: 'Members' },
    { id: 'addmember', label: '+ Add Member' },
    { id: 'bookings', label: 'Bookings', count: bookings.filter(b => b.status === 'Pending').length },
    { id: 'gallery', label: 'Gallery Upload' },
    { id: 'posts', label: 'Posts & Updates' },
    { id: 'schedule', label: 'Timetable' },
    { id: 'teamprofiles', label: 'Team Profiles' },
  ]

  const typeColors = {
    'All Levels': { background: 'rgba(100,200,100,0.12)', color: '#6dc86d' },
    'All Welcome': { background: 'rgba(100,200,100,0.12)', color: '#6dc86d' },
    'Intermediate': { background: 'rgba(200,162,50,0.12)', color: '#c8a232' },
    'Advanced': { background: 'rgba(200,162,50,0.12)', color: '#c8a232' },
    'Girls Only': { background: 'rgba(200,100,200,0.12)', color: '#d090d0' },
    'By Booking': { background: 'rgba(200,162,50,0.12)', color: '#c8a232' },
    'Beginners': { background: 'rgba(100,180,255,0.12)', color: '#60b0ff' },
  }

  return (
    <>
      <Nav session={session} profile={profile} />
      {toast && <div className="toast">{toast}</div>}
      <div style={{ paddingTop: '3.3rem', minHeight: '100vh' }}>
        <div style={S.adbar}>
          <span>ADMIN PANEL — Lucas Masanja</span>
          <span style={{ color: 'rgba(240,232,208,0.45)', fontSize: '0.58rem' }}>Juhudi Skateboarding</span>
        </div>
        <div style={S.layout}>
          <div style={S.sidebar}>
            <div style={S.sideLabel}>Dashboard</div>
            {navItems.map(item => (
              <button key={item.id} onClick={() => setSec(item.id)}
                style={{ ...S.navItem, ...(sec === item.id ? S.navOn : {}), ...(item.id === 'addmember' ? { color: '#c8a232', borderLeft: '2px solid rgba(200,162,50,0.4)' } : {}) }}>
                {item.label}
                {item.count > 0 && <span style={S.badge}>{item.count}</span>}
              </button>
            ))}
          </div>

          <div style={S.main}>

            {/* OVERVIEW */}
            {sec === 'overview' && (
              <div>
                <div style={S.title}>OVERVIEW</div>
                <div style={S.cards}>
                  {[['Members', members.length], ['Pending', pending.length], ['Bookings', bookings.filter(b => b.status === 'Pending').length], ['Gallery', gallery.length], ['Posts', posts.length]].map(([l, n]) => (
                    <div key={l} style={S.card}><div style={S.cardN}>{n}</div><div style={S.cardL}>{l}</div></div>
                  ))}
                </div>
                <div style={S.secTitle}>Quick Actions</div>
                <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
                  <button className="btn-primary" onClick={() => setSec('users')}>Review Approvals ({pending.length})</button>
                  <button className="btn-primary" onClick={() => setSec('addmember')}>+ Add Member</button>
                  <button className="btn-primary" onClick={() => setSec('posts')}>Write a Post</button>
                  <button className="btn-primary" onClick={() => setSec('schedule')}>Edit Timetable</button>
                </div>
              </div>
            )}

            {/* USER APPROVALS */}
            {sec === 'users' && (
              <div>
                <div style={S.title}>USER APPROVALS</div>
                <div style={S.secTitle}>Pending ({pending.length})</div>
                {pending.length === 0 && <p style={S.empty}>No pending users. All caught up!</p>}
                <div style={{ overflowX: 'auto' }}>
                  <table style={S.tbl}>
                    <thead><tr>{['Name', 'Email', 'DOB', 'Age', 'Gender', 'Category', 'Joined', 'Actions'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
                    <tbody>
                      {pending.map(u => (
                        <tr key={u.id}>
                          <td style={S.td}>{u.full_name}</td>
                          <td style={S.td}>{u.email}</td>
                          <td style={S.td}><span style={S.mono}>{u.date_of_birth || '—'}</span></td>
                          <td style={S.td}><span style={S.gold}>{u.date_of_birth ? calcAge(u.date_of_birth) + 'y' : '—'}</span></td>
                          <td style={S.td}>{u.gender || '—'}</td>
                          <td style={S.td}><span style={{ ...S.catBadge, ...getCatColor(u.category) }}>{u.category || 'Member'}</span></td>
                          <td style={S.td}><span style={S.mono}>{new Date(u.created_at).toLocaleDateString()}</span></td>
                          <td style={S.td}>
                            <button style={S.btnGrn} onClick={() => handleApprove(u.id)}>Approve</button>
                            <button style={S.btnRed} onClick={() => handleReject(u.id)}>Reject</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ADD MEMBER DIRECTLY */}
            {sec === 'addmember' && (
              <div>
                <div style={S.title}>ADD MEMBER DIRECTLY</div>
                <p style={S.empty}>Add a member manually without them needing to sign up.</p>
                <form onSubmit={handleAddMember} style={{ background: 'var(--gm)', padding: '1.5rem', marginTop: '1rem' }}>
                  <div style={S.frow}>
                    <div style={S.fg}><label className="label">Full Name *</label><input className="input" required value={newMember.full_name} onChange={e => setNewMember({ ...newMember, full_name: e.target.value })} placeholder="Full name" /></div>
                    <div style={S.fg}><label className="label">Email (optional)</label><input className="input" type="email" value={newMember.email || ''} onChange={e => setNewMember({ ...newMember, email: e.target.value })} placeholder="member@email.com" /></div>
                  </div>
                  <div style={S.frow}>
                    <div style={S.fg}>
                      <label className="label">Date of Birth</label>
                      <input className="input" type="date" value={newMember.date_of_birth} onChange={e => setNewMember({ ...newMember, date_of_birth: e.target.value })} />
                      {newMember.date_of_birth && <div style={S.gold}>Age: {calcAge(newMember.date_of_birth)}y</div>}
                    </div>
                    <div style={S.fg}>
                      <label className="label">Gender</label>
                      <select className="input" value={newMember.gender} onChange={e => setNewMember({ ...newMember, gender: e.target.value })}>
                        <option>Male</option><option>Female</option><option>Other</option>
                      </select>
                    </div>
                  </div>
                  <div style={S.frow}>
                    <div style={S.fg}>
                      <label className="label">Category</label>
                      <select className="input" value={newMember.category} onChange={e => setNewMember({ ...newMember, category: e.target.value })}>
                        {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div style={S.fg}>
                      <label className="label">Role</label>
                      <select className="input" value={newMember.role} onChange={e => setNewMember({ ...newMember, role: e.target.value })}>
                        {ROLES.map(r => <option key={r}>{r}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={S.frow}>
                    <div style={S.fg}>
                      <label className="label">Skating Stance</label>
                      <select className="input" value={newMember.stance} onChange={e => setNewMember({ ...newMember, stance: e.target.value })}>
                        {STANCES.map(s => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                    <div style={S.fg}>
                      <label className="label">Skating Level</label>
                      <select className="input" value={newMember.level} onChange={e => setNewMember({ ...newMember, level: e.target.value })}>
                        {LEVELS.map(l => <option key={l}>{l}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={S.frow}>
                    <div style={S.fg}><label className="label">Favourite Trick</label><input className="input" value={newMember.favourite_trick} onChange={e => setNewMember({ ...newMember, favourite_trick: e.target.value })} placeholder="e.g. Kickflip" /></div>
                    <div style={S.fg}><label className="label">Idol Skater</label><input className="input" value={newMember.idol_skater} onChange={e => setNewMember({ ...newMember, idol_skater: e.target.value })} placeholder="e.g. Tony Hawk" /></div>
                  </div>
                  <div style={S.fg}><label className="label">Bio</label><textarea className="input" rows={2} value={newMember.bio} onChange={e => setNewMember({ ...newMember, bio: e.target.value })} placeholder="Short bio..." style={{ resize: 'vertical' }} /></div>
                  <button className="btn-primary" type="submit">Add Member</button>
                </form>
              </div>
            )}

            {/* MEMBERS */}
            {sec === 'members' && (
              <div>
                <div style={S.title}>ALL MEMBERS ({members.length})</div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={S.tbl}>
                    <thead><tr>{['Name', 'DOB', 'Age', 'Gender', 'Category', 'Stance', 'Level', 'Visible', 'Actions'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
                    <tbody>
                      {members.map(m => (
                        <tr key={m.id}>
                          <td style={S.td}>{m.full_name} {m.is_admin && <span style={S.gold}>[A]</span>}</td>
                          <td style={S.td}><span style={S.mono}>{m.date_of_birth || '—'}</span></td>
                          <td style={S.td}><span style={S.gold}>{m.date_of_birth ? calcAge(m.date_of_birth) + 'y' : '—'}</span></td>
                          <td style={S.td}>{m.gender || '—'}</td>
                          <td style={S.td}><span style={{ ...S.catBadge, ...getCatColor(m.category) }}>{m.category || 'Member'}</span></td>
                          <td style={S.td}>{m.stance || '—'}</td>
                          <td style={S.td}>{m.level || '—'}</td>
                          <td style={S.td}><span style={m.is_visible ? S.approved : S.pendSt}>{m.is_visible ? 'Yes' : 'No'}</span></td>
                          <td style={S.td}>
                            <button style={S.btn} onClick={() => setEditingMember(m)}>Edit</button>
                            <button style={S.btn} onClick={() => handleToggleVisible(m.id, m.is_visible)}>{m.is_visible ? 'Hide' : 'Show'}</button>
                            {!m.is_admin && <button style={S.btnRed} onClick={() => handleDeleteMember(m.id)}>Remove</button>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {editingMember && (
                  <MemberEditModal member={editingMember} calcAge={calcAge} onSave={handleUpdateMember} onClose={() => setEditingMember(null)} onPhotoUpload={handleProfilePhoto} />
                )}
              </div>
            )}

            {/* BOOKINGS */}
            {sec === 'bookings' && (
              <div>
                <div style={S.title}>BOOKINGS</div>
                {bookings.length === 0 && <p style={S.empty}>No bookings yet.</p>}
                <div style={{ overflowX: 'auto' }}>
                  <table style={S.tbl}>
                    <thead><tr>{['Name', 'Phone', 'DOB', 'Age', 'Date', 'Time', 'Level', 'Notes', 'Status', 'Actions'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
                    <tbody>
                      {bookings.map(b => (
                        <tr key={b.id}>
                          <td style={S.td}>{b.full_name}</td>
                          <td style={S.td}>{b.phone}</td>
                          <td style={S.td}><span style={S.mono}>{b.date_of_birth || '—'}</span></td>
                          <td style={S.td}><span style={S.gold}>{b.date_of_birth ? calcAge(b.date_of_birth) + 'y' : '—'}</span></td>
                          <td style={S.td}>{b.preferred_date}</td>
                          <td style={S.td}>{b.preferred_time}</td>
                          <td style={S.td}>{b.skill_level}</td>
                          <td style={S.td}><span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{b.notes || '—'}</span></td>
                          <td style={S.td}><span style={b.status === 'Approved' ? S.approved : b.status === 'Declined' ? S.declined : S.pendSt}>{b.status}</span></td>
                          <td style={S.td}>
                            {b.status === 'Pending' && <>
                              <button style={S.btnGrn} onClick={() => handleBookingStatus(b.id, 'Approved')}>Approve</button>
                              <button style={S.btnRed} onClick={() => handleBookingStatus(b.id, 'Declined')}>Decline</button>
                            </>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TIMETABLE */}
            {sec === 'schedule' && (
              <div>
                <div style={S.title}>TIMETABLE</div>
                <button className="btn-primary" style={{ marginBottom: '1rem' }} onClick={() => setAddingSession(!addingSession)}>
                  {addingSession ? 'Cancel' : '+ Add Session'}
                </button>

                {addingSession && (
                  <form onSubmit={handleAddSession} style={{ background: 'var(--gm)', padding: '1.2rem', marginBottom: '1.2rem' }}>
                    <div style={S.frow}>
                      <div style={S.fg}>
                        <label className="label">Day</label>
                        <select className="input" value={newSession.day} onChange={e => setNewSession({ ...newSession, day: e.target.value })}>
                          {DAYS.map(d => <option key={d}>{d}</option>)}
                        </select>
                      </div>
                      <div style={S.fg}><label className="label">Time</label><input className="input" value={newSession.time} onChange={e => setNewSession({ ...newSession, time: e.target.value })} placeholder="e.g. 4:00–6:00 PM" /></div>
                    </div>
                    <div style={S.frow}>
                      <div style={S.fg}><label className="label">Session Name</label><input className="input" value={newSession.session_name} onChange={e => setNewSession({ ...newSession, session_name: e.target.value })} placeholder="e.g. General Training" /></div>
                      <div style={S.fg}>
                        <label className="label">Session Type</label>
                        <select className="input" value={newSession.session_type} onChange={e => setNewSession({ ...newSession, session_type: e.target.value })}>
                          {SESSION_TYPES.map(t => <option key={t}>{t}</option>)}
                        </select>
                      </div>
                    </div>
                    <div style={S.fg}><label className="label">Notes (optional)</label><input className="input" value={newSession.notes} onChange={e => setNewSession({ ...newSession, notes: e.target.value })} placeholder="e.g. Bring your own board" /></div>
                    <button className="btn-primary" type="submit">Save Session</button>
                  </form>
                )}

                {timetable.length === 0 && (
                  <p style={S.empty}>No sessions yet. Click "+ Add Session" to build your timetable.</p>
                )}

                <div style={{ overflowX: 'auto' }}>
                  <table style={S.tbl}>
                    <thead><tr>{['Day', 'Time', 'Session', 'Type', 'Notes', 'Actions'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
                    <tbody>
                      {timetable.map(t => (
                        <tr key={t.id}>
                          {editingSession?.id === t.id ? (
                            <>
                              <td style={S.td}><select className="input" style={{ width: 110 }} value={editingSession.day} onChange={e => setEditingSession({ ...editingSession, day: e.target.value })}>{DAYS.map(d => <option key={d}>{d}</option>)}</select></td>
                              <td style={S.td}><input className="input" style={{ width: 130 }} value={editingSession.time} onChange={e => setEditingSession({ ...editingSession, time: e.target.value })} /></td>
                              <td style={S.td}><input className="input" style={{ width: 150 }} value={editingSession.session_name} onChange={e => setEditingSession({ ...editingSession, session_name: e.target.value })} /></td>
                              <td style={S.td}><select className="input" style={{ width: 120 }} value={editingSession.session_type} onChange={e => setEditingSession({ ...editingSession, session_type: e.target.value })}>{SESSION_TYPES.map(st => <option key={st}>{st}</option>)}</select></td>
                              <td style={S.td}><input className="input" style={{ width: 150 }} value={editingSession.notes || ''} onChange={e => setEditingSession({ ...editingSession, notes: e.target.value })} /></td>
                              <td style={S.td}>
                                <button style={S.btnGrn} onClick={() => handleUpdateSession(t.id, editingSession)}>Save</button>
                                <button style={S.btn} onClick={() => setEditingSession(null)}>Cancel</button>
                              </td>
                            </>
                          ) : (
                            <>
                              <td style={S.td}>{t.day}</td>
                              <td style={S.td}>{t.time}</td>
                              <td style={S.td}>{t.session_name}</td>
                              <td style={S.td}><span style={{ ...S.catBadge, ...(typeColors[t.session_type] || {}) }}>{t.session_type}</span></td>
                              <td style={S.td}><span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>{t.notes || '—'}</span></td>
                              <td style={S.td}>
                                <button style={S.btn} onClick={() => setEditingSession({ ...t })}>Edit</button>
                                <button style={S.btnRed} onClick={() => handleDeleteSession(t.id)}>Delete</button>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* GALLERY */}
            {sec === 'gallery' && (
              <div>
                <div style={S.title}>GALLERY UPLOAD</div>
                <form onSubmit={handleGalleryUpload}>
                  <div style={S.uploadZone} onClick={() => document.getElementById('galFileIn').click()}>
                    <div style={{ fontSize: '1.8rem', marginBottom: '0.4rem' }}>📷</div>
                    <div style={{ fontFamily: "'Space Mono',monospace", fontSize: '0.7rem', color: 'var(--muted)' }}>
                      {galFile ? `✓ ${galFile.name}` : 'Click to upload image (JPG, PNG, WebP)'}
                    </div>
                    <input type="file" id="galFileIn" accept="image/*" style={{ display: 'none' }} onChange={e => setGalFile(e.target.files[0])} />
                  </div>
                  <div style={S.frow}>
                    <div style={S.fg}><label className="label">Title (optional)</label><input className="input" value={galForm.title} onChange={e => setGalForm({ ...galForm, title: e.target.value })} placeholder="Photo title" /></div>
                    <div style={S.fg}><label className="label">Caption</label><input className="input" value={galForm.caption} onChange={e => setGalForm({ ...galForm, caption: e.target.value })} placeholder="What's happening?" /></div>
                  </div>
                  <button className="btn-primary" type="submit" disabled={galLoading}>{galLoading ? 'Uploading...' : 'Publish to Gallery'}</button>
                </form>
                <div style={{ marginTop: '1.8rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: '0.8rem' }}>
                  {gallery.map(item => (
                    <div key={item.id}>
                      <img src={item.image_url} alt={item.caption} style={{ width: '100%', height: 95, objectFit: 'cover', display: 'block' }} />
                      <div style={{ padding: '0.28rem', fontSize: '0.68rem', color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.caption}</div>
                      <button style={S.btnRed} onClick={() => handleDeleteGallery(item.id)}>Remove</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* POSTS */}
            {sec === 'posts' && (
              <div>
                <div style={S.title}>POSTS & UPDATES</div>
                <form onSubmit={handlePublishPost} style={{ background: 'var(--gm)', padding: '1.2rem', marginBottom: '1.8rem' }}>
                  <div style={S.fg}><label className="label">Title</label><input className="input" required value={postForm.title} onChange={e => setPostForm({ ...postForm, title: e.target.value })} placeholder="Announcement title" /></div>
                  <div style={S.fg}><label className="label">Content</label><textarea className="input" rows={4} required value={postForm.content} onChange={e => setPostForm({ ...postForm, content: e.target.value })} placeholder="Write your update..." style={{ resize: 'vertical' }} /></div>
                  <div style={S.fg}>
                    <label className="label">Attach Media (optional)</label>
                    <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      <button type="button" style={S.btn} onClick={() => document.getElementById('postMediaIn').click()}>+ Attach Image/Video</button>
                      <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{postMedia ? `✓ ${postMedia.name}` : 'No file selected'}</span>
                      <input type="file" id="postMediaIn" accept="image/*,video/*" style={{ display: 'none' }} onChange={e => setPostMedia(e.target.files[0])} />
                    </div>
                  </div>
                  <button className="btn-primary" type="submit">Publish Post</button>
                </form>
                <div style={S.secTitle}>Published Posts ({posts.length})</div>
                {posts.map(p => (
                  <div key={p.id} style={{ padding: '0.9rem', border: '1px solid rgba(255,255,255,0.07)', marginBottom: '0.65rem', display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: '1.2rem', marginBottom: '0.18rem' }}>{p.title}</div>
                      <div style={{ fontFamily: 'monospace', fontSize: '0.6rem', color: 'var(--muted)', marginBottom: '0.35rem' }}>{new Date(p.created_at).toLocaleDateString()}</div>
                      <div style={{ fontSize: '0.83rem', color: 'rgba(255,255,255,0.65)' }}>{p.content}</div>
                      {p.media_url && p.media_type === 'image' && <img src={p.media_url} alt={p.title} style={{ maxHeight: 100, marginTop: '0.6rem' }} />}
                      {p.media_url && p.media_type === 'video' && <video src={p.media_url} controls style={{ maxHeight: 100, marginTop: '0.6rem' }} />}
                    </div>
                    <button style={S.btnRed} onClick={() => handleDeletePost(p.id)}>Delete</button>
                  </div>
                ))}
              </div>
            )}

            {/* TEAM PROFILES */}
            {sec === 'teamprofiles' && (
              <div>
                <div style={S.title}>TEAM PROFILES</div>
                <p style={S.empty}>Click "Edit" to update photo, stance, level, favourite trick, idol skater and more.</p>
                <div style={{ overflowX: 'auto' }}>
                  <table style={S.tbl}>
                    <thead><tr>{['Photo', 'Name', 'Age', 'Category', 'Stance', 'Level', 'Trick', 'Idol', 'Visible', 'Actions'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
                    <tbody>
                      {members.map(m => (
                        <tr key={m.id}>
                          <td style={S.td}>
                            <div style={{ width: 36, height: 36, background: 'var(--maroon-dk)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Bebas Neue',sans-serif", fontSize: '0.8rem', color: 'var(--gold)' }}>
                              {m.photo_url ? <img src={m.photo_url} alt={m.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : m.full_name?.split(' ').map(w => w[0]).join('').slice(0, 2)}
                            </div>
                          </td>
                          <td style={S.td}>{m.full_name}</td>
                          <td style={S.td}><span style={S.gold}>{m.date_of_birth ? calcAge(m.date_of_birth) + 'y' : '—'}</span></td>
                          <td style={S.td}><span style={{ ...S.catBadge, ...getCatColor(m.category) }}>{m.category || '—'}</span></td>
                          <td style={S.td}>{m.stance || '—'}</td>
                          <td style={S.td}>{m.level || '—'}</td>
                          <td style={S.td}>{m.favourite_trick || '—'}</td>
                          <td style={S.td}>{m.idol_skater || '—'}</td>
                          <td style={S.td}><span style={m.is_visible ? S.approved : S.pendSt}>{m.is_visible ? 'Visible' : 'Hidden'}</span></td>
                          <td style={S.td}>
                            <button style={S.btn} onClick={() => { setSec('members'); setEditingMember(m) }}>Edit</button>
                            <button style={S.btn} onClick={() => handleToggleVisible(m.id, m.is_visible)}>{m.is_visible ? 'Hide' : 'Show'}</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  )
}

function getCatColor(cat) {
  const map = {
    'Student': { background: 'rgba(100,180,255,0.12)', color: '#60b0ff' },
    'Working': { background: 'rgba(200,162,50,0.12)', color: '#c8a232' },
    'Parent / Guardian': { background: 'rgba(200,100,200,0.12)', color: '#d090d0' },
    'Sponsor': { background: 'rgba(100,200,100,0.12)', color: '#6dc86d' },
    'Volunteer': { background: 'rgba(255,160,50,0.12)', color: '#ffa030' },
    'Coach': { background: 'rgba(255,80,80,0.12)', color: '#ff6060' },
    'Founder': { background: 'rgba(200,162,50,0.2)', color: '#c8a232' },
  }
  return map[cat] || { background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.6)' }
}

function MemberEditModal({ member, calcAge, onSave, onClose, onPhotoUpload }) {
  const [form, setForm] = useState({
    full_name: member.full_name || '',
    date_of_birth: member.date_of_birth || '',
    gender: member.gender || 'Male',
    category: member.category || 'Student',
    stance: member.stance || 'Regular',
    level: member.level || 'Beginner',
    favourite_trick: member.favourite_trick || '',
    idol_skater: member.idol_skater || '',
    bio: member.bio || '',
    role: member.role || 'Member',
    is_visible: member.is_visible,
    student: member.student,
    working: member.working,
  })
  const [photoFile, setPhotoFile] = useState(null)
  const initials = member.full_name?.split(' ').map(w => w[0]).join('').slice(0, 2)

  function handleSave() {
    onSave(member.id, {
      ...form,
      student: form.category === 'Student',
      working: form.category === 'Working',
    })
    if (photoFile) onPhotoUpload(member.id, photoFile)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: '#161616', border: '1px solid rgba(200,162,50,0.3)', padding: '2rem', width: 580, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '0.75rem', right: '0.85rem', background: 'none', border: 'none', color: '#6a6a6a', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: '1.8rem', marginBottom: '1.2rem', color: '#f0e8d0' }}>Edit: {member.full_name}</div>

        <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '1.5rem', marginBottom: '1.3rem' }}>
          <div>
            <div style={{ width: 130, height: 130, background: '#5c1212', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Bebas Neue',sans-serif", fontSize: '2.5rem', color: '#c8a232', overflow: 'hidden', position: 'relative' }}>
              {member.photo_url
                ? <img src={member.photo_url} alt={member.full_name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                : initials}
            </div>
            <button style={{ ...S.btn, width: 130, marginTop: '0.5rem', textAlign: 'center' }} onClick={() => document.getElementById('pmPhotoIn').click()}>Upload Photo</button>
            <input type="file" id="pmPhotoIn" accept="image/*" style={{ display: 'none' }} onChange={e => setPhotoFile(e.target.files[0])} />
            {photoFile && <div style={{ fontSize: '0.7rem', color: '#6dc86d', marginTop: '0.3rem' }}>✓ {photoFile.name}</div>}
          </div>
          <div>
            <div style={{ marginBottom: '0.75rem' }}><label className="label">Full Name</label><input className="input" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginBottom: '0.75rem' }}>
              <div><label className="label">Date of Birth</label><input className="input" type="date" value={form.date_of_birth} onChange={e => setForm({ ...form, date_of_birth: e.target.value })} /></div>
              <div><label className="label">Age (auto)</label><div style={S.gold}>{form.date_of_birth ? calcAge(form.date_of_birth) + 'y' : '—'}</div></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
              <div><label className="label">Gender</label><select className="input" value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}><option>Male</option><option>Female</option><option>Other</option></select></div>
              <div><label className="label">Category</label><select className="input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div><label className="label">Skating Stance</label><select className="input" value={form.stance} onChange={e => setForm({ ...form, stance: e.target.value })}>{STANCES.map(s => <option key={s}>{s}</option>)}</select></div>
          <div><label className="label">Skating Level</label><select className="input" value={form.level} onChange={e => setForm({ ...form, level: e.target.value })}>{LEVELS.map(l => <option key={l}>{l}</option>)}</select></div>
        </div>
        <div style={{ marginBottom: '0.75rem' }}><label className="label">Favourite Trick</label><input className="input" value={form.favourite_trick} onChange={e => setForm({ ...form, favourite_trick: e.target.value })} placeholder="e.g. Kickflip, Ollie..." /></div>
        <div style={{ marginBottom: '0.75rem' }}><label className="label">Idol Skater</label><input className="input" value={form.idol_skater} onChange={e => setForm({ ...form, idol_skater: e.target.value })} placeholder="e.g. Tony Hawk, Nyjah Huston..." /></div>
        <div style={{ marginBottom: '0.75rem' }}><label className="label">Bio</label><textarea className="input" rows={3} value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} placeholder="Short bio..." style={{ resize: 'vertical' }} /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
          <div><label className="label">Role</label><select className="input" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>{ROLES.map(r => <option key={r}>{r}</option>)}</select></div>
          <div><label className="label">Visible on Team Page</label><select className="input" value={form.is_visible ? 'Yes' : 'No'} onChange={e => setForm({ ...form, is_visible: e.target.value === 'Yes' })}><option>Yes</option><option>No</option></select></div>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <button className="btn-primary" onClick={handleSave}>Save Profile</button>
          <button className="btn-outline" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

const S = {
  adbar: { background: '#5c1212', padding: '0.4rem 1.4rem', fontFamily: "'Space Mono',monospace", fontSize: '0.62rem', letterSpacing: '0.07em', color: '#f0e8d0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(200,162,50,0.28)' },
  layout: { display: 'grid', gridTemplateColumns: '200px 1fr', minHeight: 'calc(100vh - 5rem)' },
  sidebar: { background: '#131313', borderRight: '1px solid rgba(255,255,255,0.045)', padding: '1.1rem' },
  sideLabel: { fontFamily: "'Space Mono',monospace", fontSize: '0.56rem', letterSpacing: '0.14em', color: '#6a6a6a', margin: '1.1rem 0 0.45rem', textTransform: 'uppercase' },
  navItem: { display: 'block', width: '100%', background: 'none', border: 'none', color: 'rgba(255,255,255,0.52)', fontFamily: "'Space Mono',monospace", fontSize: '0.62rem', letterSpacing: '0.07em', textTransform: 'uppercase', textAlign: 'left', padding: '0.58rem 0.65rem', cursor: 'pointer', marginBottom: '0.12rem' },
  navOn: { color: '#c8a232', background: 'rgba(200,162,50,0.065)' },
  main: { padding: '1.6rem', overflowX: 'auto' },
  title: { fontFamily: "'Bebas Neue',sans-serif", fontSize: '2rem', marginBottom: '1.6rem', color: '#f0e8d0' },
  secTitle: { fontFamily: "'Bebas Neue',sans-serif", fontSize: '1.4rem', marginBottom: '0.8rem', color: '#fafafa' },
  cards: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(110px,1fr))', gap: '0.75rem', marginBottom: '1.8rem' },
  card: { background: '#202020', padding: '0.9rem', borderLeft: '3px solid #c8a232' },
  cardN: { fontFamily: "'Bebas Neue',sans-serif", fontSize: '2rem', color: '#c8a232' },
  cardL: { fontFamily: "'Space Mono',monospace", fontSize: '0.57rem', letterSpacing: '0.1em', color: '#6a6a6a', textTransform: 'uppercase', marginTop: '0.18rem' },
  tbl: { width: '100%', borderCollapse: 'collapse' },
  th: { fontFamily: "'Space Mono',monospace", fontSize: '0.58rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6a6a6a', padding: '0.6rem 0.75rem', borderBottom: '1px solid rgba(255,255,255,0.065)', textAlign: 'left', whiteSpace: 'nowrap' },
  td: { padding: '0.6rem 0.75rem', borderBottom: '1px solid rgba(255,255,255,0.038)', fontSize: '0.82rem', color: 'rgba(255,255,255,0.76)', verticalAlign: 'middle' },
  btn: { background: 'none', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.55)', fontFamily: "'Space Mono',monospace", fontSize: '0.57rem', padding: '0.26rem 0.52rem', cursor: 'pointer', marginRight: '0.22rem' },
  btnGrn: { background: 'none', border: '1px solid rgba(109,200,109,0.4)', color: '#6dc86d', fontFamily: "'Space Mono',monospace", fontSize: '0.57rem', padding: '0.26rem 0.52rem', cursor: 'pointer', marginRight: '0.22rem' },
  btnRed: { background: 'none', border: '1px solid rgba(220,80,80,0.3)', color: '#e06060', fontFamily: "'Space Mono',monospace", fontSize: '0.57rem', padding: '0.26rem 0.52rem', cursor: 'pointer', marginRight: '0.22rem' },
  badge: { display: 'inline-block', background: 'rgba(200,162,50,0.2)', color: '#c8a232', fontFamily: "'Space Mono',monospace", fontSize: '0.55rem', padding: '0.1rem 0.4rem', marginLeft: '0.4rem' },
  catBadge: { display: 'inline-block', padding: '0.16rem 0.45rem', fontFamily: "'Space Mono',monospace", fontSize: '0.55rem', letterSpacing: '0.05em' },
  gold: { fontFamily: "'Space Mono',monospace", fontSize: '0.76rem', color: '#c8a232' },
  mono: { fontFamily: 'monospace', fontSize: '0.78rem' },
  approved: { color: '#6dc86d', fontFamily: "'Space Mono',monospace", fontSize: '0.6rem' },
  pendSt: { color: '#c8a232', fontFamily: "'Space Mono',monospace", fontSize: '0.6rem' },
  declined: { color: '#e06060', fontFamily: "'Space Mono',monospace", fontSize: '0.6rem' },
  uploadZone: { border: '2px dashed rgba(200,162,50,0.25)', padding: '1.8rem', textAlign: 'center', cursor: 'pointer', marginBottom: '1.1rem' },
  frow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' },
  fg: { marginBottom: '0.75rem' },
  empty: { color: '#6a6a6a', fontSize: '0.88rem', marginBottom: '1rem' },
}
