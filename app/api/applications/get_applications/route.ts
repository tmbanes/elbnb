import { NextRequest, NextResponse } from 'next/server'
import { CreateApplicationService } from '@/services/application_workflow/create_application'
import { getAuthenticatedUser } from '@/lib/auth/get-user'
import { AccommodationApplication, ApplicationStatus } from '@/types/application_workflow'
import { requireRole } from '@/lib/auth/require-role'

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