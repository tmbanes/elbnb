import { createSupabaseServerClient } from '@/lib/supabase/server-client'

export interface User {
  user_id: string
  email: string
  role: 'student' | 'guest' | 'dorm_manager' | 'admin'
  full_name?: string
  // Add other user properties from your users table
}

export async function getAuthenticatedUser(): Promise<User | null> {
  try {
    const supabase = await createSupabaseServerClient()
    
    // Get the authenticated user from Supabase Auth
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !authUser) {
      return null
    }

    // Fetch user details from your users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', authUser.id)
      .single()

    if (userError || !userData) {
      return null
    }

    return {
      user_id: userData.user_id,
      email: userData.email,
      role: userData.role,
      full_name: userData.full_name,
      // Map other fields as needed
    }
  } catch (error) {
    console.error('Error fetching authenticated user:', error)
    return null
  }
}