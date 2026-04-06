import {
  adminReviewApplication,
  applicantRespondToAdminDecision,
  cancelOwnApplication,
  createGuestApplication as createGuestApplicationShared,
  dormManagerReviewApplication,
  getOwnApplicationsByRole,
  markApplicationPaid,
} from "@/services/application_workflow";

async function createGuestApplication(payload: {
  preferred_accommodation: string;
  preferred_unit_type: string;
  duration_of_stay: number;
  check_in: string;
  check_out: string;
  number_of_companions: number;
  stay_count: number;
  stay_unit: "days" | "weeks" | "months";
}) {
  return createGuestApplicationShared(payload);
}

async function cancelGuestApplication(application_id: string) {
  return cancelOwnApplication(application_id);
}

async function dormManagerReviewGuestApplication(payload: {
  application_id: string;
  approve: boolean;
  unit_id?: string | null;
  remarks?: string;
}) {
  return dormManagerReviewApplication(payload);
}

async function adminReviewGuestApplication(payload: {
  application_id: string;
  approve: boolean;
  unit_id?: string | null;
  remarks?: string;
}) {
  return adminReviewApplication(payload);
}

async function guestRespondToApplication(payload: {
  application_id: string;
  accept: boolean;
}) {
  return applicantRespondToAdminDecision(payload);
}

async function markGuestApplicationPaid(application_id: string) {
  return markApplicationPaid(application_id);
}

async function getMyGuestApplications() {
  return getOwnApplicationsByRole();
}

export {
  createGuestApplication,
  cancelGuestApplication,
  dormManagerReviewGuestApplication,
  adminReviewGuestApplication,
  guestRespondToApplication,
  markGuestApplicationPaid,
  getMyGuestApplications,
};
