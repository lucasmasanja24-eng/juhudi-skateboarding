import { useState } from 'react'
import { useRouter } from 'next/router'
import Nav from '../components/Nav'
import { signIn, signUp } from '../lib/supabase'

const CATS = ['Student','Working','Parent / Guardian','Sponsor','Volunteer','Coach','Other']
const RELS = ['Parent','Guardian','Teacher','Sibling','Colleague','Friend','Other']

export default function Login({ session, profile }) {
  const router = useRouter()
  const [tab, setTab]       = useState('login')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg]       = useState('')
  const [err, setErr]       = useState('')
  const [li, setLi]         = useState({ email:'', password:'' })
  const [su, setSu]         = useState({
    fullName:'', dob:'', gender:'Male', category:'Student',
    school:'', grade:'',
    emergencyName:'', emergencyRelationship:'Parent', emergencyPhone:'',
    email:'', password:''
  })

  async function doLogin(e) {
    e.preventDefault(); setLoading(true); setErr('')
    try { await signIn(li); router.push('/') }
    catch(e){ setErr(e.message) }
    setLoading(false)
  }

  async function doSignup(e) {
    e.preventDefault(); setLoading(true); setErr('')
    if(!su.emergencyName||!su.emergencyPhone){
      setErr('Emergency contact name and phone are required.')
      setLoading(false); return
    }
    try {
      await signUp(su)
      setMsg('Request sent! Admin will review and approve your account. You will be able to log in once approved.')
      setTab('login')
    } catch(e){ setErr(e.message) }
    setLoading(false)
  }

  return (
    <>
      <Nav session={session} profile={profile}/>
      <div style={S.page}>
        <div style={S.card}>
          <div style={{textAlign:'center',marginBottom:'0.8rem'}}>
            <img src="/logo.jpg" alt="Juhudi" style={{width:70,height:70,borderRadius:'50%',objectFit:'cover',boxShadow:'0 0 0 3px rgba(200,162,50,0.5)'}}/>
          </div>
          <h1 style={S.title}>JUHUDI</h1>
          <p style={S.sub}>Join the movement</p>

          <div style={S.tabs}>
            <button onClick={()=>setTab('login')}  style={{...S.tab,...(tab==='login' ?S.tabOn:{})}}>Login</button>
            <button onClick={()=>setTab('signup')} style={{...S.tab,...(tab==='signup'?S.tabOn:{})}}>Sign Up</button>
          </div>

          {msg && <div style={S.ok}>{msg}</div>}
          {err && <div style={S.errBox}>{err}</div>}

          {tab==='login' ? (
            <form onSubmit={doLogin}>
              <Fg label="Email"><input className="input" type="email" required value={li.email} onChange={e=>setLi({...li,email:e.target.value})} placeholder="your@email.com"/></Fg>
              <Fg label="Password"><input className="input" type="password" required value={li.password} onChange={e=>setLi({...li,password:e.target.value})} placeholder="••••••••"/></Fg>
              <button className="btn-primary" type="submit" style={{width:'100%',marginTop:'0.5rem'}} disabled={loading}>{loading?'Logging in...':'Login'}</button>
            </form>
          ):(
            <form onSubmit={doSignup}>
              {/* SECTION: Personal Info */}
              <div style={S.sectionHead}>Personal Information</div>
              <Fg label="Full Name *"><input className="input" required value={su.fullName} onChange={e=>setSu({...su,fullName:e.target.value})} placeholder="Your full name"/></Fg>
              <div style={S.frow}>
                <Fg label="Date of Birth *"><input className="input" type="date" required value={su.dob} onChange={e=>setSu({...su,dob:e.target.value})}/></Fg>
                <Fg label="Gender"><select className="input" value={su.gender} onChange={e=>setSu({...su,gender:e.target.value})}><option>Male</option><option>Female</option><option>Other</option></select></Fg>
              </div>
              <Fg label="I am a..."><select className="input" value={su.category} onChange={e=>setSu({...su,category:e.target.value})}>{CATS.map(c=><option key={c}>{c}</option>)}</select></Fg>

              {/* SECTION: School Info (only if Student) */}
              {su.category==='Student' && (
                <>
                  <div style={S.sectionHead}>School Information</div>
                  <div style={S.frow}>
                    <Fg label="School Name *"><input className="input" required value={su.school} onChange={e=>setSu({...su,school:e.target.value})} placeholder="Name of your school"/></Fg>
                    <Fg label="Grade / Class *"><input className="input" required value={su.grade} onChange={e=>setSu({...su,grade:e.target.value})} placeholder="e.g. Form 3, Grade 8"/></Fg>
                  </div>
                </>
              )}

              {/* SECTION: Emergency Contact */}
              <div style={S.sectionHead}>Emergency Contact</div>
              <p style={S.sectionNote}>A person we can contact in case of an emergency. Can be a parent, guardian, teacher or colleague.</p>
              <Fg label="Contact Full Name *"><input className="input" required value={su.emergencyName} onChange={e=>setSu({...su,emergencyName:e.target.value})} placeholder="e.g. Mama Fatuma"/></Fg>
              <div style={S.frow}>
                <Fg label="Relationship *"><select className="input" value={su.emergencyRelationship} onChange={e=>setSu({...su,emergencyRelationship:e.target.value})}>{RELS.map(r=><option key={r}>{r}</option>)}</select></Fg>
                <Fg label="Phone / WhatsApp *"><input className="input" type="tel" required value={su.emergencyPhone} onChange={e=>setSu({...su,emergencyPhone:e.target.value})} placeholder="+255 ..."/></Fg>
              </div>

              {/* SECTION: Account */}
              <div style={S.sectionHead}>Account Details</div>
              <Fg label="Email *"><input className="input" type="email" required value={su.email} onChange={e=>setSu({...su,email:e.target.value})} placeholder="your@email.com"/></Fg>
              <Fg label="Password *"><input className="input" type="password" required minLength={6} value={su.password} onChange={e=>setSu({...su,password:e.target.value})} placeholder="Minimum 6 characters"/></Fg>

              <button className="btn-primary" type="submit" style={{width:'100%',marginTop:'0.5rem'}} disabled={loading}>{loading?'Submitting...':'Request Account'}</button>
              <p style={{fontSize:'0.72rem',color:'#6a6a6a',marginTop:'0.8rem',textAlign:'center'}}>Accounts require admin approval before access is granted</p>
            </form>
          )}
        </div>
      </div>
    </>
  )
}

