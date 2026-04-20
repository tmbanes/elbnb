import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/get-user";
import { getBillingInformation } from "@/services/user-services";

export async function GET(request: NextRequest) {
    const user = await getAuthenticatedUser();  // get current user
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    } // catch if user is not authenticated

    try {
        const billingInfo = await getBillingInformation(user.user_id); // get billing information for the user
        console.log("Billing information retrieved:", billingInfo); // [DEBUGGING] log billing information for debugging
        return NextResponse.json({ billingInfo }); // return billing information as JSON
    }
    catch (error) {
        console.error("Error fetching billing information:", error);
        return NextResponse.json(
            { error: "Failed to fetch billing information" }, 
            { status: 500 });
    }
}