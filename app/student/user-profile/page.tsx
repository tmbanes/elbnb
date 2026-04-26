import { redirect } from 'next/navigation'
import { ProfileComponent } from '@/components/ui/profile-component'
import { getApiAuthenticatedUser } from '@/lib/auth/session'
import { createSupabaseServerClient } from '@/lib/supabase/server-client'

export default async function StudentProfilePage() {
  const user = await getApiAuthenticatedUser()

  if (!user) {
    redirect("/");
  }

  // Fetch data from database and auth metadata
  const supabase = await createSupabaseServerClient();
  const { data: dbMetadata } = await supabase
    .from('student')
    .select('*')
    .eq('user_id', user.user_id)
    .single();

  // Merge: Database values take priority over auth metadata
  const mergedMetadata = {
    ...(user || {}),
    ...(dbMetadata || {})
  };

  return (
    <main>
      <ProfileComponent
        user={user}
        metadata={mergedMetadata}
      />
    </main>
  )
}