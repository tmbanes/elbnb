import { Suspense } from "react";
import ManagersContent from "./ManagersPageContent";

export default function ManagersPage() {
  return (
    <div className="min-h-screen bg-[#F6F8D5]">
      <Suspense fallback={<p className="p-6">Loading...</p>}>
        <ManagersContent />
      </Suspense>
    </div>
  );
}
