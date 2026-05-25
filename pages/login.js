import { useState } from 'react'
import { useRouter } from 'next/router'
import Nav from '../components/Nav'
import { signIn, signUp } from '../lib/supabase'

export default function Login({ session, profile }) {
  const router = useRouter()
  const [tab, setTab] = useState('login')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [loginData, setLoginData] = useState({ email: '', password: '' })
  const [signupData, setSignupData] = useState({
    fullName: '', dob: '', gender: 'Male', category: 'Student', email: '', password: ''
  })

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      await signIn(loginData)
      router.push('/')
    } catch (err) { setError(err.message) }
    setLoading(false)
  }

  async function handleSignup(e) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      await signUp(signupData)
      setMsg('Account request sent! Admin will review and approve your account. You will be notified once approved.')
      setTab('login')
    } catch (err) { setError(err.message) }
    setLoading(false)
  }

  const categories = ['Student', 'Working', 'Parent / Guardian', 'Sponsor', 'Volunteer', 'Coach', 'Other']

  return (
    <>
      <Nav session={session} profile={profile} />
      <div style={S.page}>
        <div style={S.card}>
          <div style={S.logo}><img src="/logo.jpg" alt="Juhudi" style={S.logoImg} /></div>
          <h1 style={S.title}>JUHUDI</h1>
          <p style={S.sub}>Join the movement</p>
          <div style={S.tabs}>
            <button onClick={() => setTab('login')} style={{ ...S.tab, ...(tab === 'login' ? S.tabOn : {}) }}>Login</button>
            <button onClick={() => setTab('signup')} style={{ ...S.tab, ...(tab === 'signup' ? S.tabOn : {}) }}>Sign Up</button>
          </div>
          {msg && <div style={S.success}>{msg}</div>}
          {error && <div style={S.err}>{error}</div>}

          {tab === 'login' ? (
            <form onSubmit={handleLogin}>
              <div style={S.fg}><label className="label">Email</label><input className="input" type="email" required value={loginData.email} onChange={e => setLoginData({ ...loginData, email: e.target.value })} placeholder="your@email.com" /></div>
              <div style={S.fg}><label className="label">Password</label><input className="input" type="password" required value={loginData.password} onChange={e => setLoginData({ ...loginData, password: e.target.value })} placeholder="••••••••" /></div>
              <button className="btn-primary" type="submit" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
            </form>
          ) : (
            <form onSubmit={handleSignup}>
              <div style={S.fg}><label className="label">Full Name *</label><input className="input" required value={signupData.fullName} onChange={e => setSignupData({ ...signupData, fullName: e.target.value })} placeholder="Your full name" /></div>
              <div style={S.fg}><label className="label">Date of Birth *</label><input className="input" type="date" required value={signupData.dob} onChange={e => setSignupData({ ...signupData, dob: e.target.value })} /></div>
              <div style={S.frow}>
                <div style={S.fg}>
                  <label className="label">Gender</label>
                  <select className="input" value={signupData.gender} onChange={e => setSignupData({ ...signupData, gender: e.target.value })}>
                    <option>Male</option><option>Female</option><option>Other</option>
                  </select>
                </div>
                <div style={S.fg}>
                  <label className="label">I am a...</label>
                  <select className="input" value={signupData.category} onChange={e => setSignupData({ ...signupData, category: e.target.value })}>
                    {categories.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div style={S.fg}><label className="label">Email *</label><input className="input" type="email" required value={signupData.email} onChange={e => setSignupData({ ...signupData, email: e.target.value })} placeholder="your@email.com" /></div>
              <div style={S.fg}><label className="label">Password *</label><input className="input" type="password" required minLength={6} value={signupData.password} onChange={e => setSignupData({ ...signupData, password: e.target.value })} placeholder="Minimum 6 characters" /></div>
              <button className="btn-primary" type="submit" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>{loading ? 'Submitting...' : 'Request Account'}</button>
              <p style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: '0.8rem', textAlign: 'center' }}>Accounts require admin approval before access is granted</p>
            </form>
          )}
        </div>
      </div>
    </>
  )
}

const S = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '5rem 1rem 2rem', background: '#5c1212' },
  card: { background: '#161616', border: '1px solid rgba(200,162,50,0.28)', padding: '2rem', width: 400, maxWidth: '95vw' },
  logo: { textAlign: 'center', marginBottom: '0.8rem' },
  logoImg: { width: 70, height: 70, borderRadius: '50%', objectFit: 'cover', boxShadow: '0 0 0 3px rgba(200,162,50,0.5)' },
  title: { fontFamily: "'Bebas Neue',sans-serif", fontSize: '2rem', color: '#f0e8d0', textAlign: 'center', marginBottom: '0.2rem' },
  sub: { fontSize: '0.82rem', color: '#6a6a6a', textAlign: 'center', marginBottom: '1.6rem' },
  tabs: { display: 'flex', marginBottom: '1.6rem', borderBottom: '1px solid rgba(255,255,255,0.07)' },
  tab: { background: 'none', border: 'none', color: '#6a6a6a', fontFamily: "'Space Mono',monospace", fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.5rem 1rem 0.65rem', cursor: 'pointer', borderBottom: '2px solid transparent', marginBottom: -1 },
  tabOn: { color: '#c8a232', borderBottomColor: '#c8a232' },
  fg: { marginBottom: '0.9rem' },
  frow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' },
  success: { background: 'rgba(109,200,109,0.1)', border: '1px solid rgba(109,200,109,0.3)', color: '#6dc86d', padding: '0.8rem', fontSize: '0.82rem', marginBottom: '1rem', lineHeight: 1.5 },
  err: { background: 'rgba(220,80,80,0.1)', border: '1px solid rgba(220,80,80,0.3)', color: '#e06060', padding: '0.8rem', fontSize: '0.82rem', marginBottom: '1rem' },
}
