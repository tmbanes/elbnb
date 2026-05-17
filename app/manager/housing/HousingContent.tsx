"use client";

import { Property } from "@/types/housing/types";
import HousingDetail from "./HousingDetail";

export default function HousingContent({ properties }: { properties: Property[] }) {
  const property = properties[0] ?? null;

  if (!property) {
    return (
      <div className="flex items-center justify-center h-64 text-[#8c8b82] font-medium font-[family-name:var(--font-archivo)]">
        No property assigned to your account.
      </div>
    );
  }

  return <HousingDetail property={property} assignedAdmins={(property as any).assignedAdmins} onBack={() => {}} hideBack />;
}
