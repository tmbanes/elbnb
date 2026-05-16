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
  const [expandedRecord, setExpandedRecord] = useState<string | null>(null);
  const [isProfileExpanded, setIsProfileExpanded] = useState(false);

  const toggleExpand = (id: string) => {
    setExpandedRecord(expandedRecord === id ? null : id);
  };

  const toggleProfileExpand = () => {
    setIsProfileExpanded(!isProfileExpanded);
  };

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
          
          <div className="relative">
            <div 
              onClick={toggleProfileExpand}
              className={`flex items-center gap-4 bg-white p-4 rounded-[20px] border border-slate-100 shadow-sm cursor-pointer hover:shadow-md transition-all active:scale-[0.98] ${isProfileExpanded ? 'ring-2 ring-[#0B3A64]/10' : ''}`}
            >
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

            {/* PROFILE EXPANDED CONTENT */}
            {isProfileExpanded && (
              <div className="absolute right-0 top-full mt-3 w-[280px] bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.08)] p-5 z-20 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Full Identity</p>
                    <p className="text-[13px] font-bold text-[#0B3A64]">{profile.first_name} {profile.middle_name ? profile.middle_name + ' ' : ''}{profile.last_name}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Account Type</p>
                      <p className="text-[11px] font-bold text-[#DE7A6A] uppercase">{profile.role?.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Sex</p>
                      <p className="text-[11px] font-bold text-[#0B3A64] uppercase">{profile.sex || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status</p>
                      <p className="text-[11px] font-bold text-green-600 uppercase">Verified</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">System Join Date</p>
                      <p className="text-[11px] font-medium text-slate-600">{new Date(profile.created_at || Date.now()).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Full System ID</p>
                    <p className="text-[11px] font-mono font-medium text-slate-500 break-all bg-slate-50 p-2 rounded-lg border border-slate-100">{profile.user_id}</p>
                  </div>
                  <div className="pt-3 border-t border-slate-50 flex justify-between items-center">
                    <p className="text-[9px] text-slate-300 italic">Audit Reference Record</p>
                    <span className="text-[9px] font-bold text-[#0B3A64]/30">ELBNB SECURE</span>
                  </div>
                </div>
              </div>
            )}
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
                    history.map((record, index) => {
                        const isExpanded = expandedRecord === record.application_id;
                        return (
                            <div key={record.application_id} className={`group ${index !== history.length - 1 ? 'border-b border-slate-50' : ''}`}>
                                <div 
                                    onClick={() => toggleExpand(record.application_id)}
                                    className={`p-6 flex items-center gap-6 cursor-pointer transition-all ${isExpanded ? 'bg-slate-50/80' : 'hover:bg-slate-50/50'}`}
                                >
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
                                        <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">{record.preferred_unit_type} · {record.term_applied || 'Semester'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[13px] font-bold text-slate-900">{record.application_status.toUpperCase()}</p>
                                        <p className="text-[10px] text-slate-400 font-medium">{record.date_submitted ? new Date(record.date_submitted).toLocaleDateString() : "---"}</p>
                                    </div>
                                </div>

                                {/* EXPANDED CONTENT */}
                                {isExpanded && (
                                    <div className="px-6 pb-6 pt-2 bg-slate-50/80 animate-in slide-in-from-top-2 duration-300">
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-8 p-5 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Stay Duration</p>
                                                <p className="text-[13px] font-bold text-[#0B3A64]">{record.duration_of_stay || 1} Semester(s)</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Check-in Date</p>
                                                <p className="text-[13px] font-bold text-[#0B3A64]">{record.check_in ? new Date(record.check_in).toLocaleDateString() : 'Pending'}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Check-out Date</p>
                                                <p className="text-[13px] font-bold text-[#0B3A64]">{record.check_out ? new Date(record.check_out).toLocaleDateString() : 'Pending'}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Unit Number</p>
                                                <p className="text-[13px] font-bold text-[#0B3A64]">{record.unit?.unit_number || 'Unassigned'}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Companions</p>
                                                <p className="text-[13px] font-bold text-[#0B3A64]">{record.number_of_companions || 0} person(s)</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Move-in Date</p>
                                                <p className="text-[13px] font-bold text-[#0B3A64]">{record.accommodation_assignment?.move_in_date ? new Date(record.accommodation_assignment.move_in_date).toLocaleDateString() : 'N/A'}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
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
