import { redirect } from 'next/navigation'
import { ProfileComponent } from '@/components/ui/profile-component'
import { getApiAuthenticatedUser } from '@/lib/auth/session'
import { createSupabaseServerClient } from '@/lib/supabase/server-client'

export default async function ManagerProfilePage() {
  const auth = await getApiAuthenticatedUser()
  if ("error" in auth) redirect("/");

  const user = auth.user;
  if (user.role !== "dormitory_manager") redirect("/dashboard");

  const supabase = await createSupabaseServerClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  const { data: dbMetadata } = await supabase
    .from('dormitory_manager')
    .select('*')
    .eq('user_id', user.user_id)
    .single();

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
