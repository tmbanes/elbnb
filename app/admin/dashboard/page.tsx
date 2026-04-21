import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { redirect } from "next/navigation";

type RecentApplicationRow = {
  application_id: string;
  application_status: string;
  date_submitted: string;
  preferred_unit_type: string | null;
  users: { first_name: string; last_name: string } | { first_name: string; last_name: string }[] | null;
  accommodation: { name: string } | { name: string }[] | null;
};

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function startOfNextMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 1);
}

function formatPercent(value: number) {
  if (!Number.isFinite(value)) return "0%";
  return `${value.toFixed(1)}%`;
}

function formatCurrencyPHP(amount: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function AdminDashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (!profile || profile.role !== "housing_admin") redirect("/");

  // ── Total rooms + occupancy (across dormitories) ───────────────────────────
  const { data: dorms, error: dormError } = await supabase
    .from("accommodation")
    .select(
      `
      accommodation_id,
      name,
      accommodation_type,
      unit (unit_id, unit_type, max_occupancy, current_occupancy, unit_status)
    `,
    )
    .eq("accommodation_type", "dormitory");

  if (dormError) {
    throw new Error(dormError.message);
  }

  const activeUnits =
    (dorms ?? [])
      .flatMap((d: any) => (d.unit ?? []) as any[])
      .filter((u) => u?.unit_status === "active") ?? [];

  const totalRooms = activeUnits.filter((u) => u?.unit_type === "room").length;
  const totalCapacity = activeUnits.reduce(
    (sum, u) => sum + (Number(u?.max_occupancy) || 0),
    0,
  );
  const occupied = activeUnits.reduce(
    (sum, u) => sum + (Number(u?.current_occupancy) || 0),
    0,
  );
  const available = Math.max(0, totalCapacity - occupied);
  const occupancyRate = totalCapacity > 0 ? (occupied / totalCapacity) * 100 : 0;

  // ── Pending applications (admin queue) ─────────────────────────────────────
  const { count: pendingApplications, error: pendingError } = await supabase
    .from("accommodation_application")
    .select("application_id", { count: "exact", head: true })
    .eq("application_status", "pending_admin");

  if (pendingError) throw new Error(pendingError.message);

  // ── Revenue this month (paid billings by billing_period_date) ──────────────
  const now = new Date();
  const monthStart = startOfMonth(now);
  const nextMonthStart = startOfNextMonth(now);

  const { data: paidBills, error: billsError } = await supabase
    .from("billing")
    .select("amount, status, billing_period_date")
    .eq("status", "paid")
    .gte("billing_period_date", monthStart.toISOString())
    .lt("billing_period_date", nextMonthStart.toISOString());

  if (billsError) throw new Error(billsError.message);

  const revenueThisMonth = (paidBills ?? []).reduce(
    (sum: number, b: any) => sum + (Number(b?.amount) || 0),
    0,
  );

  // ── Recent applications list ───────────────────────────────────────────────
  const { data: recentApplications, error: recentError } = await supabase
    .from("accommodation_application")
    .select(
      `
      application_id,
      application_status,
      date_submitted,
      preferred_unit_type,
      users:user_id (first_name, last_name),
      accommodation:preferred_accommodation_id (name)
    `,
    )
    .order("date_submitted", { ascending: false })
    .limit(5);

  if (recentError) throw new Error(recentError.message);

  // ── Occupancy by dormitory ────────────────────────────────────────────────
  const occupancyByDormitory = (dorms ?? []).map((d: any) => {
    const units = ((d.unit ?? []) as any[]).filter((u) => u?.unit_status === "active");
    const cap = units.reduce((s, u) => s + (Number(u?.max_occupancy) || 0), 0);
    const occ = units.reduce((s, u) => s + (Number(u?.current_occupancy) || 0), 0);
    const rate = cap > 0 ? (occ / cap) * 100 : 0;
    return {
      accommodation_id: d.accommodation_id as string,
      name: d.name as string,
      occupied: occ,
      capacity: cap,
      rate,
    };
  });

  return (
    <main className="min-h-screen p-8 space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600">Live admin overview.</p>
      </header>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-slate-900">Summary</h2>
        <ul className="space-y-1 text-slate-800">
          <li>
            <span className="font-semibold">Total rooms:</span> {totalRooms}
          </li>
          <li>
            <span className="font-semibold">Occupancy rate:</span>{" "}
            {formatPercent(occupancyRate)} ({occupied} occupied, {available} available)
          </li>
          <li>
            <span className="font-semibold">Pending applications:</span>{" "}
            {pendingApplications ?? 0}
          </li>
          <li>
            <span className="font-semibold">Revenue this month:</span>{" "}
            {formatCurrencyPHP(revenueThisMonth)}
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-slate-900">Recent applications</h2>
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="text-left p-3">Student name</th>
                <th className="text-left p-3">Dormitory</th>
                <th className="text-left p-3">Room type</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Date applied</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {(recentApplications as unknown as RecentApplicationRow[] | null)?.map((a) => {
                const userObj = Array.isArray(a.users) ? a.users[0] : a.users;
                const accObj = Array.isArray(a.accommodation) ? a.accommodation[0] : a.accommodation;

                return (
                  <tr key={a.application_id}>
                  <td className="p-3">
                    {(userObj?.first_name ?? "—") + " " + (userObj?.last_name ?? "")}
                  </td>
                  <td className="p-3">{accObj?.name ?? "—"}</td>
                  <td className="p-3">{a.preferred_unit_type ?? "—"}</td>
                  <td className="p-3">{a.application_status}</td>
                  <td className="p-3">
                    {a.date_submitted ? new Date(a.date_submitted).toLocaleDateString() : "—"}
                  </td>
                  </tr>
                );
              })}
              {(!recentApplications || recentApplications.length === 0) && (
                <tr>
                  <td className="p-3 text-slate-500" colSpan={5}>
                    No applications found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-slate-900">Occupancy by dormitory</h2>
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="text-left p-3">Dormitory</th>
                <th className="text-left p-3">Occupancy</th>
                <th className="text-left p-3">Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {occupancyByDormitory.map((d) => (
                <tr key={d.accommodation_id}>
                  <td className="p-3">{d.name}</td>
                  <td className="p-3">
                    {d.occupied}/{d.capacity}
                  </td>
                  <td className="p-3">{formatPercent(d.rate)}</td>
                </tr>
              ))}
              {occupancyByDormitory.length === 0 && (
                <tr>
                  <td className="p-3 text-slate-500" colSpan={3}>
                    No dormitories found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
