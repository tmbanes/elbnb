import { supabaseAdmin } from "@/lib/supabase/admin-client";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";

export class ResidentsService {
  /**
   * Fetch all residents for an admin.
   * Can optionally filter by a specific unit_id.
   */
  static async getResidentsForAdmin(unitId?: string) {
    let query = supabaseAdmin
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
        users:user_id ( first_name, last_name, email, profile_picture_url ),
        unit:unit_id (
          unit_id, unit_number, unit_type,
          accommodation:accommodation_id ( accommodation_id, name, location )
        )
      `);

    if (unitId) {
      query = query.eq("unit_id", unitId);
    }

    const { data: assignments, error } = await query.order("move_in_date", { ascending: false });

    if (error) {
      console.error("Admin residents fetch error:", error.message);
      throw new Error(error.message);
    }

    return (assignments || []).map((r: any) => ({
      ...r,
      users: Array.isArray(r.users) ? r.users[0] : r.users,
      unit: Array.isArray(r.unit) ? r.unit[0] : r.unit,
    }));
  }

  /**
   * Fetch all residents strictly assigned to accommodations managed by the given manager ID.
   */
  static async getResidentsForManager(managerId: string) {
    // 1. Get ALL accommodations managed by this user
    const { data: accommodations, error: accomError } = await supabaseAdmin
      .from("accommodation")
      .select("accommodation_id, name, location")
      .eq("manager_id", managerId);

    if (accomError) {
      console.error("Manager accommodations fetch error:", accomError.message);
      throw new Error(accomError.message);
    }

    if (!accommodations || accommodations.length === 0) {
      return { residents: [], accommodations: [] };
    }

    const accommodationIds = accommodations.map((a: any) => a.accommodation_id);

    // 2. Fetch units for these accommodations
    const { data: units, error: unitsErr } = await supabaseAdmin
      .from("unit")
      .select("unit_id")
      .in("accommodation_id", accommodationIds);

    if (unitsErr) {
      throw new Error(unitsErr.message);
    }

    const unitIds = (units ?? []).map((u: any) => u.unit_id);

    if (unitIds.length === 0) {
      return { residents: [], accommodations };
    }

    // 3. Fetch assignments
    const { data: assignments, error } = await supabaseAdmin
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
        users:user_id ( first_name, last_name, email, profile_picture_url ),
        unit:unit_id (
          unit_id, unit_number, unit_type,
          accommodation:accommodation_id ( accommodation_id, name, location )
        )
      `)
      .in("unit_id", unitIds)
      .order("move_in_date", { ascending: false });

    if (error) {
      console.error("Manager residents fetch error:", error.message);
      throw new Error(error.message);
    }

    const mappedAssignments = (assignments || []).map((asg: any) => ({
      ...asg,
      users: Array.isArray(asg.users) ? asg.users[0] : asg.users,
      unit: {
        ...asg.unit,
        accommodation: Array.isArray(asg.unit?.accommodation) ? asg.unit.accommodation[0] : asg.unit?.accommodation
      }
    }));

    return { residents: mappedAssignments, accommodations };
  }
}
