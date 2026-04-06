import {
  adminReviewApplication,
  applicantRespondToAdminDecision,
  cancelOwnApplication,
  createStudentApplication as createStudentApplicationShared,
  dormManagerReviewApplication,
  getOwnApplicationsByRole,
  markApplicationPaid,
} from "@/services/application_workflow";

async function createStudentApplication(payload: {
  preferred_accommodation: string;
  preferred_unit_type: string;
  duration_of_stay: number;
  check_in: string;
  check_out: string;
  number_of_companions: number;
}) {
  return createStudentApplicationShared(payload);
}

async function cancelStudentApplication(application_id: string) {
  return cancelOwnApplication(application_id);
}

async function dormManagerReviewStudentApplication(payload: {
  application_id: string;
  approve: boolean;
  unit_id?: string | null;
  remarks?: string;
}) {
  return dormManagerReviewApplication(payload);
}

async function adminReviewStudentApplication(payload: {
  application_id: string;
  approve: boolean;
  unit_id?: string | null;
  remarks?: string;
}) {
  return adminReviewApplication(payload);
}

async function studentRespondToApplication(payload: {
  application_id: string;
  accept: boolean;
}) {
  return applicantRespondToAdminDecision(payload);
}

async function markStudentApplicationPaid(application_id: string) {
  return markApplicationPaid(application_id);
}

async function getMyStudentApplications() {
  return getOwnApplicationsByRole();
}

export {
  createStudentApplication,
  cancelStudentApplication,
  dormManagerReviewStudentApplication,
  adminReviewStudentApplication,
  studentRespondToApplication,
  markStudentApplicationPaid,
  getMyStudentApplications,
};