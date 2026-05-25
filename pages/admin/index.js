import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Nav from '../../components/Nav'
import { supabase } from '../../lib/supabase'
import {
  getAllMembers, getPendingUsers, approveUser, rejectUser,
  updateProfile, deleteMember, toggleMemberVisibility, uploadProfilePhoto,
  getAllBookings, updateBookingStatus,
  getGallery, uploadGalleryImage, deleteGalleryItem,
  getPosts, createPost, deletePost,
  getTimetable, addTimetableSession, updateTimetableSession, deleteTimetableSession,
} from '../../lib/supabase'

const CATS    = ['Student','Working','Parent / Guardian','Sponsor','Volunteer','Coach','Other']
const LEVELS  = ['Beginner','Intermediate','Advanced','Pro']
const STANCES = ['Regular','Goofy']
const ROLES   = ['Member','Founder','Coach','Captain']
const DAYS    = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
const S_TYPES = ['All Levels','All Welcome','Intermediate','Advanced','Girls Only','By Booking','Beginners']

function calcAge(dob) {
  if (!dob) return null
  const d=new Date(dob),n=new Date()
  let a=n.getFullYear()-d.getFullYear()
  if(n.getMonth()-d.getMonth()<0||(n.getMonth()===d.getMonth()&&n.getDate()<d.getDate()))a--
  return a
}

function catColor(cat) {
  const map={
    'Student':           {background:'rgba(100,180,255,0.12)',color:'#60b0ff'},
    'Working':           {background:'rgba(200,162,50,0.12)', color:'#c8a232'},
    'Parent / Guardian': {background:'rgba(200,100,200,0.12)',color:'#d090d0'},
    'Sponsor':           {background:'rgba(100,200,100,0.12)',color:'#6dc86d'},
    'Volunteer':         {background:'rgba(255,160,50,0.12)', color:'#ffa030'},
    'Coach':             {background:'rgba(255,80,80,0.12)',  color:'#ff6060'},
    'Founder':           {background:'rgba(200,162,50,0.2)',  color:'#c8a232'},
  }
  return map[cat]||{background:'rgba(255,255,255,0.07)',color:'rgba(255,255,255,0.6)'}
}

function typeColor(t) {
  const map={
    'All Levels':  {background:'rgba(100,200,100,0.12)',color:'#6dc86d'},
    'All Welcome': {background:'rgba(100,200,100,0.12)',color:'#6dc86d'},
    'Intermediate':{background:'rgba(200,162,50,0.12)', color:'#c8a232'},
    'Advanced':    {background:'rgba(200,162,50,0.12)', color:'#c8a232'},
    'By Booking':  {background:'rgba(200,162,50,0.12)', color:'#c8a232'},
    'Girls Only':  {background:'rgba(200,100,200,0.12)',color:'#d090d0'},
    'Beginners':   {background:'rgba(100,180,255,0.12)',color:'#60b0ff'},
  }
  return map[t]||{}
}

