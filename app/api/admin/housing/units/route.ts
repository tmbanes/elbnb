import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin-client";

// GET /api/admin/housing/units?accommodation_id=123  → all units for a property
// GET /api/admin/housing/units?id=123                → single unit
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  const accommodationId = req.nextUrl.searchParams.get("accommodation_id");

  if (id) {
    const { data, error } = await supabaseAdmin
      .from("unit")
      .select("*")
      .eq("unit_id", id)
      .single();
    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  if (accommodationId) {
    const { data, error } = await supabaseAdmin
      .from("unit")
      .select("*")
      .eq("accommodation_id", accommodationId);
    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  return NextResponse.json(
    { error: "Provide id or accommodation_id" },
    { status: 400 },
  );
}

// POST /api/admin/housing/units
// Body: { accommodation_id, unit_number, unit_type, max_occupancy,
//         rental_fee, billing_period, furnishing_status }
export async function POST(req: NextRequest) {
  const body = await req.json();

  const { data, error } = await supabaseAdmin
    .from("unit")
    .insert({
      accommodation_id: body.accommodation_id,
      unit_number: body.unit_number,
      unit_type: body.unit_type,
      max_occupancy: body.max_occupancy,
      rental_fee: body.rental_fee,
      billing_period: body.billing_period,
      furnishing_status: body.furnishing_status,
      current_occupancy: 0,
      is_active: true,
      unit_status: "active",
    })
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

// PATCH /api/admin/housing/units?id=123
export async function PATCH(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const body = await req.json();

  const { error } = await supabaseAdmin
    .from("unit")
    .update(body)
    .eq("unit_id", id);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

// DELETE /api/admin/housing/units?id=123
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  // Block if unit has active occupants
  const { data: unit } = await supabaseAdmin
    .from("unit")
    .select("current_occupancy")
    .eq("unit_id", id)
    .single();

  if (unit && unit.current_occupancy > 0) {
    return NextResponse.json(
      { error: "Cannot delete — this unit has active occupants." },
      { status: 409 },
    );
  }

  const { error } = await supabaseAdmin.from("unit").delete().eq("unit_id", id);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
