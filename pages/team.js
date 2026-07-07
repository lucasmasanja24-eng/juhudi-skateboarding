import { useEffect, useState } from 'react'
import Nav from '../components/Nav'
import { getApprovedMembers } from '../lib/supabase'

function calcAge(dob) {
  if (!dob) return null
  const d = new Date(dob), n = new Date()
  let a = n.getFullYear() - d.getFullYear()
  if (n.getMonth()-d.getMonth()<0||(n.getMonth()===d.getMonth()&&n.getDate()<d.getDate())) a--
  return a
}

const ROLE_ORDER = {
  'Founder':1,'Coach':2,'Captain':3,'Member':4,
  'Student':4,'Working':5,'Volunteer':6,
  'Parent / Guardian':7,'Sponsor':8,'Other':9,
}

const SECTIONS = [
  { key:'leadership', label:'Leadership',           roles:['Founder','Coach','Captain'] },
  { key:'skaters',    label:'Active Skaters',        roles:['Member'] },
  { key:'community',  label:'Community',             roles:['Student','Working','Volunteer','Other'] },
  { key:'supporters', label:'Parents & Supporters',  roles:['Parent / Guardian','Sponsor'] },
]

// Force fresh image — never serve stale cached photo
function freshImg(url) {
  if (!url) return null
  // If URL already has our version param, strip it and add fresh one
  const base = url.split('?')[0]
  return `${base}?v=${Date.now()}`
}

