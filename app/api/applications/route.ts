import { NextRequest, NextResponse } from "next/server";
import { applicationWorkflowService } from "@/services/application_workflow/index";
import type { SubmitAccommodationApplicationInput } from "@/types/application_workflow/index";

// ROUTE: displaying tile cards for dashboard
export async function GET() {
  const result = await applicationWorkflowService.listAvailableAccommodations();

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result.data, { status: 200 });
}
// ROUTE: submit application
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as SubmitAccommodationApplicationInput;
    const result = await applicationWorkflowService.submitApplication(body);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(
      { message: "Application submitted successfully", data: result.data },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
