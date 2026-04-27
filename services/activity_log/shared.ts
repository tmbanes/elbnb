import { UserRole } from "@/types/user.types";

const USER_ROLES: UserRole[] = [
  "student",
  "dormitory_manager",
  "housing_admin",
  "admin",
  "guest",
];

function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && USER_ROLES.includes(value as UserRole);
}

export { isUserRole };
