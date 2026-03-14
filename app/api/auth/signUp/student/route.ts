import { NextRequest, NextResponse } from "next/server";
import { signUpAsStudent } from "@/lib/auth";

async function POST(request: NextRequest) {
    try {

       
        const userData = await request.json(); // get data from request body

        // up mail validation
        if(!userData.email.endswith('@up.edu.ph')) {
            return NextResponse.json({ error: "Email must be a valid UP email address" }, { status: 400 }); 
        }
        const result = await signUpAsStudent(userData); // trigger sign-up function
        if (!result.success) { // if sign-up failed, return error response
            return NextResponse.json({ error: result.error }, { status: 400 });
        }
        return NextResponse.json({ message: "Student created successfully" }, { status: 201 });
    } catch (error) {
        console.error('[ERROR] signing up with email:', error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export { POST };