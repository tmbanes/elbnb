import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/auth/api-guard';
import { supabaseAdmin } from '@/lib/supabase/admin-client';

// GET — fetch payment details for an application
export const GET = withRole(['student', 'guest'], async (req, { user }) => {
  try {
    const { searchParams } = new URL(req.url);
    const applicationId = searchParams.get('applicationId');

    if (!applicationId) {
      return NextResponse.json({ error: 'Missing applicationId' }, { status: 400 });
    }

    const { data: billing, error } = await supabaseAdmin
      .from('billing')
      .select(`
        billing_id,
        amount,
        billing_period_date,
        due_date,
        status,
        payment_method,
        transaction_reference,
        receipt_files,
        created_at,
        billing_item (
          type,
          amount
        ),
        accommodation_assignment!inner (
          assignment_id,
          application_id,
          user_id,
          users (
            first_name,
            last_name
          ),
          accommodation_application (
            preferred_accommodation_id,
            preferred_unit_type,
            application_status
          )
        )
      `)
      .eq('accommodation_assignment.application_id', applicationId)
      .eq('accommodation_assignment.user_id', user.user_id)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (!billing) {
      return NextResponse.json({ error: 'Billing record not found.' }, { status: 404 });
    }

    const receiptPath = billing.transaction_reference || billing.receipt_files?.[billing.receipt_files.length - 1] || null;
    let receiptPreviewUrl: string | null = null;

    if (receiptPath) {
      const { data: signed, error: signError } = await supabaseAdmin.storage
        .from('payment_receipts')
        .createSignedUrl(receiptPath, 60 * 10);
      if (!signError) receiptPreviewUrl = signed.signedUrl;
    }

    const items = Array.isArray(billing.billing_item)
      ? billing.billing_item
      : billing.billing_item
        ? [billing.billing_item]
        : [];

    return NextResponse.json({
      billingId: billing.billing_id,
      amount: billing.amount,
      status: billing.status,
      billingPeriodDate: billing.billing_period_date,
      dueDate: billing.due_date,
      paymentMethod: billing.payment_method,
      receiptPath,
      receiptPreviewUrl,
      breakdown: items.map((item: any) => ({
        label: item.type,
        amount: Number(item.amount || 0),
      })),
      summary: { total: Number(billing.amount || 0) },
      applicant: billing.accommodation_assignment?.users ?? null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load payment details.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
});
