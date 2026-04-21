import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin-client";

// GET /api/admin/housing/dorms          → all dorms
// GET /api/admin/housing/dorms?id=123   → single dorm with units + manager
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");

  if (id) {
    const { data, error } = await supabaseAdmin.rpc("get_dormitory_details", {
      p_accommodation_id: id,
    });
    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
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
      )
    `,
    )
    .eq("accommodation_type", "dormitory");

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/admin/housing/dorms
export async function POST(req: NextRequest) {
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
}

// PATCH /api/admin/housing/dorms?id=123
// Body: { accommodationFields: {...}, dormitoryFields: {...} }
export async function PATCH(req: NextRequest) {
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
}

// DELETE /api/admin/housing/dorms?id=123
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { data, error } = await supabaseAdmin.rpc("delete_accommodation", {
    p_accommodation_id: id,
  });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
