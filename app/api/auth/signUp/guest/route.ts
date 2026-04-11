import { NextRequest, NextResponse } from "next/server";
import { createUserProfile } from "@/services/server/auth";
import { createClient } from "@supabase/supabase-js";

async function POST(request: NextRequest) {
  try {
    const userData = await request.json(); // get data from request body
    const result = await createUserProfile(userData); // trigger sign-up function
    if (!result.success) {
      // if sign-up failed, return error response
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json(
      { message: "Guest created successfully" },
      { status: 201 },
    );
  } catch (error) {
    console.error("[ERROR] signing up with email:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export { POST };
