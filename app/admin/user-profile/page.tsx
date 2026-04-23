import { redirect } from 'next/navigation'
import { ProfileComponent } from '@/components/ui/profile-component'
import { getApiAuthenticatedUser } from '@/lib/auth/session'
import { createSupabaseServerClient } from '@/lib/supabase/server-client'

export default async function AdminProfilePage() {
  const auth = await getApiAuthenticatedUser()
  if ("error" in auth) redirect("/");

  const user = auth.user;
  if (user.role !== "housing_admin") redirect("/dashboard");

  const supabase = await createSupabaseServerClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  return (
    <main>
      <ProfileComponent 
        user={user} 
        metadata={authUser?.user_metadata} 
      />
    </main>
  )
}
