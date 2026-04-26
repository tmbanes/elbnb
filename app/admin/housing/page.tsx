// app/admin/housing/page.tsx
import { Suspense } from "react";
import PropertiesContent from "./properties/PropertiesContent";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { getApiAuthenticatedUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function PropertiesPage() {
  const user = await getApiAuthenticatedUser();
  if (!user || user.role !== "housing_admin") {
    redirect("/onboarding");
  }

  const supabase = await createSupabaseServerClient();

  // Parallel fetch on the server
  const [dormsRes, rentalsRes, managersRes] = await Promise.all([
    supabase.from("accommodation")
      .select("*, dormitory_manager(users(first_name, last_name))")
      .eq("accommodation_type", "dormitory"),
    supabase.from("accommodation")
      .select("*, dormitory_manager(users(first_name, last_name))")
      .eq("accommodation_type", "renting_space"),
    supabase.from("dormitory_manager").select("manager_id")
  ]);

  const processProperties = (data: any[]) => 
    (data || []).map(p => ({
      ...p,
      dormitory_manager: Array.isArray(p.dormitory_manager) ? p.dormitory_manager[0] : p.dormitory_manager,
      // Handle deeper nesting if needed
    })).map(p => ({
      ...p,
      dormitory_manager: p.dormitory_manager ? {
        ...p.dormitory_manager,
        users: Array.isArray(p.dormitory_manager.users) ? p.dormitory_manager.users[0] : p.dormitory_manager.users
      } : null
    }));

  const initialData = {
    properties: [...processProperties(dormsRes.data || []), ...processProperties(rentalsRes.data || [])],
    managerCount: managersRes.data?.length || 0
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-[#F6F8D5]">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="mb-8">
          <Suspense fallback={<p className="p-6">Loading properties...</p>}>
            <PropertiesContent initialData={initialData} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
