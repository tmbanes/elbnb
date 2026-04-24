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
  },
  {
    assignment_id: "8",
    application_id: "app-8",
    unit_id: "u-401",
    user_id: "user-8",
    move_in_date: "2025-06-01",
    created_at: "2025-05-20",
    expected_move_out_date: "2025-12-01",
    assignment_status: "pending",
    users: { first_name: "Juan", last_name: "Luna", email: "juan@example.com" },
    unit: { 
      unit_id: "u-401", 
      unit_number: "401-D", 
      unit_type: "Studio",
      accommodation: { name: "Sunrise Apartments", location: "Downtown" }
    }
  },
  {
    assignment_id: "9",
    application_id: "app-9",
    unit_id: "u-402",
    user_id: "user-9",
    move_in_date: "2025-02-15",
    created_at: "2025-02-10",
    expected_move_out_date: "2025-08-15",
    assignment_status: "active",
    users: { first_name: "Elena", last_name: "Gomez", email: "elena@example.com" },
    unit: { 
      unit_id: "u-402", 
      unit_number: "402-B", 
      unit_type: "Studio",
      accommodation: { name: "Sunrise Apartments", location: "Downtown" }
    }
  },
  {
    assignment_id: "10",
    application_id: "app-10",
    unit_id: "u-501",
    user_id: "user-10",
    move_in_date: "2025-04-01",
    created_at: "2025-03-25",
    expected_move_out_date: "2025-09-30",
    assignment_status: "active",
    users: { first_name: "Miguel", last_name: "Hernandez", email: "miguel@example.com" },
    unit: { 
      unit_id: "u-501", 
      unit_number: "501-A", 
      unit_type: "Family Suite",
      accommodation: { name: "Greenwood Oaks", location: "Suburbs" }
    }
  },
  {
    assignment_id: "11",
    application_id: "app-11",
    unit_id: "u-502",
    user_id: "user-11",
    move_in_date: "2025-07-15",
    created_at: "2025-07-01",
    expected_move_out_date: "2026-01-15",
    assignment_status: "waiting_payment",
    users: { first_name: "Sofia", last_name: "Vergara", email: "sofia@example.com" },
    unit: { 
      unit_id: "u-502", 
      unit_number: "502-C", 
      unit_type: "Family Suite",
      accommodation: { name: "Greenwood Oaks", location: "Suburbs" }
    }
  },
  {
    assignment_id: "12",
    application_id: "app-12",
    unit_id: "u-601",
    user_id: "user-12",
    move_in_date: "2025-01-10",
    created_at: "2025-01-01",
    expected_move_out_date: "2025-07-10",
    assignment_status: "active",
    users: { first_name: "David", last_name: "Wilson", email: "david@example.com" },
    unit: { 
      unit_id: "u-601", 
      unit_number: "Penthouse-1", 
      unit_type: "Luxury",
      accommodation: { name: "Skyline Tower", location: "City Center" }
    }
  },
  {
    assignment_id: "13",
    application_id: "app-13",
    unit_id: "u-602",
    user_id: "user-13",
    move_in_date: "2024-06-01",
    created_at: "2024-05-15",
    expected_move_out_date: "2024-12-01",
    actual_move_out_date: "2024-11-30",
    assignment_status: "terminated",
    users: { first_name: "Sarah", last_name: "Connor", email: "sarah@example.com" },
    unit: { 
      unit_id: "u-602", 
      unit_number: "Penthouse-2", 
      unit_type: "Luxury",
      accommodation: { name: "Skyline Tower", location: "City Center" }
    }
  },
  {
    assignment_id: "14",
    application_id: "app-14",
    unit_id: "u-104",
    user_id: "user-14",
    move_in_date: "2025-03-01",
    created_at: "2025-02-20",
    expected_move_out_date: "2025-08-31",
    assignment_status: "cancelled",
    users: { first_name: "Pedro", last_name: "Penduko", email: "pedro@example.com" },
    unit: { 
      unit_id: "u-104", 
      unit_number: "104-A", 
      unit_type: "Standard",
      accommodation: { name: "University Hall", location: "Main Campus" }
    }
  },
  {
    assignment_id: "15",
    application_id: "app-15",
    unit_id: "u-205",
    user_id: "user-15",
    move_in_date: "2025-05-01",
    created_at: "2025-04-10",
    expected_move_out_date: "2025-10-31",
    assignment_status: "pending",
    users: { first_name: "Lucia", last_name: "Santos", email: "lucia@example.com" },
    unit: { 
      unit_id: "u-205", 
      unit_number: "205-C", 
      unit_type: "Suite",
      accommodation: { name: "Garden Residences", location: "East Campus" }
    }
  }
];
