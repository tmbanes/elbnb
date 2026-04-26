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

    const metadata = user.user_metadata || {};

    // Construct User object directly from JWT metadata to avoid DB query
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
