export interface ApplicationUser {
  first_name: string;
  last_name: string;
  email: string;
}

export interface Unit {
  unit_id: string;
  unit_number: string;
  unit_type: string;
  max_occupancy: number;
  current_occupancy: number;
  rental_fee: number;
  billing_period: string;
  unit_status: string;
}

export interface ApplicationAccommodation {
  accommodation_id: string;
  name: string;
  location: string;
  unit: Unit[];
}

export interface AdminApplication {
  application_id: string;
  preferred_accommodation: string;
  preferred_unit_type: string;
  date_submitted: string;
  duration_of_stay: number;
  check_in: string;
  check_out: string;
  number_of_companions: number;
  application_status: string;
  user_id: string;
  users: ApplicationUser;
  accommodation: ApplicationAccommodation;
}

export type AdminAction = "approve" | "reject";

export async function fetchAdminApplications(): Promise<{
  applications: AdminApplication[];
}> {
  const res = await fetch("/api/admin/applications", {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) {
    const { error } = await res.json();
    throw new Error(error ?? "Failed to fetch applications.");
  }

  return res.json();
}

export async function processApplication(
  application_id: string,
  action: AdminAction,
  unit_id?: string
): Promise<void> {
  const res = await fetch("/api/admin/applications", {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ application_id, action, unit_id }),
  });

  if (!res.ok) {
    const { error } = await res.json();
    throw new Error(error ?? "Failed to process application.");
  }
}
