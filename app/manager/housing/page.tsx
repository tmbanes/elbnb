import { Suspense } from "react";
import HousingContent from "./HousingContent";
import { getApiAuthenticatedUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";

export default async function HousingPage() {
  const user = await getApiAuthenticatedUser();

  if (!user || !["dormitory_manager", "housing_admin"].includes(user.role)) {
    redirect("/onboarding");
  }

  const supabase = await createSupabaseServerClient();

  // Fetch accommodations and units for this manager
  const { data: properties, error } = await supabase
    .from("accommodation")
    .select(`
      *,
      dormitory (*),
      renting_space (*),
      units:unit (*)
    `)
    .eq("manager_id", user.user_id);

  if (error) {
    console.error("Housing Fetch Error:", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    });
  }
  console.log(`Housing Page: Fetched ${properties?.length || 0} properties for manager ${user.user_id}`);

  if (error) {
    return (
      <div className="p-8 bg-red-50 text-red-700 font-mono">
        <h1 className="text-xl font-bold mb-4">Housing Fetch Error</h1>
        <pre className="whitespace-pre-wrap">{JSON.stringify(error, null, 2)}</pre>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-[#F6F8D5]">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="mb-8">
          <Suspense
            fallback={<p className="p-6 text-[#44291B] font-bold text-center">Loading Housing Dashboard...</p>}>
            <HousingContent properties={(properties || []) as any} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
