export interface Resident {
  assignment_id: string;
  application_id: string;
  unit_id: string;
  user_id: string;
  move_in_date: string;
  created_at: string;
  expected_move_out_date: string;
  actual_move_out_date?: string | null;
  assignment_status: string;
  users: {
    first_name: string;
    last_name: string;
    email: string;
  };
  unit: {
    unit_id: string;
    unit_number: string;
    unit_type: string;
    accommodation: {
      name: string;
      location: string;
    };
  };
}
