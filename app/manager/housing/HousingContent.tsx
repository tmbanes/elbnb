"use client";

import { useState } from "react";
import { Property } from "@/types/housing/types";
import HousingList from "./HousingList";
import HousingDetail from "./HousingDetail";
import { DUMMY_HOUSING } from "./dummyData";

export default function HousingContent() {
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  if (selectedProperty) {
    return (
      <HousingDetail
        property={selectedProperty}
        onBack={() => setSelectedProperty(null)}
      />
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-black text-[#44291B] font-archivo-black tracking-tight">Housing Management</h1>
        <p className="text-md text-[#44291B]font-medium">Manage and monitor your assigned properties and units</p>
      </div>

      <HousingList
        properties={DUMMY_HOUSING}
        onSelect={setSelectedProperty}
      />
    </div>
  );
}
