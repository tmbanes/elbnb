"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search, Bell, Building2, History, FileText,
  Download, ArrowRight, LogOut, ChevronLeft,
  CheckCircle2, XCircle, Clock, Folder
} from "lucide-react";
import { Archivo } from "next/font/google";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";

const archivo = Archivo({ subsets: ["latin"] });

interface HistoryUIProps {
  profile: any;
  initialHistory: any[];
  onLogout?: () => void;
  isLoggingOut?: boolean;
}

export default function HistoryUI({ profile, initialHistory, onLogout, isLoggingOut }: HistoryUIProps) {
  const [showLogout, setShowLogout] = useState(false);
  const [history, setHistory] = useState<any[]>(initialHistory);
  const [isLoading, setIsLoading] = useState(false);

  const userInitials = profile ? `${profile.first_name?.[0] ?? ""}${profile.last_name?.[0] ?? ""}`.toUpperCase() : "G";

  return (
    <div className={`min-h-screen bg-[#F6F8D5] p-6 lg:p-10 text-slate-800 flex flex-col items-center ${archivo.className}`}>
      <div className="w-full max-w-[1100px]">
        {/* TOP BAR */}
        <header className="flex flex-col-reverse md:flex-row justify-between items-start md:items-center w-full mb-12 gap-4">
          <div className="relative w-full md:w-[350px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search history..."
              className="w-full pl-11 pr-4 py-3 bg-slate-100/80 rounded-full text-sm border-none focus:ring-2 focus:ring-slate-300 outline-none font-medium placeholder:text-slate-400"
            />
          </div>
          <div className="flex items-center gap-6 self-end md:self-auto">
            <button className="relative text-slate-700 hover:text-slate-900 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#A05C5C] rounded-full ring-2 ring-[#FDFBF7]"></span>
            </button>

            <div className="relative">
              <div
                className="flex items-center gap-3 cursor-pointer group"
                onClick={() => setShowLogout(!showLogout)}
              >
                <div className="flex flex-col items-end">
                  <span className="text-[13px] font-bold text-slate-900 leading-tight">{profile?.first_name}</span>
                  <span className="text-[9px] text-slate-500 font-bold tracking-widest uppercase">GUEST</span>
                </div>
                <div className="w-10 h-10 rounded-full bg-[#5D6BDE] text-white flex items-center justify-center font-bold text-sm shadow-sm group-hover:scale-105 transition-transform overflow-hidden">
                  {profile?.profile_picture_url ? (
                    <Image src={profile.profile_picture_url} alt="Profile" width={40} height={40} className="w-full h-full object-cover" />
                  ) : userInitials}
                </div>
              </div>

              {showLogout && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-slate-100 p-2 z-50 overflow-hidden">
                  <Link href="/guest/settings">
                    <button className="w-full flex items-center gap-2 text-left px-3 py-2.5 text-[13px] font-bold text-slate-700 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer mb-1">
                      <Search className="w-4 h-4 text-slate-400" />
                      Settings
                    </button>
                  </Link>
                  <div className="h-px bg-slate-100 my-1 mx-1" />
                  <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-2 text-left px-3 py-2.5 text-[13px] font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* BACK BUTTON */}
        <Link href="/guest/dashboard" className="inline-block mb-8">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-[#5591AB] hover:bg-[#4a7d94] text-white font-bold text-[13px] rounded-lg transition-all shadow-[0_2px_10px_rgba(85,145,171,0.2)] hover:shadow-[0_4px_15px_rgba(85,145,171,0.3)] active:scale-[0.98] cursor-pointer group">
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to Dashboard
          </button>
        </Link>

        {/* PAGE HEADER */}
        <section className="mb-10">
          <h3 className="text-[11px] font-extrabold text-[#4A3022] tracking-[0.2em] uppercase mb-2">
            Guest Residency Archive
          </h3>
          <h1 className="text-4xl md:text-5xl font-extrabold text-[#4A3022] tracking-tight">
            Accommodation History
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-4">
            Review your past residency applications and assignments.
          </p>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* MAIN CONTENT AREA */}
          <div className="lg:col-span-2 space-y-8">

            {/* PAST RECORDS SECTION */}
            <div className="space-y-4">
              <div className="flex justify-between items-center px-2">
                <h3 className="text-[17px] font-extrabold text-[#2A3F2D]">Activity Logs</h3>
                <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">{history.length} Records Found</span>
              </div>

              <div className="bg-[#FDFFF4] rounded-[24px] overflow-hidden border border-[#eef1d6] shadow-sm">
                {isLoading ? (
                  <div className="p-10 text-center text-slate-400 font-medium">Loading history...</div>
                ) : history.length === 0 ? (
                  <div className="p-10 text-center text-slate-400 font-medium">No history records found.</div>
                ) : (
                  history.map((record, index) => (
                    <div key={record.application_id} className={`p-6 ${index !== history.length - 1 ? 'border-b border-[#eef1d6]' : ''} flex flex-col md:flex-row items-center gap-6 md:gap-12 hover:bg-[#F8F9EC] transition-colors group`}>
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${record.application_status === 'approved' ? 'bg-[#E9EBC1] text-[#709849]' :
                          record.application_status === 'rejected' ? 'bg-red-50 text-red-400' :
                            'bg-blue-50 text-blue-400'
                        }`}>
                        {record.application_status === 'approved' ? <Building2 className="w-6 h-6" /> :
                          record.application_status === 'rejected' ? <XCircle className="w-6 h-6" /> :
                            <Clock className="w-6 h-6" />}
                      </div>
                      <div className="flex-1 min-w-[140px]">
                        <h4 className="text-[17px] font-bold text-slate-900">{record.accommodation?.name || "Preferred Stay"}</h4>
                        <p className="text-[13px] font-medium text-slate-500 mt-0.5">{record.preferred_unit_type} • {record.term_applied || "Standard Term"}</p>
                      </div>
                      <div className="text-center md:text-left">
                        <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Status</p>
                        <p className={`text-[12px] font-bold uppercase tracking-wider ${record.application_status === 'approved' ? 'text-[#78A24C]' :
                            record.application_status === 'rejected' ? 'text-red-500' :
                              'text-[#5591AB]'
                          }`}>
                          {record.application_status.replace(/_/g, ' ')}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0 ml-auto">
                        <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Submitted</p>
                        <p className="text-[13px] font-bold text-slate-900">
                          {record.date_submitted ? new Date(record.date_submitted).toLocaleDateString() : "---"}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* SIDEBAR */}
          <div className="flex flex-col">
            {/* RESIDENCE SUMMARY CARD */}
            <div className="bg-[#6492A7] rounded-[24px] p-8 shadow-md text-white flex flex-col h-full relative overflow-hidden">
              <div>
                <h2 className="text-[17px] font-extrabold mb-8 tracking-wide">Account Status</h2>

                <div className="space-y-8">
                  <div className="flex justify-between items-end border-b border-white/20 pb-4">
                    <p className="text-[14px] font-medium text-white/70">Total Apps</p>
                    <p className="text-4xl font-extrabold">{history.length}</p>
                  </div>
                  <div className="flex justify-between items-end border-b border-white/20 pb-4">
                    <p className="text-[14px] font-medium text-white/70">Approved</p>
                    <p className="text-4xl font-extrabold">{history.filter(h => h.application_status === 'approved').length}</p>
                  </div>
                </div>

                <div className="mt-12 bg-white/10 rounded-2xl p-6 border border-white/10 backdrop-blur-sm">
                  <p className="text-[11px] font-extrabold text-white/90 uppercase tracking-[0.2em] mb-4">Quick Tip</p>
                  <p className="text-[15px] text-white/80 leading-relaxed font-medium">
                    Ensure all your uploaded documents are verified before your check-in date to avoid delays.
                  </p>
                </div>
              </div>

              <div className="mt-auto pt-10 opacity-20">
                <History className="w-32 h-32 absolute -bottom-10 -right-10 rotate-12" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
