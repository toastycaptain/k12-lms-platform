"use client";

export { useIbHomePayload, type HomeLinkItem, type IbHomePayload } from "@/features/ib/data";

export function isCoordinatorRole(roles: string[]) {
  return roles.some((role) => ["admin", "curriculum_lead", "district_admin"].includes(role));
}