export default function Admin({ session, profile }) {
  const router = useRouter()
  const [sec, setSec]           = useState('overview')
  const [pending, setPending]   = useState([])
  const [members, setMembers]   = useState([])
  const [bookings, setBookings] = useState([])
  const [gallery, setGallery]   = useState([])
  const [posts, setPosts]       = useState([])
  const [tt, setTt]             = useState([])
  const [toast, setToast]       = useState('')
  const [editM, setEditM]       = useState(null)
  const [editTT, setEditTT]     = useState(null)
  const [showAddTT, setShowAddTT] = useState(false)
  const [galFile, setGalFile]   = useState(null)
  const [galLoading, setGalLoading] = useState(false)
  const [galForm, setGalForm]   = useState({title:'',caption:''})
  const [postForm, setPostForm] = useState({title:'',content:''})
  const [postMedia, setPostMedia] = useState(null)
  const [newM, setNewM] = useState({full_name:'',email:'',date_of_birth:'',gender:'Male',category:'Student',stance:'Regular',level:'Beginner',favourite_trick:'',idol_skater:'',bio:'',role:'Member'})
  const [newTT, setNewTT] = useState({day:'Monday',time:'',session_name:'',session_type:'All Levels',notes:'',sort_order:0})

  useEffect(() => {
    if (!session) { router.push('/login'); return }
    if (profile && !profile.is_admin) { router.push('/'); return }
    load()
  }, [session, profile])

  async function load() {
    try {
      const [p,m,b,g,ps,t] = await Promise.all([
        getPendingUsers(), getAllMembers(), getAllBookings(),
        getGallery(), getPosts(), getTimetable()
      ])
      setPending(p||[]); setMembers(m||[]); setBookings(b||[])
      setGallery(g||[]); setPosts(ps||[]); setTt(t||[])
    } catch(e){ showToast('Error: '+e.message) }
  }

  function showToast(msg){ setToast(msg); setTimeout(()=>setToast(''),3500) }

  // ── USER APPROVALS ──
  async function doApprove(id) {
    await approveUser(id)
    setPending(p=>p.filter(u=>u.id!==id))
    showToast('User approved! They can now log in.')
    load()
  }
  async function doReject(id) {
    if(!confirm('Reject and delete this user?')) return
    await rejectUser(id)
    setPending(p=>p.filter(u=>u.id!==id))
    showToast('User rejected.')
  }

  // ── MEMBERS ──
  async function doUpdateMember(id, updates) {
    await updateProfile(id, updates)
    setEditM(null); load(); showToast('Member updated!')
  }
  async function doDeleteMember(id) {
    if(!confirm('Remove this member permanently?')) return
    await deleteMember(id); load(); showToast('Member removed.')
  }
  async function doToggleVisible(id, vis) {
    await toggleMemberVisibility(id, vis); load(); showToast('Visibility updated.')
  }
  async function doPhotoUpload(id, file) {
    const url = await uploadProfilePhoto(id, file)
    await updateProfile(id, {photo_url:url}); load(); showToast('Photo updated!')
  }
  async function doAddMember(e) {
    e.preventDefault()
    if(!newM.full_name){ showToast('Name is required'); return }
    try {
      const { error } = await supabase.from('profiles').insert({
        id: crypto.randomUUID(),
        email: newM.email || `${Date.now()}@juhudi.local`,
        full_name: newM.full_name,
        date_of_birth: newM.date_of_birth || null,
        gender: newM.gender,
        category: newM.category,
        student: newM.category==='Student',
        working: newM.category==='Working',
        stance: newM.stance,
        level: newM.level,
        favourite_trick: newM.favourite_trick,
        idol_skater: newM.idol_skater,
        bio: newM.bio,
        role: newM.role,
        is_approved: true,
        is_visible: true,
        is_admin: false,
      })
      if(error) throw error
      setNewM({full_name:'',email:'',date_of_birth:'',gender:'Male',category:'Student',stance:'Regular',level:'Beginner',favourite_trick:'',idol_skater:'',bio:'',role:'Member'})
      load(); showToast('Member added!')
    } catch(e){ showToast('Error: '+e.message) }
  }

  // ── BOOKINGS ──
  async function doBookingStatus(id, status) {
    await updateBookingStatus(id, status); load(); showToast(`Booking ${status.toLowerCase()}.`)
  }

  // ── GALLERY ──
  async function doGalleryUpload(e) {
    e.preventDefault()
    if(!galFile){ showToast('Select an image first'); return }
    setGalLoading(true)
    try {
      await uploadGalleryImage(galFile, galForm.caption, galForm.title)
      setGalFile(null); setGalForm({title:'',caption:''})
      load(); showToast('Photo published!')
    } catch(e){ showToast('Upload failed: '+e.message) }
    setGalLoading(false)
  }
  async function doDeleteGal(id){ await deleteGalleryItem(id); load(); showToast('Photo removed.') }

  // ── POSTS ──
  async function doPublishPost(e) {
    e.preventDefault()
    if(!postForm.title||!postForm.content){ showToast('Fill title and content'); return }
    await createPost({title:postForm.title, content:postForm.content, mediaFile:postMedia})
    setPostForm({title:'',content:''}); setPostMedia(null)
    load(); showToast('Post published!')
  }
  async function doDeletePost(id){ if(!confirm('Delete post?')) return; await deletePost(id); load(); showToast('Post deleted.') }

  // ── TIMETABLE ──
  async function doAddTT(e) {
    e.preventDefault()
    if(!newTT.time||!newTT.session_name){ showToast('Fill time and session name'); return }
    await addTimetableSession(newTT)
    setNewTT({day:'Monday',time:'',session_name:'',session_type:'All Levels',notes:'',sort_order:0})
    setShowAddTT(false); load(); showToast('Session added!')
  }
  async function doUpdateTT(id, data){ await updateTimetableSession(id,data); setEditTT(null); load(); showToast('Session updated!') }
  async function doDeleteTT(id){ if(!confirm('Delete session?')) return; await deleteTimetableSession(id); load(); showToast('Session deleted.') }

  const NAV = [
    {id:'overview',  label:'Overview'},
    {id:'users',     label:'User Approvals', count:pending.length},
    {id:'addmember', label:'+ Add Member'},
    {id:'members',   label:'All Members'},
    {id:'bookings',  label:'Bookings', count:bookings.filter(b=>b.status==='Pending').length},
    {id:'gallery',   label:'Gallery Upload'},
    {id:'posts',     label:'Posts & Updates'},
    {id:'schedule',  label:'Timetable'},
    {id:'teamprofiles',label:'Team Profiles'},
  ]

  return (
    <>
      <Nav session={session} profile={profile}/>
      {toast && <div className="toast">{toast}</div>}
      <div style={{paddingTop:'3.3rem',minHeight:'100vh'}}>
        <div style={A.bar}>
          <span>⚡ ADMIN PANEL — Lucas Masanja</span>
          <span style={{color:'rgba(240,232,208,0.4)',fontSize:'0.58rem'}}>Juhudi Skateboarding</span>
        </div>
        <div style={A.layout}>

          {/* SIDEBAR */}
          <div style={A.side}>
            {NAV.map(n=>(
              <button key={n.id} onClick={()=>setSec(n.id)}
                style={{...A.ni,...(sec===n.id?A.niOn:{}),(n.id==='addmember'?{color:'#c8a232'}:{})}}>
                {n.label}
                {n.count>0&&<span style={A.badge}>{n.count}</span>}
              </button>
            ))}
          </div>

          {/* MAIN */}
          <div style={A.main}>

            {/* ── OVERVIEW ── */}
            {sec==='overview'&&(
              <div>
                <div style={A.title}>OVERVIEW</div>
                <div style={A.cards}>
                  {[['Members',members.length],['Pending',pending.length],['Bookings',bookings.filter(b=>b.status==='Pending').length],['Gallery',gallery.length],['Posts',posts.length]].map(([l,n])=>(
                    <div key={l} style={A.card}><div style={A.cardN}>{n}</div><div style={A.cardL}>{l}</div></div>
                  ))}
                </div>
                <div style={A.secT}>Quick Actions</div>
                <div style={{display:'flex',gap:'0.8rem',flexWrap:'wrap'}}>
                  <button className="btn-primary" onClick={()=>setSec('users')}>Review Approvals ({pending.length})</button>
                  <button className="btn-primary" onClick={()=>setSec('addmember')}>+ Add Member</button>
                  <button className="btn-primary" onClick={()=>setSec('posts')}>Write a Post</button>
                  <button className="btn-primary" onClick={()=>setSec('schedule')}>Edit Timetable</button>
                </div>
              </div>
            )}

            {/* ── USER APPROVALS ── */}
            {sec==='users'&&(
              <div>
                <div style={A.title}>USER APPROVALS</div>
                <div style={A.secT}>Pending ({pending.length})</div>
                {pending.length===0&&<p style={A.empty}>No pending users — all caught up! ✅</p>}
                <div style={{overflowX:'auto'}}>
                  <table style={A.tbl}>
                    <thead><tr>{['Name','Email','DOB','Age','Gender','Category','Requested','Actions'].map(h=><th key={h} style={A.th}>{h}</th>)}</tr></thead>
                    <tbody>
                      {pending.map(u=>(
                        <tr key={u.id}>
                          <td style={A.td}>{u.full_name}</td>
                          <td style={A.td}>{u.email}</td>
                          <td style={A.td}><span style={A.mono}>{u.date_of_birth||'—'}</span></td>
                          <td style={A.td}><span style={A.gold}>{u.date_of_birth?calcAge(u.date_of_birth)+'y':'—'}</span></td>
                          <td style={A.td}>{u.gender||'—'}</td>
                          <td style={A.td}><span style={{...A.catB,...catColor(u.category)}}>{u.category||'—'}</span></td>
                          <td style={A.td}><span style={A.mono}>{new Date(u.created_at).toLocaleDateString()}</span></td>
                          <td style={A.td}>
                            <button style={A.btnG} onClick={()=>doApprove(u.id)}>Approve</button>
                            <button style={A.btnR} onClick={()=>doReject(u.id)}>Reject</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── ADD MEMBER ── */}
            {sec==='addmember'&&(
              <div>
                <div style={A.title}>ADD MEMBER DIRECTLY</div>
                <p style={A.empty}>Add a member manually — no signup needed from them.</p>
                <form onSubmit={doAddMember} style={{background:'#202020',padding:'1.5rem',marginTop:'1rem'}}>
                  <div style={A.frow}>
                    <div style={A.fg}><label className="label">Full Name *</label><input className="input" required value={newM.full_name} onChange={e=>setNewM({...newM,full_name:e.target.value})} placeholder="Full name"/></div>
                    <div style={A.fg}><label className="label">Email (optional)</label><input className="input" type="email" value={newM.email} onChange={e=>setNewM({...newM,email:e.target.value})} placeholder="member@email.com"/></div>
                  </div>
                  <div style={A.frow}>
                    <div style={A.fg}>
                      <label className="label">Date of Birth</label>
                      <input className="input" type="date" value={newM.date_of_birth} onChange={e=>setNewM({...newM,date_of_birth:e.target.value})}/>
                      {newM.date_of_birth&&<div style={A.gold}>Age: {calcAge(newM.date_of_birth)}y</div>}
                    </div>
                    <div style={A.fg}><label className="label">Gender</label><select className="input" value={newM.gender} onChange={e=>setNewM({...newM,gender:e.target.value})}><option>Male</option><option>Female</option><option>Other</option></select></div>
                  </div>
                  <div style={A.frow}>
                    <div style={A.fg}><label className="label">Category</label><select className="input" value={newM.category} onChange={e=>setNewM({...newM,category:e.target.value})}>{CATS.map(c=><option key={c}>{c}</option>)}</select></div>
                    <div style={A.fg}><label className="label">Role</label><select className="input" value={newM.role} onChange={e=>setNewM({...newM,role:e.target.value})}>{ROLES.map(r=><option key={r}>{r}</option>)}</select></div>
                  </div>
                  <div style={A.frow}>
                    <div style={A.fg}><label className="label">Skating Stance</label><select className="input" value={newM.stance} onChange={e=>setNewM({...newM,stance:e.target.value})}>{STANCES.map(s=><option key={s}>{s}</option>)}</select></div>
                    <div style={A.fg}><label className="label">Skating Level</label><select className="input" value={newM.level} onChange={e=>setNewM({...newM,level:e.target.value})}>{LEVELS.map(l=><option key={l}>{l}</option>)}</select></div>
                  </div>
                  <div style={A.frow}>
                    <div style={A.fg}><label className="label">Favourite Trick</label><input className="input" value={newM.favourite_trick} onChange={e=>setNewM({...newM,favourite_trick:e.target.value})} placeholder="e.g. Kickflip"/></div>
                    <div style={A.fg}><label className="label">Idol Skater</label><input className="input" value={newM.idol_skater} onChange={e=>setNewM({...newM,idol_skater:e.target.value})} placeholder="e.g. Tony Hawk"/></div>
                  </div>
                  <div style={A.fg}><label className="label">Bio</label><textarea className="input" rows={2} value={newM.bio} onChange={e=>setNewM({...newM,bio:e.target.value})} placeholder="Short bio..." style={{resize:'vertical'}}/></div>
                  <button className="btn-primary" type="submit">Add Member</button>
                </form>
              </div>
            )}

            {/* ── ALL MEMBERS ── */}
            {sec==='members'&&(
              <div>
                <div style={A.title}>ALL MEMBERS ({members.length})</div>
                <div style={{overflowX:'auto'}}>
                  <table style={A.tbl}>
                    <thead><tr>{['Name','DOB','Age','Gender','Category','Stance','Level','Visible','Actions'].map(h=><th key={h} style={A.th}>{h}</th>)}</tr></thead>
                    <tbody>
                      {members.map(m=>(
                        <tr key={m.id}>
                          <td style={A.td}>{m.full_name}{m.is_admin&&<span style={A.gold}> [A]</span>}</td>
                          <td style={A.td}><span style={A.mono}>{m.date_of_birth||'—'}</span></td>
                          <td style={A.td}><span style={A.gold}>{m.date_of_birth?calcAge(m.date_of_birth)+'y':'—'}</span></td>
                          <td style={A.td}>{m.gender||'—'}</td>
                          <td style={A.td}><span style={{...A.catB,...catColor(m.category)}}>{m.category||'—'}</span></td>
                          <td style={A.td}>{m.stance||'—'}</td>
                          <td style={A.td}>{m.level||'—'}</td>
                          <td style={A.td}><span style={m.is_visible?A.ok:A.pend}>{m.is_visible?'Yes':'No'}</span></td>
                          <td style={A.td}>
                            <button style={A.btn} onClick={()=>setEditM(m)}>Edit</button>
                            <button style={A.btn} onClick={()=>doToggleVisible(m.id,m.is_visible)}>{m.is_visible?'Hide':'Show'}</button>
                            {!m.is_admin&&<button style={A.btnR} onClick={()=>doDeleteMember(m.id)}>Remove</button>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {editM&&<EditMemberModal m={editM} onSave={doUpdateMember} onClose={()=>setEditM(null)} onPhoto={doPhotoUpload} calcAge={calcAge}/>}
              </div>
            )}

            {/* ── BOOKINGS ── */}
            {sec==='bookings'&&(
              <div>
                <div style={A.title}>BOOKINGS</div>
                {bookings.length===0&&<p style={A.empty}>No bookings yet.</p>}
                <div style={{overflowX:'auto'}}>
                  <table style={A.tbl}>
                    <thead><tr>{['Name','Phone','DOB','Age','Date','Time','Level','Notes','Status','Actions'].map(h=><th key={h} style={A.th}>{h}</th>)}</tr></thead>
                    <tbody>
                      {bookings.map(b=>(
                        <tr key={b.id}>
                          <td style={A.td}>{b.full_name}</td>
                          <td style={A.td}>{b.phone}</td>
                          <td style={A.td}><span style={A.mono}>{b.date_of_birth||'—'}</span></td>
                          <td style={A.td}><span style={A.gold}>{b.date_of_birth?calcAge(b.date_of_birth)+'y':'—'}</span></td>
                          <td style={A.td}>{b.preferred_date}</td>
                          <td style={A.td}>{b.preferred_time}</td>
                          <td style={A.td}>{b.skill_level}</td>
                          <td style={A.td}><span style={{fontSize:'0.75rem',color:'#6a6a6a'}}>{b.notes||'—'}</span></td>
                          <td style={A.td}><span style={b.status==='Approved'?A.ok:b.status==='Declined'?A.dec:A.pend}>{b.status}</span></td>
                          <td style={A.td}>
                            {b.status==='Pending'&&<>
                              <button style={A.btnG} onClick={()=>doBookingStatus(b.id,'Approved')}>Approve</button>
                              <button style={A.btnR} onClick={()=>doBookingStatus(b.id,'Declined')}>Decline</button>
                            </>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── GALLERY ── */}
            {sec==='gallery'&&(
              <div>
                <div style={A.title}>GALLERY UPLOAD</div>
                <form onSubmit={doGalleryUpload}>
                  <div style={A.uploadZone} onClick={()=>document.getElementById('galIn').click()}>
                    <div style={{fontSize:'1.8rem',marginBottom:'0.4rem'}}>📷</div>
                    <div style={{fontFamily:"'Space Mono',monospace",fontSize:'0.7rem',color:'#6a6a6a'}}>{galFile?`✓ ${galFile.name}`:'Click to select image (JPG, PNG, WebP)'}</div>
                    <input type="file" id="galIn" accept="image/*" style={{display:'none'}} onChange={e=>setGalFile(e.target.files[0])}/>
                  </div>
                  <div style={A.frow}>
                    <div style={A.fg}><label className="label">Title (optional)</label><input className="input" value={galForm.title} onChange={e=>setGalForm({...galForm,title:e.target.value})} placeholder="Photo title"/></div>
                    <div style={A.fg}><label className="label">Caption *</label><input className="input" value={galForm.caption} onChange={e=>setGalForm({...galForm,caption:e.target.value})} placeholder="What's happening in this photo?"/></div>
                  </div>
                  <button className="btn-primary" type="submit" disabled={galLoading}>{galLoading?'Uploading...':'Publish to Gallery'}</button>
                </form>
                <div style={{marginTop:'1.8rem',display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))',gap:'0.8rem'}}>
                  {gallery.map(item=>(
                    <div key={item.id}>
                      <img src={item.image_url} alt={item.caption} style={{width:'100%',height:95,objectFit:'cover',display:'block'}}/>
                      <div style={{padding:'0.28rem',fontSize:'0.68rem',color:'#6a6a6a',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.caption}</div>
                      <button style={A.btnR} onClick={()=>doDeleteGal(item.id)}>Remove</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── POSTS ── */}
            {sec==='posts'&&(
              <div>
                <div style={A.title}>POSTS & UPDATES</div>
                <form onSubmit={doPublishPost} style={{background:'#202020',padding:'1.2rem',marginBottom:'1.8rem'}}>
                  <div style={A.fg}><label className="label">Title *</label><input className="input" required value={postForm.title} onChange={e=>setPostForm({...postForm,title:e.target.value})} placeholder="Announcement title"/></div>
                  <div style={A.fg}><label className="label">Content *</label><textarea className="input" rows={4} required value={postForm.content} onChange={e=>setPostForm({...postForm,content:e.target.value})} placeholder="Write your update..." style={{resize:'vertical'}}/></div>
                  <div style={A.fg}>
                    <label className="label">Attach Media (optional)</label>
                    <div style={{display:'flex',gap:'0.6rem',alignItems:'center',flexWrap:'wrap'}}>
                      <button type="button" style={A.btn} onClick={()=>document.getElementById('pmIn').click()}>+ Attach Image/Video</button>
                      <span style={{fontSize:'0.75rem',color:'#6a6a6a'}}>{postMedia?`✓ ${postMedia.name}`:'No file selected'}</span>
                      <input type="file" id="pmIn" accept="image/*,video/*" style={{display:'none'}} onChange={e=>setPostMedia(e.target.files[0])}/>
                    </div>
                  </div>
                  <button className="btn-primary" type="submit">Publish Post</button>
                </form>
                <div style={A.secT}>Published Posts ({posts.length})</div>
                {posts.map(p=>(
                  <div key={p.id} style={{padding:'0.9rem',border:'1px solid rgba(255,255,255,0.07)',marginBottom:'0.65rem',display:'flex',justifyContent:'space-between',gap:'1rem'}}>
                    <div style={{flex:1}}>
                      <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:'1.2rem',marginBottom:'0.18rem'}}>{p.title}</div>
                      <div style={{fontFamily:'monospace',fontSize:'0.6rem',color:'#6a6a6a',marginBottom:'0.35rem'}}>{new Date(p.created_at).toLocaleDateString()}</div>
                      <div style={{fontSize:'0.83rem',color:'rgba(255,255,255,0.65)'}}>{p.content}</div>
                      {p.media_url&&p.media_type==='image'&&<img src={p.media_url} alt={p.title} style={{maxHeight:100,marginTop:'0.6rem'}}/>}
                      {p.media_url&&p.media_type==='video'&&<video src={p.media_url} controls style={{maxHeight:100,marginTop:'0.6rem'}}/>}
                    </div>
                    <button style={A.btnR} onClick={()=>doDeletePost(p.id)}>Delete</button>
                  </div>
                ))}
              </div>
            )}

            {/* ── TIMETABLE ── */}
            {sec==='schedule'&&(
              <div>
                <div style={A.title}>TIMETABLE</div>
                <button className="btn-primary" style={{marginBottom:'1rem'}} onClick={()=>setShowAddTT(!showAddTT)}>
                  {showAddTT?'Cancel':'+ Add Session'}
                </button>
                {showAddTT&&(
                  <form onSubmit={doAddTT} style={{background:'#202020',padding:'1.2rem',marginBottom:'1.2rem'}}>
                    <div style={A.frow}>
                      <div style={A.fg}><label className="label">Day</label><select className="input" value={newTT.day} onChange={e=>setNewTT({...newTT,day:e.target.value})}>{DAYS.map(d=><option key={d}>{d}</option>)}</select></div>
                      <div style={A.fg}><label className="label">Time *</label><input className="input" required value={newTT.time} onChange={e=>setNewTT({...newTT,time:e.target.value})} placeholder="e.g. 4:00–6:00 PM"/></div>
                    </div>
                    <div style={A.frow}>
                      <div style={A.fg}><label className="label">Session Name *</label><input className="input" required value={newTT.session_name} onChange={e=>setNewTT({...newTT,session_name:e.target.value})} placeholder="e.g. General Training"/></div>
                      <div style={A.fg}><label className="label">Session Type</label><select className="input" value={newTT.session_type} onChange={e=>setNewTT({...newTT,session_type:e.target.value})}>{S_TYPES.map(t=><option key={t}>{t}</option>)}</select></div>
                    </div>
                    <div style={A.fg}><label className="label">Notes</label><input className="input" value={newTT.notes} onChange={e=>setNewTT({...newTT,notes:e.target.value})} placeholder="e.g. Bring your own board"/></div>
                    <button className="btn-primary" type="submit">Save Session</button>
                  </form>
                )}
                {tt.length===0&&<p style={A.empty}>No sessions yet. Click "+ Add Session" to build your timetable.</p>}
                <div style={{overflowX:'auto'}}>
                  <table style={A.tbl}>
                    <thead><tr>{['Day','Time','Session','Type','Notes','Actions'].map(h=><th key={h} style={A.th}>{h}</th>)}</tr></thead>
                    <tbody>
                      {tt.map(t=>(
                        <tr key={t.id}>
                          {editTT?.id===t.id?(
                            <>
                              <td style={A.td}><select className="input" style={{width:110}} value={editTT.day} onChange={e=>setEditTT({...editTT,day:e.target.value})}>{DAYS.map(d=><option key={d}>{d}</option>)}</select></td>
                              <td style={A.td}><input className="input" style={{width:130}} value={editTT.time} onChange={e=>setEditTT({...editTT,time:e.target.value})}/></td>
                              <td style={A.td}><input className="input" style={{width:150}} value={editTT.session_name} onChange={e=>setEditTT({...editTT,session_name:e.target.value})}/></td>
                              <td style={A.td}><select className="input" style={{width:120}} value={editTT.session_type} onChange={e=>setEditTT({...editTT,session_type:e.target.value})}>{S_TYPES.map(st=><option key={st}>{st}</option>)}</select></td>
                              <td style={A.td}><input className="input" style={{width:150}} value={editTT.notes||''} onChange={e=>setEditTT({...editTT,notes:e.target.value})}/></td>
                              <td style={A.td}>
                                <button style={A.btnG} onClick={()=>doUpdateTT(t.id,editTT)}>Save</button>
                                <button style={A.btn}  onClick={()=>setEditTT(null)}>Cancel</button>
                              </td>
                            </>
                          ):(
                            <>
                              <td style={A.td}>{t.day}</td>
                              <td style={A.td}>{t.time}</td>
                              <td style={A.td}>{t.session_name}</td>
                              <td style={A.td}><span style={{...A.catB,...typeColor(t.session_type)}}>{t.session_type}</span></td>
                              <td style={A.td}><span style={{fontSize:'0.78rem',color:'#6a6a6a'}}>{t.notes||'—'}</span></td>
                              <td style={A.td}>
                                <button style={A.btn}  onClick={()=>setEditTT({...t})}>Edit</button>
                                <button style={A.btnR} onClick={()=>doDeleteTT(t.id)}>Delete</button>
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

            {/* ── TEAM PROFILES ── */}
            {sec==='teamprofiles'&&(
              <div>
                <div style={A.title}>TEAM PROFILES</div>
                <p style={A.empty}>Click "Edit" to update any member's photo, stance, level, trick, idol and more.</p>
                <div style={{overflowX:'auto'}}>
                  <table style={A.tbl}>
                    <thead><tr>{['Photo','Name','Age','Category','Stance','Level','Trick','Idol','Visible','Actions'].map(h=><th key={h} style={A.th}>{h}</th>)}</tr></thead>
                    <tbody>
                      {members.map(m=>(
                        <tr key={m.id}>
                          <td style={A.td}>
                            <div style={{width:36,height:36,background:'#5c1212',overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Bebas Neue',sans-serif",fontSize:'0.8rem',color:'#c8a232'}}>
                              {m.photo_url?<img src={m.photo_url} alt={m.full_name} style={{width:'100%',height:'100%',objectFit:'cover'}}/>:m.full_name?.split(' ').map(w=>w[0]).join('').slice(0,2)}
                            </div>
                          </td>
                          <td style={A.td}>{m.full_name}</td>
                          <td style={A.td}><span style={A.gold}>{m.date_of_birth?calcAge(m.date_of_birth)+'y':'—'}</span></td>
                          <td style={A.td}><span style={{...A.catB,...catColor(m.category)}}>{m.category||'—'}</span></td>
                          <td style={A.td}>{m.stance||'—'}</td>
                          <td style={A.td}>{m.level||'—'}</td>
                          <td style={A.td}>{m.favourite_trick||'—'}</td>
                          <td style={A.td}>{m.idol_skater||'—'}</td>
                          <td style={A.td}><span style={m.is_visible?A.ok:A.pend}>{m.is_visible?'Visible':'Hidden'}</span></td>
                          <td style={A.td}>
                            <button style={A.btn} onClick={()=>{ setSec('members'); setEditM(m) }}>Edit</button>
                            <button style={A.btn} onClick={()=>doToggleVisible(m.id,m.is_visible)}>{m.is_visible?'Hide':'Show'}</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {editM&&<EditMemberModal m={editM} onSave={doUpdateMember} onClose={()=>setEditM(null)} onPhoto={doPhotoUpload} calcAge={calcAge}/>}
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  )
}

function EditMemberModal({ m, onSave, onClose, onPhoto, calcAge }) {
  const [f, setF] = useState({
    full_name: m.full_name||'', date_of_birth: m.date_of_birth||'',
    gender: m.gender||'Male', category: m.category||'Student',
    stance: m.stance||'Regular', level: m.level||'Beginner',
    favourite_trick: m.favourite_trick||'', idol_skater: m.idol_skater||'',
    bio: m.bio||'', role: m.role||'Member', is_visible: m.is_visible,
  })
  const [photoFile, setPhotoFile] = useState(null)
  const init = m.full_name?.split(' ').map(w=>w[0]).join('').slice(0,2)

  function save() {
    onSave(m.id, { ...f, student: f.category==='Student', working: f.category==='Working' })
    if (photoFile) onPhoto(m.id, photoFile)
  }

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.9)',zIndex:500,display:'flex',alignItems:'center',justifyContent:'center',padding:'1rem'}}>
      <div style={{background:'#161616',border:'1px solid rgba(200,162,50,0.3)',padding:'2rem',width:580,maxWidth:'95vw',maxHeight:'92vh',overflowY:'auto',position:'relative'}}>
        <button onClick={onClose} style={{position:'absolute',top:'0.75rem',right:'0.85rem',background:'none',border:'none',color:'#6a6a6a',fontSize:'1.5rem',cursor:'pointer'}}>×</button>
        <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:'1.8rem',marginBottom:'1.2rem',color:'#f0e8d0'}}>Edit: {m.full_name}</div>

        <div style={{display:'grid',gridTemplateColumns:'130px 1fr',gap:'1.5rem',marginBottom:'1.3rem'}}>
          <div>
            <div style={{width:130,height:130,background:'#5c1212',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Bebas Neue',sans-serif",fontSize:'2.5rem',color:'#c8a232',overflow:'hidden',position:'relative'}}>
              {m.photo_url?<img src={m.photo_url} alt={m.full_name} style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover'}}/>:init}
            </div>
            <button style={{...A.btn,width:130,marginTop:'0.5rem',textAlign:'center'}} onClick={()=>document.getElementById('pmPhIn').click()}>Upload Photo</button>
            <input type="file" id="pmPhIn" accept="image/*" style={{display:'none'}} onChange={e=>setPhotoFile(e.target.files[0])}/>
            {photoFile&&<div style={{fontSize:'0.7rem',color:'#6dc86d',marginTop:'0.3rem'}}>✓ {photoFile.name}</div>}
          </div>
          <div>
            <div style={A.fg}><label className="label">Full Name</label><input className="input" value={f.full_name} onChange={e=>setF({...f,full_name:e.target.value})}/></div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.6rem',marginBottom:'0.75rem'}}>
              <div><label className="label">Date of Birth</label><input className="input" type="date" value={f.date_of_birth} onChange={e=>setF({...f,date_of_birth:e.target.value})}/></div>
              <div><label className="label">Age (auto)</label><div style={{...A.gold,paddingTop:'0.6rem'}}>{f.date_of_birth?calcAge(f.date_of_birth)+'y':'—'}</div></div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.6rem'}}>
              <div><label className="label">Gender</label><select className="input" value={f.gender} onChange={e=>setF({...f,gender:e.target.value})}><option>Male</option><option>Female</option><option>Other</option></select></div>
              <div><label className="label">Category</label><select className="input" value={f.category} onChange={e=>setF({...f,category:e.target.value})}>{CATS.map(c=><option key={c}>{c}</option>)}</select></div>
            </div>
          </div>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'0.75rem'}}>
          <div><label className="label">Skating Stance</label><select className="input" value={f.stance} onChange={e=>setF({...f,stance:e.target.value})}>{STANCES.map(s=><option key={s}>{s}</option>)}</select></div>
          <div><label className="label">Skating Level</label><select className="input" value={f.level} onChange={e=>setF({...f,level:e.target.value})}>{LEVELS.map(l=><option key={l}>{l}</option>)}</select></div>
        </div>
        <div style={A.fg}><label className="label">Favourite Trick</label><input className="input" value={f.favourite_trick} onChange={e=>setF({...f,favourite_trick:e.target.value})} placeholder="e.g. Kickflip, Ollie..."/></div>
        <div style={A.fg}><label className="label">Idol Skater</label><input className="input" value={f.idol_skater} onChange={e=>setF({...f,idol_skater:e.target.value})} placeholder="e.g. Tony Hawk, Nyjah Huston..."/></div>
        <div style={A.fg}><label className="label">Bio</label><textarea className="input" rows={3} value={f.bio} onChange={e=>setF({...f,bio:e.target.value})} placeholder="Short bio..." style={{resize:'vertical'}}/></div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'1rem'}}>
          <div><label className="label">Role</label><select className="input" value={f.role} onChange={e=>setF({...f,role:e.target.value})}>{ROLES.map(r=><option key={r}>{r}</option>)}</select></div>
          <div><label className="label">Visible on Team Page</label><select className="input" value={f.is_visible?'Yes':'No'} onChange={e=>setF({...f,is_visible:e.target.value==='Yes'})}><option>Yes</option><option>No</option></select></div>
        </div>
        <div style={{display:'flex',gap:'0.6rem'}}>
          <button className="btn-primary" onClick={save}>Save Profile</button>
          <button className="btn-outline" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

const A = {
  bar:    {background:'#5c1212',padding:'0.4rem 1.4rem',fontFamily:"'Space Mono',monospace",fontSize:'0.62rem',letterSpacing:'0.07em',color:'#f0e8d0',display:'flex',alignItems:'center',justifyContent:'space-between',borderBottom:'1px solid rgba(200,162,50,0.28)'},
  layout: {display:'grid',gridTemplateColumns:'195px 1fr',minHeight:'calc(100vh - 5rem)'},
  side:   {background:'#131313',borderRight:'1px solid rgba(255,255,255,0.045)',padding:'1.1rem'},
  ni:     {display:'block',width:'100%',background:'none',border:'none',color:'rgba(255,255,255,0.52)',fontFamily:"'Space Mono',monospace",fontSize:'0.62rem',letterSpacing:'0.07em',textTransform:'uppercase',textAlign:'left',padding:'0.58rem 0.65rem',cursor:'pointer',marginBottom:'0.12rem'},
  niOn:   {color:'#c8a232',background:'rgba(200,162,50,0.065)'},
  main:   {padding:'1.6rem',overflowX:'auto'},
  title:  {fontFamily:"'Bebas Neue',sans-serif",fontSize:'2rem',marginBottom:'1.6rem',color:'#f0e8d0'},
  secT:   {fontFamily:"'Bebas Neue',sans-serif",fontSize:'1.4rem',marginBottom:'0.8rem',color:'#fafafa'},
  cards:  {display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(110px,1fr))',gap:'0.75rem',marginBottom:'1.8rem'},
  card:   {background:'#202020',padding:'0.9rem',borderLeft:'3px solid #c8a232'},
  cardN:  {fontFamily:"'Bebas Neue',sans-serif",fontSize:'2rem',color:'#c8a232'},
  cardL:  {fontFamily:"'Space Mono',monospace",fontSize:'0.57rem',letterSpacing:'0.1em',color:'#6a6a6a',textTransform:'uppercase',marginTop:'0.18rem'},
  badge:  {display:'inline-block',background:'rgba(200,162,50,0.2)',color:'#c8a232',fontFamily:"'Space Mono',monospace",fontSize:'0.55rem',padding:'0.1rem 0.4rem',marginLeft:'0.4rem'},
  tbl:    {width:'100%',borderCollapse:'collapse'},
  th:     {fontFamily:"'Space Mono',monospace",fontSize:'0.58rem',letterSpacing:'0.1em',textTransform:'uppercase',color:'#6a6a6a',padding:'0.6rem 0.75rem',borderBottom:'1px solid rgba(255,255,255,0.065)',textAlign:'left',whiteSpace:'nowrap'},
  td:     {padding:'0.6rem 0.75rem',borderBottom:'1px solid rgba(255,255,255,0.038)',fontSize:'0.82rem',color:'rgba(255,255,255,0.76)',verticalAlign:'middle'},
  btn:    {background:'none',border:'1px solid rgba(255,255,255,0.12)',color:'rgba(255,255,255,0.55)',fontFamily:"'Space Mono',monospace",fontSize:'0.57rem',padding:'0.26rem 0.52rem',cursor:'pointer',marginRight:'0.22rem'},
  btnG:   {background:'none',border:'1px solid rgba(109,200,109,0.4)',color:'#6dc86d',fontFamily:"'Space Mono',monospace",fontSize:'0.57rem',padding:'0.26rem 0.52rem',cursor:'pointer',marginRight:'0.22rem'},
  btnR:   {background:'none',border:'1px solid rgba(220,80,80,0.3)',color:'#e06060',fontFamily:"'Space Mono',monospace",fontSize:'0.57rem',padding:'0.26rem 0.52rem',cursor:'pointer',marginRight:'0.22rem'},
  catB:   {display:'inline-block',padding:'0.16rem 0.45rem',fontFamily:"'Space Mono',monospace",fontSize:'0.55rem',letterSpacing:'0.05em'},
  gold:   {fontFamily:"'Space Mono',monospace",fontSize:'0.76rem',color:'#c8a232'},
  mono:   {fontFamily:'monospace',fontSize:'0.78rem'},
  ok:     {color:'#6dc86d',fontFamily:"'Space Mono',monospace",fontSize:'0.6rem'},
  pend:   {color:'#c8a232',fontFamily:"'Space Mono',monospace",fontSize:'0.6rem'},
  dec:    {color:'#e06060',fontFamily:"'Space Mono',monospace",fontSize:'0.6rem'},
  uploadZone:{border:'2px dashed rgba(200,162,50,0.25)',padding:'1.8rem',textAlign:'center',cursor:'pointer',marginBottom:'1.1rem'},
  frow:   {display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'0.75rem'},
  fg:     {marginBottom:'0.75rem'},
  empty:  {color:'#6a6a6a',fontSize:'0.88rem',marginBottom:'1rem'},
}
