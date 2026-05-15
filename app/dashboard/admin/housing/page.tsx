import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/admin-client";

export const dynamic = 'force-dynamic';

export default async function HousingDashboardPage() {
  
  // Using { count: 'exact', head: true } is extremely efficient because 
  // it doesn't actually download any rows from the database, it just asks for the count!
  const [
    { count: totalDorms },
    { count: totalRentalSpaces },
    { count: totalManagers }
  ] = await Promise.all([
    supabaseAdmin
      .from("accommodation")
      .select("*", { count: "exact", head: true })
      .eq("accommodation_type", "dormitory"),
    supabaseAdmin
      .from("accommodation")
      .select("*", { count: "exact", head: true })
      .eq("accommodation_type", "renting_space"),
    supabaseAdmin
      .from("dormitory_manager")
      .select("*", { count: "exact", head: true })
  ]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Housing Routes</h1>
      <p>will remove this page once moved to ADMIN page routes (pages for housing currently in /dashboard for checking)</p>

      {/* Stats Display */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-white border rounded shadow-sm">
          <h2 className="text-sm font-semibold text-gray-500">Total Dorms</h2>
          <p className="text-3xl font-bold">{totalDorms ?? 0}</p>
        </div>
        <div className="p-4 bg-white border rounded shadow-sm">
          <h2 className="text-sm font-semibold text-gray-500">Total Rental Spaces</h2>
          <p className="text-3xl font-bold">{totalRentalSpaces ?? 0}</p>
        </div>
        <div className="p-4 bg-white border rounded shadow-sm">
          <h2 className="text-sm font-semibold text-gray-500">Total Managers</h2>
          <p className="text-3xl font-bold">{totalManagers ?? 0}</p>
        </div>
      </div>

      {/* Quick Links */}
      <div className="flex gap-4">
        <Link
          href="/dashboard/admin/housing/properties"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          View All Properties
        </Link>
        <Link
          href="/dashboard/admin/housing/managers"
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
        >
          View All Managers
        </Link>
      </div>
    </div>
  );
}