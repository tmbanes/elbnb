import { Suspense } from "react";
import PropertiesContent from "./properties/PropertiesContent";

export default function PropertiesPage() {
  return (
    <div className="min-h-screen p-4 md:p-8 bg-[#F6F8D5]">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="mb-8">
          <Suspense
            fallback={<p className="p-6">Loading...</p>}>
            <PropertiesContent />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
