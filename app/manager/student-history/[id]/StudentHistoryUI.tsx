"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  Search, Bell, Building2, History, FileText, 
  Download, ArrowRight, LogOut, ChevronLeft,
  CheckCircle2, XCircle, Clock, Folder,
  CreditCard, AlertCircle
} from "lucide-react";
import { Archivo } from "next/font/google";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";

const archivo = Archivo({ subsets: ["latin"] });

interface StudentHistoryUIProps {
  profile: any;
  initialHistory: any[];
  initialBilling: any[];
}

export default function StudentHistoryUI({ profile, initialHistory, initialBilling }: StudentHistoryUIProps) {
  const [history, setHistory] = useState<any[]>(initialHistory);
  const [billing, setBilling] = useState<any[]>(initialBilling);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className={`min-h-screen bg-[#F6F8D5] p-6 lg:p-10 text-slate-800 flex flex-col items-center ${archivo.className}`}>
      <div className="w-full max-w-[1100px]">
        {/* BACK BUTTON */}
        <Link href="/manager/dashboard" className="inline-block mb-8">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-[#0B3A64] hover:bg-[#082a4a] text-white font-bold text-[13px] rounded-lg transition-all shadow-md active:scale-[0.98] cursor-pointer group">
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to Dashboard
          </button>
        </Link>

        {/* PAGE HEADER */}
        <section className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <h3 className="text-[11px] font-extrabold text-[#0B3A64] tracking-[0.2em] uppercase mb-2">
                Manager Audit View
            </h3>
            <h1 className="text-4xl md:text-5xl font-extrabold text-[#0B3A64] tracking-tight">
                Resident <span className="italic text-[#DE7A6A]">History</span>
            </h1>
            <p className="text-sm font-medium text-slate-500 mt-4">
                Reviewing activity logs for <span className="text-[#0B3A64] font-bold">{profile.first_name} {profile.last_name}</span>.
            </p>
          </div>
          
          <div className="flex items-center gap-4 bg-white p-4 rounded-[20px] border border-slate-100 shadow-sm">
             <div className="w-12 h-12 rounded-full bg-[#5D6BDE] text-white flex items-center justify-center font-bold text-sm shadow-sm overflow-hidden">
                {profile.profile_picture_url ? (
                    <Image src={profile.profile_picture_url} alt="Profile" width={48} height={48} className="w-full h-full object-cover" />
                ) : (profile.first_name?.[0] + profile.last_name?.[0]).toUpperCase()}
             </div>
             <div>
                <p className="text-[14px] font-black text-[#0B3A64] leading-tight">{profile.first_name} {profile.last_name}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">ID: {profile.user_id.slice(0, 8)}...</p>
             </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* MAIN CONTENT AREA */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* RESIDENCY LOGS */}
            <div className="space-y-4">
               <div className="flex justify-between items-center px-2">
                  <h3 className="text-[17px] font-extrabold text-[#2A3F2D]">Residency Logs</h3>
                  <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">{history.length} Records</span>
               </div>

               <div className="bg-white rounded-[24px] overflow-hidden border border-slate-100 shadow-sm">
                  {isLoading ? (
                      <div className="p-10 text-center text-slate-400 font-medium">Loading history...</div>
                  ) : history.length === 0 ? (
                      <div className="p-10 text-center text-slate-400 font-medium">No residency records found.</div>
                  ) : (
                    history.map((record, index) => (
                        <div key={record.application_id} className={`p-6 ${index !== history.length - 1 ? 'border-b border-slate-50' : ''} flex items-center gap-6 group hover:bg-slate-50/50 transition-colors`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                                record.application_status === 'approved' ? 'bg-green-50 text-green-500' :
                                record.application_status === 'rejected' ? 'bg-red-50 text-red-400' :
                                'bg-blue-50 text-blue-400'
                            }`}>
                                {record.application_status === 'approved' ? <Building2 className="w-5 h-5" /> : 
                                 record.application_status === 'rejected' ? <XCircle className="w-5 h-5" /> :
                                 <Clock className="w-5 h-5" />}
                            </div>
                            <div className="flex-1">
                                <h4 className="text-[15px] font-bold text-slate-900">{record.accommodation?.name || "Preferred Stay"}</h4>
                                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">{record.preferred_unit_type} · {record.term_applied}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[13px] font-bold text-slate-900">{record.application_status.toUpperCase()}</p>
                                <p className="text-[10px] text-slate-400 font-medium">{record.date_submitted ? new Date(record.date_submitted).toLocaleDateString() : "---"}</p>
                            </div>
                        </div>
                    ))
                  )}
               </div>
            </div>

            {/* BILLING LOGS */}
            <div className="space-y-4">
               <div className="flex justify-between items-center px-2">
                  <h3 className="text-[17px] font-extrabold text-[#2A3F2D]">Billing Activity</h3>
                  <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">{billing.length} Invoices</span>
               </div>

               <div className="bg-white rounded-[24px] overflow-hidden border border-slate-100 shadow-sm">
                  {isLoading ? (
                      <div className="p-10 text-center text-slate-400 font-medium">Loading billing...</div>
                  ) : billing.length === 0 ? (
                      <div className="p-10 text-center text-slate-400 font-medium">No billing records found.</div>
                  ) : (
                    billing.map((bill, index) => (
                        <div key={bill.billing_id} className={`p-6 ${index !== billing.length - 1 ? 'border-b border-slate-50' : ''} flex items-center gap-6 group hover:bg-slate-50/50 transition-colors`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                                bill.status === 'Paid' ? 'bg-green-50 text-green-500' : 'bg-red-50 text-red-500'
                            }`}>
                                <CreditCard className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-[15px] font-bold text-slate-900">₱{bill.amount.toLocaleString()}</h4>
                                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">{bill.billing_type} · Due {new Date(bill.due_date).toLocaleDateString()}</p>
                            </div>
                            <div className="text-right">
                                <p className={`text-[11px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${
                                    bill.status === 'Paid' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                                }`}>
                                    {bill.status}
                                </p>
                            </div>
                        </div>
                    ))
                  )}
               </div>
            </div>
          </div>

          {/* SIDEBAR */}
          <div className="flex flex-col gap-6">
            {/* AUDIT SUMMARY */}
            <div className="bg-[#0B3A64] rounded-[24px] p-8 shadow-md text-white relative overflow-hidden">
               <h2 className="text-[17px] font-extrabold mb-8 tracking-wide">Audit Summary</h2>
               
               <div className="space-y-6">
                  <div>
                     <p className="text-[11px] font-bold text-white/50 uppercase tracking-widest mb-1">Lifetime Billing</p>
                     <p className="text-3xl font-black">₱{billing.reduce((acc, b) => acc + (b.amount || 0), 0).toLocaleString()}</p>
                  </div>
                  <div>
                     <p className="text-[11px] font-bold text-white/50 uppercase tracking-widest mb-1">Residency Status</p>
                     <p className="text-lg font-bold">Resident since 2024</p>
                  </div>
               </div>

               <div className="mt-10 pt-10 border-t border-white/10 opacity-20">
                  <AlertCircle className="w-24 h-24 absolute -bottom-6 -right-6 rotate-12" />
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
