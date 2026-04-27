import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/auth/api-guard';

const ALL_ROLES = ['student', 'guest', 'housing_admin', 'dormitory_manager'] as const;

const roleConfig = {
  student: {
    table: 'student',
    allowedFields: ['student_num', 'degree_program', 'college', 'home_address', 'emergency_contact', 'enrollment_status', 'emergency_person'],
  },
  dormitory_manager: {
    table: 'dormitory_manager',
    allowedFields: ['employee_id', 'office_location'],
  },
  housing_admin: {
    table: 'housing_admin',
    allowedFields: ['admin_id', 'office_location'],
  },
  guest: {
    table: 'guest',
    allowedFields: ['valid_id', 'purpose_visit', 'occupancy_status'],
  },
} as const;

// Fields that belong to the main 'users' table
const USER_FIELDS = ['birthdate', 'sex', 'profile_picture_url', 'contact_number'];

// PATCH — update the authenticated user's profile
export const PATCH = withRole([...ALL_ROLES], async (req, { user }) => {
  try {
    const { createSupabaseServerClient } = await import('@/lib/supabase/server-client');
    const supabase = await createSupabaseServerClient();
    const body = await req.json();

    const config = roleConfig[user.role as keyof typeof roleConfig];

    if (!config) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }
    
    // 1. Separate updates for 'users' table and role-specific table
    const userUpdates: Record<string, any> = {};
    const roleUpdates: Record<string, any> = {};
    const metadataUpdates: Record<string, any> = {};

    // Handle 'users' table fields
    for (const field of USER_FIELDS) {
      if (body[field] !== undefined) {
        userUpdates[field] = body[field];
        metadataUpdates[field] = body[field];
      }
    }


    // Handle role-specific fields
    for (const field of config.allowedFields) {
      if (body[field] !== undefined) {
        roleUpdates[field] = body[field];
        metadataUpdates[field] = body[field];
      }
    }

    // 2. Perform Database Updates
    const { supabaseAdmin } = await import('@/lib/supabase/admin-client');

    if (Object.keys(userUpdates).length > 0) {
      const { error: userError } = await supabase
        .from('users')
        .update(userUpdates)
        .eq('user_id', user.user_id)
        .select('user_id');
      
      if (userError) {
        console.error("DEBUG: Users table update failed:", userError);
        throw userError;
      }
    }

    if (Object.keys(roleUpdates).length > 0) {
      const { error: roleError, count } = await supabaseAdmin
        .from(config.table)
        .update(roleUpdates)
        .eq('user_id', user.user_id)
        .select('user_id');
      
      if (roleError) {
        console.error("DEBUG: Role table update failed:", roleError);
        throw roleError;
      }
    }

    // 3. Update Auth Metadata to keep session in sync
    if (Object.keys(metadataUpdates).length > 0) {
      const { error: authError } = await supabase.auth.updateUser({
        data: metadataUpdates
      });
      if (authError) console.error("Auth metadata sync failed:", authError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Profile Update Error:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
});
