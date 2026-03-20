import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Every request hitting your app passes through this first (but only matched routes).
export async function middleware(req: NextRequest) {
  const res = NextResponse.next()   // “Let the request continue normally” (default pass-through)

  // Only run on admin API routes
  if (!req.nextUrl.pathname.startsWith('/api/admin')) { //This manually checks the route (route filtering)
    return res
  }

  // ── DEV BYPASS — remove this block before production ──────────────────────
  // THIS IS FOR TESTING PURPOSES ONLY — it allows you to bypass auth checks
  // REMOVE THIS IF THERE ARE ROLES IMPLEMENTED
  if (process.env.NODE_ENV === 'development') {
    return res
  }

  // crateServerClient is a helper that sets up a Supabase client with the right cookies for auth
  // Reads cookies from the request
  // Uses them to reconstruct the user session
  // Allows server-side auth checking
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: () => {}, // read-only in middleware (can't modify cookies)
      },
    }
  )

  // Check if user is logged in
  // Reads session from cookies
  // Validates it with Supabase Auth
  // Returns the authenticated user (or null)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {  // if not logged in, block access
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if user has housing_admin role
  const { data: profile } = await supabase  // Fetch user role from database
    .from('users')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (profile?.role !== 'housing_admin') {  // if logged in but not admin role
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return res
}

export const config = {
  // Covers all current and future admin routes
  matcher: ['/api/admin/:path*'],
}