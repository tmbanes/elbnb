"use client";

import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { processPaymentAction } from "./actions";
import { BillingStatus } from "@/types/billing/enums";
import { 
  CreditCard, 
  FileText, 
  Download, 
  UploadCloud, 
  AlertCircle,
  CheckCircle2,
  Clock,
  Printer
} from "lucide-react";
import { format } from "date-fns";

export default function BillingClient({ userId, summary, bills }: any) {
  const supabase = getSupabaseBrowserClient();

  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  
  const overdueAmount = bills
    .filter((b: any) => b.status === BillingStatus.OVERDUE)
    .reduce((sum: number, b: any) => sum + b.amount, 0);

  const getStatusColor = (status: string) => {
    switch(status) {
      case BillingStatus.PAID: return "bg-green-100 text-green-700 border-green-200";
      case BillingStatus.UNPAID: return "bg-slate-100 text-slate-700 border-slate-200";
      case BillingStatus.PENDING: return "bg-amber-100 text-amber-700 border-amber-200";
      case BillingStatus.OVERDUE: return "bg-red-100 text-red-700 border-red-200";
      case BillingStatus.FAILED: return "bg-rose-100 text-rose-700 border-rose-200";
      default: return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getStatusFormat = (status: string) => {
    return status.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  }

  const handleUploadPayment = async (billId: string) => {
    if (!uploadFile) return;
    
    setIsUploading(true);
    setUploadError("");

    try {
      const fileExt = uploadFile.name.split('.').pop();
      const fileName = `${userId}/${billId}-${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('payment_receipts')
        .upload(fileName, uploadFile);

      if (error) {
        throw error;
      }

      await processPaymentAction(userId, billId, data.path);
      
      // Reload page to reflect changes
      window.location.reload();

    } catch (err: any) {
      setUploadError(err.message || "Failed to upload receipt.");
    } finally {
      setIsUploading(false);
      setUploadFile(null);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
    <div className="space-y-6 print:hidden">
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-medium text-slate-500">Current Balance</h3>
            <div className="p-2 bg-slate-50 rounded-lg"><CreditCard className="w-5 h-5 text-slate-400"/></div>
          </div>
          <p className="text-3xl font-bold text-slate-900">₱{summary.balance.toLocaleString()}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-medium text-slate-500">Total Paid</h3>
            <div className="p-2 bg-emerald-50 rounded-lg"><CheckCircle2 className="w-5 h-5 text-emerald-500"/></div>
          </div>
          <p className="text-3xl font-bold text-slate-900">₱{summary.paid.toLocaleString()}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-medium text-slate-500">Overdue</h3>
            <div className="p-2 bg-red-50 rounded-lg"><AlertCircle className="w-5 h-5 text-red-500"/></div>
          </div>
          <p className="text-3xl font-bold text-red-600">₱{overdueAmount.toLocaleString()}</p>
        </div>

        <div className="bg-indigo-600 text-white p-6 rounded-2xl shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <h3 className="text-sm font-medium text-indigo-100">Next Payment Due</h3>
            <div className="p-2 bg-white/20 rounded-lg"><Clock className="w-5 h-5 text-white"/></div>
          </div>
          <p className="text-3xl font-bold relative z-10 text-white">
            {bills.find((b: any) => b.status === BillingStatus.UNPAID) 
              ? format(new Date(bills.find((b: any) => b.status === BillingStatus.UNPAID).due_date), 'MMM dd, yyyy')
              : "All clear!"}
          </p>
        </div>
      </div>

      {/* Action Area & Table Data */}
      <div className="bg-white border text-sm border-slate-200 rounded-2xl shadow-sm overflow-hidden line-clamp-2">
        <div className="overflow-x-auto text-slate-700">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 font-semibold">Invoice / Period</th>
                <th className="px-6 py-4 font-semibold">Amount</th>
                <th className="px-6 py-4 font-semibold">Due Date</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bills.map((bill: any) => (
                <tr key={bill.billing_id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-slate-900">{bill.billing_period_date ? `Invoice for ${format(new Date(bill.billing_period_date), 'MMMM yyyy')}` : "Student Invoice"}</p>
                    <p className="text-xs text-slate-500">#{bill.billing_id.split("-")[0]}</p>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-900">
                    ₱{bill.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    {format(new Date(bill.due_date), 'MMM dd, yyyy')}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(bill.status)}`}>
                      {getStatusFormat(bill.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => setSelectedBill(bill)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition font-medium flex items-center gap-2"
                      >
                        <FileText className="w-4 h-4"/> Detail
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {bills.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-500">
                    No billing records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
    </div>

    {/* Detail Modal Layer */}
    {selectedBill && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm print:hidden">
        <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl overflow-hidden flex flex-col">
          <div className="p-8 pb-4 flex justify-between items-center bg-slate-50 border-b border-slate-100">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{selectedBill.billing_period_date ? `Invoice for ${format(new Date(selectedBill.billing_period_date), 'MMMM yyyy')}` : "Student Invoice"}</h2>
              <p className="text-slate-500 mt-1">Invoice #{selectedBill.billing_id.split("-")[0]}</p>
            </div>
            <button onClick={() => setSelectedBill(null)} className="text-slate-400 hover:text-slate-600 font-bold text-2xl px-2">
              &times;
            </button>
          </div>

          <div className="p-8 flex-1 space-y-8">
            <div className="flex justify-between items-center text-sm">
              <div>
                <p className="text-slate-500 font-medium">Due Date</p>
                <p className="font-semibold text-slate-900 mt-1">{format(new Date(selectedBill.due_date), 'MMMM dd, yyyy')}</p>
              </div>
              <div className="text-right">
                <p className="text-slate-500 font-medium">Status</p>
                 <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(selectedBill.status)}`}>
                    {getStatusFormat(selectedBill.status)}
                  </span>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-xl p-6">
               <h4 className="font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">Breakdown</h4>
               <ul className="space-y-3">
                 {selectedBill.breakdown?.map((item: any, i: number) => (
                   <li key={i} className="flex justify-between text-slate-700">
                     <span className="capitalize">{item.label.replace("_", " ")}</span>
                     <span className="font-medium">₱{Math.abs(item.amount).toLocaleString()}</span>
                   </li>
                 ))}
               </ul>
               <div className="mt-4 pt-4 border-t border-slate-200 flex justify-between text-lg font-bold text-slate-900">
                 <span>Total Amount</span>
                 <span>₱{selectedBill.summary?.total.toLocaleString()}</span>
               </div>
            </div>

            {(selectedBill.status === BillingStatus.UNPAID || selectedBill.status === BillingStatus.OVERDUE || selectedBill.status === BillingStatus.FAILED) && (
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-6 space-y-4">
                <div>
                  <h4 className="font-bold text-indigo-900 flex items-center gap-2"><CreditCard className="w-5 h-5"/> Cash Payment Process</h4>
                  <p className="text-sm text-indigo-700 mt-2">
                    Please submit your cash transaction alongside the office or designated bank, then upload your receipt/deposit slip here to verify payment.
                  </p>
                </div>
                
                <div className="flex flex-col md:flex-row gap-3">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition"
                  />
                  <button 
                    disabled={!uploadFile || isUploading}
                    onClick={() => handleUploadPayment(selectedBill.billing_id)}
                    className="whitespace-nowrap px-6 py-2.5 bg-indigo-600 disabled:bg-indigo-300 hover:bg-indigo-700 text-white font-semibold rounded-xl flex items-center gap-2 transition"
                  >
                    {isUploading ? "Uploading..." : <><UploadCloud className="w-4 h-4"/> Submit Receipt</>}
                  </button>
                </div>
                {uploadError && <p className="text-red-500 text-sm mt-2">{uploadError}</p>}
              </div>
            )}
            
          </div>
          <div className="bg-slate-50 p-6 border-t border-slate-100 flex justify-end gap-3">
              <button 
                onClick={handlePrint}
                className="px-5 py-2.5 flex items-center gap-2 text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 font-medium rounded-xl transition shadow-sm"
              >
                <Printer className="w-4 h-4"/> Print PDF
              </button>
          </div>
        </div>
      </div>
    )}

    {/* Printable View (Hidden in normal screen, block in print) */}
    {selectedBill && (
      <div className="hidden print:block font-sans text-black bg-white p-8 absolute inset-0 text-sm">
        <div className="flex justify-between items-end border-b-2 border-slate-900 pb-6 mb-8">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-900 uppercase tracking-tighter">INVOICE</h1>
            <p className="text-slate-500 mt-1 font-mono">#{selectedBill.billing_id}</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-slate-800 text-xl">ELbnb Housing</p>
            <p className="text-slate-500">Student Residence Account</p>
          </div>
        </div>
        
        <div className="flex justify-between mb-10">
          <div>
            <p className="text-slate-500 font-bold mb-1">BILLED TO:</p>
            <p className="font-semibold text-lg">{selectedBill.accommodation_assignment?.users?.full_name || "Student Resident"}</p>
            <p className="text-slate-600">ID: {userId}</p>
          </div>
          <div className="text-right">
             <p className="text-slate-500 font-bold mb-1">DETAILS:</p>
             <p><span className="font-semibold">Billed Date:</span> {format(new Date(selectedBill.created_at), 'MM/dd/yyyy')}</p>
             <p><span className="font-semibold">Due Date:</span> {format(new Date(selectedBill.due_date), 'MM/dd/yyyy')}</p>
             <p className="mt-2"><span className="font-bold">Status:</span> {getStatusFormat(selectedBill.status).toUpperCase()}</p>
          </div>
        </div>

        <table className="w-full text-left border-collapse mb-10">
          <thead>
            <tr className="border-b border-slate-300">
              <th className="py-3 font-bold uppercase text-xs text-slate-500 w-2/3">Item Description</th>
              <th className="py-3 font-bold uppercase text-xs text-slate-500 text-right w-1/3">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-100">
              <td className="py-4 font-semibold">{selectedBill.billing_period_date ? `Invoice for ${format(new Date(selectedBill.billing_period_date), 'MMMM yyyy')}` : "Student Invoice"} - Base</td>
              <td className="py-4 text-right font-medium">₱{selectedBill.amount.toLocaleString()}</td>
            </tr>
            {selectedBill.breakdown?.map((item: any, i: number) => (
              <tr key={i} className="border-b border-slate-100">
                <td className="py-3 capitalize text-slate-700 pl-4">↳ {item.label.replace(/_/g, " ")}</td>
                <td className="py-3 text-right">₱{item.amount.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end pt-4">
          <div className="w-1/2">
            <div className="border-t-2 border-slate-900 pt-4 flex justify-between">
              <span className="text-lg font-bold">TOTAL DUE</span>
              <span className="text-2xl font-black">₱{selectedBill.summary?.total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="mt-20 border-t border-slate-300 pt-4 text-center text-slate-400 text-xs">
           This is an electronically generated statement. No physical signature is required.
        </div>
      </div>
    )}
    </>
  );
}
