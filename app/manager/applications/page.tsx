import { getApiAuthenticatedUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import ManagerApplicationsClient from "./ManagerApplicationsClient";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";

export default async function ManagerApplicationsPage() {
  const user = await getApiAuthenticatedUser();

  if (!user || user.role !== "dormitory_manager") {
    redirect("/onboarding");
  }

  const supabase = await createSupabaseServerClient();

  // 1. Get the accommodation assigned to this manager
  const { data: accommodationData, error: managerError } = await supabase
    .from("accommodation")
    .select("accommodation_id, name")
    .eq("manager_id", user.user_id)
    .single();

  if (managerError || !accommodationData) {
    // If no accommodation, we'll pass empty data to the client to handle
    return (
      <ManagerApplicationsClient
        user={user}
        initialData={{
          accommodation: { accommodation_id: "", name: "No Accommodation Assigned" },
          applications: [],
          units: []
        }}
      />
    );
  }

  const accommodationId = accommodationData.accommodation_id;

  // 2. Fetch applications and units in parallel
  const [appsRes, unitsRes] = await Promise.all([
    supabase
      .from("accommodation_application")
      .select(`
        application_id,
        preferred_accommodation_id,
        preferred_unit_type,
        date_submitted,
        duration_of_stay,
        check_in,
        check_out,
        number_of_companions,
        application_status,
        user_id,
        file,
        users (
          first_name,
          last_name,
          email
        )
      `)
      .eq("preferred_accommodation_id", accommodationId)
      .eq("application_status", "pending_dorm_manager")
      .order("date_submitted", { ascending: false }),
    supabase
      .from("unit")
      .select("unit_id, unit_number")
      .eq("accommodation_id", accommodationId)
  ]);

  const initialData = {
    accommodation: accommodationData,
    applications: (appsRes.data || []).map((app: any) => ({
      ...app,
      users: Array.isArray(app.users) ? app.users[0] : app.users
    })),
    units: unitsRes.data || []
  };

  return <ManagerApplicationsClient user={user} initialData={initialData as any} />;
}
