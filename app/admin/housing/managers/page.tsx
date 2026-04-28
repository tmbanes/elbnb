import { Suspense } from "react";
import ManagersContent from "./ManagersPageContent";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { supabaseAdmin } from "@/lib/supabase/admin-client";
import { requireRole } from "@/lib/auth/session";

export default async function ManagersPage() {
  const user = await requireRole(['housing_admin', 'admin']);

  const supabase = await createSupabaseServerClient();
  // Use supabaseAdmin to bypass RLS and ensure the admin can see all managers
  const { data: managers, error } = await supabaseAdmin
    .from("dormitory_manager")
    .select("*, users(user_id, first_name, last_name, email)")
    .order("employee_id", { ascending: true });

  const mappedManagers = (managers || []).map((m: any) => ({
    ...m,
    users: Array.isArray(m.users) ? m.users[0] : m.users,
  }));

  return (
    <div className="min-h-screen p-8 bg-[#F6F8D5]">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="mb-8">
          <Suspense fallback={<p className="p-6">Loading managers...</p>}>
            <ManagersContent initialManagers={mappedManagers} initialError={error?.message || null} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
