import { useState, useEffect } from 'react'
import Nav from '../components/Nav'
import { supabase } from '../lib/supabase'

const WHATSAPP_CHANNEL = 'https://whatsapp.com/channel/juhudiskateboarding'
const FOUNDER_WHATSAPP = 'https://wa.me/255621220443'
const FOUNDER_NUMBER   = '+255 621 220 443'

export default function Support({ session, profile }) {
  const [reviews, setReviews]   = useState([])
  const [form, setForm]         = useState({ name:'', email:'', type:'comment', rating:5, message:'' })
  const [loading, setLoading]   = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [err, setErr]           = useState('')

  useEffect(() => { loadReviews() }, [])

  async function loadReviews() {
    const { data } = await supabase.from('reviews').select('*').eq('is_approved',true).order('created_at',{ascending:false})
    setReviews(data||[])
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if(!form.name||!form.message){ setErr('Name and message are required.'); return }
    setLoading(true); setErr('')
    try {
      const { error } = await supabase.from('reviews').insert({
        name: form.name,
        email: form.email||null,
        type: form.type,
        rating: form.type==='review'?form.rating:null,
        message: form.message,
        is_approved: false,
      })
      if(error) throw error
      setSubmitted(true)
      setForm({ name:'', email:'', type:'comment', rating:5, message:'' })
    } catch(e){ setErr(e.message) }
    setLoading(false)
  }

  function stars(n) {
    return '★'.repeat(n)+'☆'.repeat(5-n)
  }

  const typeColors = {
    review:   {background:'rgba(200,162,50,0.12)',color:'#c8a232'},
    comment:  {background:'rgba(100,180,255,0.12)',color:'#60b0ff'},
    question: {background:'rgba(200,100,200,0.12)',color:'#d090d0'},
  }

  return (
    <>
      <Nav session={session} profile={profile}/>
      <div style={S.page}>
        <div style={S.inner}>

          {/* ── HEADER ── */}
          <div className="section-label">Get Involved</div>
          <h1 className="section-title">SUPPORT JUHUDI</h1>
          <div className="divider"/>

          {/* ── QUOTE ── */}
          <div style={S.hero}>
            <div style={S.quote}>"From 4 skateboards and a few kids to a community of 30+ young skaters — built on effort, support, and passion."</div>
            <p style={{color:'rgba(240,232,208,0.55)',fontSize:'0.86rem'}}>Help us build the future of skateboarding in Tanzania</p>
          </div>

          {/* ── WAYS TO SUPPORT ── */}
          <div style={S.ways}>
            <div style={S.way}><div style={S.wayIco}>💰</div><div style={S.wayT}>FINANCIAL</div><div style={S.wayD}>Fund equipment, events, maintenance, and the future skatepark dream in Dar es Salaam.</div></div>
            <div style={S.way}><div style={S.wayIco}>🛹</div><div style={S.wayT}>EQUIPMENT</div><div style={S.wayD}>Boards, trucks, wheels, helmets, pads — any skate gear helps a young rider get started.</div></div>
            <div style={S.way}><div style={S.wayIco}>🤝</div><div style={S.wayT}>SPONSORSHIP</div><div style={S.wayD}>Partner with Juhudi as a brand, organization, or individual sponsor.</div></div>
          </div>

          {/* ── CONTACT & DONATE ── */}
          <div style={S.contactBox}>
            <div className="section-label">Contact & Donate</div>
            <h2 style={S.contactH}>REACH OUT TO US</h2>

            <div style={S.contactGrid}>

              {/* Email */}
              <div style={S.contactCard}>
                <div style={S.contactIcon}>✉️</div>
                <div style={S.contactLabel}>Email</div>
                <a href="mailto:juhudiskateboarding@gmail.com" style={S.contactLink}>juhudiskateboarding@gmail.com</a>
                <div style={S.contactNote}>For sponsorships, partnerships and general inquiries</div>
              </div>

              {/* Founder WhatsApp */}
              <div style={S.contactCard}>
                <div style={S.contactIcon}>📱</div>
                <div style={S.contactLabel}>Founder — Lucas Masanja</div>
                <a href={FOUNDER_WHATSAPP} target="_blank" rel="noreferrer" style={S.contactLink}>{FOUNDER_NUMBER}</a>
                <div style={S.contactNote}>WhatsApp direct to the founder</div>
                <a href={FOUNDER_WHATSAPP} target="_blank" rel="noreferrer" style={S.waBtn}>
                  💬 Message on WhatsApp
                </a>
              </div>

              {/* WhatsApp Channel */}
              <div style={S.contactCard}>
                <div style={S.contactIcon}>📢</div>
                <div style={S.contactLabel}>WhatsApp Channel</div>
                <div style={S.contactNote}>Follow our official WhatsApp channel for updates, news and events from Juhudi Skateboarding</div>
                <a href={WHATSAPP_CHANNEL} target="_blank" rel="noreferrer" style={S.waBtn}>
                  📲 Join Our Channel
                </a>
              </div>

              {/* Financial Donation */}
              <div style={{...S.contactCard,borderColor:'rgba(200,162,50,0.4)'}}>
                <div style={S.contactIcon}>💳</div>
                <div style={S.contactLabel}>Financial Support</div>
                <div style={S.contactNote}>To send financial support from inside Tanzania, contact us directly via WhatsApp or email and we will send you payment details.</div>
                <div style={{...S.contactNote,marginTop:'0.5rem',color:'rgba(200,162,50,0.8)',fontFamily:"'Space Mono',monospace",fontSize:'0.65rem',letterSpacing:'0.05em'}}>
                  💡 International payment option (VISA) coming soon
                </div>
                <a href={FOUNDER_WHATSAPP} target="_blank" rel="noreferrer" style={S.waBtn}>
                  💬 Contact to Donate
                </a>
              </div>

            </div>

            {/* Social Links */}
            <div style={S.socials}>
              <a href="https://instagram.com/juhudiskateboarding" target="_blank" rel="noreferrer" style={S.socialBtn}>📸 @juhudiskateboarding</a>
              <a href="https://tiktok.com/@juhudi_skateboarding" target="_blank" rel="noreferrer" style={S.socialBtn}>🎵 @juhudi_skateboarding</a>
            </div>
          </div>

          {/* ── REVIEWS / COMMENTS / QUESTIONS ── */}
          <div style={S.reviewSection}>
            <div className="section-label">Community</div>
            <h2 style={S.reviewH}>REVIEWS, COMMENTS & QUESTIONS</h2>
            <p style={S.reviewSub}>Leave a review, share a comment, or ask us anything. We read every message.</p>

            {/* SUBMIT FORM */}
            <div style={S.formBox}>
              {submitted ? (
                <div style={S.ok}>
                  <div style={{fontSize:'1.5rem',marginBottom:'0.5rem'}}>🙏</div>
                  <strong>Thank you!</strong> Your message has been received. It will appear here once approved by our admin.
                  <button style={{...S.linkBtn,marginTop:'0.8rem',display:'block'}} onClick={()=>setSubmitted(false)}>Submit another message</button>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div style={S.formH}>Leave a Message</div>
                  {err && <div style={S.errBox}>{err}</div>}

                  <div style={S.frow}>
                    <div style={S.fg}><label className="label">Your Name *</label><input className="input" required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Your name"/></div>
                    <div style={S.fg}><label className="label">Email (optional)</label><input className="input" type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="your@email.com"/></div>
                  </div>

                  <div style={S.fg}>
                    <label className="label">Message Type</label>
                    <div style={{display:'flex',gap:'0.6rem',flexWrap:'wrap'}}>
                      {[['comment','💬 Comment'],['question','❓ Question'],['review','⭐ Review']].map(([v,l])=>(
                        <button key={v} type="button"
                          onClick={()=>setForm({...form,type:v})}
                          style={{...S.typeBtn,...(form.type===v?S.typeBtnOn:{})}}>
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>

                  {form.type==='review' && (
                    <div style={S.fg}>
                      <label className="label">Rating</label>
                      <div style={{display:'flex',gap:'0.4rem'}}>
                        {[1,2,3,4,5].map(n=>(
                          <button key={n} type="button" onClick={()=>setForm({...form,rating:n})}
                            style={{background:'none',border:'none',fontSize:'1.6rem',cursor:'pointer',color:form.rating>=n?'#c8a232':'#333',padding:'0 0.1rem'}}>
                            ★
                          </button>
                        ))}
                        <span style={{color:'#6a6a6a',fontFamily:"'Space Mono',monospace",fontSize:'0.65rem',marginLeft:'0.4rem',alignSelf:'center'}}>{form.rating}/5</span>
                      </div>
                    </div>
                  )}

                  <div style={S.fg}>
                    <label className="label">
                      {form.type==='question'?'Your Question *':form.type==='review'?'Your Review *':'Your Comment *'}
                    </label>
                    <textarea className="input" rows={4} required value={form.message} onChange={e=>setForm({...form,message:e.target.value})}
                      placeholder={form.type==='question'?'Ask us anything about Juhudi Skateboarding...':form.type==='review'?'Share your experience with Juhudi Skateboarding...':'Share your thoughts, encouragement or feedback...'}
                      style={{resize:'vertical'}}/>
                  </div>

                  <button className="btn-primary" type="submit" disabled={loading}>{loading?'Sending...':'Submit'}</button>
                </form>
              )}
            </div>

            {/* APPROVED REVIEWS */}
            {reviews.length > 0 && (
              <div style={{marginTop:'2rem'}}>
                <div style={S.formH}>What People Are Saying ({reviews.length})</div>
                <div style={S.reviewGrid}>
                  {reviews.map(r=>(
                    <div key={r.id} style={S.reviewCard}>
                      <div style={S.reviewTop}>
                        <div style={S.reviewAvatar}>{r.name.charAt(0).toUpperCase()}</div>
                        <div>
                          <div style={S.reviewName}>{r.name}</div>
                          <div style={S.reviewDate}>{new Date(r.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})}</div>
                        </div>
                        <span style={{...S.typePill,...typeColors[r.type]}}>{r.type}</span>
                      </div>
                      {r.rating && <div style={S.stars}>{stars(r.rating)}</div>}
                      <div style={S.reviewMsg}>{r.message}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  )
}

const S = {
  page:        {padding:'5rem 1.4rem 3rem'},
  inner:       {maxWidth:1040,margin:'0 auto'},
  hero:        {background:'rgba(123,26,26,0.18)',border:'1px solid rgba(200,162,50,0.2)',padding:'2.2rem',textAlign:'center',marginBottom:'2.2rem'},
  quote:       {fontFamily:"'Bebas Neue',sans-serif",fontSize:'clamp(1.3rem,3.2vw,2rem)',lineHeight:1.22,maxWidth:660,margin:'0 auto 1rem',color:'#f0e8d0'},
  ways:        {display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:'1.1rem',marginBottom:'2.5rem'},
  way:         {padding:'1.6rem',border:'1px solid rgba(255,255,255,0.065)',textAlign:'center'},
  wayIco:      {fontSize:'1.5rem',marginBottom:'0.7rem'},
  wayT:        {fontFamily:"'Bebas Neue',sans-serif",fontSize:'1.3rem',marginBottom:'0.38rem'},
  wayD:        {fontSize:'0.8rem',color:'#6a6a6a',lineHeight:1.6},
  contactBox:  {background:'rgba(10,10,10,0.5)',border:'1px solid rgba(200,162,50,0.2)',padding:'2rem',marginBottom:'2.5rem'},
  contactH:    {fontFamily:"'Bebas Neue',sans-serif",fontSize:'2rem',marginBottom:'1.5rem'},
  contactGrid: {display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:'1rem',marginBottom:'1.5rem'},
  contactCard: {background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',padding:'1.2rem'},
  contactIcon: {fontSize:'1.8rem',marginBottom:'0.5rem'},
  contactLabel:{fontFamily:"'Space Mono',monospace",fontSize:'0.65rem',letterSpacing:'0.1em',textTransform:'uppercase',color:'#c8a232',marginBottom:'0.4rem'},
  contactLink: {color:'#fff',fontSize:'0.85rem',display:'block',marginBottom:'0.4rem',wordBreak:'break-all'},
  contactNote: {fontSize:'0.78rem',color:'#6a6a6a',lineHeight:1.5,marginBottom:'0.7rem'},
  waBtn:       {display:'inline-block',background:'#25D366',color:'#fff',fontFamily:"'Space Mono',monospace",fontSize:'0.6rem',fontWeight:700,letterSpacing:'0.08em',padding:'0.5rem 0.9rem',textDecoration:'none',marginTop:'0.3rem'},
  socials:     {display:'flex',gap:'0.8rem',flexWrap:'wrap'},
  socialBtn:   {background:'transparent',color:'#fff',border:'1px solid rgba(255,255,255,0.2)',fontFamily:"'Space Mono',monospace",fontSize:'0.6rem',fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',padding:'0.5rem 0.9rem',textDecoration:'none'},
  reviewSection:{marginTop:'1rem'},
  reviewH:     {fontFamily:"'Bebas Neue',sans-serif",fontSize:'2rem',marginBottom:'0.5rem'},
  reviewSub:   {color:'#6a6a6a',fontSize:'0.87rem',marginBottom:'1.5rem'},
  formBox:     {background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',padding:'1.5rem',marginBottom:'1.5rem'},
  formH:       {fontFamily:"'Bebas Neue',sans-serif",fontSize:'1.4rem',marginBottom:'1rem',color:'#f0e8d0'},
  frow:        {display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem'},
  fg:          {marginBottom:'0.9rem'},
  typeBtn:     {background:'none',border:'1px solid rgba(255,255,255,0.12)',color:'rgba(255,255,255,0.55)',fontFamily:"'Space Mono',monospace",fontSize:'0.65rem',padding:'0.4rem 0.8rem',cursor:'pointer'},
  typeBtnOn:   {border:'1px solid #c8a232',color:'#c8a232',background:'rgba(200,162,50,0.08)'},
  stars:       {color:'#c8a232',fontSize:'1.1rem',marginBottom:'0.5rem',letterSpacing:'0.1em'},
  reviewGrid:  {display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:'1rem'},
  reviewCard:  {background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',padding:'1.2rem'},
  reviewTop:   {display:'flex',alignItems:'center',gap:'0.8rem',marginBottom:'0.6rem'},
  reviewAvatar:{width:38,height:38,borderRadius:'50%',background:'rgba(200,162,50,0.2)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Bebas Neue',sans-serif",fontSize:'1.2rem',color:'#c8a232',flexShrink:0},
  reviewName:  {fontWeight:700,fontSize:'0.9rem'},
  reviewDate:  {fontSize:'0.7rem',color:'#6a6a6a',fontFamily:"'Space Mono',monospace"},
  reviewMsg:   {fontSize:'0.85rem',color:'rgba(255,255,255,0.75)',lineHeight:1.6},
  typePill:    {display:'inline-block',padding:'0.15rem 0.5rem',fontFamily:"'Space Mono',monospace",fontSize:'0.55rem',letterSpacing:'0.05em',marginLeft:'auto'},
  ok:          {background:'rgba(109,200,109,0.1)',border:'1px solid rgba(109,200,109,0.3)',color:'#6dc86d',padding:'1.2rem',fontSize:'0.85rem',lineHeight:1.6,textAlign:'center'},
  errBox:      {background:'rgba(220,80,80,0.1)',border:'1px solid rgba(220,80,80,0.3)',color:'#e06060',padding:'0.8rem',fontSize:'0.82rem',marginBottom:'1rem'},
  linkBtn:     {background:'none',border:'none',color:'#c8a232',fontFamily:"'Space Mono',monospace",fontSize:'0.65rem',cursor:'pointer',textDecoration:'underline'},
}
