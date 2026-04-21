import { NextRequest, NextResponse } from 'next/server'
import { CreateApplicationService } from '@/services/application_workflow/create_application'
<<<<<<< HEAD
import { getAuthenticatedUser } from '@/lib/auth/get-user'
import { AccommodationApplication, ApplicationStatus } from '@/types/application_workflow'
import { requireRole } from '@/lib/auth/require-role'
=======
import { AccommodationApplication, ApplicationStatus } from '@/types/application_workflow'
import { getApiAuthenticatedUser } from '@/lib/auth/server-auth'
>>>>>>> 76e8f3255db7be2b6cbe835d611a2e1be74975e1

// GET USER'S APPLICATIONS
export async function GET(request: NextRequest) {
  try {
<<<<<<< HEAD
    const user = await getAuthenticatedUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

=======
    const auth = await getApiAuthenticatedUser();

    if ("error" in auth) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      );
    }

    const user = auth.user;

>>>>>>> 76e8f3255db7be2b6cbe835d611a2e1be74975e1
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