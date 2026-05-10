import { useEffect, useState } from 'react'
import Nav from '../components/Nav'
import { getGallery } from '../lib/supabase'

export default function Gallery({ session, profile }) {
  const [items, setItems] = useState([])

  useEffect(() => {
    getGallery().then(d => setItems(d || [])).catch(() => {})
  }, [])

  const placeholders = [
    'Training session at Juhudi Secondary',
    'Learning ollies on the court',
    'Girls session — Saturday morning',
    'Community skate jam',
    'New gear arrived — helmets & pads',
    'Lucas teaching kick flips',
    'The OG 4 boards that started it all',
    'Friday session vibes',
  ]

  return (
    <>
      <Nav session={session} profile={profile} />
      <div style={S.page}>
        <div style={S.inner}>
          <div className="section-label">Media</div>
          <h1 className="section-title">THE GALLERY</h1>
          <div className="divider" />
          <div style={S.grid}>
            {items.map(item => (
              <div key={item.id} style={S.item}>
                <img src={item.image_url} alt={item.caption} style={S.img} />
                <div style={S.overlay}><span style={S.cap}>{item.caption}</span></div>
              </div>
            ))}
            {placeholders.map((cap, i) => (
              <div key={i} style={{ ...S.item, ...S.placeholder }}>
                <div style={S.placeholderInner}>
                  <span style={{ fontSize: '1.5rem', opacity: 0.2 }}>🛹</span>
                  <span style={S.placeholderText}>PHOTO COMING SOON</span>
                </div>
                <div style={S.overlay}><span style={S.cap}>{cap}</span></div>
              </div>
            ))}
          </div>
          <div style={S.social}>
            <p style={S.socialText}>Follow us: <strong style={{ color: 'var(--gold)' }}>@juhudiskateboarding</strong> on Instagram &amp; TikTok</p>
          </div>
        </div>
      </div>
    </>
  )
}

const S = {
  page: { padding: '5rem 1.4rem 3rem' },
  inner: { maxWidth: 1040, margin: '0 auto' },
  grid: { columns: 3, gap: '0.75rem' },
  item: { breakInside: 'avoid', marginBottom: '0.75rem', position: 'relative', overflow: 'hidden', cursor: 'pointer', background: 'var(--gm)', display: 'block' },
  img: { width: '100%', display: 'block', objectFit: 'cover' },
  overlay: { position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(0,0,0,0.82),transparent)', opacity: 0, transition: 'opacity 0.3s', display: 'flex', alignItems: 'flex-end', padding: '0.75rem' },
  cap: { fontSize: '0.76rem', color: '#fff' },
  placeholder: { height: 180, display: 'flex' },
  placeholderInner: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', background: 'var(--maroon-dk)' },
  placeholderText: { fontFamily: "'Space Mono',monospace", fontSize: '0.56rem', color: 'rgba(200,162,50,0.3)', letterSpacing: '0.07em' },
  social: { textAlign: 'center', marginTop: '2.2rem', padding: '1.6rem', border: '1px dashed rgba(200,162,50,0.18)' },
  socialText: { fontFamily: "'Space Mono',monospace", fontSize: '0.72rem', color: 'var(--muted)' },
}
