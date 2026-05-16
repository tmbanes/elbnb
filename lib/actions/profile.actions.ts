"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { revalidatePath } from "next/cache";

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
    allowedFields: ['valid_id', 'purpose_visit', 'emergency_person', 'emergency_contact', 'home_address'],
  },
} as const;

const USER_FIELDS = ['birthdate', 'sex', 'profile_picture_url', 'contact_number'];

export async function updateProfileAction(body: any) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  // We read the role from user_metadata or fallback to checking the user object
  const userRole = user.user_metadata?.role || (user as any).role;
  const config = roleConfig[userRole as keyof typeof roleConfig];

  if (!config) throw new Error('Invalid role');

  const userUpdates: Record<string, any> = {};
  const roleUpdates: Record<string, any> = {};
  const metadataUpdates: Record<string, any> = {};

  for (const field of USER_FIELDS) {
    if (body[field] !== undefined) {
      userUpdates[field] = body[field];
      metadataUpdates[field] = body[field];
    }
  }

  for (const field of config.allowedFields) {
    if (body[field] !== undefined) {
      roleUpdates[field] = body[field];
      metadataUpdates[field] = body[field];
    }
  }

  if (Object.keys(userUpdates).length > 0) {
    const { error: userError } = await supabase
      .from('users')
      .update(userUpdates)
      .eq('user_id', user.id);
    if (userError) throw new Error(userError.message);
  }

  if (Object.keys(roleUpdates).length > 0) {
    const { error: roleError } = await supabase
      .from(config.table)
      .update(roleUpdates)
      .eq('user_id', user.id);
    if (roleError) throw new Error(roleError.message);
  }

  if (Object.keys(metadataUpdates).length > 0) {
    const { error: authError } = await supabase.auth.updateUser({
      data: metadataUpdates
    });
    if (authError) throw new Error(authError.message);
  }

  revalidatePath('/student/user-profile');
  revalidatePath('/admin/user-profile');
  revalidatePath('/guest/user-profile');
  revalidatePath('/manager/user-profile');

  return { success: true };
}
