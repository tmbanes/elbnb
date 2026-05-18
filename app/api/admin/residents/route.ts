import { withRole } from "@/lib/auth/api-guard";
import { ResidentsService } from "@/services/residents.service";
import { NextRequest, NextResponse } from "next/server";

export const GET = withRole(["housing_admin", "admin"], async (req: NextRequest, { user }) => {
  try {
    const { searchParams } = new URL(req.url);
    const unitId = searchParams.get("unit_id") || undefined;

    const residents = await ResidentsService.getResidentsForAdmin(user!.user_id, user.role!, unitId);

    return NextResponse.json({ data: residents });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});
