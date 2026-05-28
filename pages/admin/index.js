import { useState, useEffect, useRef } from 'react'
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
const STYPES  = ['All Levels','All Welcome','Intermediate','Advanced','Girls Only','By Booking','Beginners']

function calcAge(dob) {
  if (!dob) return null
  const d=new Date(dob), n=new Date()
  let a=n.getFullYear()-d.getFullYear()
  if(n.getMonth()-d.getMonth()<0||(n.getMonth()===d.getMonth()&&n.getDate()<d.getDate()))a--
  return a
}

function catColor(cat) {
  const m={
    'Student':{bg:'rgba(100,180,255,0.12)',cl:'#60b0ff'},
    'Working':{bg:'rgba(200,162,50,0.12)',cl:'#c8a232'},
    'Parent / Guardian':{bg:'rgba(200,100,200,0.12)',cl:'#d090d0'},
    'Sponsor':{bg:'rgba(100,200,100,0.12)',cl:'#6dc86d'},
    'Volunteer':{bg:'rgba(255,160,50,0.12)',cl:'#ffa030'},
    'Coach':{bg:'rgba(255,80,80,0.12)',cl:'#ff6060'},
  }
  const c=m[cat]||{bg:'rgba(255,255,255,0.07)',cl:'rgba(255,255,255,0.6)'}
  return {background:c.bg,color:c.cl}
}

function typeColor(t) {
  const m={
    'All Levels':{bg:'rgba(100,200,100,0.12)',cl:'#6dc86d'},
    'All Welcome':{bg:'rgba(100,200,100,0.12)',cl:'#6dc86d'},
    'Intermediate':{bg:'rgba(200,162,50,0.12)',cl:'#c8a232'},
    'Advanced':{bg:'rgba(200,162,50,0.12)',cl:'#c8a232'},
    'By Booking':{bg:'rgba(200,162,50,0.12)',cl:'#c8a232'},
    'Girls Only':{bg:'rgba(200,100,200,0.12)',cl:'#d090d0'},
    'Beginners':{bg:'rgba(100,180,255,0.12)',cl:'#60b0ff'},
  }
  const c=m[t]||{bg:'rgba(255,255,255,0.07)',cl:'rgba(255,255,255,0.6)'}
  return {background:c.bg,color:c.cl}
}

