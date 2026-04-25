import { redirect } from 'next/navigation'
import { ProfileComponent } from '@/components/ui/profile-component'
import Link from 'next/link'
import { ProfileUpload } from './ProfileUpload'
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

  if (user.role === "student") redirect("/student/dashboard");
  if (user.role === "guest") redirect("/guest/dashboard");
  if (user.role === "dormitory_manager") redirect("/manager/dashboard");
  if (user.role === "housing_admin") redirect("/admin/dashboard");

  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p>Other role dashboards can be implemented here.</p>
    </div>
  )
}