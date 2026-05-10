import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { signOut } from '../lib/supabase'

export default function Nav({ session, profile }) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleSignOut() {
    await signOut()
    router.push('/')
  }

  const links = [
    { href: '/', label: 'Home' },
    { href: '/story', label: 'Story' },
    { href: '/team', label: 'Team' },
    { href: '/schedule', label: 'Schedule' },
    { href: '/gallery', label: 'Gallery' },
    { href: '/support', label: 'Support' },
  ]

  return (
    <nav style={styles.nav}>
      <Link href="/" style={styles.logoWrap}>
        <img src="/logo.jpg" alt="Juhudi Logo" style={styles.logoImg} />
        <span style={styles.brand}>JUHUDI</span>
      </Link>

      <div style={styles.links}>
        {links.map(l => (
          <Link key={l.href} href={l.href} style={{ ...styles.link, ...(router.pathname === l.href ? styles.linkActive : {}) }}>
            {l.label}
          </Link>
        ))}
      </div>

      <div style={styles.right}>
        {profile?.is_admin && (
          <Link href="/admin" style={{ ...styles.link, color: '#e05a1a' }}>Admin</Link>
        )}
        <Link href="/booking" style={styles.btnP}>Book Class</Link>
        {session ? (
          <button onClick={handleSignOut} style={styles.link}>Logout</button>
        ) : (
          <Link href="/login" style={styles.link}>Login</Link>
        )}
      </div>
    </nav>
  )
}

const styles = {
  nav: { position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 1.4rem', background: 'rgba(7,7,7,0.97)', borderBottom: '1px solid rgba(200,162,50,0.22)' },
  logoWrap: { display: 'flex', alignItems: 'center', gap: '0.7rem', cursor: 'pointer', textDecoration: 'none' },
  logoImg: { width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', boxShadow: '0 0 0 2px rgba(200,162,50,0.6)' },
  brand: { fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.4rem', color: '#c8a232', letterSpacing: '0.06em' },
  links: { display: 'flex', gap: '0.1rem' },
  link: { background: 'none', border: 'none', color: 'rgba(255,255,255,0.65)', fontFamily: "'Space Mono', monospace", fontSize: '0.62rem', letterSpacing: '0.07em', textTransform: 'uppercase', cursor: 'pointer', padding: '0.4rem 0.65rem', textDecoration: 'none', transition: 'color 0.2s' },
  linkActive: { color: '#c8a232' },
  right: { display: 'flex', gap: '0.4rem', alignItems: 'center' },
  btnP: { background: '#c8a232', color: '#090909', border: 'none', fontFamily: "'Space Mono', monospace", fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', padding: '0.45rem 0.9rem', textDecoration: 'none' },
}
