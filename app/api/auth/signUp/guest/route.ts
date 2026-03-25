import { NextRequest, NextResponse } from "next/server";
// import { signUpAsGuest } from "@/services/browser/auth";
import { createClient } from "@supabase/supabase-js";

async function POST(request: NextRequest) {
  try {
    const userData = await request.json(); // get data from request
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    //use signUp function directly
    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          role: "guest",
          ...userData,
        },
      },
    });
    // const result = await signUpAsGuest(userData); // trigger sign-up function
    if (error) {
      // if sign-up failed, return error response
      return NextResponse.json({ error: error.message }, { status: 400 });
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
