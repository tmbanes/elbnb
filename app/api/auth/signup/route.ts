// /api/auth/signup/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createUserProfile } from "@/services/server/auth";
import { StudentCreationRequest, UserCreationRequest } from "@/types/user.types";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as StudentCreationRequest;

    // Signup with Supabase Admin client
    const result = await createUserProfile(body);

    if (!result.success) {
      return NextResponse.json({ success: false, error: (result as any).error }, { status: 400 });
    }

    const successData = result as any;

    // Return id and session (if available)
    return NextResponse.json({
      success: true,
      userId: successData.userId,
      session: successData.session,
      emailVerificationRequired: successData.emailVerificationRequired,
    });
  } catch (err: any) {
    console.error("Server route error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}