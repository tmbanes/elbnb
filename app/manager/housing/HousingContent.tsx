"use client";

import { Property } from "@/types/housing/types";
import HousingDetail from "./HousingDetail";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export default function HousingContent({ properties }: { properties: Property[] }) {
  const router = useRouter();
  const property = properties[0] ?? null;

  if (!property) {
    return (
      <div className="flex flex-col gap-4">
        <Button
          variant="ghost"
          onClick={() => router.push("/manager/dashboard")}
          className="flex items-center gap-2 text-[#44291B]/60 hover:text-[#44291B] hover:bg-[#FDFFF4] -ml-2 mb-2 transition-all group w-fit"
        >
          <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span className="text-xs font-bold uppercase tracking-wider">Back to Dashboard</span>
        </Button>
        <div className="flex items-center justify-center h-64 text-[#8c8b82] font-medium font-[family-name:var(--font-archivo)]">
          No property assigned to your account.
        </div>
      </div>
    );
  }

  return (
    <>
      <Button
        variant="ghost"
        onClick={() => router.push("/manager/dashboard")}
        className="flex items-center gap-2 text-[#44291B]/60 hover:text-[#44291B] hover:bg-[#FDFFF4] -ml-2 mb-2 transition-all group w-fit"
      >
        <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        <span className="text-xs font-bold uppercase tracking-wider">Back to Dashboard</span>
      </Button>
      <HousingDetail property={property} onBack={() => router.push("/manager/dashboard")} hideBack={true} />
    </>
  );
}
