"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { supabaseAdmin } from "@/lib/supabase/admin-client";
import { createActivityLog, getCurrentUserRole } from "@/services/activity_log/server";
import { revalidatePath } from "next/cache";

type UpdateResidentAction = "record-move-in" | "record-move-out" | "terminate";

export async function updateResidentStatus(assignmentId: string, action: UpdateResidentAction, date: string) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (!profile || !["dormitory_manager", "housing_admin", "admin"].includes(profile.role)) {
      return { success: false, error: "Forbidden" };
    }

    // Verify scope for manager
    if (profile.role === "dormitory_manager") {
      if (action === "terminate") {
        return { success: false, error: "Managers cannot terminate stays. Admins only." };
      }

      const { data: managerAccoms } = await supabaseAdmin
        .from("accommodation")
        .select("accommodation_id")
        .eq("manager_id", user.id);

      const managerAccomIds = (managerAccoms || []).map((a: any) => a.accommodation_id);

      const { data: assignment } = await supabaseAdmin
        .from("accommodation_assignment")
        .select("unit_id, unit:unit_id(accommodation_id)")
        .eq("assignment_id", assignmentId)
        .maybeSingle();

      const assignedAccomId = (assignment?.unit as any)?.accommodation_id;
      if (!assignment || !managerAccomIds.includes(assignedAccomId)) {
        return { success: false, error: "Assignment does not belong to your accommodations" };
      }
    }

    let updateData: Record<string, any> = {};

    if (action === "record-move-in") {
      updateData = { assignment_status: "active", move_in_date: date };
    } else if (action === "record-move-out") {
      updateData = { assignment_status: "completed", actual_move_out_date: date };
    } else if (action === "terminate") {
      updateData = { assignment_status: "terminated", actual_move_out_date: date };
    }

    const { error: updateErr } = await supabaseAdmin
      .from("accommodation_assignment")
      .update(updateData)
      .eq("assignment_id", assignmentId);

    if (updateErr) {
      return { success: false, error: updateErr.message };
    }

    // Log action
    const actor = await getCurrentUserRole();
    if (actor) {
      const { data: assignmentData } = await supabaseAdmin
        .from("accommodation_assignment")
        .select("user_id, users(first_name, last_name)")
        .eq("assignment_id", assignmentId)
        .single();

      const residentName = assignmentData?.users
        ? `${(assignmentData.users as any).first_name} ${(assignmentData.users as any).last_name}`
        : "Unknown Resident";

      let logAction = "terminate_assignment";
      let logDesc = "";

      if (action === "record-move-in") {
        logAction = "accept_assignment";
        logDesc = `${actor.first_name} recorded move-in for ${residentName}`;
      } else if (action === "record-move-out") {
        logAction = "terminate_assignment";
        logDesc = `${actor.first_name} recorded move-out for ${residentName}`;
      } else if (action === "terminate") {
        logAction = "terminate_assignment";
        logDesc = `${actor.first_name} terminated stay for ${residentName}`;
      }

      await createActivityLog({
        p_user_id: actor.userId,
        p_action_type: logAction,
        p_log_desc: logDesc,
        p_entity_type: "assignment",
        p_entity_id: assignmentId,
        p_user_role: actor.role,
      });
    }

    revalidatePath("/admin/residents");
    revalidatePath("/manager/residents");
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message || "Unexpected error" };
  }
}

export async function overrideResidentUnit(assignmentId: string, targetUnitNumber: string) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Unauthorized" };

    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (!profile || !["housing_admin", "admin"].includes(profile.role)) {
      return { success: false, error: "Admin role required to override units." };
    }

    if (!targetUnitNumber) {
      return { success: false, error: "Target unit number is required" };
    }

    const { data: targetUnit, error: unitErr } = await supabaseAdmin
      .from("unit")
      .select("unit_id")
      .eq("unit_number", targetUnitNumber)
      .maybeSingle();

    if (unitErr || !targetUnit) {
      return { success: false, error: `Unit '${targetUnitNumber}' not found` };
    }

    const { error: updateErr } = await supabaseAdmin
      .from("accommodation_assignment")
      .update({ unit_id: targetUnit.unit_id })
      .eq("assignment_id", assignmentId);

    if (updateErr) {
      return { success: false, error: updateErr.message };
    }

    // Log action
    const actor = await getCurrentUserRole();
    if (actor) {
      const { data: assignmentData } = await supabaseAdmin
        .from("accommodation_assignment")
        .select("users(first_name, last_name)")
        .eq("assignment_id", assignmentId)
        .single();

      const residentName = assignmentData?.users
        ? `${(assignmentData.users as any).first_name} ${(assignmentData.users as any).last_name}`
        : "Unknown Resident";

      await createActivityLog({
        p_user_id: actor.userId,
        p_action_type: "reassign_assignment",
        p_log_desc: `${actor.first_name} reassigned ${residentName} to unit ${targetUnitNumber}`,
        p_entity_type: "assignment",
        p_entity_id: assignmentId,
        p_user_role: actor.role,
      });
    }

    revalidatePath("/admin/residents");
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message || "Unexpected error" };
  }
}
