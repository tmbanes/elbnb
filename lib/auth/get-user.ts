import { createSupabaseServerClient } from '@/lib/supabase/server-client'
import { User } from '@/types/user.types'

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
    return (userData)
  } catch (error) {
    console.error('Error fetching authenticated user:', error)
    return null
  }
}