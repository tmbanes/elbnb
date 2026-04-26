import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { User } from "@/types/user.types";
import { cache } from "react";
import { NextResponse } from "next/server";


// FUNCTION: Retrieves user and user role from JWT metadata.
// Wrapped in cache() to avoid multiple database calls per request lifecycle
export const getApiAuthenticatedUser = cache(async (): Promise<User | null> => {
    const supabase = await createSupabaseServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    let metadata = user.user_metadata || {};

    // SOURCE OF TRUTH: Fetch from the public.users table to ensure roles are current.
    // This prevents stale JWT metadata from causing incorrect redirects (e.g. Managers sent to Student dashboard).
    const { data: dbUser } = await supabase
        .from("users")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

    if (dbUser) {
        // Use database values as primary, metadata as fallback
        metadata = { ...metadata, ...dbUser };
        
        // If metadata is out of sync, trigger a background update
        if (dbUser.role !== user.user_metadata?.role) {
            supabase.auth.updateUser({
                data: { 
                    role: dbUser.role,
                    first_name: dbUser.first_name,
                    last_name: dbUser.last_name,
                    user_status: dbUser.user_status
                }
            }).catch(() => {});
        }
    }

    // Construct User object
    return {
        user_id: user.id,
        email: user.email || metadata.email || "",
        first_name: metadata.first_name || "",
        last_name: metadata.last_name || "",
        middle_name: metadata.middle_name,
        role: metadata.role,
        user_status: metadata.user_status || "inactive",
        created_at: user.created_at,
        sex: metadata.sex || "",
        birthdate: metadata.birthdate || "",
        profile_picture_url: metadata.profile_picture_url,
    } as User;
});

// FUNCTION: Requires user and user role for route protection in Server Components
export async function requireRole(allowedRoles: string[]) {
    const user = await getApiAuthenticatedUser();

    if (!user) redirect("/onboarding");

    // If role is missing OR profile is incomplete (indicated by "TBD" or empty name)
    if (!user.role || !user.first_name || user.first_name === "TBD") {
        redirect("/complete-profile");
    }

    if (!allowedRoles.includes(user.role)) {
        redirect("/auth/auth-code-error");
    }

    return user;
}

// FUNCTION: Decide where the user belongs after successful login and redirect them to user authorized route.
export async function redirectByRole() {
    const user = await getApiAuthenticatedUser();

    if (!user) redirect("/onboarding");

    // If role is missing OR profile is incomplete
    if (!user.role || !user.first_name || user.first_name === "TBD") {
        redirect("/complete-profile");
        return; // Ensure execution stops
    }

    switch (user.role) {
        case "student":
            redirect("/student/dashboard");
            break;
        case "guest":
            redirect("/guest/dashboard");
            break;
        case "housing_admin":
            redirect("/admin/dashboard");
            break;
        case "dormitory_manager":
            redirect("/manager/dashboard");
            break;
        default:
            redirect("/login");
            break;
    }
}
