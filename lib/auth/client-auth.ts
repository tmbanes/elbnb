// lib\utils.ts
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { User } from "@/types/user.types";

// FUNCTION: Retrieves user and user role from users table.
export async function getUserWithRole(): Promise<User | null> {
    const supabase = await createSupabaseServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("user_id", user.id)
        .single();

    if (error || !data) return null;

    return data;
}

// FUNCTION: Requires user and user role for route protection. 
export async function requireRole(allowedRoles: string[]) {
    const user = await getUserWithRole();

    if (!user) redirect("/onboarding"); // redirect if unauthenticated

    if (!user.role) redirect("/role-selection");
    
    if (!allowedRoles.includes(user.role)) {
        redirect("/auth/auth-code-error");
    }

    return user;
}

// FUNCTION: Decide where the user belongs after successful login and redirect them to user authorized route.
export async function redirectByRole() {
    const user = await getUserWithRole();

    if (!user) redirect("/onboarding");

    // if (!user.role) redirect("/role-selection");

    if (user.role) {
        switch (user.role) {
            case "student":
                redirect("/student/dashboard");
            case "guest":
                redirect("/guest/dashboard");
            case "housing_admin":
                redirect("/admin/dashboard");
            case "dormitory_manager":
                redirect("/manager/dashboard");
            default:
                redirect("/login");
        }
    };
    
}

