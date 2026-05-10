import '../styles/globals.css'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function App({ Component, pageProps }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) {
        fetchProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) {
        fetchProfile(session.user.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Profile fetch error:', error)
      } else {
        setProfile(data)
      }
    } catch (e) {
      console.error('Profile error:', e)
    } finally {
      setLoading(false)
    }
  }

  function refreshProfile() {
    if (session) fetchProfile(session.user.id)
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#090909',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Space Mono', monospace",
        fontSize: '0.75rem',
        color: '#c8a232',
        letterSpacing: '0.2em'
      }}>
        LOADING...
      </div>
    )
  }

  return (
    <Component
      {...pageProps}
      session={session}
      profile={profile}
      refreshProfile={refreshProfile}
    />
  )
}
