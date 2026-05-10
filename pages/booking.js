import { useState } from 'react'
import Nav from '../components/Nav'
import { createBooking } from '../lib/supabase'

export default function Booking({ session, profile }) {
  const [form, setForm] = useState({ full_name: '', date_of_birth: '', phone: '', preferred_date: '', preferred_time: 'Morning (8:00–11:00 AM)', skill_level: 'Complete Beginner', notes: '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  function calcAge(dob) {
    if (!dob) return null
    const d = new Date(dob), n = new Date()
    let a = n.getFullYear() - d.getFullYear()
    if (n.getMonth() - d.getMonth() < 0 || (n.getMonth() - d.getMonth() === 0 && n.getDate() < d.getDate())) a--
    return a
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.full_name || !form.phone || !form.preferred_date) { setError('Please fill all required fields'); return }
    setLoading(true); setError('')
    try {
      await createBooking(form)
      setSuccess(true)
      setForm({ full_name: '', date_of_birth: '', phone: '', preferred_date: '', preferred_time: 'Morning (8:00–11:00 AM)', skill_level: 'Complete Beginner', notes: '' })
    } catch (err) { setError(err.message) }
    setLoading(false)
  }

  const age = form.date_of_birth ? calcAge(form.date_of_birth) : null

  return (
    <>
      <Nav session={session} profile={profile} />
      <div style={S.page}>
        <div style={S.inner}>
          <div className="section-label">Private Sessions</div>
          <h1 className="section-title">BOOK A CLASS</h1>
          <div className="divider" />
          <div style={S.grid}>
            <div>
              {success && <div style={S.success}>Booking request sent! Admin will confirm via WhatsApp soon.</div>}
              {error && <div style={S.err}>{error}</div>}
              <form onSubmit={handleSubmit}>
                <div style={S.fg}><label className="label">Full Name *</label><input className="input" required value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} placeholder="Your full name" /></div>
                <div style={S.fg}>
                  <label className="label">Date of Birth</label>
                  <input className="input" type="date" value={form.date_of_birth} onChange={e => setForm({ ...form, date_of_birth: e.target.value })} />
                  {age !== null && <div style={S.age}>Age: {age} years</div>}
                </div>
                <div style={S.fg}><label className="label">Phone / WhatsApp *</label><input className="input" required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+255 ..." /></div>
                <div style={S.fg}><label className="label">Preferred Date *</label><input className="input" type="date" required value={form.preferred_date} onChange={e => setForm({ ...form, preferred_date: e.target.value })} /></div>
                <div style={S.fg}>
                  <label className="label">Preferred Time</label>
                  <select className="input" value={form.preferred_time} onChange={e => setForm({ ...form, preferred_time: e.target.value })}>
                    <option>Morning (8:00–11:00 AM)</option>
                    <option>Afternoon (2:00–5:00 PM)</option>
                    <option>Evening (5:00–7:00 PM)</option>
                  </select>
                </div>
                <div style={S.fg}>
                  <label className="label">Skill Level</label>
                  <select className="input" value={form.skill_level} onChange={e => setForm({ ...form, skill_level: e.target.value })}>
                    <option>Complete Beginner</option>
                    <option>Some Experience</option>
                    <option>Intermediate</option>
                    <option>Advanced</option>
                  </select>
                </div>
                <div style={S.fg}><label className="label">Notes</label><textarea className="input" rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Anything else?" style={{ resize: 'vertical' }} /></div>
                <button className="btn-primary" type="submit" style={{ width: '100%' }} disabled={loading}>{loading ? 'Sending...' : 'Request Class'}</button>
              </form>
            </div>

            <div style={S.info}>
              <h3 style={S.infoTitle}>PRIVATE SESSIONS</h3>
              <p style={S.infoP}>One-on-one or small group training tailored to your level. Sessions run every Sunday morning.</p>
              <div style={{ margin: '1.1rem 0' }}>
                {[['📍', 'Juhudi Secondary School, Gongo la Mboto'], ['⏱', 'Sessions 60–90 minutes'], ['👟', 'Comfortable clothes and closed shoes'], ['🛹', 'Boards and helmets provided if needed']].map(([ico, txt]) => (
                  <div key={txt} style={S.row}><span>{ico}</span><span style={S.rowTxt}>{txt}</span></div>
                ))}
              </div>
              <div style={S.infoDivider}>
                <p style={S.infoSmall}>Admin will confirm via WhatsApp or suggest an alternative time.</p>
                <p style={{ fontSize: '0.82rem', marginTop: '0.65rem' }}><a href="mailto:juhudiskateboarding@gmail.com" style={{ color: 'var(--gold)' }}>juhudiskateboarding@gmail.com</a></p>
              </div>
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
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.2rem', marginTop: '1.4rem' },
  fg: { marginBottom: '1.1rem' },
  age: { fontFamily: "'Space Mono',monospace", fontSize: '0.75rem', color: 'var(--gold)', marginTop: '0.3rem' },
  info: { background: 'rgba(123,26,26,0.13)', border: '1px solid rgba(200,162,50,0.18)', padding: '1.7rem' },
  infoTitle: { fontFamily: "'Bebas Neue',sans-serif", fontSize: '1.7rem', marginBottom: '0.75rem', color: 'var(--cream)' },
  infoP: { color: 'rgba(255,255,255,0.62)', fontSize: '0.85rem', lineHeight: 1.72, marginBottom: '0.75rem' },
  row: { display: 'flex', gap: '0.75rem', marginBottom: '0.38rem', fontSize: '0.82rem', alignItems: 'flex-start' },
  rowTxt: { color: 'rgba(255,255,255,0.62)' },
  infoDivider: { borderTop: '1px solid rgba(200,162,50,0.16)', paddingTop: '1.1rem' },
  infoSmall: { fontSize: '0.8rem', color: 'var(--muted)' },
  success: { background: 'rgba(109,200,109,0.1)', border: '1px solid rgba(109,200,109,0.3)', color: '#6dc86d', padding: '0.8rem', fontSize: '0.82rem', marginBottom: '1rem', lineHeight: 1.5 },
  err: { background: 'rgba(220,80,80,0.1)', border: '1px solid rgba(220,80,80,0.3)', color: '#e06060', padding: '0.8rem', fontSize: '0.82rem', marginBottom: '1rem' },
}
