"use client";

import { useState } from "react";
import { Property } from "@/types/housing/types";
import { Archivo, Archivo_Black } from "next/font/google";
import HousingList from "./HousingList";
import HousingDetail from "./HousingDetail";

const archivo = Archivo({ subsets: ["latin"] });
const archivoBlack = Archivo_Black({ subsets: ["latin"], weight: "400" });

export default function HousingContent({ properties }: { properties: Property[] }) {
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
        <h1 className={`${archivoBlack.className} pt-6 text-3xl md:text-5xl text-[#44291B] mr-2`}>Housing Management</h1>
        <p className="text-md text-[#44291B] font-medium">Manage and monitor your assigned property and units</p>
      </div>

      <HousingList
        properties={properties}
        onSelect={setSelectedProperty}
      />
    </div>
  );
}
