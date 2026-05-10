import { useEffect, useState } from 'react'
import Nav from '../components/Nav'
import { getApprovedMembers } from '../lib/supabase'

export default function Team({ session, profile }) {
  const [members, setMembers] = useState([])

  useEffect(() => {
    getApprovedMembers().then(d => setMembers(d || [])).catch(() => {})
  }, [])

  function calcAge(dob) {
    if (!dob) return null
    const d = new Date(dob), n = new Date()
    let a = n.getFullYear() - d.getFullYear()
    if (n.getMonth() - d.getMonth() < 0 || (n.getMonth() - d.getMonth() === 0 && n.getDate() < d.getDate())) a--
    return a
  }

  return (
    <>
      <Nav session={session} profile={profile} />
      <div style={S.page}>
        <div style={S.inner}>
          <div className="section-label">The Crew</div>
          <h1 className="section-title">MEET THE TEAM</h1>
          <div className="divider" />
          <p style={S.sub}>30+ riders strong and growing. Boys, girls, students, and community youth — one movement.</p>
          <div style={S.grid}>
            {members.map(m => (
              <div key={m.id} style={S.card}>
                <div style={S.avatar}>
                  <div style={S.avatarPat} />
                  {m.photo_url
                    ? <img src={m.photo_url} alt={m.full_name} style={S.avatarImg} />
                    : <span style={S.initials}>{m.full_name?.split(' ').map(w => w[0]).join('').slice(0, 2)}</span>
                  }
                </div>
                <div style={S.info}>
                  <div style={S.name}>{m.full_name}</div>
                  <div style={S.meta}>Age {calcAge(m.date_of_birth)} · {m.gender}</div>
                  <div style={S.badges}>
                    {m.role === 'Founder' && <span style={S.badge}>FOUNDER</span>}
                    {m.role === 'Coach' && <span style={S.badge}>COACH</span>}
                    {m.role === 'Captain' && <span style={S.badge}>CAPTAIN</span>}
                    {m.student && <span style={S.badge}>STUDENT</span>}
                    {m.gender === 'Female' && <span style={{ ...S.badge, background: 'rgba(200,100,200,0.12)', color: '#d090d0' }}>GIRL SKATER</span>}
                  </div>
                  <div style={S.level}>{m.stance} · {m.level}</div>
                  {m.favourite_trick && <div style={S.trick}>Fav: {m.favourite_trick}</div>}
                  {m.idol_skater && <div style={S.idol}>Idol: {m.idol_skater}</div>}
                  {m.bio && <div style={S.bio}>{m.bio}</div>}
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
  page: { padding: '5rem 1.4rem 3rem' },
  inner: { maxWidth: 1040, margin: '0 auto' },
  sub: { color: 'var(--muted)', marginBottom: '1.4rem', fontSize: '0.87rem' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(170px,1fr))', gap: '1.1rem' },
  card: { background: 'var(--gm)', overflow: 'hidden' },
  avatar: { height: 145, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--maroon-dk)', position: 'relative', overflow: 'hidden' },
  avatarPat: { position: 'absolute', inset: 0, opacity: 0.06, backgroundImage: 'repeating-linear-gradient(45deg,var(--gold) 0,var(--gold) 1px,transparent 0,transparent 16px)', backgroundSize: '16px 16px' },
  avatarImg: { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' },
  initials: { position: 'relative', zIndex: 1, fontFamily: "'Bebas Neue',sans-serif", fontSize: '2.3rem', color: 'var(--gold)' },
  info: { padding: '0.75rem 0.85rem' },
  name: { fontWeight: 700, fontSize: '0.87rem', marginBottom: '0.12rem' },
  meta: { fontSize: '0.68rem', color: 'var(--muted)', fontFamily: "'Space Mono',monospace" },
  badges: { display: 'flex', flexWrap: 'wrap', gap: '0.18rem', marginTop: '0.28rem' },
  badge: { display: 'inline-block', padding: '0.16rem 0.42rem', background: 'rgba(200,162,50,0.13)', color: 'var(--gold)', fontFamily: "'Space Mono',monospace", fontSize: '0.56rem', letterSpacing: '0.05em' },
  level: { fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.3rem', fontStyle: 'italic' },
  trick: { fontSize: '0.7rem', color: 'var(--muted)', marginTop: '0.2rem' },
  idol: { fontSize: '0.7rem', color: 'var(--muted)', marginTop: '0.1rem' },
  bio: { fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)', marginTop: '0.4rem', lineHeight: 1.4 },
}
