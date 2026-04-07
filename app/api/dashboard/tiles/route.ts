import { NextRequest, NextResponse } from "next/server";
import { UnitAccomodationsDisplayService } from "@/services/unit_accommodation/index";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get("type") || "accommodations";
  const accommodationId = searchParams.get("accommodationId");

  try {
    // Get the current user's role
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    let userRole;
    if (user) {
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('user_id', user.id)
        .single();
      
      userRole = userData?.role;
    }

    let result;

    switch (type) {
      case "accommodations":
        // Pass user role to filter accommodations
        result = await UnitAccomodationsDisplayService.listAccomodations(userRole);
        break;

      case "units":
        result = await UnitAccomodationsDisplayService.listUnits("");
        break;

      case "units-by-accommodation":
        if (!accommodationId) {
          return NextResponse.json(
            { error: "accommodationId is required for units-by-accommodation" },
            { status: 400 }
          );
        }
        result = await UnitAccomodationsDisplayService.listUnitsForAccomodation(accommodationId);
        break;

      default:
        return NextResponse.json(
          { error: "Invalid type. Use: accommodations, units, or units-by-accommodation" },
          { status: 400 }
        );
    }

    if (result.error || !result.data) {
      return NextResponse.json(
        { error: result.error || "No data found" },
        { status: 400 }
      );
    }

    // Calculate vacant slots for units only
    let data = result.data;
    if (type !== "accommodations" && Array.isArray(data)) {
      data = data.map((unit: any) => ({
        ...unit,
        vacant_slots: unit.max_occupancy - unit.current_occupancy
      }));
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}