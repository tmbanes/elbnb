<<<<<<< HEAD
import { NextRequest, NextResponse } from 'next/server'
import { CreateApplicationService } from '@/services/application_workflow/create_application'
import { getAuthenticatedUser } from '@/lib/auth/get-user'
import { AccommodationApplication, ApplicationStatus } from '@/types/application_workflow'
import { requireRole } from '@/lib/auth/require-role'

// CREATE A NEW APPLICATION -- user should be authenticated AND either student or guest to create an application
export async function POST(request: NextRequest) {
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
    const applicationData: Omit<AccommodationApplication, 'application_id' | 'accommodation_assignment'> = {
      preferred_accommodation: body.preferred_accommodation,
      preferred_unit_type: body.preferred_unit_type,
      duration_of_stay: body.duration_of_stay,
      check_in: body.check_in,
      check_out: body.check_out,
      number_of_companions: body.number_of_companions ?? 0,
      unit_id: body.unit_id ?? '',
      user_id: user.user_id,
      date_submitted: '',
      application_status: 'pending_dorm_manager' as ApplicationStatus,
      // application_id OMITTED
      // accommodation_assignment OMITTED
    }
    const validationErrors = CreateApplicationService.validateApplication(applicationData)
    
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: validationErrors.join(', ') },
        { status: 400 }
      )
    }

    // CALL SERVICE TO CREATE APPLICATION
    const application = await CreateApplicationService.createApplication(applicationData)
    return NextResponse.json({
      success: true,
      data: application,
    })

  } catch (err) {
    console.error('Application creation error:', err)
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    )
  }
}
=======
import { NextRequest, NextResponse } from 'next/server'
import { CreateApplicationService } from '@/services/application_workflow/create_application'
import { AccommodationApplication, ApplicationStatus } from '@/types/application_workflow'
import { requireApiRole } from '@/lib/auth/session'

// CREATE A NEW APPLICATION -- user should be authenticated AND either student or guest to create an application
export async function POST(request: NextRequest) {
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
    const applicationData: Omit<AccommodationApplication, 'application_id' | 'accommodation_assignment'> = {
      // preferred_accommodation: body.preferred_accommodation,
      preferred_accommodation_id: body.preferred_accommodation_id,
      preferred_unit_type: body.preferred_unit_type,
      duration_of_stay: body.duration_of_stay,
      check_in: body.check_in,
      check_out: body.check_out,
      number_of_companions: body.number_of_companions ?? 0,
      unit_id: body.unit_id ?? '',
      user_id: user.user_id,
      date_submitted: '',
      application_status: 'pending_dorm_manager' as ApplicationStatus,
      // application_id OMITTED
      // accommodation_assignment OMITTED
    }
    const validationErrors = CreateApplicationService.validateApplication(applicationData)

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: validationErrors.join(', ') },
        { status: 400 }
      )
    }

    // CALL SERVICE TO CREATE APPLICATION
    const application = await CreateApplicationService.createApplication(applicationData)
    return NextResponse.json({
      success: true,
      data: application,
    })

  } catch (err) {
    console.error('Application creation error:', err)
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    )
  }
}
>>>>>>> origin/develop
