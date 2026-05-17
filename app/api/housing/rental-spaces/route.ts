import { withRole } from "@/lib/auth/api-guard";
import { NextRequest, NextResponse } from "next/server";
import { HousingService } from "@/services/unit_accommodation/housing.service";

export const GET = withRole(['housing_admin', 'admin'], async (req: NextRequest, { user }) => {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (id) {
      const data = await HousingService.getRentalSpace(id);
      return NextResponse.json(data);
    }
    const fetchAll = req.nextUrl.searchParams.get("all") === "true";
    const data = await HousingService.getAllRentalSpaces(fetchAll ? undefined : user);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});

export const POST = withRole(['housing_admin', 'admin'], async (req: NextRequest, { user }) => {
  try {
    const body = await req.json();
    const data = await HousingService.createRentalSpace(body);
    if (data) {
      const res = await HousingService.assignAccommodationToAdmin(user?.user_id, data.accommodation_id);
      return NextResponse.json(res, { status: 201 });
    }
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});

export const PATCH = withRole(['housing_admin', 'admin'], async (req: NextRequest) => {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    const { accommodationFields, rentingFields } = await req.json();
    const result = await HousingService.updateRentalSpace(id, accommodationFields, rentingFields);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});

export const DELETE = withRole(['housing_admin', 'admin'], async (req: NextRequest) => {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    const data = await HousingService.deleteAccommodation(id);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});
