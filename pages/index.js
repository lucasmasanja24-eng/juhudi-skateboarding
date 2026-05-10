import { useEffect, useState } from 'react'
import Link from 'next/link'
import Nav from '../components/Nav'
import { getPosts } from '../lib/supabase'

export default function Home({ session, profile }) {
  const [posts, setPosts] = useState([])

  useEffect(() => {
    getPosts().then(data => setPosts(data || [])).catch(() => {})
  }, [])

  const defaultPosts = [
    { id: 1, title: 'New Gear Arrived!', created_at: '2025-04-01', content: 'Thanks to Don Bosco Skateboarding for the donation of decks, helmets and protective gear. The crew is hyped!', media_url: null },
    { id: 2, title: 'Girls Session Launched', created_at: '2025-03-01', content: 'Dedicated sessions for girls every Saturday morning. Skateboarding is for everyone.', media_url: null },
    { id: 3, title: '30+ Members Strong', created_at: '2025-02-01', content: 'From 4 kids to over 30. Boys, girls, students, and neighborhood youth all skating together.', media_url: null },
  ]

  const displayPosts = posts.length > 0 ? posts.slice(0, 3) : defaultPosts

  return (
    <>
      <Nav session={session} profile={profile} />

      {/* HERO */}
      <div style={styles.hero}>
        <div style={styles.heroPat} />
        <div style={styles.heroContent}>
          <img src="/logo.jpg" alt="Juhudi Skateboarding" style={styles.heroLogo} />
          <div style={styles.heroTag}>Dar es Salaam, Tanzania · Gongo la Mboto</div>
          <h1 style={styles.heroTitle}>JUHUDI<br /><span style={{ color: '#c8a232', fontSize: '0.52em' }}>SKATEBOARDING</span></h1>
          <p style={styles.heroSub}>Juhudi means <em>effort</em>. From 4 boards and a basketball court to a community of 30+ young skaters — built on passion, hustle, and each other.</p>
          <div style={styles.heroBtns}>
            <Link href="/story" style={styles.btnP}>Our Story</Link>
            <Link href="/booking" style={styles.btnO}>Book a Class</Link>
            <Link href="/support" style={styles.btnO}>Support Us</Link>
          </div>
          <div style={styles.statBar}>
            {[['30+','Skaters'],['4','OG Boards'],['1','Court'],['∞','Juhudi']].map(([n,l]) => (
              <div key={l} style={styles.statItem}>
                <span style={styles.statN}>{n}</span>
                <span style={styles.statL}>{l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* POSTS */}
      <div style={{ padding: '3.5rem 1.4rem', background: '#131313' }}>
        <div style={styles.inner}>
          <div className="section-label">Latest</div>
          <h2 className="section-title">WHAT'S HAPPENING</h2>
          <div style={styles.postsGrid}>
            {displayPosts.map(p => (
              <div key={p.id} style={styles.postCard}>
                <div style={styles.postDate}>{new Date(p.created_at).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</div>
                <h3 style={styles.postTitle}>{p.title}</h3>
                <p style={styles.postContent}>{p.content}</p>
                {p.media_url && p.media_type === 'image' && <img src={p.media_url} alt={p.title} style={{ width: '100%', maxHeight: 200, objectFit: 'cover', marginTop: '0.8rem' }} />}
                {p.media_url && p.media_type === 'video' && <video src={p.media_url} controls style={{ width: '100%', maxHeight: 200, marginTop: '0.8rem' }} />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

const styles = {
  hero: { position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: '#5c1212' },
  heroPat: { position: 'absolute', inset: 0, opacity: 0.035, backgroundImage: 'repeating-linear-gradient(45deg,#c8a232 0,#c8a232 1px,transparent 0,transparent 36px)', backgroundSize: '36px 36px' },
  heroContent: { position: 'relative', zIndex: 2, textAlign: 'center', padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '5rem' },
  heroLogo: { width: 210, height: 210, borderRadius: '50%', objectFit: 'cover', marginBottom: '1.8rem', boxShadow: '0 0 0 5px rgba(200,162,50,0.6), 0 0 0 10px rgba(200,162,50,0.15), 0 12px 60px rgba(0,0,0,0.7)' },
  heroTag: { fontFamily: "'Space Mono', monospace", fontSize: '0.68rem', letterSpacing: '0.22em', color: '#c8a232', textTransform: 'uppercase', marginBottom: '0.9rem' },
  heroTitle: { fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(3.2rem,9vw,7.5rem)', lineHeight: 0.92, color: '#f0e8d0', letterSpacing: '0.02em' },
  heroSub: { fontSize: '0.97rem', color: 'rgba(240,232,208,0.68)', maxWidth: 460, margin: '1.1rem auto 2rem', lineHeight: 1.75 },
  heroBtns: { display: 'flex', gap: '0.7rem', justifyContent: 'center', flexWrap: 'wrap' },
  statBar: { display: 'flex', borderTop: '1px solid rgba(200,162,50,0.18)', marginTop: '2.8rem', width: '100%', maxWidth: 580 },
  statItem: { flex: 1, padding: '0.9rem', borderRight: '1px solid rgba(200,162,50,0.1)', textAlign: 'center' },
  statN: { fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.9rem', color: '#c8a232', display: 'block' },
  statL: { fontFamily: "'Space Mono', monospace", fontSize: '0.58rem', letterSpacing: '0.12em', color: 'rgba(240,232,208,0.45)', textTransform: 'uppercase' },
  inner: { maxWidth: 1040, margin: '0 auto' },
  postsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))', gap: '1.1rem' },
  postCard: { border: '1px solid rgba(200,162,50,0.18)', padding: '1.2rem' },
  postDate: { fontFamily: "'Space Mono', monospace", fontSize: '0.6rem', color: '#c8a232', letterSpacing: '0.1em', marginBottom: '0.35rem' },
  postTitle: { fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.3rem', marginBottom: '0.35rem' },
  postContent: { fontSize: '0.82rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.65 },
  btnP: { background: '#c8a232', color: '#090909', fontFamily: "'Space Mono', monospace", fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.6rem 1.2rem', textDecoration: 'none', border: 'none', cursor: 'pointer' },
  btnO: { background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.25)', fontFamily: "'Space Mono', monospace", fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.6rem 1.2rem', textDecoration: 'none' },
}
