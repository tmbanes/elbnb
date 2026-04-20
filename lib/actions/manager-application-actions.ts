import { Unit } from "@/types/accommodation_units";

export interface ApplicationUser {
  first_name: string;
  last_name: string;
  email: string;
}

export interface Application {
  application_id: string;
  preferred_accommodation_id: string;
  preferred_unit_type: string;
  date_submitted: string;
  duration_of_stay: number;
  check_in: string;
  check_out: string;
  number_of_companions: number;
  application_status: string;
  user_id: string;
  users: ApplicationUser;
}

export interface ManagerApplicationsResponse {
  accommodation: { accommodation_id: string; name: string };
  applications: Application[];
  units: Unit[];
}

export type ManagerAction = "forward" | "reject";

export async function fetchManagerApplications(): Promise<ManagerApplicationsResponse> {
  
  const res = await fetch("/api/manager/applications", {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) {
    const { error } = await res.json();
    throw new Error(error ?? "Failed to fetch applications.");
  }

  return res.json();
}

export async function updateApplicationStatus(
  application_id: string,
  action: ManagerAction,
  unitId?: string
): Promise<void> {
  const res = await fetch("/api/manager/applications", {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ application_id, action, unit_id: unitId }),
  });

  if (!res.ok) {
    const { error } = await res.json();
    throw new Error(error ?? "Failed to update application.");
  }
}