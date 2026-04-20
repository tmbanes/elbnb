// /app/api/auth/signUp/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createStudentProfile } from "@/services/server/auth";

export async function POST(req: NextRequest) {
  console.log("Route hit"); // <- first thing

  try {
    const body = await req.json();

    // Validate UP email
    if (!body.email?.endsWith("@up.edu.ph")) {
      return NextResponse.json(
        { error: "Email must be a valid UP email address" },
        { status: 400 },
      );
    }

    const result = await createStudentProfile(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(
      { message: "Student profile created" },
      { status: 201 },
    );
  } catch (err: any) {
    console.error("Error creating student profile:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
