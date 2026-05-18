import { withRole } from "@/lib/auth/api-guard";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin-client";

// GET /api/housing/managers          → all managers
// GET /api/housing/managers?id=123   → single manager
export const GET = withRole(['housing_admin'], async (req: NextRequest) => {
  const id = req.nextUrl.searchParams.get("id");

  if (id) {
    const { data, error } = await supabaseAdmin
      .from("dormitory_manager")
      .select(
        `
        employee_id,
        office_location,
        users (user_id, first_name, last_name, email, role)
      `,
      )
      .eq("employee_id", id)
      .single();

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  const { data, error } = await supabaseAdmin.from("dormitory_manager").select(`
      employee_id,
      office_location,
      users (user_id, first_name, last_name, email, role),
      accommodation:accommodation(name)
    `);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
});

// POST /api/housing/managers
// Body (existing user): { user_id, office_location }
export const POST = withRole(['housing_admin'], async (req: NextRequest) => {
  const body = await req.json();

  const { data, error } = await supabaseAdmin.rpc("create_dormitory_manager", {
    p_user_id: body.user_id ?? null,
    p_first_name: body.first_name ?? null,
    p_last_name: body.last_name ?? null,
    p_email: body.email ?? null,
    p_office_location: body.office_location,
  });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
});

// PATCH /api/housing/managers?id=123
export const PATCH = withRole(['housing_admin'], async (req: NextRequest) => {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { managerFields, userFields, user_id } = await req.json();

  if (managerFields && Object.keys(managerFields).length > 0) {
    const { error } = await supabaseAdmin
      .from("dormitory_manager")
      .update(managerFields)
      .eq("employee_id", id);
    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (userFields && user_id && Object.keys(userFields).length > 0) {
    const { error } = await supabaseAdmin
      .from("users")
      .update(userFields)
      .eq("user_id", user_id);
    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
});

// DELETE /api/housing/managers?id=123
export const DELETE = withRole(['housing_admin'], async (req: NextRequest) => {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  // Block if manager is still assigned to an active accommodation
  const { data: assigned } = await supabaseAdmin
    .from("accommodation")
    .select("accommodation_id")
    .eq("manager_id", id)
    .eq("accommodation_status", "active");

  if (assigned && assigned.length > 0) {
    return NextResponse.json(
      { error: "Cannot delete — this manager is assigned to an active property." },
      { status: 409 },
    );
  }

  // Get user_id before deleting
  const { data: manager, error: fetchError } = await supabaseAdmin
    .from("dormitory_manager")
    .select("user_id")
    .eq("employee_id", id)
    .single();

  if (fetchError)
    return NextResponse.json({ error: fetchError.message }, { status: 500 });

  const userId = manager.user_id;

  // 1. Delete from dormitory_manager
  const { error: deleteManagerError } = await supabaseAdmin
    .from("dormitory_manager")
    .delete()
    .eq("employee_id", id);

  if (deleteManagerError)
    return NextResponse.json({ error: deleteManagerError.message }, { status: 500 });

  // 2. Delete from users table
  const { error: deleteUserError } = await supabaseAdmin
    .from("users")
    .delete()
    .eq("user_id", userId);

  if (deleteUserError)
    return NextResponse.json({ error: deleteUserError.message }, { status: 500 });

  // 3. Delete from Supabase Auth — fixes "already used" error on recreate
  const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(userId);

  if (deleteAuthError)
    return NextResponse.json({ error: deleteAuthError.message }, { status: 500 });

  return NextResponse.json({ success: true });
});