// /api/auth/signup/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createUserProfile } from "@/services/server/auth";
import { UserCreationRequest } from "@/types/user.types";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as UserCreationRequest;

    // Signup with Supabase Admin client
    const result = await createUserProfile(body);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    // Return id and session (if available)
    return NextResponse.json({
      success: true,
      userId: result.userId,
      session: result.session,
      emailVerificationRequired: result.emailVerificationRequired,
    });
  } catch (err: any) {
    console.error("Server route error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}