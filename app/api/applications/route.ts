import { NextRequest, NextResponse } from 'next/server'
import { ApplicationService } from '@/services/application_workflow'
import { getAuthenticatedUser } from '@/lib/auth/get-user'
import { AccommodationApplication } from '@/types/application_workflow'

// CREATE A NEW APPLICATION
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const applicationData: AccommodationApplication = {
      ...body,
      user_id: user.user_id, // Ensure the application is tied to the authenticated user
    }
    const validationErrors = ApplicationService.validateApplication(applicationData)
    
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: validationErrors.join(', ') },
        { status: 400 }
      )
    }

    // CALL SERVICE TO CREATE APPLICATION
    const application = await ApplicationService.createApplication(applicationData)
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

// GET USER'S APPLICATIONS
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const applications = await ApplicationService.getApplicationsByUser(user.user_id)

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