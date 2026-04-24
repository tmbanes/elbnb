import { Suspense } from "react";
import ResidentManagement from "./residentManagement";

export default function AdminResidentsPage() {
  return (
    <div className="min-h-screen p-8 bg-[#F6F8D5]">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="mb-8">
          <Suspense fallback={<p className="p-6">Loading...</p>}>
            <ResidentManagement apiEndpoint="/api/admin/residents" title="Admin Resident Management" />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
