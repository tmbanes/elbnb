import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { getAllBillsForAdmin, getActiveTenants } from "@/services/user-services";
import { redirect } from "next/navigation";
import AdminBillingClient from "./AdminBillingClient";
import LogoutButton from "@/components/logout-button";

export default async function AdminBillingPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  // Double check if user is admin role by getting profile metadata if needed, 
  // or default to passing "admin" to service
  const { data: bills, error } = await getAllBillsForAdmin("admin");
  const { data: activeTenants } = await getActiveTenants();

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

  return (
    <main className="min-h-screen p-8 bg-slate-50/50">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Billing Management</h1>
          <p className="text-slate-500 mt-1 mb-4 text-sm">Overview of all tenant invoices, payments, and revenue.</p>
          <LogoutButton />
        </div>
        
        <AdminBillingClient 
          adminId={user.id} 
          bills={bills || []} 
          summary={summary}
          activeTenants={activeTenants || []}
        />
      </div>
    </main>
  );
}
