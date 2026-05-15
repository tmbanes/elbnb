import { redirect } from 'next/navigation'
import { ProfileComponent } from '@/components/ui/profile-component'
import { getApiAuthenticatedUser } from '@/lib/auth/session'
import { createSupabaseServerClient } from '@/lib/supabase/server-client'
import { supabaseAdmin } from '@/lib/supabase/admin-client'

export default async function StudentProfilePage() {
  const user = await getApiAuthenticatedUser()

  if (!user) {
    redirect("/");
  }

  // Fetch data from database and auth metadata
  const supabase = await createSupabaseServerClient();
  const { data: dbMetadata } = await supabaseAdmin  
    .from('student')
    .select('*')
    .eq('user_id', user.user_id)
    .single();

  // Merge: Database values take priority over auth metadata
  const mergedMetadata = {
    ...(user || {}),
    ...(dbMetadata || {})
  };

  // Fetch active assignment for the student
  const { data: assignmentData } = await supabaseAdmin
    .from('accommodation_assignment')
    .select('*, accommodation(*), unit(*)')
    .eq('user_id', user.user_id)
    .eq('assignment_status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  return (
    <main>
      <ProfileComponent
        user={user}
        metadata={mergedMetadata}
        currentAssignment={assignmentData}
      />
    </main>
  )
}