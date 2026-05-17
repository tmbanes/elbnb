import { withRole } from "@/lib/auth/api-guard";
import { NextRequest, NextResponse } from "next/server";
import { HousingService } from "@/services/unit_accommodation/housing.service";

export const GET = withRole(['housing_admin', 'admin'], async (req: NextRequest, { user }) => {
  try {
    const id = req.nextUrl.searchParams.get("id");
    const fetchAll = req.nextUrl.searchParams.get("all") === "true";
    
    if (id) {
      const data = await HousingService.getManager(id);
      return NextResponse.json(data);
    }
    
    let data;
    if (fetchAll) {
      data = await HousingService.getAllManagers();
    } else {
      data = await HousingService.getAssignedManagers(user);
    }
    
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});

export const POST = withRole(['housing_admin', 'admin'], async (req: NextRequest) => {
  try {
    const body = await req.json();
    const data = await HousingService.createManager(body);
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});

export const PATCH = withRole(['housing_admin', 'admin'], async (req: NextRequest) => {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    const { managerFields, userFields, user_id } = await req.json();
    const result = await HousingService.updateManager(id, managerFields, userFields, user_id);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});

export const DELETE = withRole(['housing_admin', 'admin'], async (req: NextRequest) => {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    const data = await HousingService.deleteManager(id);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});