export default function Admin({ session, profile }) {
  const router = useRouter()
  const [sec, setSec]             = useState('overview')
  const [pending, setPending]     = useState([])
  const [members, setMembers]     = useState([])
  const [bookings, setBookings]   = useState([])
  const [gallery, setGallery]     = useState([])
  const [posts, setPosts]         = useState([])
  const [tt, setTt]               = useState([])
  const [toast, setToast]         = useState('')
  const [toastType, setToastType] = useState('ok') // ok | err
  const [editM, setEditM]         = useState(null)
  const [editTT, setEditTT]       = useState(null)
  const [editPost, setEditPost]   = useState(null)
  const [showAddTT, setShowAddTT] = useState(false)
  const [galFile, setGalFile]     = useState(null)
  const [galPrev, setGalPrev]     = useState(null)
  const [galLoading, setGalLoading] = useState(false)
  const [galForm, setGalForm]     = useState({title:'',caption:''})
  const [postForm, setPostForm]   = useState({title:'',content:''})
  const [postMedia, setPostMedia] = useState(null)
  const [postMediaPrev, setPostMediaPrev] = useState(null)
  const [postLoading, setPostLoading] = useState(false)
  const [newM, setNewM]           = useState({full_name:'',email:'',date_of_birth:'',gender:'Male',category:'Student',stance:'Regular',level:'Beginner',favourite_trick:'',idol_skater:'',bio:'',role:'Member'})
  const [newTT, setNewTT]         = useState({day:'Monday',time:'',session_name:'',session_type:'All Levels',notes:'',sort_order:0})

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
    } catch(e) { showToast('Error loading: '+e.message, 'err') }
  }

  function showToast(msg, type='ok') {
    setToast(msg); setToastType(type)
    setTimeout(()=>setToast(''), 3800)
  }

  // ── USER APPROVALS ──────────────────────────────────────
  async function doApprove(id) {
    try { await approveUser(id); setPending(p=>p.filter(u=>u.id!==id)); showToast('User approved! ✅'); load() }
    catch(e){ showToast('Error: '+e.message,'err') }
  }
  async function doReject(id) {
    if(!confirm('Reject and permanently delete this user?')) return
    try { await rejectUser(id); setPending(p=>p.filter(u=>u.id!==id)); showToast('User rejected.') }
    catch(e){ showToast('Error: '+e.message,'err') }
  }

  // ── MEMBERS ─────────────────────────────────────────────
  async function doUpdateMember(id, updates) {
    try { await updateProfile(id, updates); setEditM(null); load(); showToast('Member updated! ✅') }
    catch(e){ showToast('Error: '+e.message,'err') }
  }
  async function doDeleteMember(id) {
    if(!confirm('Remove this member permanently?')) return
    try { await deleteMember(id); load(); showToast('Member removed.') }
    catch(e){ showToast('Error: '+e.message,'err') }
  }
  async function doToggleVisible(id, vis) {
    try { await toggleMemberVisibility(id, vis); load(); showToast('Visibility updated.') }
    catch(e){ showToast('Error: '+e.message,'err') }
  }
  async function doPhotoUpload(id, file) {
    try { const url=await uploadProfilePhoto(id,file); await updateProfile(id,{photo_url:url}); load(); showToast('Photo updated! ✅') }
    catch(e){ showToast('Photo upload failed: '+e.message,'err') }
  }
  async function doAddMember(e) {
    e.preventDefault()
    if(!newM.full_name){ showToast('Name is required','err'); return }
    try {
      const { error } = await supabase.from('profiles').insert({
        id: crypto.randomUUID(),
        email: newM.email||`${Date.now()}@juhudi.local`,
        full_name: newM.full_name,
        date_of_birth: newM.date_of_birth||null,
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
      load(); showToast('Member added! ✅')
    } catch(e){ showToast('Error: '+e.message,'err') }
  }

  // ── BOOKINGS ────────────────────────────────────────────
  async function doBookingStatus(id, status) {
    try { await updateBookingStatus(id,status); load(); showToast(`Booking ${status.toLowerCase()}. ✅`) }
    catch(e){ showToast('Error: '+e.message,'err') }
  }

  // ── GALLERY ─────────────────────────────────────────────
  function handleGalFile(e) {
    const file = e.target.files[0]
    if(!file) return
    setGalFile(file)
    const reader = new FileReader()
    reader.onload = ev => setGalPrev(ev.target.result)
    reader.readAsDataURL(file)
  }

  async function doGalleryUpload(e) {
    e.preventDefault()
    if(!galFile){ showToast('Select an image first','err'); return }
    setGalLoading(true)
    try {
      await uploadGalleryImage(galFile, galForm.caption, galForm.title)
      setGalFile(null); setGalPrev(null); setGalForm({title:'',caption:''})
      document.getElementById('galFileIn').value=''
      load(); showToast('Photo published to gallery! ✅')
    } catch(e){ showToast('Upload failed: '+e.message+'. Check storage policies in Supabase.','err') }
    setGalLoading(false)
  }
  async function doDeleteGal(id) {
    if(!confirm('Remove this photo?')) return
    try { await deleteGalleryItem(id); load(); showToast('Photo removed.') }
    catch(e){ showToast('Error: '+e.message,'err') }
  }

  // ── POSTS ───────────────────────────────────────────────
  function handlePostMedia(e) {
    const file = e.target.files[0]
    if(!file) return
    setPostMedia(file)
    const reader = new FileReader()
    reader.onload = ev => setPostMediaPrev({src:ev.target.result, type:file.type.startsWith('video')?'video':'image'})
    reader.readAsDataURL(file)
  }

  async function doPublishPost(e) {
    e.preventDefault()
    if(!postForm.title||!postForm.content){ showToast('Fill title and content','err'); return }
    setPostLoading(true)
    try {
      await createPost({title:postForm.title, content:postForm.content, mediaFile:postMedia})
      setPostForm({title:'',content:''}); setPostMedia(null); setPostMediaPrev(null)
      if(document.getElementById('postMediaIn')) document.getElementById('postMediaIn').value=''
      load(); showToast('Post published! ✅')
    } catch(e){ showToast('Error: '+e.message,'err') }
    setPostLoading(false)
  }
  async function doDeletePost(id) {
    if(!confirm('Delete this post permanently?')) return
    try { await deletePost(id); load(); showToast('Post deleted.') }
    catch(e){ showToast('Error: '+e.message,'err') }
  }

  // ── TIMETABLE ───────────────────────────────────────────
  async function doAddTT(e) {
    e.preventDefault()
    if(!newTT.time||!newTT.session_name){ showToast('Fill time and session name','err'); return }
    try {
      await addTimetableSession(newTT)
      setNewTT({day:'Monday',time:'',session_name:'',session_type:'All Levels',notes:'',sort_order:0})
      setShowAddTT(false); load(); showToast('Session added! ✅')
    } catch(e){ showToast('Error: '+e.message,'err') }
  }
  async function doUpdateTT(id, data) {
    try { await updateTimetableSession(id,data); setEditTT(null); load(); showToast('Session updated! ✅') }
    catch(e){ showToast('Error: '+e.message,'err') }
  }
  async function doDeleteTT(id) {
    if(!confirm('Delete this session?')) return
    try { await deleteTimetableSession(id); load(); showToast('Session deleted.') }
    catch(e){ showToast('Error: '+e.message,'err') }
  }

  const NAV = [
    {id:'overview',     label:'📊 Overview'},
    {id:'users',        label:'👤 User Approvals', count:pending.length},
    {id:'addmember',    label:'➕ Add Member'},
    {id:'members',      label:'👥 All Members'},
    {id:'bookings',     label:'📅 Bookings', count:bookings.filter(b=>b.status==='Pending').length},
    {id:'gallery',      label:'📷 Gallery Upload'},
    {id:'posts',        label:'📝 Posts & Updates'},
    {id:'schedule',     label:'🕐 Timetable'},
    {id:'teamprofiles', label:'🛹 Team Profiles'},
  ]

  return (
    <>
      <Nav session={session} profile={profile}/>
      {toast&&(
        <div style={{
          position:'fixed',bottom:'1.5rem',right:'1.5rem',
          background: toastType==='err'?'rgba(30,10,10,0.98)':'rgba(20,30,20,0.98)',
          border:`1px solid ${toastType==='err'?'#e06060':'#6dc86d'}`,
          borderLeft:`4px solid ${toastType==='err'?'#e06060':'#6dc86d'}`,
          padding:'0.85rem 1.2rem',
          fontFamily:"'Space Mono',monospace",fontSize:'0.72rem',
          zIndex:9999,maxWidth:340,lineHeight:1.5,
          color: toastType==='err'?'#e06060':'#6dc86d',
        }}>{toast}</div>
      )}

      <div style={{paddingTop:'3.3rem',minHeight:'100vh'}}>
        <div style={A.bar}>
          <span>⚡ ADMIN — Lucas Masanja</span>
          <span style={{color:'rgba(240,232,208,0.4)',fontSize:'0.58rem'}}>Juhudi Skateboarding</span>
        </div>

        <div style={A.layout}>
          {/* SIDEBAR */}
          <div style={A.side}>
            {NAV.map(n=>(
              <button key={n.id} onClick={()=>setSec(n.id)}
                style={{...A.ni,...(sec===n.id?A.niOn:{})}}>
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
                  {[['Members',members.length],['Pending',pending.length],
                    ['Bookings',bookings.filter(b=>b.status==='Pending').length],
                    ['Gallery',gallery.length],['Posts',posts.length],['Schedule',tt.length]
                  ].map(([l,n])=>(
                    <div key={l} style={A.card}><div style={A.cardN}>{n}</div><div style={A.cardL}>{l}</div></div>
                  ))}
                </div>
                <div style={A.secT}>Quick Actions</div>
                <div style={{display:'flex',gap:'0.8rem',flexWrap:'wrap'}}>
                  <button className="btn-primary" onClick={()=>setSec('users')}>Review Approvals ({pending.length})</button>
                  <button className="btn-primary" onClick={()=>setSec('addmember')}>+ Add Member</button>
                  <button className="btn-primary" onClick={()=>setSec('posts')}>Write a Post</button>
                  <button className="btn-primary" onClick={()=>setSec('gallery')}>Upload Photo</button>
                  <button className="btn-primary" onClick={()=>setSec('schedule')}>Edit Timetable</button>
                </div>
              </div>
            )}

            {/* ── USER APPROVALS ── */}
            {sec==='users'&&(
              <div>
                <div style={A.title}>USER APPROVALS</div>
                {pending.length===0
                  ? <div style={A.emptyBox}>✅ No pending users — all caught up!</div>
                  : (
                    <div style={{overflowX:'auto'}}>
                      <table style={A.tbl}>
                        <thead><tr>{['Name','Email','DOB','Age','Gender','Category','Requested','Actions'].map(h=><th key={h} style={A.th}>{h}</th>)}</tr></thead>
                        <tbody>
                          {pending.map(u=>(
                            <tr key={u.id}>
                              <td style={A.td}><strong>{u.full_name}</strong></td>
                              <td style={A.td}>{u.email}</td>
                              <td style={A.td}><span style={A.mono}>{u.date_of_birth||'—'}</span></td>
                              <td style={A.td}><span style={A.gold}>{u.date_of_birth?calcAge(u.date_of_birth)+'y':'—'}</span></td>
                              <td style={A.td}>{u.gender||'—'}</td>
                              <td style={A.td}><span style={{...A.catB,...catColor(u.category)}}>{u.category||'—'}</span></td>
                              <td style={A.td}><span style={A.mono}>{new Date(u.created_at).toLocaleDateString()}</span></td>
                              <td style={A.td}>
                                <button style={A.btnG} onClick={()=>doApprove(u.id)}>✅ Approve</button>
                                <button style={A.btnR} onClick={()=>doReject(u.id)}>❌ Reject</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                }
              </div>
            )}

            {/* ── ADD MEMBER ── */}
            {sec==='addmember'&&(
              <div>
                <div style={A.title}>ADD MEMBER DIRECTLY</div>
                <p style={A.subP}>Add a member manually — no signup needed from them.</p>
                <form onSubmit={doAddMember} style={A.formBox}>
                  <div style={A.frow}>
                    <Fg label="Full Name *"><input className="input" required value={newM.full_name} onChange={e=>setNewM({...newM,full_name:e.target.value})} placeholder="Full name"/></Fg>
                    <Fg label="Email (optional)"><input className="input" type="email" value={newM.email} onChange={e=>setNewM({...newM,email:e.target.value})} placeholder="member@email.com"/></Fg>
                  </div>
                  <div style={A.frow}>
                    <Fg label="Date of Birth">
                      <input className="input" type="date" value={newM.date_of_birth} onChange={e=>setNewM({...newM,date_of_birth:e.target.value})}/>
                      {newM.date_of_birth&&<div style={A.ageDisp}>Age: {calcAge(newM.date_of_birth)} years</div>}
                    </Fg>
                    <Fg label="Gender"><select className="input" value={newM.gender} onChange={e=>setNewM({...newM,gender:e.target.value})}><option>Male</option><option>Female</option><option>Other</option></select></Fg>
                  </div>
                  <div style={A.frow}>
                    <Fg label="Category"><select className="input" value={newM.category} onChange={e=>setNewM({...newM,category:e.target.value})}>{CATS.map(c=><option key={c}>{c}</option>)}</select></Fg>
                    <Fg label="Role"><select className="input" value={newM.role} onChange={e=>setNewM({...newM,role:e.target.value})}>{ROLES.map(r=><option key={r}>{r}</option>)}</select></Fg>
                  </div>
                  <div style={A.frow}>
                    <Fg label="Skating Stance"><select className="input" value={newM.stance} onChange={e=>setNewM({...newM,stance:e.target.value})}>{STANCES.map(s=><option key={s}>{s}</option>)}</select></Fg>
                    <Fg label="Skating Level"><select className="input" value={newM.level} onChange={e=>setNewM({...newM,level:e.target.value})}>{LEVELS.map(l=><option key={l}>{l}</option>)}</select></Fg>
                  </div>
                  <div style={A.frow}>
                    <Fg label="Favourite Trick"><input className="input" value={newM.favourite_trick} onChange={e=>setNewM({...newM,favourite_trick:e.target.value})} placeholder="e.g. Kickflip"/></Fg>
                    <Fg label="Idol Skater"><input className="input" value={newM.idol_skater} onChange={e=>setNewM({...newM,idol_skater:e.target.value})} placeholder="e.g. Tony Hawk"/></Fg>
                  </div>
                  <Fg label="Bio"><textarea className="input" rows={2} value={newM.bio} onChange={e=>setNewM({...newM,bio:e.target.value})} placeholder="Short bio..." style={{resize:'vertical'}}/></Fg>
                  <button className="btn-primary" type="submit" style={{marginTop:'0.5rem'}}>Add Member</button>
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
                          <td style={A.td}>{m.full_name}{m.is_admin&&<span style={{...A.gold,marginLeft:4}}>[ADMIN]</span>}</td>
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
                {bookings.length===0
                  ? <div style={A.emptyBox}>No bookings yet.</div>
                  : (
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
                  )
                }
              </div>
            )}

            {/* ── GALLERY ── */}
            {sec==='gallery'&&(
              <div>
                <div style={A.title}>GALLERY UPLOAD</div>
                <form onSubmit={doGalleryUpload} style={A.formBox}>
                  <div style={A.uploadZone} onClick={()=>document.getElementById('galFileIn').click()}>
                    {galPrev
                      ? <img src={galPrev} alt="preview" style={{maxHeight:160,maxWidth:'100%',display:'block',margin:'0 auto'}}/>
                      : <>
                          <div style={{fontSize:'2.5rem',marginBottom:'0.5rem'}}>📷</div>
                          <div style={{fontFamily:"'Space Mono',monospace",fontSize:'0.72rem',color:'#6a6a6a'}}>Click here to select photo</div>
                          <div style={{fontFamily:"'Space Mono',monospace",fontSize:'0.62rem',color:'#444',marginTop:'0.3rem'}}>JPG, PNG or WebP</div>
                        </>
                    }
                    <input type="file" id="galFileIn" accept="image/*" style={{display:'none'}} onChange={handleGalFile}/>
                  </div>
                  {galFile&&<div style={{fontFamily:"'Space Mono',monospace",fontSize:'0.7rem',color:'#6dc86d',marginBottom:'0.75rem'}}>✓ {galFile.name}</div>}
                  <div style={A.frow}>
                    <Fg label="Title (optional)"><input className="input" value={galForm.title} onChange={e=>setGalForm({...galForm,title:e.target.value})} placeholder="Photo title"/></Fg>
                    <Fg label="Caption *"><input className="input" value={galForm.caption} onChange={e=>setGalForm({...galForm,caption:e.target.value})} placeholder="What's in this photo?"/></Fg>
                  </div>
                  <button className="btn-primary" type="submit" disabled={galLoading}>{galLoading?'Uploading... please wait':'Publish to Gallery'}</button>
                </form>

                {gallery.length>0&&(
                  <>
                    <div style={{...A.secT,marginTop:'2rem'}}>Published Photos ({gallery.length})</div>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))',gap:'0.8rem'}}>
                      {gallery.map(item=>(
                        <div key={item.id} style={{position:'relative'}}>
                          <img src={item.image_url} alt={item.caption} style={{width:'100%',height:110,objectFit:'cover',display:'block'}}/>
                          <div style={{padding:'0.3rem',fontSize:'0.68rem',color:'#6a6a6a',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.caption}</div>
                          <button style={A.btnR} onClick={()=>doDeleteGal(item.id)}>Remove</button>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── POSTS ── */}
            {sec==='posts'&&(
              <div>
                <div style={A.title}>POSTS & UPDATES</div>
                <form onSubmit={doPublishPost} style={A.formBox}>
                  <Fg label="Title *"><input className="input" required value={postForm.title} onChange={e=>setPostForm({...postForm,title:e.target.value})} placeholder="Post title"/></Fg>
                  <Fg label="Content *"><textarea className="input" rows={5} required value={postForm.content} onChange={e=>setPostForm({...postForm,content:e.target.value})} placeholder="Write your update, announcement or news..." style={{resize:'vertical'}}/></Fg>

                  <Fg label="Attach Photo or Video (optional)">
                    <div style={{display:'flex',gap:'0.7rem',alignItems:'center',flexWrap:'wrap',marginBottom:'0.6rem'}}>
                      <button type="button" style={A.btn} onClick={()=>document.getElementById('postMediaIn').click()}>
                        📎 Attach Media
                      </button>
                      {postMedia&&<span style={{fontSize:'0.75rem',color:'#6dc86d'}}>✓ {postMedia.name}</span>}
                      {postMedia&&<button type="button" style={A.btnR} onClick={()=>{setPostMedia(null);setPostMediaPrev(null)}}>Remove</button>}
                      <input type="file" id="postMediaIn" accept="image/*,video/*" style={{display:'none'}} onChange={handlePostMedia}/>
                    </div>
                    {postMediaPrev&&postMediaPrev.type==='image'&&<img src={postMediaPrev.src} alt="preview" style={{maxHeight:160,maxWidth:'100%',border:'1px solid rgba(200,162,50,0.3)',display:'block'}}/>}
                    {postMediaPrev&&postMediaPrev.type==='video'&&<video src={postMediaPrev.src} controls style={{maxHeight:160,maxWidth:'100%',border:'1px solid rgba(200,162,50,0.3)',display:'block'}}/>}
                  </Fg>
                  <button className="btn-primary" type="submit" disabled={postLoading}>{postLoading?'Publishing...':'Publish Post'}</button>
                </form>

                {posts.length>0&&(
                  <>
                    <div style={{...A.secT,marginTop:'2rem'}}>Published Posts ({posts.length})</div>
                    {posts.map(p=>(
                      <div key={p.id} style={{padding:'1rem',border:'1px solid rgba(255,255,255,0.07)',marginBottom:'0.75rem',display:'flex',justifyContent:'space-between',gap:'1rem',alignItems:'flex-start'}}>
                        <div style={{flex:1}}>
                          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:'1.25rem',marginBottom:'0.2rem'}}>{p.title}</div>
                          <div style={{fontFamily:'monospace',fontSize:'0.6rem',color:'#6a6a6a',marginBottom:'0.4rem'}}>{new Date(p.created_at).toLocaleDateString()}</div>
                          <div style={{fontSize:'0.83rem',color:'rgba(255,255,255,0.65)',lineHeight:1.55}}>{p.content}</div>
                          {p.media_url&&p.media_type==='image'&&<img src={p.media_url} alt={p.title} style={{maxHeight:120,marginTop:'0.6rem',display:'block'}}/>}
                          {p.media_url&&p.media_type==='video'&&<video src={p.media_url} controls style={{maxHeight:120,marginTop:'0.6rem',display:'block'}}/>}
                        </div>
                        <button style={A.btnR} onClick={()=>doDeletePost(p.id)}>Delete</button>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}

            {/* ── TIMETABLE ── */}
            {sec==='schedule'&&(
              <div>
                <div style={A.title}>TIMETABLE</div>
                <div style={{display:'flex',gap:'0.8rem',marginBottom:'1rem',flexWrap:'wrap'}}>
                  <button className="btn-primary" onClick={()=>setShowAddTT(!showAddTT)}>
                    {showAddTT?'Cancel':'+ Add New Session'}
                  </button>
                </div>

                {showAddTT&&(
                  <form onSubmit={doAddTT} style={A.formBox}>
                    <div style={A.secT}>New Session</div>
                    <div style={A.frow}>
                      <Fg label="Day"><select className="input" value={newTT.day} onChange={e=>setNewTT({...newTT,day:e.target.value})}>{DAYS.map(d=><option key={d}>{d}</option>)}</select></Fg>
                      <Fg label="Time *"><input className="input" required value={newTT.time} onChange={e=>setNewTT({...newTT,time:e.target.value})} placeholder="e.g. 4:00–6:00 PM"/></Fg>
                    </div>
                    <div style={A.frow}>
                      <Fg label="Session Name *"><input className="input" required value={newTT.session_name} onChange={e=>setNewTT({...newTT,session_name:e.target.value})} placeholder="e.g. General Training"/></Fg>
                      <Fg label="Session Type"><select className="input" value={newTT.session_type} onChange={e=>setNewTT({...newTT,session_type:e.target.value})}>{STYPES.map(t=><option key={t}>{t}</option>)}</select></Fg>
                    </div>
                    <Fg label="Notes (optional)"><input className="input" value={newTT.notes} onChange={e=>setNewTT({...newTT,notes:e.target.value})} placeholder="e.g. Bring your own board"/></Fg>
                    <button className="btn-primary" type="submit">Save Session</button>
                  </form>
                )}

                {tt.length===0
                  ? <div style={A.emptyBox}>No sessions yet. Click "+ Add New Session" to build your timetable.</div>
                  : (
                    <div style={{overflowX:'auto'}}>
                      <table style={A.tbl}>
                        <thead><tr>{['Day','Time','Session','Type','Notes','Actions'].map(h=><th key={h} style={A.th}>{h}</th>)}</tr></thead>
                        <tbody>
                          {tt.map(t=>(
                            <tr key={t.id}>
                              {editTT?.id===t.id?(
                                <>
                                  <td style={A.td}><select className="input" style={{width:115}} value={editTT.day} onChange={e=>setEditTT({...editTT,day:e.target.value})}>{DAYS.map(d=><option key={d}>{d}</option>)}</select></td>
                                  <td style={A.td}><input className="input" style={{width:130}} value={editTT.time} onChange={e=>setEditTT({...editTT,time:e.target.value})}/></td>
                                  <td style={A.td}><input className="input" style={{width:150}} value={editTT.session_name} onChange={e=>setEditTT({...editTT,session_name:e.target.value})}/></td>
                                  <td style={A.td}><select className="input" style={{width:125}} value={editTT.session_type} onChange={e=>setEditTT({...editTT,session_type:e.target.value})}>{STYPES.map(st=><option key={st}>{st}</option>)}</select></td>
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
                  )
                }
              </div>
            )}

            {/* ── TEAM PROFILES ── */}
            {sec==='teamprofiles'&&(
              <div>
                <div style={A.title}>TEAM PROFILES</div>
                <p style={A.subP}>Click "Edit" on any member to update their photo, stance, level, trick, idol, bio and more.</p>
                <div style={{overflowX:'auto'}}>
                  <table style={A.tbl}>
                    <thead><tr>{['Photo','Name','Age','Category','Stance','Level','Trick','Idol','Visible','Actions'].map(h=><th key={h} style={A.th}>{h}</th>)}</tr></thead>
                    <tbody>
                      {members.map(m=>(
                        <tr key={m.id}>
                          <td style={A.td}>
                            <div style={{width:38,height:38,background:'#5c1212',overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Bebas Neue',sans-serif",fontSize:'0.85rem',color:'#c8a232'}}>
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
                            <button style={A.btnG} onClick={()=>setEditM(m)}>Edit Profile</button>
                            <button style={A.btn}  onClick={()=>doToggleVisible(m.id,m.is_visible)}>{m.is_visible?'Hide':'Show'}</button>
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

// Small helper component
function Fg({ label, children }) {
  return (
    <div style={{marginBottom:'0.85rem'}}>
      <label className="label">{label}</label>
      {children}
    </div>
  )
}

function EditMemberModal({ m, onSave, onClose, onPhoto, calcAge }) {
  const [f, setF] = useState({
    full_name: m.full_name||'',
    date_of_birth: m.date_of_birth||'',
    gender: m.gender||'Male',
    category: m.category||'Student',
    stance: m.stance||'Regular',
    level: m.level||'Beginner',
    favourite_trick: m.favourite_trick||'',
    idol_skater: m.idol_skater||'',
    bio: m.bio||'',
    role: m.role||'Member',
    is_visible: m.is_visible!==false,
  })
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPrev, setPhotoPrev] = useState(m.photo_url||null)
  const init = m.full_name?.split(' ').map(w=>w[0]).join('').slice(0,2)

  function handlePhoto(e) {
    const file = e.target.files[0]
    if(!file) return
    setPhotoFile(file)
    const reader = new FileReader()
    reader.onload = ev => setPhotoPrev(ev.target.result)
    reader.readAsDataURL(file)
  }

  function save() {
    onSave(m.id, { ...f, student: f.category==='Student', working: f.category==='Working' })
    if (photoFile) onPhoto(m.id, photoFile)
  }

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.92)',zIndex:500,display:'flex',alignItems:'center',justifyContent:'center',padding:'1rem'}}>
      <div style={{background:'#161616',border:'1px solid rgba(200,162,50,0.35)',padding:'2rem',width:600,maxWidth:'96vw',maxHeight:'93vh',overflowY:'auto',position:'relative'}}>
        <button onClick={onClose} style={{position:'absolute',top:'0.75rem',right:'0.85rem',background:'none',border:'none',color:'#6a6a6a',fontSize:'1.6rem',cursor:'pointer',lineHeight:1}}>×</button>
        <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:'1.8rem',marginBottom:'1.4rem',color:'#f0e8d0'}}>✏️ Edit: {m.full_name}</div>

        <div style={{display:'grid',gridTemplateColumns:'140px 1fr',gap:'1.5rem',marginBottom:'1.3rem'}}>
          <div>
            <div style={{width:135,height:135,background:'#5c1212',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Bebas Neue',sans-serif",fontSize:'2.8rem',color:'#c8a232',overflow:'hidden',position:'relative',marginBottom:'0.6rem'}}>
              {photoPrev
                ? <img src={photoPrev} alt={m.full_name} style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover'}}/>
                : init
              }
            </div>
            <button style={{...A.btn,width:135,textAlign:'center',display:'block'}} onClick={()=>document.getElementById('pmPhIn').click()}>
              📷 Upload Photo
            </button>
            <input type="file" id="pmPhIn" accept="image/*" style={{display:'none'}} onChange={handlePhoto}/>
            {photoFile&&<div style={{fontSize:'0.68rem',color:'#6dc86d',marginTop:'0.4rem',wordBreak:'break-all'}}>✓ {photoFile.name}</div>}
          </div>
          <div>
            <Fg label="Full Name"><input className="input" value={f.full_name} onChange={e=>setF({...f,full_name:e.target.value})}/></Fg>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.6rem',marginBottom:'0.85rem'}}>
              <div>
                <label className="label">Date of Birth</label>
                <input className="input" type="date" value={f.date_of_birth} onChange={e=>setF({...f,date_of_birth:e.target.value})}/>
              </div>
              <div>
                <label className="label">Age (auto)</label>
                <div style={{...A.gold,paddingTop:'0.65rem',fontSize:'1rem'}}>{f.date_of_birth?calcAge(f.date_of_birth)+'y':'—'}</div>
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.6rem'}}>
              <Fg label="Gender"><select className="input" value={f.gender} onChange={e=>setF({...f,gender:e.target.value})}><option>Male</option><option>Female</option><option>Other</option></select></Fg>
              <Fg label="Category"><select className="input" value={f.category} onChange={e=>setF({...f,category:e.target.value})}>{CATS.map(c=><option key={c}>{c}</option>)}</select></Fg>
            </div>
          </div>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'0.85rem'}}>
          <Fg label="Skating Stance"><select className="input" value={f.stance} onChange={e=>setF({...f,stance:e.target.value})}>{STANCES.map(s=><option key={s}>{s}</option>)}</select></Fg>
          <Fg label="Skating Level"><select className="input" value={f.level} onChange={e=>setF({...f,level:e.target.value})}>{LEVELS.map(l=><option key={l}>{l}</option>)}</select></Fg>
        </div>
        <Fg label="Favourite Trick"><input className="input" value={f.favourite_trick} onChange={e=>setF({...f,favourite_trick:e.target.value})} placeholder="e.g. Kickflip, Ollie, Heelflip..."/></Fg>
        <Fg label="Idol Skater"><input className="input" value={f.idol_skater} onChange={e=>setF({...f,idol_skater:e.target.value})} placeholder="e.g. Tony Hawk, Nyjah Huston..."/></Fg>
        <Fg label="Bio / About"><textarea className="input" rows={3} value={f.bio} onChange={e=>setF({...f,bio:e.target.value})} placeholder="Short bio about this skater..." style={{resize:'vertical'}}/></Fg>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'1.2rem'}}>
          <Fg label="Role"><select className="input" value={f.role} onChange={e=>setF({...f,role:e.target.value})}>{ROLES.map(r=><option key={r}>{r}</option>)}</select></Fg>
          <Fg label="Visible on Team Page"><select className="input" value={f.is_visible?'Yes':'No'} onChange={e=>setF({...f,is_visible:e.target.value==='Yes'})}><option>Yes</option><option>No</option></select></Fg>
        </div>
        <div style={{display:'flex',gap:'0.7rem'}}>
          <button className="btn-primary" onClick={save}>💾 Save Profile</button>
          <button className="btn-outline" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

const A = {
  bar:     {background:'#5c1212',padding:'0.4rem 1.4rem',fontFamily:"'Space Mono',monospace",fontSize:'0.62rem',letterSpacing:'0.07em',color:'#f0e8d0',display:'flex',alignItems:'center',justifyContent:'space-between',borderBottom:'1px solid rgba(200,162,50,0.28)'},
  layout:  {display:'grid',gridTemplateColumns:'195px 1fr',minHeight:'calc(100vh - 5rem)'},
  side:    {background:'#0f0f0f',borderRight:'1px solid rgba(255,255,255,0.05)',padding:'1rem'},
  ni:      {display:'block',width:'100%',background:'none',border:'none',color:'rgba(255,255,255,0.5)',fontFamily:"'Space Mono',monospace",fontSize:'0.6rem',letterSpacing:'0.06em',textTransform:'uppercase',textAlign:'left',padding:'0.62rem 0.7rem',cursor:'pointer',marginBottom:'0.1rem',borderRadius:2},
  niOn:    {color:'#c8a232',background:'rgba(200,162,50,0.08)',borderLeft:'2px solid #c8a232'},
  main:    {padding:'1.8rem',overflowX:'auto'},
  title:   {fontFamily:"'Bebas Neue',sans-serif",fontSize:'2.2rem',marginBottom:'1.6rem',color:'#f0e8d0'},
  secT:    {fontFamily:"'Bebas Neue',sans-serif",fontSize:'1.4rem',marginBottom:'0.9rem',color:'#fafafa'},
  subP:    {color:'#6a6a6a',fontSize:'0.87rem',marginBottom:'1rem'},
  cards:   {display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(110px,1fr))',gap:'0.75rem',marginBottom:'1.8rem'},
  card:    {background:'#202020',padding:'0.9rem',borderLeft:'3px solid #c8a232'},
  cardN:   {fontFamily:"'Bebas Neue',sans-serif",fontSize:'2rem',color:'#c8a232'},
  cardL:   {fontFamily:"'Space Mono',monospace",fontSize:'0.57rem',letterSpacing:'0.1em',color:'#6a6a6a',textTransform:'uppercase',marginTop:'0.18rem'},
  badge:   {display:'inline-block',background:'rgba(200,162,50,0.25)',color:'#c8a232',fontFamily:"'Space Mono',monospace",fontSize:'0.58rem',padding:'0.12rem 0.45rem',marginLeft:'0.4rem',borderRadius:2},
  formBox: {background:'#181818',border:'1px solid rgba(255,255,255,0.06)',padding:'1.4rem',marginBottom:'1.5rem'},
  tbl:     {width:'100%',borderCollapse:'collapse'},
  th:      {fontFamily:"'Space Mono',monospace",fontSize:'0.58rem',letterSpacing:'0.1em',textTransform:'uppercase',color:'#6a6a6a',padding:'0.65rem 0.75rem',borderBottom:'1px solid rgba(255,255,255,0.065)',textAlign:'left',whiteSpace:'nowrap'},
  td:      {padding:'0.65rem 0.75rem',borderBottom:'1px solid rgba(255,255,255,0.038)',fontSize:'0.82rem',color:'rgba(255,255,255,0.76)',verticalAlign:'middle'},
  btn:     {background:'none',border:'1px solid rgba(255,255,255,0.15)',color:'rgba(255,255,255,0.6)',fontFamily:"'Space Mono',monospace",fontSize:'0.57rem',padding:'0.28rem 0.55rem',cursor:'pointer',marginRight:'0.25rem'},
  btnG:    {background:'rgba(109,200,109,0.1)',border:'1px solid rgba(109,200,109,0.4)',color:'#6dc86d',fontFamily:"'Space Mono',monospace",fontSize:'0.57rem',padding:'0.28rem 0.55rem',cursor:'pointer',marginRight:'0.25rem'},
  btnR:    {background:'rgba(220,80,80,0.08)',border:'1px solid rgba(220,80,80,0.3)',color:'#e06060',fontFamily:"'Space Mono',monospace",fontSize:'0.57rem',padding:'0.28rem 0.55rem',cursor:'pointer',marginRight:'0.25rem'},
  catB:    {display:'inline-block',padding:'0.16rem 0.45rem',fontFamily:"'Space Mono',monospace",fontSize:'0.55rem',letterSpacing:'0.05em'},
  gold:    {fontFamily:"'Space Mono',monospace",fontSize:'0.76rem',color:'#c8a232'},
  mono:    {fontFamily:'monospace',fontSize:'0.78rem'},
  ok:      {color:'#6dc86d',fontFamily:"'Space Mono',monospace",fontSize:'0.6rem'},
  pend:    {color:'#c8a232',fontFamily:"'Space Mono',monospace",fontSize:'0.6rem'},
  dec:     {color:'#e06060',fontFamily:"'Space Mono',monospace",fontSize:'0.6rem'},
  ageDisp: {fontFamily:"'Space Mono',monospace",fontSize:'0.75rem',color:'#c8a232',marginTop:'0.3rem'},
  uploadZone:{border:'2px dashed rgba(200,162,50,0.3)',padding:'2rem',textAlign:'center',cursor:'pointer',marginBottom:'1rem',background:'rgba(255,255,255,0.02)'},
  frow:    {display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem'},
  emptyBox:{background:'rgba(255,255,255,0.03)',border:'1px dashed rgba(255,255,255,0.1)',padding:'1.5rem',textAlign:'center',color:'#6a6a6a',fontSize:'0.87rem',fontFamily:"'Space Mono',monospace"},
}
