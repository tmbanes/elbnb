// /app/api/users/profile/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { getApiAuthenticatedUser } from "@/lib/auth/session";

const roleConfig = {
    student: {
        table: "student",
        allowedFields: ["first_name", "last_name", "middle_name", "course", "year_level"],
    },
    dormitory_manager: {
        table: "dormitory_manager",
        allowedFields: ["first_name", "last_name", "dorm_name"],
    },
    housing_admin: {
        table: "housing_admin",
        allowedFields: ["first_name", "last_name"],
    },
} as const;

// FUNCTION: Updates user profile
export async function PATCH(req: NextRequest) {
    const auth = await getApiAuthenticatedUser();

    // Check if user is authenticated
    if ("error" in auth) {
        return NextResponse.json(
            { error: auth.error },
            { status: auth.status }
        );
    }

    // Get user and request body
    const user = auth.user;
    const body = await req.json();

    // Get role configuration
    const config = roleConfig[user.role as keyof typeof roleConfig];

    // Check if role is valid
    if (!config) {
        return NextResponse.json(
            { error: "Invalid role" },
            { status: 400 }
        );
    }

    // Build safe update object dynamically
    const allowedUpdates: Record<string, any> = {};

    // Check which fields are being updated (excluding undefined, "", and null)
    // This prevents users from updating fields that are not allowed or are empty
    for (const field of config.allowedFields) {
        if (body[field] !== undefined && body[field] !== "" && body[field] !== null) {
            allowedUpdates[field] = body[field];
        }
    }

    // Check if there are any valid fields to update
    if (Object.keys(allowedUpdates).length === 0) {
        return NextResponse.json(
            { error: "No valid fields to update" },
            { status: 400 }
        );
    }

    // Connect to Supabase
    const supabase = await createSupabaseServerClient();

    // Update user profile
    const { data, error } = await supabase
        .from(config.table)
        .update(allowedUpdates)
        .eq("user_id", user.user_id)
        .select()
        .single();

    // Check for errors
    if (error) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }

    return NextResponse.json(data);
}