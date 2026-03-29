"use client";

import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();

  return (
    <div className="space-y-4 p-6">
      <div>Dashboard</div>

      <button
        onClick={() => router.push("/dashboard/apply")}
        className="rounded bg-emerald-500 px-4 py-2 text-white hover:bg-emerald-600"
      >
        Go to Apply Page
      </button>
    </div>
  );
}
