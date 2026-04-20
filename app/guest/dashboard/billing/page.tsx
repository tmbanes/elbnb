import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { getUserPaymentSummary, getStudentBillsDetailed, getStudentPaymentHistory } from "@/services/user-services";
import { redirect } from "next/navigation";
import BillingClient from "@/app/student/dashboard/billing/BillingClient";
import LogoutButton from "@/components/logout-button";

export default async function GuestBillingPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { data: summary } = await getUserPaymentSummary(user.id, "guest");
  const { data: bills } = await getStudentBillsDetailed(user.id);
  const { data: paymentHistory } = await getStudentPaymentHistory(user.id);

  return (
    <main className="min-h-screen p-8 bg-slate-50/50">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Guest Billing & Payments</h1>
          <p className="text-slate-500 mt-1 mb-4 text-sm">Manage your invoices and view your payment history.</p>
          <LogoutButton />
        </div>
        
        <BillingClient 
          userId={user.id} 
          summary={summary || { total: 0, paid: 0, balance: 0 }} 
          bills={bills || []}
          paymentHistory={paymentHistory || []}
        />
      </div>
    </main>
  );
}