function Fg({ label, children }) {
  return <div style={{marginBottom:'0.9rem'}}><label className="label">{label}</label>{children}</div>
}

const S = {
  page:        {minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',padding:'5rem 1rem 2rem',background:'#5c1212'},
  card:        {background:'#161616',border:'1px solid rgba(200,162,50,0.28)',padding:'2rem',width:440,maxWidth:'96vw'},
  title:       {fontFamily:"'Bebas Neue',sans-serif",fontSize:'2rem',color:'#f0e8d0',textAlign:'center',marginBottom:'0.2rem'},
  sub:         {fontSize:'0.82rem',color:'#6a6a6a',textAlign:'center',marginBottom:'1.6rem'},
  tabs:        {display:'flex',marginBottom:'1.6rem',borderBottom:'1px solid rgba(255,255,255,0.07)'},
  tab:         {background:'none',border:'none',color:'#6a6a6a',fontFamily:"'Space Mono',monospace",fontSize:'0.65rem',letterSpacing:'0.1em',textTransform:'uppercase',padding:'0.5rem 1rem 0.65rem',cursor:'pointer',borderBottom:'2px solid transparent',marginBottom:-1},
  tabOn:       {color:'#c8a232',borderBottomColor:'#c8a232'},
  frow:        {display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem'},
  sectionHead: {fontFamily:"'Bebas Neue',sans-serif",fontSize:'1.2rem',color:'#c8a232',marginTop:'1.2rem',marginBottom:'0.6rem',borderBottom:'1px solid rgba(200,162,50,0.2)',paddingBottom:'0.3rem'},
  sectionNote: {fontSize:'0.75rem',color:'#6a6a6a',marginBottom:'0.8rem',lineHeight:1.5},
  ok:          {background:'rgba(109,200,109,0.1)',border:'1px solid rgba(109,200,109,0.3)',color:'#6dc86d',padding:'0.8rem',fontSize:'0.82rem',marginBottom:'1rem',lineHeight:1.5},
  errBox:      {background:'rgba(220,80,80,0.1)',border:'1px solid rgba(220,80,80,0.3)',color:'#e06060',padding:'0.8rem',fontSize:'0.82rem',marginBottom:'1rem'},
}
