import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/auth/api-guard';
import { CreateApplicationService } from '@/services/application_workflow/create_application';
import { AccommodationApplication, ApplicationStatus } from '@/types/application_workflow';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { v4 as uuidv4 } from 'uuid';

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const BUCKET = 'application_documents';

// GET — fetch authenticated user's applications
export const GET = withRole(['student', 'guest'], async (_req, { user }) => {
  try {
    const applications = await CreateApplicationService.getApplicationsByUser(user.user_id);
    return NextResponse.json({ success: true, data: applications });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
});

// POST — create a new application (with file upload)
export const POST = withRole(['student', 'guest'], async (req, { user }) => {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const body = JSON.parse(formData.get('data') as string);

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Allowed: PDF, JPG, PNG, GIF, WEBP' }, { status: 400 });
    }
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: 'File exceeds 5MB limit' }, { status: 400 });
    }

    const applicationData: Omit<AccommodationApplication, 'application_id' | 'accommodation_assignment'> = {
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
      file: '',
    };

    const validationErrors = CreateApplicationService.validateApplication(applicationData);
    if (validationErrors.length > 0) {
      return NextResponse.json({ error: validationErrors.join(', ') }, { status: 400 });
    }

    const application = await CreateApplicationService.createApplication(applicationData);
    const applicationId = application.application_id;

    const supabase = await createSupabaseServerClient();
    const fileUuid = uuidv4();
    const ext = file.name.split('.').pop();
    const storagePath = `${applicationId}/${fileUuid}.${ext}`;
    const bytes = await file.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, bytes, { contentType: file.type, upsert: false });

    if (uploadError) {
      await supabase.from('accommodation_application').delete().eq('application_id', applicationId);
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    const { error: updateError } = await supabase
      .from('accommodation_application')
      .update({ file: fileUuid })
      .eq('application_id', applicationId);

    if (updateError) throw new Error(`Failed to save file reference: ${updateError.message}`);

    return NextResponse.json({ success: true, data: { ...application, file: fileUuid } });
  } catch (err) {
    console.error('Application creation error:', err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
});
