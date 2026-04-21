import { NextRequest, NextResponse } from "next/server";
import { getBillingInformation } from "@/services/user-services";
import { getApiAuthenticatedUser } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
    const auth = await getApiAuthenticatedUser();

    if ("error" in auth) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      );
    }

    const user = auth.user;
    
    try {
        // TO DO: Add user.role to actual parameters of getBillingInformation()
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