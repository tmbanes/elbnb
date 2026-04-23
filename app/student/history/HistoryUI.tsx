"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Search, Bell, Building2, History, FileText, 
  Download, ArrowRight, LogOut, ChevronLeft,
  CheckCircle2, XCircle, Clock, Folder
} from "lucide-react";
import { Archivo } from "next/font/google";

const archivo = Archivo({ subsets: ["latin"] });

interface HistoryUIProps {
  onLogout?: () => void;
  isLoggingOut?: boolean;
}

export default function HistoryUI({ onLogout, isLoggingOut }: HistoryUIProps) {
  const [showLogout, setShowLogout] = useState(false);

  return (
    <div className={`min-h-screen bg-[#F6F8D5] p-6 lg:p-10 text-slate-800 flex flex-col items-center ${archivo.className}`}>
      <div className="w-full max-w-[1100px]">
        {/* TOP BAR (Same as Dashboard) */}
        <header className="flex flex-col-reverse md:flex-row justify-between items-start md:items-center w-full mb-12 gap-4">
          <div className="relative w-full md:w-[350px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search data, students, or rooms..." 
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
                  <span className="text-[13px] font-bold text-slate-900 leading-tight">JD</span>
                  <span className="text-[9px] text-slate-500 font-bold tracking-widest uppercase">STUDENT</span>
                </div>
                <div className="w-10 h-10 rounded-full bg-[#5D6BDE] text-white flex items-center justify-center font-bold text-sm shadow-sm group-hover:scale-105 transition-transform">
                  JD
                </div>
              </div>
              
              {showLogout && (
                <div className="absolute right-0 top-full mt-2 w-40 bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-slate-100 p-2 z-50 overflow-hidden">
                  <button 
                    onClick={onLogout}
                    disabled={isLoggingOut}
                    className="w-full flex items-center gap-2 text-left px-3 py-2 text-[13px] font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <LogOut className="w-4 h-4" />
                    {isLoggingOut ? "Exiting..." : "Log out"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* BACK BUTTON */}
        <Link href="/student/dashboard" className="inline-block mb-8">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-[#5591AB] hover:bg-[#4a7d94] text-white font-bold text-[13px] rounded-lg transition-all shadow-[0_2px_10px_rgba(85,145,171,0.2)] hover:shadow-[0_4px_15px_rgba(85,145,171,0.3)] active:scale-[0.98] cursor-pointer group">
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to Dashboard
          </button>
        </Link>

        {/* PAGE HEADER */}
        <section className="mb-10">
          <h3 className="text-[11px] font-extrabold text-[#4A3022] tracking-[0.2em] uppercase mb-2">
            Student Housing Archive
          </h3>
          <h1 className="text-4xl md:text-5xl font-extrabold text-[#4A3022] tracking-tight">
            Accommodation <span className="italic text-[#5591AB]">History</span>
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-4">
            Review your past stays in the University.
          </p>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* MAIN CONTENT AREA */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* ACTIVE NOW CARD */}
            <div className="bg-[#FDFFF4] rounded-[24px] p-6 border border-[#eef1d6] shadow-sm relative overflow-hidden">
               <div className="absolute top-4 right-4 bg-[#78A24C] text-white text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                 Active Now
               </div>
               
               <div className="flex flex-col md:flex-row gap-6 items-start">
                  <div className="w-full md:w-48 h-32 rounded-xl overflow-hidden shadow-md">
                     <img 
                       src="https://images.unsplash.com/photo-1555854817-2b22603c76de?q=80&w=500" 
                       alt="Heritage Hall" 
                       className="w-full h-full object-cover"
                     />
                  </div>
                  <div className="flex-1">
                     <h2 className="text-2xl font-bold text-[#2A3F2D] mb-1 leading-tight">Heritage Hall</h2>
                     <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">Luxury Studio Suite • Wing B</p>
                     
                     <div className="grid grid-cols-2 gap-8">
                        <div>
                           <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Room</p>
                           <p className="text-lg font-bold text-slate-900">402-A</p>
                        </div>
                        <div>
                           <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Stay Dates</p>
                           <p className="text-sm font-bold text-slate-900 leading-tight">Aug 2023 - Present</p>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            {/* PAST RESIDENCES SECTION */}
            <div className="space-y-4">
               <div className="flex justify-between items-center px-2">
                  <h3 className="text-[17px] font-extrabold text-[#2A3F2D]">Past Residences</h3>
                  <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">3 Records Found</span>
               </div>

               <div className="bg-[#FDFFF4] rounded-[24px] overflow-hidden border border-[#eef1d6] shadow-sm">
                  {/* Record 1: West Hall */}
                  <div className="p-6 border-b border-[#eef1d6] flex flex-col md:flex-row items-center gap-6 md:gap-12 hover:bg-[#F8F9EC] transition-colors group">
                     <div className="w-12 h-12 rounded-full bg-[#E9EBC1] flex items-center justify-center text-[#709849] shrink-0">
                        <Building2 className="w-6 h-6" />
                     </div>
                     <div className="flex-1 min-w-[140px]">
                        <h4 className="text-[17px] font-bold text-slate-900">West Hall</h4>
                        <p className="text-[13px] font-medium text-slate-500 mt-0.5">Room 210 • Standard Single</p>
                     </div>
                     <div className="text-center md:text-left">
                        <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Period</p>
                        <p className="text-[14px] font-bold text-slate-900 whitespace-nowrap">Aug 2022 - May 2023</p>
                     </div>
                     <div className="flex flex-col items-end gap-1 shrink-0 ml-auto">
                        <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-[#78A24C] uppercase tracking-wider mb-1">
                           <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                        </div>
                        <button className="flex items-center gap-1.5 text-[12px] font-bold text-[#5591AB] hover:underline">
                           <Download className="w-3.5 h-3.5" /> Download Receipt
                        </button>
                     </div>
                  </div>

                  {/* Record 2: Founder's Commons */}
                  <div className="p-6 border-b border-[#eef1d6] flex flex-col md:flex-row items-center gap-6 md:gap-12 hover:bg-[#F8F9EC] transition-colors group">
                     <div className="w-12 h-12 rounded-full bg-[#E9EBC1] flex items-center justify-center text-[#709849] shrink-0">
                        <Building2 className="w-6 h-6" />
                     </div>
                     <div className="flex-1 min-w-[140px]">
                        <h4 className="text-[17px] font-bold text-slate-900">Founder's Commons</h4>
                        <p className="text-[13px] font-medium text-slate-500 mt-0.5">Room 105 • Shared Quad</p>
                     </div>
                     <div className="text-center md:text-left">
                        <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Period</p>
                        <p className="text-[14px] font-bold text-slate-900 whitespace-nowrap">Jan 2022 - May 2022</p>
                     </div>
                     <div className="flex flex-col items-end gap-1 shrink-0 ml-auto">
                        <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-[#78A24C] uppercase tracking-wider mb-1">
                           <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                        </div>
                        <button className="flex items-center gap-1.5 text-[12px] font-bold text-[#5591AB] hover:underline">
                           <Download className="w-3.5 h-3.5" /> Download Receipt
                        </button>
                     </div>
                  </div>

                  {/* Record 3: North Ridge Apartments (Cancelled) */}
                  <div className="p-6 flex flex-col md:flex-row items-center gap-6 md:gap-12 hover:bg-[#F8F9EC] transition-colors group">
                     <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-400 shrink-0">
                        <XCircle className="w-6 h-6" />
                     </div>
                     <div className="flex-1 min-w-[140px]">
                        <h4 className="text-[17px] font-bold text-slate-900">North Ridge Apartments</h4>
                        <p className="text-[13px] font-medium text-slate-500 italic mt-0.5">Summer Session Booking</p>
                     </div>
                     <div className="text-center md:text-left">
                        <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Period</p>
                        <p className="text-[14px] font-bold text-slate-900 whitespace-nowrap">Jun 2022 - Jul 2022</p>
                     </div>
                     <div className="flex flex-col items-end gap-1 shrink-0 ml-auto">
                        <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-red-500 uppercase tracking-wider mb-1 bg-red-50 px-2 py-0.5 rounded-full">
                           Cancelled
                        </div>
                        <button className="text-[12px] font-bold text-slate-500 hover:text-slate-900">
                           View Policy
                        </button>
                     </div>
                  </div>
               </div>
            </div>
          </div>

          {/* SIDEBAR */}
          <div className="flex flex-col">
            
            {/* RESIDENCE SUMMARY CARD */}
            <div className="bg-[#6492A7] rounded-[24px] p-8 shadow-md text-white flex flex-col h-full relative overflow-hidden">
               <div>
                 <h2 className="text-[17px] font-extrabold mb-8 tracking-wide">Residence Summary</h2>
                 
                 <div className="space-y-8">
                    <div className="flex justify-between items-end border-b border-white/20 pb-4">
                       <p className="text-[14px] font-medium text-white/70">Total Years</p>
                       <p className="text-4xl font-extrabold">2.5</p>
                    </div>
                    <div className="flex justify-between items-end border-b border-white/20 pb-4">
                       <p className="text-[14px] font-medium text-white/70">Distinct Halls</p>
                       <p className="text-4xl font-extrabold">03</p>
                    </div>
                    <div className="flex justify-between items-end border-b border-white/20 pb-4">
                       <p className="text-[14px] font-medium text-white/70">Total Stay Days</p>
                       <p className="text-4xl font-extrabold">842</p>
                    </div>
                 </div>

                 <div className="mt-12 bg-white/10 rounded-2xl p-6 border border-white/10 backdrop-blur-sm">
                    <p className="text-[11px] font-extrabold text-white/90 uppercase tracking-[0.2em] mb-4">Campus Milestone</p>
                    <p className="text-[15px] text-white/80 leading-relaxed font-medium">
                       You are in the top 15% of long-term residents. Eligible for priority renewal in the next cycle.
                    </p>
                 </div>
               </div>

               {/* Extra spacing to push content if needed, but flex-col and h-full should handle it */}
               <div className="mt-auto pt-10 opacity-20">
                  <Building2 className="w-32 h-32 absolute -bottom-10 -right-10 rotate-12" />
               </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
