import { Suspense } from "react";
import PropertiesContent from "./PropertiesContent";

export default function PropertiesPage() {
  return (
    <div className="min-h-screen bg-[#F6F8D5]">
      <Suspense 
        fallback={<p className="p-6">Loading...</p>}>
        <PropertiesContent />
      </Suspense>
    </div>
  );
}
