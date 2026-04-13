"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface SummaryStats {
  totalDorms: number;
  totalRentalSpaces: number;
  totalManagers: number;
  totalUnits: number;
}

export default function HousingDashboardPage() {
  const [stats, setStats] = useState<SummaryStats>({
    totalDorms: 0,
    totalRentalSpaces: 0,
    totalManagers: 0,
    totalUnits: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [dormsRes, rentalRes, managersRes] = await Promise.all([
          fetch("/api/admin/housing/dorms"),
          fetch("/api/admin/housing/rental-spaces"),
          fetch("/api/admin/housing/managers"),
        ]);

        if (!dormsRes.ok || !rentalRes.ok || !managersRes.ok) {
          throw new Error("Failed to fetch housing data");
        }

        const [dorms, rentals, managers] = await Promise.all([
          dormsRes.json(),
          rentalRes.json(),
          managersRes.json(),
        ]);

        setStats({
          totalDorms: dorms.length,
          totalRentalSpaces: rentals.length,
          totalManagers: managers.length,
          totalUnits: 0, // extended via units API if needed
        });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (loading) return <p className="p-6">Loading housing overview...</p>;
  if (error) return <p className="p-6 text-red-500">Error: {error}</p>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Housing Inventory</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <StatCard label="Dormitories" value={stats.totalDorms} />
        <StatCard label="Rental Spaces" value={stats.totalRentalSpaces} />
        <StatCard label="Managers" value={stats.totalManagers} />
      </div>

      {/* Quick Links */}
      <div className="flex gap-4">
        <Link
          href="/dashboard/admin/housing/properties"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          View All Properties
        </Link>
        <Link
          href="/dashboard/admin/housing/managers"
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          View All Managers
        </Link>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded border p-4 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}
