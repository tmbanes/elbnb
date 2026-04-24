import { redirect } from 'next/navigation'
import { ProfileComponent } from '@/components/ui/profile-component'
import { getApiAuthenticatedUser } from '@/lib/auth/session'
import { createSupabaseServerClient } from '@/lib/supabase/server-client'

export default async function StudentProfilePage() {
  const auth = await getApiAuthenticatedUser()

  if ("error" in auth) {
    redirect("/");
  }

  const user = auth.user;

  // Fetch data from database and auth metadata
  const supabase = await createSupabaseServerClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  const { data: dbMetadata } = await supabase
    .from('student')
    .select('*')
    .eq('user_id', user.user_id)
    .single();

  // Merge: Database values take priority over auth metadata
  const mergedMetadata = {
    ...(authUser?.user_metadata || {}),
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