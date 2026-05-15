import { withRole } from "@/lib/auth/api-guard";
import { NextRequest, NextResponse } from "next/server";
import { HousingService } from "@/services/unit_accommodation/housing.service";

export const GET = withRole(['housing_admin', 'admin'], async (req: NextRequest) => {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (id) {
      const data = await HousingService.getDorm(id);
      return NextResponse.json(data);
    }
    const data = await HousingService.getAllDorms();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});

export const POST = withRole(['housing_admin', 'admin'], async (req: NextRequest) => {
  try {
    const body = await req.json();
    const data = await HousingService.createDorm(body);
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});

export const PATCH = withRole(['housing_admin', 'admin'], async (req: NextRequest) => {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    const { accommodationFields, dormitoryFields } = await req.json();
    const result = await HousingService.updateDorm(id, accommodationFields, dormitoryFields);
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
