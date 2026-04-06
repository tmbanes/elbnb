export type AssignmentStatus =
  | "active"
  | "completed"
  | "cancelled"
  | "terminated"
  | "pending";

export interface AccommodationAssignment {
  assignment_id: string;
  application_id: string;
  unit_id: string;
  user_id: string;
  move_In_Date: string;
  expected_Move_Out_Date: string;
  actual_Move_Out_Date?: string | null; // optional
  assignment_status: AssignmentStatus;
}