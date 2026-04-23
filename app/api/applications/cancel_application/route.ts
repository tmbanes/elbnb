<<<<<<< HEAD
import { NextRequest, NextResponse } from 'next/server'
import { CreateApplicationService } from '@/services/application_workflow/create_application'
import { CancelApplicationService } from '@/services/application_workflow/cancel_application'
import { getAuthenticatedUser } from '@/lib/auth/get-user'
import { AccommodationApplication, ApplicationStatus, CancellableStatus } from '@/types/application_workflow'
import { requireRole } from '@/lib/auth/require-role'

// CANCEL AN APPLICATION -- user should be authenticated AND either student or guest to cancel an application
export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const denied = requireRole(user, ['student', 'guest'])
    if (denied) return denied

    const body = await request.json()
    const applicationId = body.applicationId
    const applicationData = await CreateApplicationService.getApplicationById(applicationId)

    if (!applicationData) {
      return NextResponse.json(
        { error: "Application ID not found" },
        { status: 400 }
      )
    }
    
    const validationErrors = CancelApplicationService.validateCancellation(applicationData)
    
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: validationErrors.join(', ') },
        { status: 400 }
      )
    }

    // CALL SERVICE TO CANCEL APPLICATION
    const application = await CancelApplicationService.cancelApplicationStatus(applicationData)
    return NextResponse.json({
      success: true,
      data: application,
    })

  } catch (err) {
    console.error('Application cancellation error:', err)
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    )
  }
}
=======
import { NextRequest, NextResponse } from 'next/server'
import { CreateApplicationService } from '@/services/application_workflow/create_application'
import { CancelApplicationService } from '@/services/application_workflow/cancel_application'
import { AccommodationApplication, ApplicationStatus, CancellableStatus } from '@/types/application_workflow'
import { requireApiRole } from '@/lib/auth/session'

// CANCEL AN APPLICATION -- user should be authenticated AND either student or guest to cancel an application
export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireApiRole(['student', 'guest']);

    if ("error" in auth) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      );
    }

    const user = auth.user;

    const body = await request.json()
    const applicationId = body.applicationId
    const applicationData = await CreateApplicationService.getApplicationById(applicationId)

    if (!applicationData) {
      return NextResponse.json(
        { error: "Application ID not found" },
        { status: 400 }
      )
    }

    const validationErrors = CancelApplicationService.validateCancellation(applicationData)

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: validationErrors.join(', ') },
        { status: 400 }
      )
    }

    // CALL SERVICE TO CANCEL APPLICATION
    const application = await CancelApplicationService.cancelApplicationStatus(applicationData)
    return NextResponse.json({
      success: true,
      data: application,
    })

  } catch (err) {
    console.error('Application cancellation error:', err)
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    )
  }
}
>>>>>>> origin/develop
