import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/auth/api-guard';
import { CreateApplicationService } from '@/services/application_workflow/create_application';
import { CancelApplicationService } from '@/services/application_workflow/cancel_application';

// PATCH — cancel an application
export const PATCH = withRole(['student', 'guest'], async (req, { user }) => {
  try {
    const body = await req.json();
    const applicationId = body.applicationId;

    const applicationData = await CreateApplicationService.getApplicationById(applicationId);

    if (!applicationData) {
      return NextResponse.json({ error: 'Application ID not found' }, { status: 400 });
    }

    const validationErrors = CancelApplicationService.validateCancellation(applicationData);

    if (validationErrors.length > 0) {
      return NextResponse.json({ error: validationErrors.join(', ') }, { status: 400 });
    }

    const application = await CancelApplicationService.cancelApplicationStatus(applicationData);
    return NextResponse.json({ success: true, data: application });
  } catch (err) {
    console.error('Application cancellation error:', err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
});
