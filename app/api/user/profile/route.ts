import { withRole } from "@/lib/auth/api-guard";
// /app/api/student/profile/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";

export const GET = withRole(['student', 'guest', 'dormitory_manager', 'housing_admin', 'admin'], async (req: NextRequest, { user }) => {
    const supabase = await createSupabaseServerClient();

    // Map roles to their specific tables
    const roleTableMap: Record<string, string> = {
        student: "student",
        guest: "guest",
        dormitory_manager: "dormitory_manager",
        housing_admin: "housing_admin",
    };

    const targetTable = user.role ? roleTableMap[user.role] : null;

    // If there's no specific table for this role, return the base profile
    if (!targetTable) {
        return NextResponse.json(user);
    }

    const { data: roleSpecificData, error } = await supabase
        .from(targetTable)
        .select("*")
        .eq("user_id", user.user_id)
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Merge the base user data with role-specific data
    return NextResponse.json({
        ...user,
        ...(roleSpecificData || {})
    });
});
