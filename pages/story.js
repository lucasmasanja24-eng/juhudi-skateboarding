import Nav from '../components/Nav'
import Link from 'next/link'

export default function Story({ session, profile }) {
  return (
    <>
      <Nav session={session} profile={profile} />
      <div style={S.page}>
        <div style={S.inner}>
          <div className="section-label">Origin &amp; History</div>
          <h1 className="section-title">HOW IT ALL STARTED</h1>
          <div className="divider" />

          <div style={S.grid}>
            <div style={S.text}>
              <p style={S.p}>Juhudi Skateboarding was born on the basketball court of <strong style={S.gold}>Juhudi Secondary School in Gongo la Mboto, Dar es Salaam</strong>. It started with nothing more than a few boards, a dream, and one sports teacher who believed.</p>
              <p style={S.p}>When founder <strong style={S.gold}>Lucas Masanja</strong> brought the idea to the school, sports teacher <strong style={S.gold}>Sir Lipiki</strong> opened the basketball court — a small act that changed everything. That court became the first skate spot, training ground, and community hub.</p>
              <p style={S.p}>The first equipment came from <strong style={S.gold}>John Manildi</strong> — 4 boards, equipment, and Ace trucks. Those 4 boards were shared between everyone. Nobody complained. Everyone learned. That is the spirit of <strong style={S.gold}>Juhudi</strong>.</p>
              <p style={S.p}>Support came from <strong style={S.gold}>Don Bosco Skateboarding</strong> (decks, helmets, pads), the <strong style={S.gold}>Tanzania Skateboarding Community</strong> (gear, pads, trucks), and local skaters across Dar es Salaam who gave their time and energy.</p>
              <p style={S.p}>Today, Juhudi has grown from 4 kids to over <strong style={S.gold}>30 young people</strong> — boys, girls, students, and neighborhood youth — all skating together and building something real.</p>
            </div>

            <div>
              {[
                ['THE BEGINNING', '4 Boards, 1 Dream', 'John Manildi donates 4 boards, equipment & Ace trucks. Lucas launches Juhudi at the school basketball court.'],
                ['FIRST SUPPORT', 'Sir Lipiki Opens the Court', 'The school sports teacher welcomes the program and grants access to the basketball court.'],
                ['GROWING', 'Community Rallies', 'Don Bosco Skateboarding & Tanzania Skateboarding Community donate decks, helmets, pads, and trucks.'],
                ['TODAY', '30+ Skaters Strong', 'Boys, girls, students, neighborhood youth — one movement. Juhudi is just getting started.'],
              ].map(([year, title, desc]) => (
                <div key={year} style={S.milestone}>
                  <div style={S.msYear}>{year}</div>
                  <div style={S.msTitle}>{title}</div>
                  <div style={S.msDesc}>{desc}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '3rem' }}>
            <div className="section-label">Supporters</div>
            <h2 style={S.suppTitle}>THOSE WHO MADE IT POSSIBLE</h2>
            <div style={S.suppGrid}>
              {[
                ['John Manildi', 'Founding Donor', '4 boards, equipment & Ace trucks — the very foundation of Juhudi'],
                ['Don Bosco Skateboarding', 'Equipment Donation', 'Decks, helmets, and protective pads that keep our riders safe'],
                ['Tanzania Skateboarding Community', 'Gear & Support', 'Gear, pads, trucks and moral support from the wider Tanzania skate scene'],
                ['Sir Lipiki', 'Sports Teacher, Juhudi Secondary', 'Opened the school basketball court and welcomed the program'],
                ['Dar es Salaam Local Skaters', 'Community Support', 'Riders who gave time, energy and knowledge to the next generation'],
              ].map(([name, role, note]) => (
                <div key={name} style={S.suppCard}>
                  <div style={S.suppName}>{name}</div>
                  <div style={S.suppRole}>{role}</div>
                  <div style={S.suppNote}>{note}</div>
                </div>
              ))}
              <Link href="/support" style={{ ...S.suppCard, borderStyle: 'dashed', textDecoration: 'none', cursor: 'pointer' }}>
                <div style={{ ...S.suppName, color: 'var(--gold)' }}>Be Next</div>
                <div style={S.suppRole}>Future Supporter</div>
                <div style={S.suppNote}>Help us build the future of skateboarding in Tanzania →</div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

const S = {
  page: { padding: '5rem 1.4rem 3rem' },
  inner: { maxWidth: 1040, margin: '0 auto' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.8rem', alignItems: 'start' },
  text: {},
  p: { color: 'rgba(255,255,255,0.72)', lineHeight: 1.8, marginBottom: '0.95rem', fontSize: '0.92rem' },
  gold: { color: 'var(--gold)' },
  milestone: { padding: '1.1rem 1.1rem 1.1rem 1.4rem', borderLeft: '2px solid rgba(200,162,50,0.22)', marginLeft: '0.7rem', position: 'relative', marginBottom: 0 },
  msYear: { fontFamily: "'Space Mono',monospace", fontSize: '0.58rem', color: 'var(--gold)', letterSpacing: '0.1em', marginBottom: '0.22rem' },
  msTitle: { fontFamily: "'Bebas Neue',sans-serif", fontSize: '1.18rem', marginBottom: '0.22rem' },
  msDesc: { fontSize: '0.8rem', color: 'var(--muted)', lineHeight: 1.5 },
  suppTitle: { fontFamily: "'Bebas Neue',sans-serif", fontSize: '2rem', marginBottom: '1.1rem' },
  suppGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(165px,1fr))', gap: '0.75rem' },
  suppCard: { padding: '1rem', border: '1px solid rgba(200,162,50,0.16)', background: 'rgba(255,255,255,0.012)' },
  suppName: { fontWeight: 700, marginBottom: '0.18rem', fontSize: '0.88rem' },
  suppRole: { fontSize: '0.68rem', color: 'var(--gold)', fontFamily: "'Space Mono',monospace", letterSpacing: '0.05em' },
  suppNote: { fontSize: '0.77rem', color: 'var(--muted)', marginTop: '0.32rem', lineHeight: 1.45 },
}
