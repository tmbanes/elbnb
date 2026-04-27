// app/admin/housing/page.tsx
import { Suspense } from "react";
import PropertiesContent from "./properties/PropertiesContent";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { getApiAuthenticatedUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";

import { supabaseAdmin } from "@/lib/supabase/admin-client";

export default async function PropertiesPage() {
  const user = await getApiAuthenticatedUser();
  if (!user || user.role !== "housing_admin") {
    redirect("/onboarding");
  }

  const supabase = supabaseAdmin;

  // Parallel fetch on the server
  const propertyQuery = `
    accommodation_id, name, location,
    accommodation_type, accommodation_status, total_capacity,
    manager_id,
    dormitory_manager!accommodation_manager_id_fkey (
      employee_id,
      users (first_name, last_name)
    ),
    dormitory (
      number_of_semestersAllowed,
      curfew_time,
      allowed_programs,
      term_type,
      separate_by_gender
    ),
    renting_space (
      property_type,
      allow_shortterm_stay,
      allow_longterm_stay,
      minimum_stay_days,
      maximum_stay_days,
      security_deposit_required
    ),
    unit (
      current_occupancy
    )
  `;

  const [dormsRes, rentalsRes, managersRes] = await Promise.all([
    supabase.from("accommodation")
      .select(propertyQuery)
      .eq("accommodation_type", "dormitory"),
    supabase.from("accommodation")
      .select(propertyQuery)
      .eq("accommodation_type", "renting_space"),
    supabase.from("dormitory_manager").select("employee_id")
  ]);

  const processProperties = (data: any[]) =>
    (data || []).map(item => ({
      ...item,
      units: item.unit || [],
      dormitory: Array.isArray(item.dormitory) ? item.dormitory[0] : item.dormitory,
      renting_space: Array.isArray(item.renting_space) ? item.renting_space[0] : item.renting_space,
      dormitory_manager: (() => {
        const dm = Array.isArray(item.dormitory_manager) ? item.dormitory_manager[0] : item.dormitory_manager;
        if (!dm) return null;
        return {
          ...dm,
          users: Array.isArray(dm.users) ? dm.users[0] : dm.users
        };
      })()
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
