import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin-client";

// GET /api/admin/housing/rental-spaces          → all rental spaces
// GET /api/admin/housing/rental-spaces?id=123   → single rental space with units
export async function GET(req: NextRequest) {
  // TO DO: Protect this API route. Make this only accessible to admin (if admin lang talaga pwede maka-access nito).
  // const auth = await requireApiRole(['housing_admin']);

  // if ("error" in auth) {
  //   return NextResponse.json(
  //     { error: auth.error },
  //     { status: auth.status }
  //   );
  // }

  // const user = auth.user;
  const id = req.nextUrl.searchParams.get("id");

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
        renting_space (
          property_type,
          allow_shortterm_stay,
          allow_longterm_stay,
          minimum_stay_days,
          maximum_stay_days,
          security_deposit_required
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
      renting_space (
        property_type,
        allow_shortterm_stay,
        allow_longterm_stay,
        minimum_stay_days,
        maximum_stay_days,
        security_deposit_required
      )
    `,
    )
    .eq("accommodation_type", "renting_space");

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/admin/housing/rental-spaces
export async function POST(req: NextRequest) {
  const body = await req.json();

  const { data, error } = await supabaseAdmin.rpc("create_rental_space_full", {
    p_name: body.name,
    p_location: body.location,
    p_manager_id: body.manager_id,
    p_total_capacity: body.total_capacity,
    p_property_type: body.property_type,
    p_allow_shortterm_stay: body.allow_shortterm_stay,
    p_allow_longterm_stay: body.allow_longterm_stay,
    p_minimum_stay_days: body.minimum_stay_days ?? null,
    p_maximum_stay_days: body.maximum_stay_days ?? null,
    p_security_deposit_required: body.security_deposit_required,
  });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

// PATCH /api/admin/housing/rental-spaces?id=123
// Body: { accommodationFields: {...}, rentingFields: {...} }
export async function PATCH(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { accommodationFields, rentingFields } = await req.json();

  if (accommodationFields && Object.keys(accommodationFields).length > 0) {
    const { error } = await supabaseAdmin
      .from("accommodation")
      .update(accommodationFields)
      .eq("accommodation_id", id);
    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (rentingFields && Object.keys(rentingFields).length > 0) {
    const { error } = await supabaseAdmin
      .from("renting_space")
      .update(rentingFields)
      .eq("accommodation_id", id);
    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// DELETE /api/admin/housing/rental-spaces?id=123
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
