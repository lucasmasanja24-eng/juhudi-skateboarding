import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Nav from '../../components/Nav'
import {
  getAllMembers, getPendingUsers, approveUser, rejectUser, updateProfile,
  deleteMember, toggleMemberVisibility, uploadProfilePhoto,
  getAllBookings, updateBookingStatus,
  getGallery, uploadGalleryImage, deleteGalleryItem,
  getPosts, createPost, deletePost
} from '../../lib/supabase'

export default function AdminDashboard({ session, profile, refreshProfile }) {
  const router = useRouter()
  const [section, setSection] = useState('overview')
  const [pending, setPending] = useState([])
  const [members, setMembers] = useState([])
  const [bookings, setBookings] = useState([])
  const [gallery, setGallery] = useState([])
  const [posts, setPosts] = useState([])
  const [toast, setToast] = useState('')
  const [editingMember, setEditingMember] = useState(null)

  // Post form
  const [postForm, setPostForm] = useState({ title: '', content: '', date: '' })
  const [postMedia, setPostMedia] = useState(null)

  // Gallery form
  const [galForm, setGalForm] = useState({ title: '', caption: '' })
  const [galFile, setGalFile] = useState(null)
  const [galLoading, setGalLoading] = useState(false)

  useEffect(() => {
    if (!session) { router.push('/login'); return }
    if (profile && !profile.is_admin) { router.push('/'); return }
    loadAll()
  }, [session, profile])

  async function loadAll() {
    try {
      const [p, m, b, g, ps] = await Promise.all([
        getPendingUsers(), getAllMembers(), getAllBookings(), getGallery(), getPosts()
      ])
      setPending(p || [])
      setMembers(m || [])
      setBookings(b || [])
      setGallery(g || [])
      setPosts(ps || [])
    } catch (e) { showToast('Error loading data') }
  }

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

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
    showToast('User approved! They can now log in.')
    loadAll()
  }

  async function handleReject(id) {
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
    if (!confirm('Remove this member?')) return
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

  async function handleBookingStatus(id, status) {
    await updateBookingStatus(id, status)
    loadAll()
    showToast(`Booking ${status.toLowerCase()}.`)
  }

  async function handlePublishPost(e) {
    e.preventDefault()
    if (!postForm.title || !postForm.content) { showToast('Fill title and content'); return }
    await createPost({ title: postForm.title, content: postForm.content, mediaFile: postMedia })
    setPostForm({ title: '', content: '', date: '' })
    setPostMedia(null)
    loadAll()
    showToast('Post published!')
  }

  async function handleDeletePost(id) {
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
      showToast('Photo published to gallery!')
    } catch (err) { showToast('Upload failed: ' + err.message) }
    setGalLoading(false)
  }

  async function handleDeleteGallery(id) {
    await deleteGalleryItem(id)
    loadAll()
    showToast('Photo removed.')
  }

  const navItems = [
    { id: 'overview', label: 'Overview' },
    { id: 'users', label: 'User Approvals', count: pending.length },
    { id: 'members', label: 'Members' },
    { id: 'bookings', label: 'Bookings', count: bookings.filter(b => b.status === 'Pending').length },
    { id: 'gallery', label: 'Gallery Upload' },
    { id: 'posts', label: 'Posts & Updates' },
    { id: 'schedule', label: 'Timetable' },
    { id: 'teamprofiles', label: 'Team Profiles' },
  ]

  return (
    <>
      <Nav session={session} profile={profile} />
      {toast && <div className="toast">{toast}</div>}

      <div style={{ paddingTop: '3.3rem', minHeight: '100vh' }}>
        <div style={S.adbar}>
          <span>ADMIN PANEL — Lucas Masanja</span>
          <span style={{ color: 'rgba(240,232,208,0.45)' }}>Juhudi Skateboarding</span>
        </div>
        <div style={S.layout}>
          {/* SIDEBAR */}
          <div style={S.sidebar}>
            <div style={S.sideSection}>Dashboard</div>
            {navItems.map(item => (
              <button key={item.id} onClick={() => setSection(item.id)}
                style={{ ...S.navItem, ...(section === item.id ? S.navItemActive : {}) }}>
                {item.label}
                {item.count > 0 && <span style={S.badge}>{item.count}</span>}
              </button>
            ))}
          </div>

          {/* MAIN */}
          <div style={S.main}>

            {/* OVERVIEW */}
            {section === 'overview' && (
              <div>
                <div style={S.title}>OVERVIEW</div>
                <div style={S.cards}>
                  {[
                    ['Members', members.length],
                    ['Pending', pending.length],
                    ['Bookings', bookings.filter(b => b.status === 'Pending').length],
                    ['Gallery', gallery.length],
                  ].map(([label, count]) => (
                    <div key={label} style={S.card}>
                      <div style={S.cardNum}>{count}</div>
                      <div style={S.cardLabel}>{label}</div>
                    </div>
                  ))}
                </div>
                <div style={S.sectionTitle}>Quick Actions</div>
                <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
                  <button className="btn-primary" onClick={() => setSection('users')}>Review Approvals ({pending.length})</button>
                  <button className="btn-primary" onClick={() => setSection('bookings')}>Review Bookings</button>
                  <button className="btn-primary" onClick={() => setSection('posts')}>Write a Post</button>
                </div>
              </div>
            )}

            {/* USER APPROVALS */}
            {section === 'users' && (
              <div>
                <div style={S.title}>USER APPROVALS</div>
                <div style={S.sectionTitle}>Pending ({pending.length})</div>
                {pending.length === 0 && <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>No pending users.</p>}
                <div style={{ overflowX: 'auto' }}>
                  <table style={S.table}>
                    <thead><tr>
                      {['Name','Email','DOB','Age','Gender','Status','Actions'].map(h => (
                        <th key={h} style={S.th}>{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {pending.map(u => (
                        <tr key={u.id}>
                          <td style={S.td}>{u.full_name}</td>
                          <td style={S.td}>{u.email}</td>
                          <td style={S.td}>{u.date_of_birth || '—'}</td>
                          <td style={S.td}><span style={S.dobDisp}>{u.date_of_birth ? calcAge(u.date_of_birth) + 'y' : '—'}</span></td>
                          <td style={S.td}>{u.gender || '—'}</td>
                          <td style={S.td}>{u.status || '—'}</td>
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

            {/* MEMBERS */}
            {section === 'members' && (
              <div>
                <div style={S.title}>MEMBERS</div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={S.table}>
                    <thead><tr>
                      {['Name','DOB','Age','Gender','Student','Working','Stance','Level','Actions'].map(h => (
                        <th key={h} style={S.th}>{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {members.map(m => (
                        <tr key={m.id}>
                          <td style={S.td}>{m.full_name} {m.is_admin && <span style={S.gold}>[A]</span>}</td>
                          <td style={S.td}><span style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>{m.date_of_birth || '—'}</span></td>
                          <td style={S.td}><span style={S.dobDisp}>{m.date_of_birth ? calcAge(m.date_of_birth) + 'y' : '—'}</span></td>
                          <td style={S.td}>{m.gender}</td>
                          <td style={S.td}>{m.student ? 'Yes' : 'No'}</td>
                          <td style={S.td}>{m.working ? 'Yes' : 'No'}</td>
                          <td style={S.td}>{m.stance || '—'}</td>
                          <td style={S.td}>{m.level || '—'}</td>
                          <td style={S.td}>
                            <button style={S.btn} onClick={() => setEditingMember(m)}>Edit</button>
                            {!m.is_admin && <button style={S.btnRed} onClick={() => handleDeleteMember(m.id)}>Remove</button>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* EDIT MEMBER MODAL */}
                {editingMember && (
                  <MemberEditModal
                    member={editingMember}
                    calcAge={calcAge}
                    onSave={handleUpdateMember}
                    onClose={() => setEditingMember(null)}
                    onPhotoUpload={handleProfilePhoto}
                  />
                )}
              </div>
            )}

            {/* BOOKINGS */}
            {section === 'bookings' && (
              <div>
                <div style={S.title}>BOOKINGS</div>
                {bookings.length === 0 && <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>No bookings yet.</p>}
                <div style={{ overflowX: 'auto' }}>
                  <table style={S.table}>
                    <thead><tr>
                      {['Name','DOB','Age','Date','Time','Level','Status','Actions'].map(h => (
                        <th key={h} style={S.th}>{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {bookings.map(b => (
                        <tr key={b.id}>
                          <td style={S.td}>{b.full_name}</td>
                          <td style={S.td}>{b.date_of_birth || '—'}</td>
                          <td style={S.td}><span style={S.dobDisp}>{b.date_of_birth ? calcAge(b.date_of_birth) + 'y' : '—'}</span></td>
                          <td style={S.td}>{b.preferred_date}</td>
                          <td style={S.td}>{b.preferred_time}</td>
                          <td style={S.td}>{b.skill_level}</td>
                          <td style={S.td}><span style={b.status === 'Approved' ? S.approved : b.status === 'Declined' ? S.declined : S.pending}>{b.status}</span></td>
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

            {/* GALLERY */}
            {section === 'gallery' && (
              <div>
                <div style={S.title}>GALLERY UPLOAD</div>
                <form onSubmit={handleGalleryUpload}>
                  <div style={S.uploadZone} onClick={() => document.getElementById('galFileIn').click()}>
                    <div style={{ fontSize: '1.8rem', marginBottom: '0.4rem' }}>📷</div>
                    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.7rem', color: 'var(--muted)' }}>
                      {galFile ? galFile.name : 'Click to upload image (JPG, PNG, WebP)'}
                    </div>
                    <input type="file" id="galFileIn" accept="image/*" style={{ display: 'none' }} onChange={e => setGalFile(e.target.files[0])} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div>
                      <label className="label">Title (optional)</label>
                      <input className="input" value={galForm.title} onChange={e => setGalForm({ ...galForm, title: e.target.value })} placeholder="Photo title" />
                    </div>
                    <div>
                      <label className="label">Caption</label>
                      <input className="input" value={galForm.caption} onChange={e => setGalForm({ ...galForm, caption: e.target.value })} placeholder="What's happening?" />
                    </div>
                  </div>
                  <button className="btn-primary" type="submit" disabled={galLoading}>
                    {galLoading ? 'Uploading...' : 'Publish to Gallery'}
                  </button>
                </form>
                <div style={{ marginTop: '1.8rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(130px,1fr))', gap: '0.8rem' }}>
                  {gallery.map(item => (
                    <div key={item.id}>
                      <img src={item.image_url} alt={item.caption} style={{ width: '100%', height: 90, objectFit: 'cover', display: 'block' }} />
                      <div style={{ padding: '0.28rem', fontSize: '0.68rem', color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.caption}</div>
                      <button style={S.btnRed} onClick={() => handleDeleteGallery(item.id)}>Remove</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* POSTS */}
            {section === 'posts' && (
              <div>
                <div style={S.title}>POSTS & UPDATES</div>
                <form onSubmit={handlePublishPost} style={{ background: 'var(--gm)', padding: '1.2rem', marginBottom: '1.8rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div>
                      <label className="label">Title</label>
                      <input className="input" required value={postForm.title} onChange={e => setPostForm({ ...postForm, title: e.target.value })} placeholder="Announcement title" />
                    </div>
                    <div>
                      <label className="label">Date</label>
                      <input className="input" type="date" value={postForm.date} onChange={e => setPostForm({ ...postForm, date: e.target.value })} />
                    </div>
                  </div>
                  <div style={{ marginBottom: '0.75rem' }}>
                    <label className="label">Content</label>
                    <textarea className="input" rows={3} required value={postForm.content} onChange={e => setPostForm({ ...postForm, content: e.target.value })} placeholder="Write your update..." style={{ resize: 'vertical' }} />
                  </div>
                  <div style={{ marginBottom: '0.75rem' }}>
                    <label className="label">Attach Media (optional)</label>
                    <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      <button type="button" style={S.btn} onClick={() => document.getElementById('postMediaIn').click()}>+ Attach Image/Video</button>
                      <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{postMedia ? postMedia.name : 'No file selected'}</span>
                      <input type="file" id="postMediaIn" accept="image/*,video/*" style={{ display: 'none' }} onChange={e => setPostMedia(e.target.files[0])} />
                    </div>
                  </div>
                  <button className="btn-primary" type="submit">Publish Post</button>
                </form>
                <div style={S.sectionTitle}>Published Posts</div>
                {posts.map(p => (
                  <div key={p.id} style={{ padding: '0.9rem', border: '1px solid rgba(255,255,255,0.065)', marginBottom: '0.65rem', display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.2rem', marginBottom: '0.18rem' }}>{p.title}</div>
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

            {/* SCHEDULE */}
            {section === 'schedule' && (
              <div>
                <div style={S.title}>TIMETABLE</div>
                <p style={{ color: 'var(--muted)', marginBottom: '1rem', fontSize: '0.85rem' }}>Current weekly schedule — edit coming soon via database.</p>
                <table style={S.table}>
                  <thead><tr>{['Day','Time','Session','Level'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
                  <tbody>
                    {[
                      ['Monday','4:00–6:00 PM','General Training','All Levels'],
                      ['Wednesday','4:00–6:00 PM','Skills Workshop','Intermediate'],
                      ['Friday','4:00–7:00 PM','Friday Session','All Levels'],
                      ['Saturday','8:00–10:00 AM','Girls Session','Girls Only'],
                      ['Saturday','2:00–5:00 PM','Community Jam','All Welcome'],
                      ['Sunday','10:00 AM–1:00 PM','Private Classes','By Booking'],
                    ].map(row => (
                      <tr key={row[0]+row[1]}>{row.map((cell,i) => <td key={i} style={S.td}>{cell}</td>)}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* TEAM PROFILES */}
            {section === 'teamprofiles' && (
              <div>
                <div style={S.title}>TEAM PROFILES</div>
                <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '1.1rem' }}>Click "Edit Profile" to update photo, stance, level, favourite trick, idol skater.</p>
                <div style={{ overflowX: 'auto' }}>
                  <table style={S.table}>
                    <thead><tr>{['Photo','Name','Age','Stance','Level','Fav Trick','Idol','Visible','Actions'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
                    <tbody>
                      {members.map(m => (
                        <tr key={m.id}>
                          <td style={S.td}>
                            <div style={{ width: 36, height: 36, background: 'var(--maroon-dk)', borderRadius: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Bebas Neue',sans-serif", fontSize: '0.8rem', color: 'var(--gold)' }}>
                              {m.photo_url ? <img src={m.photo_url} alt={m.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : m.full_name?.split(' ').map(w=>w[0]).join('').slice(0,2)}
                            </div>
                          </td>
                          <td style={S.td}>{m.full_name}</td>
                          <td style={S.td}><span style={S.dobDisp}>{m.date_of_birth ? calcAge(m.date_of_birth)+'y' : '—'}</span></td>
                          <td style={S.td}>{m.stance || '—'}</td>
                          <td style={S.td}>{m.level || '—'}</td>
                          <td style={S.td}>{m.favourite_trick || '—'}</td>
                          <td style={S.td}>{m.idol_skater || '—'}</td>
                          <td style={S.td}><span style={m.is_visible ? S.approved : S.pending}>{m.is_visible ? 'Visible' : 'Hidden'}</span></td>
                          <td style={S.td}>
                            <button style={S.btn} onClick={() => { setSection('members'); setEditingMember(m) }}>Edit Profile</button>
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

function MemberEditModal({ member, calcAge, onSave, onClose, onPhotoUpload }) {
  const [form, setForm] = useState({
    full_name: member.full_name || '',
    date_of_birth: member.date_of_birth || '',
    gender: member.gender || 'Male',
    status: member.student && member.working ? 'Both' : member.student ? 'Student' : 'Working',
    stance: member.stance || 'Regular',
    level: member.level || 'Beginner',
    favourite_trick: member.favourite_trick || '',
    idol_skater: member.idol_skater || '',
    bio: member.bio || '',
    role: member.role || 'Member',
    is_visible: member.is_visible,
  })
  const [photoFile, setPhotoFile] = useState(null)

  function handleSave() {
    const updates = {
      ...form,
      student: form.status === 'Student' || form.status === 'Both',
      working: form.status === 'Working' || form.status === 'Both',
    }
    onSave(member.id, updates)
    if (photoFile) onPhotoUpload(member.id, photoFile)
  }

  const initials = member.full_name?.split(' ').map(w => w[0]).join('').slice(0, 2)

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'var(--gd)', border: '1px solid rgba(200,162,50,0.3)', padding: '2rem', width: 560, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '0.75rem', right: '0.85rem', background: 'none', border: 'none', color: 'var(--muted)', fontSize: '1.35rem', cursor: 'pointer' }}>×</button>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: '1.8rem', marginBottom: '1.2rem', color: 'var(--cream)' }}>Edit: {member.full_name}</div>

        <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '1.5rem', marginBottom: '1.3rem' }}>
          <div>
            <div style={{ width: 130, height: 130, background: 'var(--maroon-dk)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Bebas Neue',sans-serif", fontSize: '2.5rem', color: 'var(--gold)', overflow: 'hidden', position: 'relative' }}>
              {member.photo_url ? <img src={member.photo_url} alt={member.full_name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
            </div>
            <button style={{ ...S.btn, width: 130, marginTop: '0.5rem', textAlign: 'center' }} onClick={() => document.getElementById('pmPhotoIn').click()}>Upload Photo</button>
            <input type="file" id="pmPhotoIn" accept="image/*" style={{ display: 'none' }} onChange={e => setPhotoFile(e.target.files[0])} />
            {photoFile && <div style={{ fontSize: '0.7rem', color: '#6dc86d', marginTop: '0.3rem' }}>✓ {photoFile.name}</div>}
          </div>
          <div>
            <div style={{ marginBottom: '0.75rem' }}><label className="label">Full Name</label><input className="input" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginBottom: '0.75rem' }}>
              <div><label className="label">Date of Birth</label><input className="input" type="date" value={form.date_of_birth} onChange={e => setForm({ ...form, date_of_birth: e.target.value })} /></div>
              <div><label className="label">Age (auto)</label><div style={S.dobDisp}>{form.date_of_birth ? calcAge(form.date_of_birth)+'y' : '—'}</div></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
              <div><label className="label">Gender</label><select className="input" value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}><option>Male</option><option>Female</option><option>Other</option></select></div>
              <div><label className="label">Status</label><select className="input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}><option>Student</option><option>Working</option><option>Both</option></select></div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div><label className="label">Skating Stance</label><select className="input" value={form.stance} onChange={e => setForm({ ...form, stance: e.target.value })}><option>Regular</option><option>Goofy</option></select></div>
          <div><label className="label">Skating Level</label><select className="input" value={form.level} onChange={e => setForm({ ...form, level: e.target.value })}><option>Beginner</option><option>Intermediate</option><option>Advanced</option><option>Pro</option></select></div>
        </div>
        <div style={{ marginBottom: '0.75rem' }}><label className="label">Favourite Trick</label><input className="input" value={form.favourite_trick} onChange={e => setForm({ ...form, favourite_trick: e.target.value })} placeholder="e.g. Kickflip, Ollie..." /></div>
        <div style={{ marginBottom: '0.75rem' }}><label className="label">Idol Skater</label><input className="input" value={form.idol_skater} onChange={e => setForm({ ...form, idol_skater: e.target.value })} placeholder="e.g. Tony Hawk, Nyjah Huston..." /></div>
        <div style={{ marginBottom: '0.75rem' }}><label className="label">Bio</label><textarea className="input" rows={3} value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} placeholder="Short bio..." style={{ resize: 'vertical' }} /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
          <div><label className="label">Role</label><select className="input" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}><option>Member</option><option>Founder</option><option>Coach</option><option>Captain</option></select></div>
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
  adbar: { background: 'var(--maroon-dk)', padding: '0.4rem 1.4rem', fontFamily: "'Space Mono',monospace", fontSize: '0.62rem', letterSpacing: '0.07em', color: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(200,162,50,0.28)' },
  layout: { display: 'grid', gridTemplateColumns: '200px 1fr', minHeight: 'calc(100vh - 3.3rem - 1.8rem)' },
  sidebar: { background: 'var(--gp)', borderRight: '1px solid rgba(255,255,255,0.045)', padding: '1.1rem' },
  sideSection: { fontFamily: "'Space Mono',monospace", fontSize: '0.56rem', letterSpacing: '0.14em', color: 'var(--muted)', margin: '1.1rem 0 0.45rem', textTransform: 'uppercase' },
  navItem: { display: 'block', width: '100%', background: 'none', border: 'none', color: 'rgba(255,255,255,0.52)', fontFamily: "'Space Mono',monospace", fontSize: '0.62rem', letterSpacing: '0.07em', textTransform: 'uppercase', textAlign: 'left', padding: '0.58rem 0.65rem', cursor: 'pointer', marginBottom: '0.12rem' },
  navItemActive: { color: '#c8a232', background: 'rgba(200,162,50,0.065)' },
  main: { padding: '1.6rem', overflowX: 'auto' },
  title: { fontFamily: "'Bebas Neue',sans-serif", fontSize: '2rem', marginBottom: '1.6rem', color: 'var(--cream)' },
  sectionTitle: { fontFamily: "'Bebas Neue',sans-serif", fontSize: '1.4rem', marginBottom: '0.8rem', color: 'var(--wh)' },
  cards: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(110px,1fr))', gap: '0.75rem', marginBottom: '1.8rem' },
  card: { background: 'var(--gm)', padding: '0.9rem', borderLeft: '3px solid #c8a232' },
  cardNum: { fontFamily: "'Bebas Neue',sans-serif", fontSize: '2rem', color: '#c8a232' },
  cardLabel: { fontFamily: "'Space Mono',monospace", fontSize: '0.57rem', letterSpacing: '0.1em', color: 'var(--muted)', textTransform: 'uppercase', marginTop: '0.18rem' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { fontFamily: "'Space Mono',monospace", fontSize: '0.58rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', padding: '0.6rem 0.75rem', borderBottom: '1px solid rgba(255,255,255,0.065)', textAlign: 'left', whiteSpace: 'nowrap' },
  td: { padding: '0.6rem 0.75rem', borderBottom: '1px solid rgba(255,255,255,0.038)', fontSize: '0.82rem', color: 'rgba(255,255,255,0.76)', verticalAlign: 'middle' },
  btn: { background: 'none', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.55)', fontFamily: "'Space Mono',monospace", fontSize: '0.57rem', letterSpacing: '0.05em', padding: '0.26rem 0.52rem', cursor: 'pointer', marginRight: '0.22rem' },
  btnGrn: { background: 'none', border: '1px solid rgba(109,200,109,0.4)', color: '#6dc86d', fontFamily: "'Space Mono',monospace", fontSize: '0.57rem', padding: '0.26rem 0.52rem', cursor: 'pointer', marginRight: '0.22rem' },
  btnRed: { background: 'none', border: '1px solid rgba(220,80,80,0.3)', color: '#e06060', fontFamily: "'Space Mono',monospace", fontSize: '0.57rem', padding: '0.26rem 0.52rem', cursor: 'pointer', marginRight: '0.22rem' },
  badge: { display: 'inline-block', background: 'rgba(200,162,50,0.2)', color: '#c8a232', fontFamily: "'Space Mono',monospace", fontSize: '0.55rem', padding: '0.1rem 0.4rem', marginLeft: '0.4rem', borderRadius: 2 },
  dobDisp: { fontFamily: "'Space Mono',monospace", fontSize: '0.76rem', color: '#c8a232' },
  gold: { fontFamily: "'Space Mono',monospace", fontSize: '0.55rem', color: '#c8a232' },
  approved: { color: '#6dc86d', fontFamily: "'Space Mono',monospace", fontSize: '0.6rem' },
  pending: { color: '#c8a232', fontFamily: "'Space Mono',monospace", fontSize: '0.6rem' },
  declined: { color: '#e06060', fontFamily: "'Space Mono',monospace", fontSize: '0.6rem' },
  uploadZone: { border: '2px dashed rgba(200,162,50,0.25)', padding: '1.8rem', textAlign: 'center', cursor: 'pointer', marginBottom: '1.1rem' },
}
