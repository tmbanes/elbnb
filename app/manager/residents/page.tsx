import { getApiAuthenticatedUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import ManagerResidentsClient from "./ManagerResidentsClient";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";

export default async function ManagerResidentsPage() {
  const user = await getApiAuthenticatedUser();

  if (!user || !user.role || !["dormitory_manager", "housing_admin"].includes(user.role)) {
    redirect("/onboarding");
  }

  const supabase = await createSupabaseServerClient();

  // 1. Get ALL accommodations managed by this user
  const { data: accommodations, error: accomError } = await supabase
    .from("accommodation")
    .select("accommodation_id, name, location")
    .eq("manager_id", user.user_id);

  if (accomError || !accommodations || accommodations.length === 0) {
    return (
      <ManagerResidentsClient 
        initialResidents={[]} 
        initialAccommodations={[]} 
      />
    );
  }

  const accommodationIds = accommodations.map((a: any) => a.accommodation_id);

  // 2. Fetch units and then assignments (OR use a nested join)
  // To keep it simple and fast, we'll fetch assignments directly using a join
  const { data: assignments, error } = await supabase
    .from("accommodation_assignment")
    .select(`
      assignment_id,
      application_id,
      unit_id,
      user_id,
      move_in_date,
      expected_move_out_date,
      actual_move_out_date,
      assignment_status,
      users:user_id (
        first_name, last_name, email
      ),
      unit:unit_id (
        unit_id, unit_number, unit_type,
        accommodation:accommodation_id (
          accommodation_id, name, location
        )
      )
    `)
    .in("unit.accommodation_id", accommodationIds) // This filter works if RLS or direct query allows
    .order("move_in_date", { ascending: false });

  // Fallback: If the nested filter fails due to Supabase query limitations, 
  // we fetch unit IDs first (as done in the API route).
  let finalAssignments = assignments;
  if (error) {
    const { data: units } = await supabase
      .from("unit")
      .select("unit_id")
      .in("accommodation_id", accommodationIds);
    
    const unitIds = (units || []).map((u: any) => u.unit_id);
    
    if (unitIds.length > 0) {
      const { data: retryAssignments } = await supabase
        .from("accommodation_assignment")
        .select(`
          assignment_id,
          application_id,
          unit_id,
          user_id,
          move_in_date,
          expected_move_out_date,
          actual_move_out_date,
          assignment_status,
          users:user_id (
            first_name, last_name, email
          ),
          unit:unit_id (
            unit_id, unit_number, unit_type,
            accommodation:accommodation_id (
              accommodation_id, name, location
            )
          )
        `)
        .in("unit_id", unitIds)
        .order("move_in_date", { ascending: false });
      finalAssignments = retryAssignments;
    }
  }

  // Flatten users and units for the client
  const residents = (finalAssignments || []).map((asg: any) => ({
    ...asg,
    users: Array.isArray(asg.users) ? asg.users[0] : asg.users,
    unit: {
      ...asg.unit,
      accommodation: Array.isArray(asg.unit?.accommodation) ? asg.unit.accommodation[0] : asg.unit?.accommodation
    }
  }));

  return (
    <ManagerResidentsClient 
      initialResidents={residents} 
      initialAccommodations={accommodations} 
    />
  );
}
