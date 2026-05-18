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

    const { data, error } = await supabaseAdmin
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
      .order('created_at', { ascending: false }).limit(1);

    const billingData = (data as any)?.[0];
    if (error || !billingData) {
      console.error('Payment Details Error:', error || 'No billing record found');
      return NextResponse.json({ error: 'Invoice not found. Please contact the administrator if you believe this is an error.' }, { status: 404 });
    }

    const receiptPath = billingData.transaction_reference || (Array.isArray(billingData.receipt_files) ? billingData.receipt_files[billingData.receipt_files.length - 1] : null);
    let receiptPreviewUrl: string | null = null;

    if (receiptPath) {
      try {
        const { data: signed, error: signError } = await supabaseAdmin.storage
          .from('payment_receipts')
          .createSignedUrl(receiptPath, 60 * 10);
        if (!signError) receiptPreviewUrl = signed.signedUrl;
      } catch (err) {
        console.error('Signed URL Error:', err);
      }
    }

    const items = Array.isArray(billingData.billing_item)
      ? billingData.billing_item
      : billingData.billing_item
        ? [billingData.billing_item]
        : [];

    return NextResponse.json({
      billingId: billingData.billing_id,
      amount: Number(billingData.amount || 0),
      status: billingData.status || 'unpaid',
      billingPeriodDate: billingData.billing_period_date,
      dueDate: billingData.due_date,
      paymentMethod: billingData.payment_method || 'cash',
      receiptPath,
      receiptPreviewUrl,
      breakdown: items.length > 0 
        ? items.map((item: any) => ({
            label: item.type || 'Miscellaneous Fee',
            amount: Number(item.amount || 0),
          }))
        : [{ label: 'Total Outstanding Balance', amount: Number(billingData.amount || 0) }],
      summary: { total: Number(billingData.amount || 0) },
      applicant: billingData.accommodation_assignment?.users ?? null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load payment details.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
});
