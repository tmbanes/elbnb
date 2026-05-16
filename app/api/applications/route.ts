import { NextRequest, NextResponse } from "next/server";
import { withRole } from "@/lib/auth/api-guard";
import { 
  getApplicationsService, 
  getSingleApplicationService, 
  processApplicationService, 
  createInvoiceService 
} from "@/services/application_workflow/applications.service";
import { CreateApplicationService } from "@/services/application_workflow/create_application";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { v4 as uuidv4 } from "uuid";
import { AccommodationApplication, ApplicationStatus } from "@/types/application_workflow";

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const BUCKET = 'application_documents';

export const GET = withRole(
  ["student", "dormitory_manager", "housing_admin", "admin"], 
  async (req: NextRequest, { user }) => {
    try {
      const { searchParams } = new URL(req.url);
      const id = searchParams.get("id");

      if (id) {
        const data = await getSingleApplicationService(user, id);
        return NextResponse.json(data);
      }

      if (user.role === 'student') {
        const applications = await CreateApplicationService.getApplicationsByUser(user.user_id);
        return NextResponse.json({ success: true, data: applications });
      }

      const data = await getApplicationsService(user);
      return NextResponse.json(data);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to fetch applications.";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }
);

export const PATCH = withRole(
  ["dormitory_manager", "housing_admin", "admin"], 
  async (req: NextRequest, { user }) => {
    try {
      const body = await req.json();
      const result = await processApplicationService(user, body);
      return NextResponse.json(result);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to process application.";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }
);

export const POST = withRole(
  ["student", "housing_admin", "admin"], 
  async (req: NextRequest, { user }) => {
    try {
      // Students POSTing to create an application (FormData)
      if (user.role === 'student') {
        const formData = await req.formData();
        const file = formData.get('file') as File | null;
        const bodyStr = formData.get('data') as string;
        
        if (!bodyStr) return NextResponse.json({ error: 'No data provided' }, { status: 400 });
        const body = JSON.parse(bodyStr);

        if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        if (!ALLOWED_TYPES.includes(file.type)) return NextResponse.json({ error: 'Invalid file type.' }, { status: 400 });
        if (file.size > MAX_SIZE_BYTES) return NextResponse.json({ error: 'File exceeds 5MB limit' }, { status: 400 });

        const applicationData: Omit<AccommodationApplication, 'application_id' | 'accommodation_assignment'> = {
          preferred_accommodation_id: body.preferred_accommodation_id,
          preferred_unit_type: body.preferred_unit_type,
          duration_of_stay: body.duration_of_stay,
          check_in: body.check_in,
          check_out: body.check_out,
          number_of_companions: body.number_of_companions ?? 0,
          unit_id: body.unit_id ?? '',
          user_id: user.user_id,
          date_submitted: new Date().toISOString(),
          application_status: 'pending_dorm_manager' as ApplicationStatus,
          file: '',
        };

        const validationErrors = CreateApplicationService.validateApplication(applicationData);
        if (validationErrors.length > 0) return NextResponse.json({ error: validationErrors.join(', ') }, { status: 400 });

        const application = await CreateApplicationService.createApplication(applicationData);
        const applicationId = application.application_id;

        const supabase = await createSupabaseServerClient();
        const fileUuid = uuidv4();
        const ext = file.name.split('.').pop();
        const fileName = `${fileUuid}.${ext}`;
        const storagePath = `${applicationId}/${fileName}`;
        const bytes = await file.arrayBuffer();

        const { error: uploadError } = await supabase.storage.from(BUCKET).upload(storagePath, bytes, { contentType: file.type, upsert: false });
        if (uploadError) {
          await supabase.from('accommodation_application').delete().eq('application_id', applicationId);
          throw new Error(`Storage upload failed: ${uploadError.message}`);
        }

        const { error: updateError } = await supabase.from('accommodation_application').update({ file: fileName }).eq('application_id', applicationId);
        if (updateError) throw new Error(`Failed to save file reference: ${updateError.message}`);

        return NextResponse.json({ success: true, data: { ...application, file: fileName } });
      }

      // Admins POSTing to create an invoice (JSON)
      if (user.role === 'admin' || user.role === 'housing_admin') {
        const body = await req.json();
        const result = await createInvoiceService(user, body);
        return NextResponse.json(result);
      }

      return NextResponse.json({ error: "Unauthorized role for POST" }, { status: 403 });

    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to create application/invoice.";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }
);
