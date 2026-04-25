import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/auth/api-guard';
import { AssignmentService } from '@/services/assignment_workflow';

// GET — fetch all assignments for the authenticated user
export const GET = withRole(['student', 'guest'], async (_req, { user }) => {
  try {
    const assignments = await AssignmentService.getAssignmentsByUser(user.user_id);
    return NextResponse.json({ success: true, data: assignments });
  } catch (err) {
    console.error('Assignment fetch error:', err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
});

// PATCH — update assignment status (terminate | cancel | activate)
export const PATCH = withRole(['student', 'guest'], async (req, { user }) => {
  try {
    const body = await req.json();
    const { assignmentId, action } = body;

    if (!assignmentId || !action) {
      return NextResponse.json({ error: 'assignmentId and action are required' }, { status: 400 });
    }

    if (!['terminate', 'cancel', 'activate'].includes(action)) {
      return NextResponse.json(
        { error: "action must be one of: 'terminate', 'cancel', 'activate'" },
        { status: 400 }
      );
    }

    const assignment = await AssignmentService.getAssignmentById(assignmentId);

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    if (assignment.user_id !== user.user_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let validationErrors: string[] = [];
    let updatedAssignment;

    switch (action) {
      case 'terminate':
        validationErrors = AssignmentService.validateTermination(assignment);
        if (validationErrors.length > 0) {
          return NextResponse.json({ error: validationErrors.join(', ') }, { status: 400 });
        }
        updatedAssignment = await AssignmentService.terminateAssignment(assignment);
        break;

      case 'cancel':
        validationErrors = AssignmentService.validateCancellation(assignment);
        if (validationErrors.length > 0) {
          return NextResponse.json({ error: validationErrors.join(', ') }, { status: 400 });
        }
        updatedAssignment = await AssignmentService.cancelAssignment(assignment);
        break;

      case 'activate':
        validationErrors = AssignmentService.validateActivation(assignment);
        if (validationErrors.length > 0) {
          return NextResponse.json({ error: validationErrors.join(', ') }, { status: 400 });
        }
        updatedAssignment = await AssignmentService.activateAssignment(assignment);
        break;
    }

    return NextResponse.json({ success: true, data: updatedAssignment });
  } catch (err) {
    console.error('Assignment update error:', err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
});