export default function Team({ session, profile }) {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  // Track image errors to show initials as fallback
  const [imgErrors, setImgErrors] = useState({})

  useEffect(() => {
    getApprovedMembers()
      .then(d => {
        const sorted = (d||[]).sort((a,b) => {
          const ao = ROLE_ORDER[a.role] || ROLE_ORDER[a.category] || 9
          const bo = ROLE_ORDER[b.role] || ROLE_ORDER[b.category] || 9
          if (ao !== bo) return ao - bo
          return (a.full_name||'').localeCompare(b.full_name||'')
        })
        setMembers(sorted)
      })
      .catch(()=>{})
      .finally(()=>setLoading(false))
  }, [])

  function getMembersForSection(section) {
    return members.filter(m => {
      const role = m.role || 'Member'
      const cat  = m.category || 'Student'
      return section.roles.includes(role) || section.roles.includes(cat)
    })
  }

  function handleImgError(id) {
    setImgErrors(prev => ({...prev, [id]: true}))
  }

  function MemberCard({ m }) {
    const age    = calcAge(m.date_of_birth)
    const init   = m.full_name?.split(' ').map(w=>w[0]).join('').slice(0,2)
    const isLead = ['Founder','Coach','Captain'].includes(m.role)
    const imgSrc = m.photo_url && !imgErrors[m.id] ? freshImg(m.photo_url) : null

    return (
      <div style={{...S.card,...(isLead?S.cardLead:{})}}>
        <div style={{...S.avatar,...(isLead?S.avatarLead:{})}}>
          <div style={S.pat}/>
          {imgSrc ? (
            <img
              src={imgSrc}
              alt={m.full_name}
              style={S.avatarImg}
              onError={()=>handleImgError(m.id)}
            />
          ) : (
            <span style={{...S.init,...(isLead?{fontSize:'2.8rem',color:'#c8a232'}:{})}}>{init}</span>
          )}
          {isLead && (
            <div style={S.ribbon}>
              <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:'0.75rem',letterSpacing:'0.08em'}}>{m.role}</span>
            </div>
          )}
        </div>
        <div style={S.info}>
          <div style={{...S.name,...(isLead?{color:'#f0e8d0',fontSize:'0.95rem'}:{})}}>{m.full_name}</div>
          {age && <div style={S.meta}>Age {age} · {m.gender}</div>}
          {m.school && <div style={S.school}>🏫 {m.school}{m.grade?` · ${m.grade}`:''}</div>}
          <div style={S.badges}>
            {m.role && m.role!=='Member' && (
              <span style={{...S.badge,background:'rgba(200,162,50,0.2)',color:'#c8a232'}}>{m.role.toUpperCase()}</span>
            )}
            {m.category==='Parent / Guardian' && (
              <span style={{...S.badge,background:'rgba(200,100,200,0.12)',color:'#d090d0'}}>PARENT</span>
            )}
            {m.category==='Sponsor' && (
              <span style={{...S.badge,background:'rgba(100,200,100,0.12)',color:'#6dc86d'}}>SPONSOR</span>
            )}
            {m.gender==='Female' && (
              <span style={{...S.badge,background:'rgba(200,100,200,0.1)',color:'#d090d0'}}>GIRL SKATER</span>
            )}
          </div>
          {(m.stance||m.level) && !['Parent / Guardian','Sponsor'].includes(m.category) && (
            <div style={S.level}>{[m.stance,m.level].filter(Boolean).join(' · ')}</div>
          )}
          {m.favourite_trick && <div style={S.extra}>⚡ {m.favourite_trick}</div>}
          {m.idol_skater     && <div style={S.extra}>🌟 {m.idol_skater}</div>}
          {m.bio             && <div style={S.bio}>{m.bio}</div>}
        </div>
      </div>
    )
  }

  if (loading) return (
    <>
      <Nav session={session} profile={profile}/>
      <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Space Mono',monospace",fontSize:'0.75rem',color:'#c8a232',letterSpacing:'0.2em',paddingTop:'3.3rem'}}>
        LOADING TEAM...
      </div>
    </>
  )

  return (
    <>
      <Nav session={session} profile={profile}/>
      <div style={S.page}>
        <div style={S.inner}>
          <div className="section-label">The Crew</div>
          <h1 className="section-title">MEET THE TEAM</h1>
          <div className="divider"/>
          <p style={S.sub}>{members.length} riders, supporters, parents and coaches — one Juhudi family.</p>

          {members.length===0 ? (
            <div style={{textAlign:'center',padding:'3rem',color:'#6a6a6a',fontFamily:"'Space Mono',monospace",fontSize:'0.75rem'}}>
              No team members yet. Be the first to join!
            </div>
          ) : (
            SECTIONS.map(section => {
              const sm = getMembersForSection(section)
              if (sm.length===0) return null
              return (
                <div key={section.key} style={S.section}>
                  <div style={S.secHeader}>
                    <div style={S.secLine}/>
                    <div style={S.secLabel}>{section.label}</div>
                    <div style={S.secLine}/>
                    <div style={S.secCount}>{sm.length}</div>
                  </div>
                  <div style={section.key==='leadership' ? S.gridLead : S.grid}>
                    {sm.map(m=><MemberCard key={m.id} m={m}/>)}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </>
  )
}

const S = {
  page:      {padding:'5rem 1.4rem 3rem'},
  inner:     {maxWidth:1060,margin:'0 auto'},
  sub:       {color:'#6a6a6a',marginBottom:'1.8rem',fontSize:'0.87rem'},
  section:   {marginBottom:'3rem'},
  secHeader: {display:'flex',alignItems:'center',gap:'1rem',marginBottom:'1.5rem'},
  secLine:   {flex:1,height:1,background:'rgba(200,162,50,0.2)'},
  secLabel:  {fontFamily:"'Bebas Neue',sans-serif",fontSize:'1.3rem',color:'#c8a232',whiteSpace:'nowrap',letterSpacing:'0.05em'},
  secCount:  {fontFamily:"'Space Mono',monospace",fontSize:'0.6rem',color:'#6a6a6a',background:'rgba(200,162,50,0.1)',padding:'0.2rem 0.5rem'},
  gridLead:  {display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:'1.2rem'},
  grid:      {display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:'1rem'},
  card:      {background:'#202020',overflow:'hidden'},
  cardLead:  {background:'linear-gradient(135deg,#1a1208,#202020)',border:'1px solid rgba(200,162,50,0.25)'},
  avatar:    {height:145,display:'flex',alignItems:'center',justifyContent:'center',background:'#5c1212',position:'relative',overflow:'hidden'},
  avatarLead:{height:185},
  pat:       {position:'absolute',inset:0,opacity:0.06,backgroundImage:'repeating-linear-gradient(45deg,#c8a232 0,#c8a232 1px,transparent 0,transparent 16px)',backgroundSize:'16px 16px'},
  avatarImg: {position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',zIndex:1},
  init:      {position:'relative',zIndex:1,fontFamily:"'Bebas Neue',sans-serif",fontSize:'2.2rem',color:'rgba(200,162,50,0.6)'},
  ribbon:    {position:'absolute',bottom:0,left:0,right:0,background:'rgba(200,162,50,0.85)',color:'#090909',textAlign:'center',padding:'0.3rem 0.5rem',zIndex:2},
  info:      {padding:'0.8rem 0.9rem'},
  name:      {fontWeight:700,fontSize:'0.88rem',marginBottom:'0.12rem',color:'#fafafa'},
  meta:      {fontSize:'0.68rem',color:'#6a6a6a',fontFamily:"'Space Mono',monospace",marginBottom:'0.2rem'},
  school:    {fontSize:'0.7rem',color:'rgba(100,180,255,0.8)',marginBottom:'0.2rem'},
  badges:    {display:'flex',flexWrap:'wrap',gap:'0.18rem',margin:'0.28rem 0'},
  badge:     {display:'inline-block',padding:'0.16rem 0.42rem',fontFamily:"'Space Mono',monospace",fontSize:'0.56rem',letterSpacing:'0.05em'},
  level:     {fontSize:'0.7rem',color:'rgba(255,255,255,0.45)',fontStyle:'italic',marginTop:'0.2rem'},
  extra:     {fontSize:'0.7rem',color:'#6a6a6a',marginTop:'0.12rem'},
  bio:       {fontSize:'0.72rem',color:'rgba(255,255,255,0.5)',marginTop:'0.35rem',lineHeight:1.4},
}
