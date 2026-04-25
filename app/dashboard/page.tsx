import { redirect } from 'next/navigation'
import { getApiAuthenticatedUser } from '@/lib/auth/session'
import { User } from '@/types/user.types'

export default async function DashboardPage() {
  const user = await getApiAuthenticatedUser()
  if (!user) {
    redirect("/onboarding");
  }

  if (!user.role) redirect("/role-selection");

  // Fetch metadata from supabase auth
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