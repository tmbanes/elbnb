import { NextResponse } from 'next/server';
import { withRole } from '@/lib/auth/api-guard';
import { AssignmentService } from '@/services/assignment_workflow';

// GET — fetch accommodation history for the authenticated user
export const GET = withRole(['student', 'guest'], async (_req, { user }) => {
  try {
    const history = await AssignmentService.getAccommodationHistoryByUser(user.user_id);
    return NextResponse.json({ success: true, data: history });
  } catch (err) {
    console.error('Accommodation history fetch error:', err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
});
