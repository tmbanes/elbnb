import { Suspense } from "react";
import HousingContent from "./HousingContent";

export default function HousingPage() {
  return (
    <div className="min-h-screen p-8 bg-[#F6F8D5]">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="mb-8">
          <Suspense
            fallback={<p className="p-6 text-[#44291B] font-bold">Loading Housing Dashboard...</p>}>
            <HousingContent />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
