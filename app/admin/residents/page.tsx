// app/admin/residents/page.tsx
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { supabaseAdmin } from "@/lib/supabase/admin-client";
import { requireRole } from "@/lib/auth/session";
import ResidentsClient from "./ResidentsClient";

export default async function AdminResidentsPage() {
  const user = await requireRole(['housing_admin', 'admin']);
  const supabase = await createSupabaseServerClient();

  // Fetch initial residents data on the server - using admin client to bypass RLS
  const { data: residents, error } = await supabaseAdmin
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
      users:user_id ( first_name, last_name, email ),
      unit:unit_id (
        unit_id, unit_number, unit_type,
        accommodation:accommodation_id ( accommodation_id, name, location )
      )
    `)
    .order("move_in_date", { ascending: false });

  const mappedResidents = (residents || []).map((r: any) => ({
    ...r,
    users: Array.isArray(r.users) ? r.users[0] : r.users,
    unit: Array.isArray(r.unit) ? r.unit[0] : r.unit,
  }));

  return (
    <ResidentsClient
      initialResidents={mappedResidents}
      initialError={error?.message || null}
    />
  );
}
