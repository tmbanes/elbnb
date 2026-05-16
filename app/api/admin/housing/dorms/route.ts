import { withRole } from "@/lib/auth/api-guard";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin-client";

// GET /api/housing/dorms          → all dorms
// GET /api/housing/dorms?id=123   → single dorm with units + manager
export const GET = withRole(['housing_admin'], async (req: NextRequest) => {
  const id = req.nextUrl.searchParams.get("id");

  //replace custom function to query
  if (id) {
    const { data, error } = await supabaseAdmin
      .from("accommodation")
      .select(
        `
        accommodation_id, name, location,
        accommodation_type, accommodation_status, total_capacity,
        manager_id,
        dormitory_manager!accommodation_manager_id_fkey (
          employee_id,
          users (first_name, last_name, email)
        ),
        dormitory (
          number_of_semestersAllowed,
          curfew_time,
          allowed_programs,
          term_type,
          separate_by_gender
        ),
        unit (
          unit_id, unit_number, unit_type,
          max_occupancy, current_occupancy,
          rental_fee, unit_status
        )
      `,
      )
      .eq("accommodation_id", id)
      .single();

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });

    // Rename 'unit' to 'units' for consistency
    const response = data && data.unit ? { ...data, units: data.unit } : data;
    return NextResponse.json(response);
  }

  const { data, error } = await supabaseAdmin
    .from("accommodation")
    .select(
      `
      accommodation_id, name, location,
      accommodation_type, accommodation_status, total_capacity,
      manager_id,
      dormitory_manager!accommodation_manager_id_fkey (
        employee_id,
        users (first_name, last_name, email)
      ),
      dormitory (
        number_of_semestersAllowed,
        curfew_time,
        allowed_programs,
        term_type,
        separate_by_gender
      ),
      unit (
        current_occupancy
      )
    `,
    )
    .eq("accommodation_type", "dormitory");

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  const response = data?.map((item: any) => ({
    ...item,
    dormitory: Array.isArray(item.dormitory) ? item.dormitory[0] : item.dormitory,
    dormitory_manager: Array.isArray(item.dormitory_manager) ? item.dormitory_manager[0] : item.dormitory_manager,
    units: item.unit || []
  }));

  return NextResponse.json(response);
});

// POST /api/housing/dorms
export const POST = withRole(['housing_admin'], async (req: NextRequest) => {
  const body = await req.json();

  const { data, error } = await supabaseAdmin.rpc("create_dormitory_full", {
    p_name: body.name,
    p_location: body.location,
    p_manager_id: body.manager_id,
    p_total_capacity: body.total_capacity,
    p_number_of_semesters_allowed: body.number_of_semesters_allowed,
    p_curfew_time: body.curfew_time ?? null,
    p_allowed_programs: body.allowed_programs ?? null,
    p_term_type: body.term_type,
    p_separate_by_gender: body.separate_by_gender,
  });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
});

// PATCH /api/housing/dorms?id=123
// Body: { accommodationFields: {...}, dormitoryFields: {...} }
export const PATCH = withRole(['housing_admin'], async (req: NextRequest) => {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { accommodationFields, dormitoryFields } = await req.json();

  if (accommodationFields && Object.keys(accommodationFields).length > 0) {
    const { error } = await supabaseAdmin
      .from("accommodation")
      .update(accommodationFields)
      .eq("accommodation_id", id);
    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (dormitoryFields && Object.keys(dormitoryFields).length > 0) {
    const { error } = await supabaseAdmin
      .from("dormitory")
      .update(dormitoryFields)
      .eq("accommodation_id", id);
    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
});

// DELETE /api/housing/dorms?id=123
export const DELETE = withRole(['housing_admin'], async (req: NextRequest) => {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { data, error } = await supabaseAdmin.rpc("delete_accommodation", {
    p_accommodation_id: id,
  });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
});
