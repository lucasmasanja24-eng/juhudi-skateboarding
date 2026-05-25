import { useEffect, useState } from 'react'
import Link from 'next/link'
import Nav from '../components/Nav'
import { getTimetable } from '../lib/supabase'

const DEFAULT = [
  {id:1,day:'Monday',   time:'4:00–6:00 PM',    session_name:'General Training', session_type:'All Levels',  notes:'Tricks, basics, free skate'},
  {id:2,day:'Wednesday',time:'4:00–6:00 PM',    session_name:'Skills Workshop',  session_type:'Intermediate',notes:'Focused technique session'},
  {id:3,day:'Friday',   time:'4:00–7:00 PM',    session_name:'Friday Session',   session_type:'All Levels',  notes:'Extended + filming'},
  {id:4,day:'Saturday', time:'8:00–10:00 AM',   session_name:'Girls Session',    session_type:'Girls Only',  notes:'Safe dedicated space for girls'},
  {id:5,day:'Saturday', time:'2:00–5:00 PM',    session_name:'Community Jam',    session_type:'All Welcome', notes:'Open community session'},
  {id:6,day:'Sunday',   time:'10:00 AM–1:00 PM',session_name:'Private Classes',  session_type:'By Booking',  notes:null},
]

const TYPE_COLORS = {
  'All Levels':  {background:'rgba(100,200,100,0.12)',color:'#6dc86d'},
  'All Welcome': {background:'rgba(100,200,100,0.12)',color:'#6dc86d'},
  'Intermediate':{background:'rgba(200,162,50,0.12)', color:'#c8a232'},
  'Advanced':    {background:'rgba(200,162,50,0.12)', color:'#c8a232'},
  'By Booking':  {background:'rgba(200,162,50,0.12)', color:'#c8a232'},
  'Girls Only':  {background:'rgba(200,100,200,0.12)',color:'#d090d0'},
  'Beginners':   {background:'rgba(100,180,255,0.12)',color:'#60b0ff'},
}

export default function Schedule({ session, profile }) {
  const [timetable, setTimetable] = useState([])
  useEffect(() => { getTimetable().then(d=>setTimetable(d||[])).catch(()=>{}) }, [])
  const sessions = timetable.length > 0 ? timetable : DEFAULT

  return (
    <>
      <Nav session={session} profile={profile}/>
      <div style={S.page}>
        <div style={S.inner}>
          <div className="section-label">Training &amp; Events</div>
          <h1 className="section-title">WEEKLY SCHEDULE</h1>
          <div className="divider"/>
          <p style={S.loc}>📍 Juhudi Secondary School Basketball Court, Gongo la Mboto</p>

          <div style={{overflowX:'auto'}}>
            <table style={S.tbl}>
              <thead><tr>{['Day','Time','Session','Level','Notes'].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
              <tbody>
                {sessions.map(s=>(
                  <tr key={s.id}>
                    <td style={S.td}>{s.day}</td>
                    <td style={S.td}>{s.time}</td>
                    <td style={S.td}>{s.session_name}</td>
                    <td style={S.td}><span style={{...S.badge,...(TYPE_COLORS[s.session_type]||{})}}>{s.session_type}</span></td>
                    <td style={S.td}>{s.notes||<Link href="/booking" style={S.bookBtn}>Book Now</Link>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{marginTop:'3rem'}}>
            <div className="section-label">Events</div>
            <h2 style={S.evTitle}>UPCOMING</h2>
            {[{day:'15',month:'MAY',title:'Community Skate Jam',desc:'Open to all skill levels. Music, tricks, good vibes at Juhudi Secondary Court.'},
              {day:'01',month:'JUN',title:'Photography Workshop',desc:'Learn skate photography and filming. Run by community volunteers.'}
            ].map(ev=>(
              <div key={ev.title} style={S.evCard}>
                <div style={{textAlign:'center'}}>
                  <div style={S.evDay}>{ev.day}</div>
                  <div style={S.evMon}>{ev.month}</div>
                </div>
                <div>
                  <div style={S.evTitle2}>{ev.title}</div>
                  <div style={S.evDesc}>{ev.desc}</div>
                  <span style={{...S.badge,background:'rgba(230,90,30,0.12)',color:'#e0602a',marginTop:'0.4rem',display:'inline-block'}}>UPCOMING</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

const S = {
  page:   {padding:'5rem 1.4rem 3rem'},
  inner:  {maxWidth:1040,margin:'0 auto'},
  loc:    {color:'#6a6a6a',marginBottom:'0.5rem',fontSize:'0.82rem',fontFamily:"'Space Mono',monospace"},
  tbl:    {width:'100%',borderCollapse:'collapse',marginTop:'1.3rem'},
  th:     {fontFamily:"'Space Mono',monospace",fontSize:'0.6rem',letterSpacing:'0.1em',textTransform:'uppercase',color:'#c8a232',padding:'0.65rem 0.85rem',borderBottom:'1px solid rgba(200,162,50,0.22)',textAlign:'left'},
  td:     {padding:'0.8rem 0.85rem',borderBottom:'1px solid rgba(255,255,255,0.05)',fontSize:'0.86rem',color:'rgba(255,255,255,0.78)'},
  badge:  {display:'inline-block',padding:'0.18rem 0.5rem',fontFamily:"'Space Mono',monospace",fontSize:'0.56rem',letterSpacing:'0.05em'},
  bookBtn:{background:'#c8a232',color:'#090909',fontFamily:"'Space Mono',monospace",fontSize:'0.56rem',padding:'0.26rem 0.6rem',textDecoration:'none',fontWeight:700},
  evTitle:{fontFamily:"'Bebas Neue',sans-serif",fontSize:'2rem',marginBottom:'1rem'},
  evCard: {display:'grid',gridTemplateColumns:'65px 1fr',gap:'1.1rem',padding:'1.1rem',border:'1px solid rgba(200,162,50,0.18)',alignItems:'center',marginBottom:'0.8rem'},
  evDay:  {fontFamily:"'Bebas Neue',sans-serif",fontSize:'2.2rem',color:'#c8a232',lineHeight:1},
  evMon:  {fontFamily:"'Space Mono',monospace",fontSize:'0.58rem',color:'#6a6a6a',letterSpacing:'0.1em'},
  evTitle2:{fontFamily:"'Bebas Neue',sans-serif",fontSize:'1.3rem',marginBottom:'0.2rem'},
  evDesc: {fontSize:'0.82rem',color:'#6a6a6a'},
}
