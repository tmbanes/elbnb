import { Suspense } from "react";
import PropertiesContent from "./properties/PropertiesContent";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { requireRole } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase/admin-client";
import { HousingService } from "@/services/unit_accommodation/housing.service";

export default async function PropertiesPage() {
  const user = await requireRole(['housing_admin', 'admin']);

  // Parallel fetch on the server using HousingService to respect admin assignment limits
  const [dormsRes, rentalsRes, managersRes, allManagersRes] = await Promise.all([
    HousingService.getAllDorms(user),
    HousingService.getAllRentalSpaces(user),
    HousingService.getAssignedManagers(user),
    HousingService.getAllManagers()
  ]);

  const initialData = {
    properties: [...(dormsRes || []), ...(rentalsRes || [])],
    assignedManagerCount: managersRes?.length || 0,
    totalManagerCount: allManagersRes?.length || 0,
    allManagers: allManagersRes || []
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
