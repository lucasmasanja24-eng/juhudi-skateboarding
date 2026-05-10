import Nav from '../components/Nav'

export default function Support({ session, profile }) {
  return (
    <>
      <Nav session={session} profile={profile} />
      <div style={S.page}>
        <div style={S.inner}>
          <div className="section-label">Get Involved</div>
          <h1 className="section-title">SUPPORT JUHUDI</h1>
          <div className="divider" />

          <div style={S.hero}>
            <div style={S.quote}>"From 4 skateboards and a few kids to a community of 30+ young skaters — built on effort, support, and passion."</div>
            <p style={S.heroSub}>Help us build the future of skateboarding in Tanzania</p>
          </div>

          <div style={S.ways}>
            {[
              ['💰', 'FINANCIAL', 'Fund equipment, events, maintenance, and the future skatepark dream in Dar es Salaam.'],
              ['🛹', 'EQUIPMENT', 'Boards, trucks, wheels, helmets, pads — any skate gear helps a young rider get started.'],
              ['🤝', 'SPONSORSHIP', 'Partner with Juhudi as a brand, organization, or individual sponsor. Let\'s grow this together.'],
            ].map(([ico, title, desc]) => (
              <div key={title} style={S.way}>
                <div style={S.wayIco}>{ico}</div>
                <div style={S.wayTitle}>{title}</div>
                <div style={S.wayDesc}>{desc}</div>
              </div>
            ))}
          </div>

          <div style={S.contact}>
            <div className="section-label">Contact</div>
            <h2 style={S.contactTitle}>REACH OUT DIRECTLY</h2>
            <div style={S.btns}>
              <a href="mailto:juhudiskateboarding@gmail.com" style={S.btnP}>✉ Email Us</a>
              <a href="https://wa.me/255000000000" style={S.btnO}>💬 WhatsApp</a>
              <a href="https://instagram.com/juhudiskateboarding" target="_blank" rel="noreferrer" style={S.btnO}>📸 @juhudiskateboarding</a>
              <a href="https://tiktok.com/@juhudi_skateboarding" target="_blank" rel="noreferrer" style={S.btnO}>🎵 @juhudi_skateboarding</a>
            </div>
            <p style={S.email}>juhudiskateboarding@gmail.com</p>
          </div>
        </div>
      </div>
    </>
  )
}

const S = {
  page: { padding: '5rem 1.4rem 3rem' },
  inner: { maxWidth: 1040, margin: '0 auto' },
  hero: { background: 'rgba(123,26,26,0.18)', border: '1px solid rgba(200,162,50,0.2)', padding: '2.2rem', textAlign: 'center', marginBottom: '2.2rem' },
  quote: { fontFamily: "'Bebas Neue',sans-serif", fontSize: 'clamp(1.3rem,3.2vw,2rem)', lineHeight: 1.22, maxWidth: 660, margin: '0 auto 1rem', color: 'var(--cream)' },
  heroSub: { color: 'rgba(240,232,208,0.55)', fontSize: '0.86rem' },
  ways: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1.1rem', marginBottom: '3rem' },
  way: { padding: '1.6rem', border: '1px solid rgba(255,255,255,0.065)', textAlign: 'center' },
  wayIco: { fontSize: '1.5rem', marginBottom: '0.7rem' },
  wayTitle: { fontFamily: "'Bebas Neue',sans-serif", fontSize: '1.3rem', marginBottom: '0.38rem' },
  wayDesc: { fontSize: '0.8rem', color: 'var(--muted)', lineHeight: 1.6 },
  contact: { textAlign: 'center' },
  contactTitle: { fontFamily: "'Bebas Neue',sans-serif", fontSize: '2rem', marginBottom: '1.2rem' },
  btns: { display: 'flex', gap: '0.7rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '1.3rem' },
  btnP: { background: 'var(--gold)', color: 'var(--blk)', fontFamily: "'Space Mono',monospace", fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.6rem 1.2rem', textDecoration: 'none', border: 'none' },
  btnO: { background: 'transparent', color: 'var(--wh)', border: '1px solid rgba(255,255,255,0.25)', fontFamily: "'Space Mono',monospace", fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.6rem 1.2rem', textDecoration: 'none' },
  email: { marginTop: '1.3rem', fontFamily: "'Space Mono',monospace", fontSize: '0.68rem', color: 'var(--muted)' },
}
