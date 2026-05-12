import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/auth/api-guard';
import { getBillingInformation } from '@/services/user-services';

const ALL_ROLES = ['student', 'guest', 'housing_admin', 'dormitory_manager'] as const;

// GET — fetch billing tile information for the authenticated user
export const GET = withRole([...ALL_ROLES], async (_req, { user }) => {
  try {
    const billingInfo = await getBillingInformation(user.user_id, user.role);
    return NextResponse.json({ billingInfo });
  } catch (error) {
    console.error('Error fetching billing information:', error);
    return NextResponse.json({ error: 'Failed to fetch billing information' }, { status: 500 });
  }
});
