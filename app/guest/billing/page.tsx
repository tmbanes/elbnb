import { ensureInitialInvoicesForUser, getUserPaymentSummary, getStudentBillsDetailed, getStudentPaymentHistory } from "@/services/user-services";
import { redirect } from "next/navigation";
import { Archivo, Archivo_Black } from "next/font/google";
import BillingClient from "./BillingClient";

const archivo = Archivo({ subsets: ["latin"] });
const archivoBlack = Archivo_Black({ subsets: ["latin"], weight: "400" });

import { getApiAuthenticatedUser } from "@/lib/auth/session";

export default async function GuestBillingPage() {
  const user = await getApiAuthenticatedUser();

  if (!user) {
    redirect("/onboarding");
  }

  const [summaryRes, billsRes, historyRes] = await Promise.all([
    getUserPaymentSummary(user.user_id, "guest"),
    getStudentBillsDetailed(user.user_id),
    getStudentPaymentHistory(user.user_id)
  ]);

  const summary = summaryRes.data;
  const bills = billsRes.data;
  const paymentHistory = historyRes.data;

  return (
    <main className={`min-h-screen pt-10 pb-16 bg-[#F6F8D5] ${archivo.className}`} style={{ color: '#44291B' }}>
      <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-8">


        <BillingClient
          userId={user.user_id}
          summary={summary || { total: 0, paid: 0, balance: 0 }}
          bills={bills || []}
          paymentHistory={paymentHistory || []}
        />
      </div>
    </main>
  );
}
