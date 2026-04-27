// generatePDF usage — moved to /api/shared/pdf-generation
import { NextResponse } from 'next/server';
import { withRole } from '@/lib/auth/api-guard';
import { generatePDF } from '@/services/generate_report/pdfgeneration';
import BillingReceipt from '@/services/generate_report/pdf_formats/billingreceipt';
import { supabaseAdmin } from '@/lib/supabase/admin-client';

export const runtime = 'nodejs';

const ALL_ROLES = ['student', 'guest', 'housing_admin', 'dormitory_manager'] as const;

export const POST = withRole([...ALL_ROLES], async () => {
  const { data, error: fetchError } = await supabaseAdmin
    .from('billing')
    .select('*')
    .limit(1)
    .single();

  if (fetchError) throw fetchError;

  const pdfBuffer = await generatePDF(BillingReceipt, data);

  return new NextResponse(Uint8Array.from(pdfBuffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename=receipt.pdf',
    },
  });
});
