import { Suspense } from "react";
import HousingContent from "./HousingContent";
import { getApiAuthenticatedUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { supabaseAdmin } from "@/lib/supabase/admin-client";
import { Archivo_Black } from "next/font/google";

const archivoBlack = Archivo_Black({ subsets: ["latin"], weight: "400" });

export default async function HousingPage() {
  const user = await getApiAuthenticatedUser();

  if (!user || !user.role || !["dormitory_manager", "housing_admin"].includes(user.role)) {
    redirect("/onboarding");
  }

  const supabase = await createSupabaseServerClient();

  // Fetch accommodations and units for this manager
  const [propRes, adminRes] = await Promise.all([
    supabase
      .from("accommodation")
      .select(`
        *,
        dormitory (*),
        renting_space (*),
        units:unit (*)
      `)
      .eq("manager_id", user.user_id),
    supabaseAdmin
      .from("housing_admin")
      .select(`
        user_id,
        accommodation_ids,
        users (
          first_name,
          last_name,
          email,
          contact_number
        )
      `)
  ]);

  if (propRes.error) {
    console.error("Housing Fetch Error:", propRes.error);
    return (
      <div className="p-8 bg-red-50 text-red-700 font-mono">
        <h1 className="text-xl font-bold mb-4">Housing Fetch Error</h1>
        <pre className="whitespace-pre-wrap">{JSON.stringify(propRes.error, null, 2)}</pre>
      </div>
    );
  }

  const properties = propRes.data || [];
  const admins = adminRes.data || [];

  const propertiesWithAdmins = properties.map((prop: any) => {
    const assigned = admins
      .filter((admin: any) => {
        const ids = admin.accommodation_ids || [];
        return ids.includes(prop.accommodation_id);
      })
      .map((admin: any) => {
        const u = Array.isArray(admin.users) ? admin.users[0] : admin.users;
        return u ? { name: `${u.first_name} ${u.last_name}`, email: u.email, contact: u.contact_number } : null;
      })
      .filter(Boolean) as { name: string; email: string; contact?: string }[];

    return {
      ...prop,
      assignedAdmins: assigned,
    };
  });

  return (
    <div className="h-[100dvh] flex overflow-hidden bg-[#F6F8D5] font-[family-name:var(--font-archivo)]">
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 overflow-y-auto scrollbar-hide px-4 md:px-12 lg:px-20 xl:px-36 pt-10 pb-6">
          <div className="flex flex-col gap-6 max-w-7xl w-full">
            <div className="flex-shrink-0">
              <h1 className={`${archivoBlack.className} pt-6 text-3xl md:text-5xl text-[#44291B] tracking-tight`}>
                Property Management
              </h1>
              <p className="text-sm text-[#44291B]/60 font-medium mt-2">
                Manage your assigned accommodations, units, and details
              </p>
            </div>

            <div>
              <Suspense
                fallback={<p className="p-6 text-[#44291B] font-bold text-center">Loading Housing Dashboard...</p>}>
                <HousingContent properties={propertiesWithAdmins as any} />
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
