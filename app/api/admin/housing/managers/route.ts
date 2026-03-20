import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin-client'

// GET /api/admin/housing/managers          → all managers
// GET /api/admin/housing/managers?id=123   → single manager
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')

  if (id) {
    const { data, error } = await supabaseAdmin
      .from('dormitory_manager')
      .select(`
        employee_id,
        office_location,
        users (user_id, first_name, last_name, email, role)
      `)
      .eq('employee_id', id)
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  const { data, error } = await supabaseAdmin
    .from('dormitory_manager')
    .select(`
      employee_id,
      office_location,
      users (user_id, first_name, last_name, email, role)
    `)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST /api/admin/housing/managers
// Body (new user):      { first_name, last_name, email, office_location }
// Body (existing user): { user_id, office_location }
export async function POST(req: NextRequest) {
  const body = await req.json()

  const { data, error } = await supabaseAdmin.rpc('create_dormitory_manager', {
    p_user_id:         body.user_id ?? null,
    p_first_name:      body.first_name ?? null,
    p_last_name:       body.last_name ?? null,
    p_email:           body.email ?? null,
    p_office_location: body.office_location,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

// PATCH /api/admin/housing/managers?id=123
// Body: any fields on dormitory_manager or users table
export async function PATCH(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const { managerFields, userFields, user_id } = await req.json()

  if (managerFields && Object.keys(managerFields).length > 0) {
    const { error } = await supabaseAdmin
      .from('dormitory_manager')
      .update(managerFields)
      .eq('employee_id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Update users table if name/email is being changed
  if (userFields && user_id && Object.keys(userFields).length > 0) {
    const { error } = await supabaseAdmin
      .from('users')
      .update(userFields)
      .eq('user_id', user_id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

// DELETE /api/admin/housing/managers?id=123
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  // Block if manager is still assigned to an active accommodation
  const { data: assigned } = await supabaseAdmin
    .from('accommodation')
    .select('accommodation_id')
    .eq('manager_id', id)
    .eq('accommodation_status', 'active')

  if (assigned && assigned.length > 0) {
    return NextResponse.json(
      { error: 'Cannot delete — this manager is assigned to an active property.' },
      { status: 409 }
    )
  }

  const { error } = await supabaseAdmin
    .from('dormitory_manager')
    .delete()
    .eq('employee_id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}