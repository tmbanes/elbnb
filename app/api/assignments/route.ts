import { NextRequest, NextResponse } from 'next/server'
import { AssignmentService } from '@/services/assignment_workflow'
import { requireApiRole } from '@/lib/auth/server-auth';

// ─── GET — fetch all assignments for the authenticated user ───────────────────
export async function GET(request: NextRequest) {
  try {
    const auth = await requireApiRole(['student', 'guest']);

    if ("error" in auth) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      );
    }

    const user = auth.user;
    
    const assignments = await AssignmentService.getAssignmentsByUser(user.user_id)

    return NextResponse.json({ success: true, data: assignments })
  } catch (err) {
    console.error('Assignment fetch error:', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

// ─── PATCH — update assignment status ────────────────────────────────────────
// Body: { assignmentId: string, action: 'terminate' | 'cancel' | 'activate' }
export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireApiRole(['student', 'guest']);

    if ("error" in auth) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      );
    }

    const user = auth.user;

    const body = await request.json()
    const { assignmentId, action } = body

    if (!assignmentId || !action) {
      return NextResponse.json(
        { error: 'assignmentId and action are required' },
        { status: 400 }
      )
    }

    if (!['terminate', 'cancel', 'activate'].includes(action)) {
      return NextResponse.json(
        { error: "action must be one of: 'terminate', 'cancel', 'activate'" },
        { status: 400 }
      )
    }

    // Fetch the assignment and verify ownership
    const assignment = await AssignmentService.getAssignmentById(assignmentId)

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    if (assignment.user_id !== user.user_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    let validationErrors: string[] = []
    let updatedAssignment

    switch (action) {
      case 'terminate':
        validationErrors = AssignmentService.validateTermination(assignment)
        if (validationErrors.length > 0) {
          return NextResponse.json({ error: validationErrors.join(', ') }, { status: 400 })
        }
        updatedAssignment = await AssignmentService.terminateAssignment(assignment)
        break

      case 'cancel':
        validationErrors = AssignmentService.validateCancellation(assignment)
        if (validationErrors.length > 0) {
          return NextResponse.json({ error: validationErrors.join(', ') }, { status: 400 })
        }
        updatedAssignment = await AssignmentService.cancelAssignment(assignment)
        break

      case 'activate':
        validationErrors = AssignmentService.validateActivation(assignment)
        if (validationErrors.length > 0) {
          return NextResponse.json({ error: validationErrors.join(', ') }, { status: 400 })
        }
        updatedAssignment = await AssignmentService.activateAssignment(assignment)
        break
    }

    return NextResponse.json({ success: true, data: updatedAssignment })
  } catch (err) {
    console.error('Assignment update error:', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}