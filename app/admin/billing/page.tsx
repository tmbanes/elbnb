import { ensureInitialInvoicesForPendingPaymentApplications, getAllBillsForAdmin, getActiveTenants } from "@/services/user-services";
import { redirect } from "next/navigation";
import { Archivo, Archivo_Black } from "next/font/google";
import AdminBillingClient from "./AdminBillingClient";
import { requireRole } from "@/lib/auth/session";

const archivo = Archivo({ subsets: ["latin"] });
const archivoBlack = Archivo_Black({ subsets: ["latin"], weight: "400" });

export default async function AdminBillingPage() {
  const user = await requireRole(['housing_admin', 'admin']);

  // Trigger maintenance task in the background (fire and forget)
  ensureInitialInvoicesForPendingPaymentApplications().catch(console.error);

  // Parallelize the data fetching
  const [billsRes, tenantsRes] = await Promise.all([
    getAllBillsForAdmin(user.role || "", user.user_id || undefined),
    getActiveTenants(user.role || undefined, user.user_id || undefined)
  ]);

  const { data: bills, error } = billsRes;
  const { data: activeTenants } = tenantsRes;

  // Calculate summary metrics
  let totalRevenue = 0;
  let unpaidBalance = 0;
  let overdueBalance = 0;

  (bills || []).forEach((bill: any) => {
    if (bill.status === "paid") totalRevenue += bill.amount;
    if (bill.status === "unpaid") unpaidBalance += bill.amount;
    if (bill.status === "overdue") overdueBalance += bill.amount;
  });

  const summary = {
    totalRevenue,
    unpaidBalance,
    overdueBalance,
    transactionCount: (bills || []).length
  };

  if (error) {
    return (
      <main className="min-h-screen p-8" style={{ backgroundColor: '#F6F8D5' }}>
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="mb-8">
            <h1 className={`${archivoBlack.className} text-5xl font-bold text-[#44291B] tracking-tight`}>Billing Management</h1>
            <p className={`${archivo.className}  mt-1 mb-4 text-sm text-[#44291B]`}>Overview of all tenant invoices, payments, and revenue.</p>
          </div>
          <div className="p-6 rounded-2xl border border-red-200 bg-red-50 text-red-700 text-sm">
            SUPABASE ERROR: {JSON.stringify(error)}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-20 md:px-36 py-4 md:py-10" style={{ backgroundColor: '#F6F8D5' }}>
      <div className="max-w-7xl mx-auto space-y-8">


        <AdminBillingClient
          adminId={user.user_id}
          bills={bills || []}
          summary={summary}
          activeTenants={activeTenants || []}
        />
      </div>
    </main>
  );
}
