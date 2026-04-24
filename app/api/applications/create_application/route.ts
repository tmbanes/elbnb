import { NextRequest, NextResponse } from 'next/server'
import { CreateApplicationService } from '@/services/application_workflow/create_application'
import { AccommodationApplication, ApplicationStatus } from '@/types/application_workflow'
import { requireApiRole } from '@/lib/auth/session'
import { createSupabaseServerClient } from '@/lib/supabase/server-client'
import { v4 as uuidv4 } from 'uuid'

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
]
const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5MB
const BUCKET = 'application_documents'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireApiRole(['student', 'guest'])
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const user = auth.user

    // Parse multipart form — file + application fields together
    const formData = await request.formData()

    // Get and validate the file
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: PDF, JPG, PNG, GIF, WEBP' },
        { status: 400 }
      )
    }
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'File exceeds 5MB limit' },
        { status: 400 }
      )
    }

    // Upload the file to Supabase Storage
    const supabase = await createSupabaseServerClient()
    const fileUuid = uuidv4()
    const ext = file.name.split('.').pop()
    const storagePath = `applications/${user.user_id}/${fileUuid}.${ext}`

    const bytes = await file.arrayBuffer()

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, bytes, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      throw new Error(`Storage upload failed: ${uploadError.message}`)
    }

    // Parse application fields from the same formData
    const body = JSON.parse(formData.get('data') as string)

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
      file: fileUuid,   // ← uuid from the upload above, not from body
    }

    const validationErrors = CreateApplicationService.validateApplication(applicationData)
    if (validationErrors.length > 0) {
      return NextResponse.json({ error: validationErrors.join(', ') }, { status: 400 })
    }

    // Create the application record
    const application = await CreateApplicationService.createApplication(applicationData)
    return NextResponse.json({ success: true, data: application })

  } catch (err) {
    console.error('Application creation error:', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}