import type { UserRole } from "@/types";

export const staffRoles: UserRole[] = ["admin", "librarian"];

export function isStaff(role?: UserRole) {
  return role === "admin" || role === "librarian";
}

export function roleLabel(role?: UserRole) {
  if (!role) return "No role";
  return role.charAt(0).toUpperCase() + role.slice(1);
}
