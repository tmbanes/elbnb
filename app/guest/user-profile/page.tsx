import { redirect } from 'next/navigation'
import { ProfileComponent } from '@/components/ui/profile-component'
import { getApiAuthenticatedUser } from '@/lib/auth/session'
import { createSupabaseServerClient } from '@/lib/supabase/server-client'

export default async function GuestProfilePage() {
  const user = await getApiAuthenticatedUser()
  if (!user) redirect("/");

  const supabase = await createSupabaseServerClient();
  const { data: dbMetadata } = await supabase
    .from('guest')
    .select('*')
    .eq('user_id', user.user_id)
    .single();

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
