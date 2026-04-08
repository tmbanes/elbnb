// SAMPLE ROLE SELECTION PAGE ONLY
// redirects to dashboard for now

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Role = "guest" | "student" | "dormitory_manager" | "housing_admin";

const roleLabels: Record<Role, string> = {
  guest: "Guest",
  student: "Student",
  dormitory_manager: "Dormitory Manager",
  housing_admin: "Admin",
};

const roleDescriptions: Record<Role, string> = {
  guest: "Quick access for visitors and temporary stays.",
  student: "Access student-specific housing and residency features.",
  dormitory_manager: "Manage dorms, view assignments, and approve residents.",
  housing_admin: "Administer housing operations and system management.",
};

export default function RoleSelection() {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const router = useRouter();

  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-center bg-[#8dbd59] p-4 font-sans selection:bg-emerald-500/30">
      <div className="w-full max-w-2xl space-y-6">
        <div className="relative overflow-hidden rounded-[2rem] bg-[#5591AB] p-10 shadow-2xl backdrop-blur-xl">
          <div className="absolute -right-10 -top-10 -z-10 h-32 w-32 rounded-full bg-emerald-500/20 blur-3xl" />
          <div className="absolute -left-10 -bottom-10 -z-10 h-32 w-32 rounded-full bg-blue-500/20 blur-3xl" />

          <div className="mb-8 text-center text-[#fcf4d9]">
            <h1 className="mt-4 text-4xl font-bold tracking-tight">
              Finish setup by choosing your role
            </h1>
            <p className="mt-3 text-base leading-7 text-slate-100/90">
              Pick your matching role, then continue to complete the next step.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {Object.entries(roleLabels).map(([role, label]) => (
              <button
                key={role}
                type="button"
                onClick={() => setSelectedRole(role as Role)}
                className={`relative overflow-hidden rounded-3xl border p-6 text-left transition-all duration-200 shadow-sm ${
                  selectedRole === role
                    ? "border-[#fbbc05] bg-[#fcf4d9] shadow-xl scale-[1.02]" 
                    : "border-white/10 bg-white/10 hover:border-white/30 hover:bg-white/20"
                }`}
              >
                <span className={`text-sm font-semibold uppercase tracking-[0.2em] ${
                    selectedRole === role ? "text-[#2d1a12]/60" : "text-slate-300"
                }`}>
                  {label}
                </span>
                
                <h2 className={`mt-4 text-2xl font-bold ${
                    selectedRole === role ? "text-[#2d1a12]" : "text-white"
                }`}>
                    {label}
                </h2>
                
                <p className={`mt-3 text-sm leading-6 ${
                    selectedRole === role ? "text-[#2d1a12]/80" : "text-slate-100"
                }`}>
                  {roleDescriptions[role as Role]}
                </p>
              </button>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-end">
            <button
              type="button"
              disabled={!selectedRole}
              onClick={() => selectedRole && router.push("/dashboard")}
              className="inline-flex items-center justify-center rounded-full bg-[#fbbc05] px-6 py-3 text-sm font-bold text-[#2d1a12] transition hover:bg-[#fcf4d9] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Continue
            </button>

          </div>
        </div>
      </div>
    </main>
  );
}