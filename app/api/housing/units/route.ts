import { withRole } from "@/lib/auth/api-guard";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin-client";
import { createActivityLog } from "@/services/activity_log/server";

export const GET = withRole(['housing_admin', 'admin'], async (req: NextRequest) => {
  const id = req.nextUrl.searchParams.get("id");
  const accommodationId = req.nextUrl.searchParams.get("accommodation_id");

  if (id) {
    const { data, error } = await supabaseAdmin.from("unit").select("*").eq("unit_id", id).single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  if (accommodationId) {
    const { data, error } = await supabaseAdmin.from("unit").select("*").eq("accommodation_id", accommodationId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  return NextResponse.json({ error: "Provide id or accommodation_id" }, { status: 400 });
});

export const POST = withRole(['housing_admin', 'admin'], async (req: NextRequest, { user }) => {
  const body = await req.json();

  const { data: lastUnit, error: fetchError } = await supabaseAdmin
    .from("unit").select("unit_number").eq("accommodation_id", body.accommodation_id)
    .order("unit_number", { ascending: false }).limit(1).maybeSingle();

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });

  let maxNumber = -1;
  if (lastUnit?.unit_number) {
    const parsed = parseInt(lastUnit.unit_number);
    if (!isNaN(parsed)) maxNumber = parsed;
  }

  const numberOfUnits = parseInt(body.number_of_units) || 1;
  const units = [];

  for (let i = 0; i < numberOfUnits; i++) {
    const nextNumber = maxNumber + 1 + i;
    units.push({
      accommodation_id: body.accommodation_id, unit_type: body.unit_type ?? null,
      max_occupancy: body.max_occupancy, rental_fee: body.rental_fee,
      billing_period: body.billing_period, furnishing_status: body.furnishing_status,
      min_stay_duration: body.min_stay_duration ?? null, max_stay_duration: body.max_stay_duration ?? null,
      current_occupancy: 0, unit_status: "active", unit_number: nextNumber.toString(),
    });
  }

  const { data, error } = await supabaseAdmin.from("unit").insert(units).select();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Automatically recalculate and update parent accommodation total_capacity
  const { data: allUnits } = await supabaseAdmin
    .from("unit")
    .select("max_occupancy")
    .eq("accommodation_id", body.accommodation_id);
  const totalCapacity = (allUnits || []).reduce((sum: number, u: any) => sum + (Number(u.max_occupancy) || 0), 0);
  await supabaseAdmin
    .from("accommodation")
    .update({ total_capacity: totalCapacity })
    .eq("accommodation_id", body.accommodation_id);

  const actorName = `${user.first_name} ${user.last_name}`;
  await createActivityLog({
    p_user_id: user.user_id,
    p_action_type: "update_accomm" as any,
    p_entity_type: "accommodation",
    p_entity_id: body.accommodation_id,
    p_log_desc: `${actorName} added ${numberOfUnits} unit(s) of type "${body.unit_type}" to accommodation.`,
    p_user_role: user.role as any,
  });

  return NextResponse.json(data, { status: 201 });
});

export const PATCH = withRole(['housing_admin', 'admin'], async (req: NextRequest, { user }) => {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const body = await req.json();

  // Get accommodation_id first so we can link the log to the accommodation
  const { data: unitData } = await supabaseAdmin.from("unit").select("accommodation_id").eq("unit_id", id).maybeSingle();
  const accommodationId = unitData?.accommodation_id || id;

  const { error } = await supabaseAdmin.from("unit").update(body).eq("unit_id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  
  // Automatically recalculate and update parent accommodation total_capacity
  const { data: allUnits } = await supabaseAdmin
    .from("unit")
    .select("max_occupancy")
    .eq("accommodation_id", accommodationId);
  const totalCapacity = (allUnits || []).reduce((sum: number, u: any) => sum + (Number(u.max_occupancy) || 0), 0);
  await supabaseAdmin
    .from("accommodation")
    .update({ total_capacity: totalCapacity })
    .eq("accommodation_id", accommodationId);

  const actorName = `${user.first_name} ${user.last_name}`;
  await createActivityLog({
    p_user_id: user.user_id,
    p_action_type: "update_accomm" as any,
    p_entity_type: "accommodation",
    p_entity_id: accommodationId,
    p_log_desc: `${actorName} updated unit fields: ${Object.keys(body).join(", ")}.`,
    p_user_role: user.role as any,
  });
  return NextResponse.json({ success: true });
});

export const DELETE = withRole(['housing_admin', 'admin'], async (req: NextRequest, { user }) => {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const { data: unit } = await supabaseAdmin.from("unit").select("current_occupancy, accommodation_id").eq("unit_id", id).maybeSingle();
  if (unit && unit.current_occupancy > 0) return NextResponse.json({ error: "Cannot delete — active occupants." }, { status: 409 });
  const accommodationId = unit?.accommodation_id || id;

  const { error } = await supabaseAdmin.from("unit").delete().eq("unit_id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  
  // Automatically recalculate and update parent accommodation total_capacity
  const { data: allUnits } = await supabaseAdmin
    .from("unit")
    .select("max_occupancy")
    .eq("accommodation_id", accommodationId);
  const totalCapacity = (allUnits || []).reduce((sum: number, u: any) => sum + (Number(u.max_occupancy) || 0), 0);
  await supabaseAdmin
    .from("accommodation")
    .update({ total_capacity: totalCapacity })
    .eq("accommodation_id", accommodationId);

  const actorName = `${user.first_name} ${user.last_name}`;
  await createActivityLog({
    p_user_id: user.user_id,
    p_action_type: "update_accomm" as any,
    p_entity_type: "accommodation",
    p_entity_id: accommodationId,
    p_log_desc: `${actorName} deleted unit ${id}.`,
    p_user_role: user.role as any,
  });
  return NextResponse.json({ success: true });
});
