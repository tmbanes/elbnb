import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { LogCreationRequest } from "@/types/activity_log";
import { User, UserRole } from "@/types/user.types";
import { isUserRole } from "./shared";

async function createActivityLog(logData: LogCreationRequest) {
  const supabase = await createSupabaseServerClient();

  const { error: activityLogError } = await supabase.rpc(
    "insert_activity_log" as never,
    logData as never,
  );

  if (activityLogError) {
    console.error("[ERROR] creating activity log:", activityLogError.message);
  }
  return { success: true };
}

//Return id, role and fullname only
async function getCurrentUserRole(): Promise<{ userId: string; role: UserRole, first_name: string } | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profileData } = await supabase
    .from("users")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const role = isUserRole((profileData as { role?: unknown } | null)?.role)
    ? ((profileData as { role?: UserRole } | null)?.role ?? "guest")
    : "guest";

  return { userId: user.id, role, first_name: profileData!.first_name + profileData!.last_name };
}



export { createActivityLog, getCurrentUserRole };
