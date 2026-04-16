// lib/utils/auth.ts

import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { User } from "@/types/user.types";

type AuthResult =
    | { user: User }
    | { error: string; status: number };


// FUNCTION: Retrieves authenticated user
export async function getApiAuthenticatedUser(): Promise<AuthResult> {

    const supabase = await createSupabaseServerClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return {
        error: "Unauthorized",
        status: 401,
        };
    }

    const { data: user_profile, error } = await supabase
        .from("users")
        .select("*")
        .eq("user_id", user.id)
        .single();

    if (error || !user_profile) {
        return {
        error: "User profile not found",
        status: 404,
        };
    }

    return { user: user_profile };
}

// FUNCTION: Requires role
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