import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { ensureInitialInvoicesForUser, getUserPaymentSummary, getStudentBillsDetailed, getStudentPaymentHistory } from "@/services/user-services";
import { redirect } from "next/navigation";
import { Archivo, Archivo_Black } from "next/font/google";
import BillingClient from "./BillingClient";

const archivo = Archivo({ subsets: ["latin"] });
const archivoBlack = Archivo_Black({ subsets: ["latin"], weight: "400" });

export default async function StudentBillingPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  await ensureInitialInvoicesForUser(user.id);

  const { data: summary } = await getUserPaymentSummary(user.id, "student");
  const { data: bills, error: billsError } = await getStudentBillsDetailed(user.id);
  const { data: paymentHistory } = await getStudentPaymentHistory(user.id);

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
          userId={user.id}
          summary={summary || { total: 0, paid: 0, balance: 0 }}
          bills={bills || []}
          paymentHistory={paymentHistory || []}
          uploadEndpoint="/api/student/billing/upload-receipt"
        />
      </div>
    </main>
  );
}
