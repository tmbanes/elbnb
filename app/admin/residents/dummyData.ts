import { Resident } from "./types";

export const DUMMY_RESIDENTS: Resident[] = [
  {
    assignment_id: "1",
    application_id: "app-1",
    unit_id: "u-101",
    user_id: "user-1",
    move_in_date: "2025-04-15",
    created_at: "2025-04-14",
    expected_move_out_date: "2025-10-15",
    assignment_status: "waiting_payment",
    users: { first_name: "Maria", last_name: "Santos", email: "maria@example.com" },
    unit: { 
      unit_id: "u-101", 
      unit_number: "101-A", 
      unit_type: "Standard",
      accommodation: { name: "University Hall", location: "Main Campus" }
    }
  },
  {
    assignment_id: "2",
    application_id: "app-2",
    unit_id: "u-102",
    user_id: "user-2",
    move_in_date: "2025-01-06",
    created_at: "2025-01-05",
    expected_move_out_date: "2025-06-30",
    assignment_status: "active",
    users: { first_name: "Jose", last_name: "Reyes", email: "jose@example.com" },
    unit: { 
      unit_id: "u-102", 
      unit_number: "102-A", 
      unit_type: "Standard",
      accommodation: { name: "University Hall", location: "Main Campus" }
    }
  },
  {
    assignment_id: "3",
    application_id: "app-3",
    unit_id: "u-201",
    user_id: "user-3",
    move_in_date: "2025-03-22",
    created_at: "2025-03-20",
    expected_move_out_date: "2025-06-30",
    assignment_status: "active",
    users: { first_name: "Ana", last_name: "Dela Cruz", email: "ana@example.com" },
    unit: { 
      unit_id: "u-201", 
      unit_number: "201-B", 
      unit_type: "Suite",
      accommodation: { name: "Garden Residences", location: "East Campus" }
    }
  },
  {
    assignment_id: "4",
    application_id: "app-4",
    unit_id: "u-103",
    user_id: "user-4",
    move_in_date: "2025-02-01",
    created_at: "2025-01-28",
    expected_move_out_date: "2025-05-31",
    assignment_status: "active",
    users: { first_name: "Carlo", last_name: "Mendoza", email: "carlo@example.com" },
    unit: { 
      unit_id: "u-103", 
      unit_number: "103-B", 
      unit_type: "Standard",
      accommodation: { name: "University Hall", location: "Main Campus" }
    }
  },
  {
    assignment_id: "5",
    application_id: "app-5",
    unit_id: "u-202",
    user_id: "user-5",
    move_in_date: "2025-05-10",
    created_at: "2025-05-05",
    expected_move_out_date: "2025-11-10",
    assignment_status: "waiting_payment",
    users: { first_name: "Liza", last_name: "Bautista", email: "liza@example.com" },
    unit: { 
      unit_id: "u-202", 
      unit_number: "202-A", 
      unit_type: "Suite",
      accommodation: { name: "Garden Residences", location: "East Campus" }
    }
  },
  {
    assignment_id: "6",
    application_id: "app-6",
    unit_id: "u-301",
    user_id: "user-6",
    move_in_date: "2025-01-06",
    created_at: "2025-01-05",
    expected_move_out_date: "2025-04-01",
    actual_move_out_date: "2025-04-01",
    assignment_status: "completed",
    users: { first_name: "Ramon", last_name: "Cruz", email: "ramon@example.com" },
    unit: { 
      unit_id: "u-301", 
      unit_number: "301-C", 
      unit_type: "Deluxe",
      accommodation: { name: "University Hall", location: "Main Campus" }
    }
  },
  {
    assignment_id: "7",
    application_id: "app-7",
    unit_id: "u-304",
    user_id: "user-7",
    move_in_date: "2025-03-15",
    created_at: "2025-03-10",
    expected_move_out_date: "2025-06-15",
    assignment_status: "active",
    users: { first_name: "Grace", last_name: "Tan", email: "grace@example.com" },
    unit: { 
      unit_id: "u-304", 
      unit_number: "304-A", 
      unit_type: "Deluxe",
      accommodation: { name: "University Hall", location: "Main Campus" }
    }
  }
];
