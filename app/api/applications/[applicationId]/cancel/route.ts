import { NextResponse, NextRequest } from "next/server";
import { applicationWorkflowService } from "@/services/application_workflow/index";

type Params = { applicationId: string };

// ROUTE: cancel application, change status
export async function POST(request: NextRequest, context: { params: Params }) {
  void request;

  try {
    const { applicationId } = context.params;
    const result =
      await applicationWorkflowService.cancelMyApplication(applicationId);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(
      { message: "Application cancelled successfully", data: result.data },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
