import { NextRequest, NextResponse } from "next/server";
import { applicationWorkflowService } from "@/services/application_workflow/index";
import type { ApplicationStatus } from "@/types/application_workflow/index";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";

type Params = { applicationId: string };

type TransitionRequestBody = {
  to_status: ApplicationStatus;
  remarks?: string;
};

// ROUTE: transition application status, change status
export async function POST(req: NextRequest, context: { params: Params }) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as TransitionRequestBody;
    if (!body.to_status) {
      return NextResponse.json({ error: "Missing to_status" }, { status: 400 });
    }

    const { applicationId } = context.params;
    const result = await applicationWorkflowService.transitionApplicationStatus(
      {
        applicationId,
        toStatus: body.to_status,
        actorUserId: authData.user.id,
        remarks: body.remarks,
      },
    );

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(
      { message: "Application status updated", data: result.data },
      { status: 200 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
