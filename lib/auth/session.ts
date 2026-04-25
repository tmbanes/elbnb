import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { User } from "@/types/user.types";
import { cache } from "react";

type AuthResult =
    | { user: User }
    | { error: string; status: number };

// FUNCTION: Retrieves user and user role from users table.
// Wrapped in cache() to avoid multiple database calls per request lifecycle
export const getUserWithRole = cache(async (): Promise<User | null> => {
    const supabase = await createSupabaseServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // We select specifically what's needed for the User object to avoid exposing unnecessary data
    const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("user_id", user.id)
        .single();

    if (error || !data) return null;

  

    return data as User;
});

// FUNCTION: Requires user and user role for route protection in Server Components
export async function requireRole(allowedRoles: string[]) {
    const user = await getUserWithRole();

    if (!user) redirect("/onboarding");

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

    if (!user.role) {
        redirect("/role-selection");
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

// API ROUTE HELPERS

// FUNCTION: Retrieves authenticated user for API routes
export async function getApiAuthenticatedUser(): Promise<AuthResult> {
    const user = await getUserWithRole();

    if (!user) {
        return {
            error: "Unauthorized",
            status: 401,
        };
    }

    return { user };
}

// FUNCTION: Requires role for API routes
export async function requireApiRole(allowedRoles: string[]): Promise<AuthResult> {
    const result = await getApiAuthenticatedUser();

    if ("error" in result) return result;

    if (!allowedRoles.includes(result.user.role)) {
        return {
            error: "Forbidden",
            status: 403,
        };
    }

    return result;
}
