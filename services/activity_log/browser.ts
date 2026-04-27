import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { LogCreationRequest } from "@/types/activity_log";
import { User, UserRole } from "@/types/user.types";
import { isUserRole } from "./shared";

async function createActivityLog(logData: LogCreationRequest) {
  const supabase = getSupabaseBrowserClient();

  const { error: activityLogError } = await supabase.rpc(
    "insert_activity_log" as never,
    logData as never,
  );

  if (activityLogError) {
    console.error("[ERROR] creating activity log:", activityLogError.message);
  }
  return { success: true };
}

async function getCurrentUserFromApi(): Promise<User | null> {
  try {
    const response = await fetch("/api/auth", { method: "GET" });
    if (!response.ok) return null;

    const payload = (await response.json()) as { user?: User | null };
    return payload.user ?? null;
  } catch (error) {
    console.error("[ERROR] fetching current user profile:", error);
    return null;
  }
}

async function getCurrentUserRole(): Promise<{ userId: string; role: UserRole } | null> {
  const supabase = getSupabaseBrowserClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profileData } = await supabase
    .from("users")
    .select("role")
    .eq("user_id", user.id)
    .single();

  const role = isUserRole((profileData as { role?: unknown } | null)?.role)
    ? ((profileData as { role?: UserRole } | null)?.role ?? "guest")
    : "guest";

  return { userId: user.id, role };
}


// REFER TO THIS AS BASE 
// async function getEntityID(entityName: string,entitySelect: string): Promise <{entityID: string}> {
//   const supabase = getSupabaseBrowserClient;

//   const {data: entityData} = await supabase 
//     .from(entityName)
//     .insert([entityData])
//     .select(entitySelect)
//     .single();
// }

export { createActivityLog, getCurrentUserFromApi, isUserRole, getCurrentUserRole };
