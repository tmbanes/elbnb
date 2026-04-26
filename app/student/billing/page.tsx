import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { ensureInitialInvoicesForUser, getUserPaymentSummary, getStudentBillsDetailed, getStudentPaymentHistory } from "@/services/user-services";
import { redirect } from "next/navigation";
import { Archivo, Archivo_Black } from "next/font/google";
import BillingClient from "./BillingClient";

const archivo = Archivo({ subsets: ["latin"] });
const archivoBlack = Archivo_Black({ subsets: ["latin"], weight: "400" });

import { getApiAuthenticatedUser } from "@/lib/auth/session";

export default async function StudentBillingPage() {
  const user = await getApiAuthenticatedUser();

  if (!user) {
    redirect("/onboarding");
  }

  const [_, summaryRes, billsRes, historyRes] = await Promise.all([
    ensureInitialInvoicesForUser(user.user_id),
    getUserPaymentSummary(user.user_id, "student"),
    getStudentBillsDetailed(user.user_id),
    getStudentPaymentHistory(user.user_id)
  ]);

  const summary = summaryRes.data;
  const bills = billsRes.data;
  const billsError = billsRes.error;
  const paymentHistory = historyRes.data;

  if (billsError) {
    return <div className="p-8 text-red-500 font-mono">SUPABASE ERROR: {JSON.stringify(billsError)}</div>;
  }

  return (
    <main className="min-h-screen p-8 bg-[#F3F6D0]">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="mb-8">
          <h1 className={`${archivoBlack.className} text-3xl font-bold text-slate-900 tracking-tight`}>Billing & Payments</h1>
          <p className={`${archivo.className} text-slate-500 mt-1 mb-4 text-sm`}>Manage your invoices and view your payment history.</p>
        </div>

        <BillingClient
          userId={user.user_id}
          summary={summary || { total: 0, paid: 0, balance: 0 }}
          bills={bills || []}
          paymentHistory={paymentHistory || []}
          uploadEndpoint="/api/student/billing/upload-receipt"
        />
      </div>
    </main>
  );
}
