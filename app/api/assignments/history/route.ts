import { NextResponse } from "next/server";
import { AssignmentService } from "@/services/assignment_workflow";
import { requireApiRole } from "@/lib/auth/session";

export async function GET() {
    try {
        const auth = await requireApiRole(["student", "guest"]);

        if ("error" in auth) {
            return NextResponse.json(
                { error: auth.error },
                { status: auth.status }
            );
        }

        const user = auth.user;

        const history = await AssignmentService.getAccommodationHistoryByUser(
            user.user_id
        );

        return NextResponse.json({ success: true, data: history });
    } catch (err) {
        console.error("Accommodation history fetch error:", err);

        return NextResponse.json(
            { error: (err as Error).message },
            { status: 500 }
        );
    }
}