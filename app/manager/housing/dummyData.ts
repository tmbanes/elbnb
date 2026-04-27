import { Property } from "@/types/housing/types";

export const DUMMY_HOUSING: Property[] = [
  {
    accommodation_id: "prop-1",
    name: "Sampaguita Residence Hall",
    location: "UPLB Upper Campus",
    accommodation_type: "dormitory",
    accommodation_status: "Active",
    total_capacity: 120,
    manager_id: "m-1",
    dormitory: {
      number_of_semestersAllowed: 2,
      curfew_time: "22:00",
      allowed_programs: "All Undergraduate",
      term_type: "Semestral",
      separate_by_gender: true,
    },
    units: [
      { unit_id: "u-1", unit_number: "101", unit_type: "room", max_occupancy: 4, current_occupancy: 4, rental_fee: 1500, unit_status: "occupied" },
      { unit_id: "u-2", unit_number: "102", unit_type: "room", max_occupancy: 4, current_occupancy: 2, rental_fee: 1500, unit_status: "occupied" },
      { unit_id: "u-3", unit_number: "103", unit_type: "room", max_occupancy: 4, current_occupancy: 0, rental_fee: 1500, unit_status: "inactive" },
    ]
  },
  {
    accommodation_id: "prop-2",
    name: "Hilltop Apartments",
    location: "Raymundo Street",
    accommodation_type: "renting_space",
    accommodation_status: "Active",
    total_capacity: 10,
    manager_id: "m-1",
    renting_space: {
      property_type: "apartment",
      allow_shortterm_stay: true,
      allow_longterm_stay: true,
      minimum_stay_days: 30,
      maximum_stay_days: 365,
      security_deposit_required: true,
    },
    units: [
      { unit_id: "u-21", unit_number: "Unit 1", unit_type: "wholeunit", max_occupancy: 1, current_occupancy: 1, rental_fee: 8000, unit_status: "occupied" },
      { unit_id: "u-22", unit_number: "Unit 2", unit_type: "wholeunit", max_occupancy: 1, current_occupancy: 0, rental_fee: 8500, unit_status: "under_maintenance" },
    ]
  }
];
