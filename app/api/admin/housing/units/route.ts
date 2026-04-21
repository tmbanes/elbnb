import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin-client";

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
    { status: 400 }
  );
}

export async function POST(req: NextRequest) {
  // TO DO: Protect this API route. Make this only accessible to admin (if admin lang talaga pwede maka-access nito).
  // const auth = await requireApiRole(['housing_admin']);

  // if ("error" in auth) {
  //   return NextResponse.json(
  //     { error: auth.error },
  //     { status: auth.status }
  //   );
  // }

  // const user = auth.user;
  const body = await req.json();

  const { data, error } = await supabaseAdmin
    .from("unit")
    .insert({
      accommodation_id: body.accommodation_id,
      unit_number: body.unit_number,
      unit_type: body.unit_type ?? null,
      max_occupancy: body.max_occupancy,
      rental_fee: body.rental_fee,
      billing_period: body.billing_period,
      furnishing_status: body.furnishing_status,
      min_stay_duration: body.min_stay_duration ?? null,
      max_stay_duration: body.max_stay_duration ?? null,
      current_occupancy: 0,
      unit_status: "active",
    })
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(req: NextRequest) {
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
  if (!id)
    return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const body = await req.json();
  const { error } = await supabaseAdmin
    .from("unit")
    .update(body)
    .eq("unit_id", id);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
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
  if (!id)
    return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { data: unit } = await supabaseAdmin
    .from("unit")
    .select("current_occupancy")
    .eq("unit_id", id)
    .single();

  if (unit && unit.current_occupancy > 0) {
    return NextResponse.json(
      { error: "Cannot delete — this unit has active occupants." },
      { status: 409 }
    );
  }

  const { error } = await supabaseAdmin
    .from("unit")
    .delete()
    .eq("unit_id", id);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}