'use client'

import { useEffect, useState } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client'

export default function Welcome() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()

    async function checkSession() {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) {
        console.error('Error getting session:', error)
        return
      }

      if (!session) {
        // Not logged in, redirect to login
        window.location.href = '/google-login'
        return
      }

      console.log('Logged in user:', session.user)
      // Redirect to dashboard or home page
      window.location.href = '/dashboard'
    }

    checkSession()
  }, [])

  return <div>{loading ? 'Loading...' : 'Redirecting...'}</div>
}