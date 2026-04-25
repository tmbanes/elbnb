import { NextRequest, NextResponse } from 'next/server'
import { CreateApplicationService } from '@/services/application_workflow/create_application'
import { AccommodationApplication, ApplicationStatus } from '@/types/application_workflow'
import { getApiAuthenticatedUser } from '@/lib/auth/session'

// GET USER'S APPLICATIONS
export async function GET(request: NextRequest) {
  try {
    const auth = await getApiAuthenticatedUser();

    if ("error" in auth) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      );
    }

    const user = auth.user;

    const applications = await CreateApplicationService.getApplicationsByUser(user.user_id)

    return NextResponse.json({
      success: true,
      data: applications,
    })

  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    )
  }
}