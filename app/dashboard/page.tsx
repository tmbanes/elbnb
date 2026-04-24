import { redirect } from 'next/navigation'
import { ProfileComponent } from '@/components/ui/profile-component'
import { getApiAuthenticatedUser } from '@/lib/auth/session'
import { createSupabaseServerClient } from '@/lib/supabase/server-client'

export default async function DashboardPage() {
  const auth = await getApiAuthenticatedUser()
  if ("error" in auth) {
    redirect("/");
  }

  const user = auth.user;

  // Fetch metadata from supabase auth
  const supabase = await createSupabaseServerClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (user.role === "student" || user.role === "guest" || user.role === "dormitory_manager") {
    return (
      <ProfileComponent user={user} metadata={authUser?.user_metadata} />
    )
  }

  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p>Other role dashboards can be implemented here.</p>
    </div>
  )
}