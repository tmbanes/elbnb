export interface AccomodationHistory {
  application_id: string;
  date_submitted: string;
  preferred_accommodation_id: string;
  preferred_unit_type: string;
  duration_of_stay: number;
  check_in: string;
  check_out: string;
  number_of_companions: number;
  application_status: string;
  assignment_id: string | null;
  move_in_date: string | null;
  expected_move_out_date: string | null;
  actual_move_out_date: string | null;
  assignment_status: string | null;
}
