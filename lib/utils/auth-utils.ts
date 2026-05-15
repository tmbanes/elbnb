// lib\utils.ts
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { UserWithRole } from "@/types/user.types";

// FUNCTION: Retrieves user and user role from users table.
export async function getUserWithRole(): Promise<UserWithRole | null> {
    const supabase = await createSupabaseServerClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: user_profile, error } = await supabase
        .from("users")
        .select("*")
        .eq("user_id", user.id)
        .single();

    // console.log(user_profile, error);
    if (error || !user_profile) redirect("/auth/auth-code-error"); // keep error handling

    return {
        user: user_profile.user,
        role: user_profile.role,
    };
}

// FUNCTION: Requires user and user role for route protection. 
export async function requireRole(allowedRoles: string[]) {
    const userWithRole = await getUserWithRole();

    if (!userWithRole) redirect("/onboarding"); // redirect if unauthenticated

    const { user, role } = userWithRole;

    // Check for missing role OR incomplete profile
    if (role == null || !user.first_name || user.first_name === "TBD") {
        redirect("/complete-profile");
    }
    else if (role != null && !allowedRoles.includes(role)) {
        redirect("/auth/auth-code-error");
    }

    return { user, role };
}

// FUNCTION: Decide where the user belongs after successful login and redirect them to user authorized route.
export async function redirectByRole() {
    const userWithRole = await getUserWithRole();

    if (!userWithRole) redirect("/onboarding");

    const { user, role } = userWithRole;

    // Check for missing role OR incomplete profile
    if (!role || !user.first_name || user.first_name === "TBD") {
        redirect("/complete-profile");
    } else {
        switch (role) {
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
}

