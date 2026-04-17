import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server-client'
import { User } from '@/types/user.types'

// // Just get the user ID of the currently authenticated user !!DELETE: already have a route for this in @/lib/auth/get-user [DOUBLE CHECK] !!
// export async function GET() {
//   const supabase = await createSupabaseServerClient()

//   const {data: { user },
//     error,
//   } = await supabase.auth.getUser()

//   if (error || !user) {
//     return NextResponse.json({ user: null }, { status: 401 })
//   }

//   console.log('Authenticated user:', user)

//   // get user object from database to retrieve role
//   const { data: userData, error: userError } = await supabase
//     .from('users')
//     .select('*')
//     .eq('user_id', user.id)
//     .single()

//   return NextResponse.json({
//     user: userData as User
//   })
// }