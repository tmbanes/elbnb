import { NextRequest, NextResponse } from "next/server";
import {
  adminReviewStudentApplication,
  cancelStudentApplication,
  createStudentApplication,
  dormManagerReviewStudentApplication,
  getMyStudentApplications,
  markStudentApplicationPaid,
  studentRespondToApplication,
} from "@/services/application_workflow/student";

export async function GET() {
  const result = await getMyStudentApplications();

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result.data, { status: 200 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const result = await createStudentApplication({
      preferred_accommodation: body.preferred_accommodation,
      preferred_unit_type: body.preferred_unit_type,
      duration_of_stay: body.duration_of_stay,
      check_in: body.check_in,
      check_out: body.check_out,
      number_of_companions: body.number_of_companions ?? 0,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.data, { status: 201 });
  } catch (error) {
    console.error("[STUDENT APPLICATION POST ERROR]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    let result;

    switch (body.action) {
      case "cancel":
        result = await cancelStudentApplication(body.application_id);
        break;

      case "dorm_manager_review":
        result = await dormManagerReviewStudentApplication({
          application_id: body.application_id,
          approve: body.approve,
          unit_id: body.unit_id ?? null,
          remarks: body.remarks,
        });
        break;

      case "admin_review":
        result = await adminReviewStudentApplication({
          application_id: body.application_id,
          approve: body.approve,
          unit_id: body.unit_id ?? null,
          remarks: body.remarks,
        });
        break;

      case "applicant_decision":
        result = await studentRespondToApplication({
          application_id: body.application_id,
          accept: body.accept,
        });
        break;

      case "mark_paid":
        result = await markStudentApplicationPaid(body.application_id);
        break;

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 },
        );
    }

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("[STUDENT APPLICATION PATCH ERROR]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
