<<<<<<< HEAD
import { NextRequest, NextResponse } from "next/server";
import { UnitAccomodationsDisplayService } from "@/services/unit_accommodation/index";
import { getAuthenticatedUser } from "@/lib/auth/get-user";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get("type") || "accommodations";
  const accommodationId = searchParams.get("accommodationId");
  const user = await getAuthenticatedUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    let result;

    switch (type) {
      case "accommodations":
        // Pass user role to filter accommodations
        result = await UnitAccomodationsDisplayService.listAccomodations(user.role);
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

    return NextResponse.json(data, { status: 200 }); // returns array of type Units / Accommodations
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
=======
import { NextRequest, NextResponse } from "next/server";
import { UnitAccomodationsDisplayService } from "@/services/unit_accommodation/index";
import { getApiAuthenticatedUser } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get("type") || "accommodations";
  const accommodationId = searchParams.get("accommodationId");
  const auth = await getApiAuthenticatedUser();

  if ("error" in auth) {
    return NextResponse.json(
      { error: auth.error },
      { status: auth.status }
    );
  }

  const user = auth.user;

  try {
    let result;

    switch (type) {
      case "accommodations":
        // Pass user role to filter accommodations
        result = await UnitAccomodationsDisplayService.listAccomodations(user.role);
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

    return NextResponse.json(data, { status: 200 }); // returns array of type Units / Accommodations
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
>>>>>>> origin/develop
}