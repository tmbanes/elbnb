import { AccommodationAssignment } from '@/types/assignment_workflow';

// BASED ON SUPABASE PROPERTIES
export type ApplicationStatus = "pending_dorm_manager" | "pending_admin" | "pending_payment" | "approved" | "rejected" | "cancelled";
export type DocumentType =  "university_id" | "form_5" | "proof_of_payment" | "parent_consent" | "other"
export type DocumentStatus = "pending" | "verified" | "rejected"
export type CancellableStatus = "pending_dorm_manager" | "pending_admin" | "pending_payment" 


// BASED ON SUPABASE PROPERTIES + accommodation_assignment 
export interface AccommodationApplication {
  application_id: string;
  user_id: string;
  unit_id: string;
  preferred_accommodation_id: string; // REQUIRED, accommodation_id.
  preferred_unit_type: string;
  date_submitted: string; // ISO date string
  duration_of_stay?: number | null; // dependent on billing period
  check_in: string; // ISO date string
  check_out?: string | null; // ISO date string
  number_of_companions: number;
  application_status: ApplicationStatus;
  accommodation_assignment?: AccommodationAssignment | null;

  // Optional joined fields (when selecting relational data in Supabase)
  users?: {
    first_name: string;
    last_name: string;
    email?: string;
  } | null;
  accommodation?: {
    accommodation_id?: string;
    name: string;
    location?: string;
  } | null;
  units?: {
    unit_number?: string;
  } | null;
  unit?: {
    unit_id?: string;
    unit_number?: string;
    accommodation?: {
      accommodation_id?: string;
      name: string;
      location?: string;
    } | null;
  } | null;
}

export interface TransitionApplicationStatus {
  application_id: string;
  to_status: ApplicationStatus;
  remarks?: string;
}

export interface Document {
  doc_id: string
  uploader_id: string // user_id
  application_id: string
  doc_name: string
  doc_type: DocumentType
  doc_status: DocumentStatus
  file_url: string
  upload_date: string // ISO Date format
  verified_by: string // manager_id
}