"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  Search, Bell, Building2, History as HistoryIcon, FileText, 
  Download, ArrowRight, LogOut, ChevronLeft,
  CheckCircle2, XCircle, Clock, Folder, X
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Archivo } from "next/font/google";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";

const archivo = Archivo({ subsets: ["latin"] });

interface HistoryUIProps {
  user: any;
  currentResidency: any;
  history: any[];
  notifications?: any[];
}

export default function HistoryUI({ user, currentResidency, history, notifications: initialNotifications = [] }: HistoryUIProps) {
  const [showLogout, setShowLogout] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  // Sync read state from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const readIds = JSON.parse(localStorage.getItem('read_notifications') || '[]');
      setNotifications(initialNotifications.map(n => ({
        ...n,
        is_read: n.is_read || readIds.includes(n.id)
      })));
    }
  }, [initialNotifications]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  // Calculations for sidebar
  const totalRecords = history.length + (currentResidency ? 1 : 0);
  const completedRecords = history.filter(h => h.application_status === 'approved' || h.application_status === 'completed').length;
  
  // Format Date Helper
  const formatDateRange = (start: string | null, end: string | null) => {
    if (!start) return "TBD";
    const startDate = new Date(start).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    const endDate = end ? new Date(end).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : "Present";
    return `${startDate} - ${endDate}`;
  };

  return (
    <div className={`min-h-screen bg-[#F6F8D5] py-6 px-6 lg:py-10 lg:px-[1in] text-slate-800 flex flex-col items-center ${archivo.className}`}>
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
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <Bell className="w-5 h-5" />
                {notifications.filter(n => !n.is_read).length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#A05C5C] text-white text-[9px] font-bold rounded-full ring-2 ring-[#FDFBF7] flex items-center justify-center">
                    {notifications.filter(n => !n.is_read).length}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 top-full mt-4 w-80 bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-slate-100 p-2 z-[60] overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-50 flex justify-between items-center">
                    <h3 className="text-sm font-bold text-slate-900">Notifications</h3>
                    <button
                      className="text-[10px] font-bold text-[#668E42] uppercase tracking-wider hover:text-[#557F44] transition-colors"
                      onClick={() => {
                        if (typeof window !== 'undefined') {
                          const existingIds = JSON.parse(localStorage.getItem('read_notifications') || '[]');
                          const allIds = Array.from(new Set([...existingIds, ...notifications.map(n => n.id)]));
                          localStorage.setItem('read_notifications', JSON.stringify(allIds));
                        }
                        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
                      }}
                    >
                      Mark all as read
                    </button>
                  </div>
                  <div className="max-h-[350px] overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map((n, i) => (
                        <div
                          key={i}
                          className="p-4 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 cursor-pointer group"
                          onClick={() => {
                            const readIds = JSON.parse(localStorage.getItem('read_notifications') || '[]');
                            if (!readIds.includes(n.id)) {
                              readIds.push(n.id);
                              localStorage.setItem('read_notifications', JSON.stringify(readIds));
                            }
                            setNotifications(prev => prev.map((notif, idx) =>
                              idx === i ? { ...notif, is_read: true } : notif
                            ));
                            if (n.link) router.push(n.link);
                          }}
                        >
                          <div className="flex gap-3">
                            <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!n.is_read ? 'bg-[#668E42]' : 'bg-transparent'}`}></div>
                            <div>
                              <p className="text-[13px] font-bold text-slate-900 mb-1 group-hover:text-[#668E42] transition-colors">{n.title}</p>
                              <p className="text-[12px] text-slate-500 leading-relaxed mb-1.5">{n.message}</p>
                              <p className="text-[10px] text-slate-400 font-medium">{new Date(n.created_at || Date.now()).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-10 text-center">
                        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Bell className="w-5 h-5 text-slate-300" />
                        </div>
                        <p className="text-slate-400 text-xs italic">No notifications yet.</p>
                      </div>
                    )}
                  </div>
                  <button
                    className="w-full py-3 text-[11px] font-bold text-slate-500 hover:text-[#668E42] transition-colors border-t border-slate-50"
                    onClick={() => { setShowNotifications(false); router.push('/student/notifications'); }}
                  >
                    View All Activity
                  </button>
                </div>
              )}
            </div>
            
            <div className="relative">
              <div 
                className="flex items-center gap-3 cursor-pointer group"
                onClick={() => setShowLogout(!showLogout)}
              >
                <div className="flex flex-col items-end">
                  <span className="text-[13px] font-bold text-slate-900 leading-tight">
                    {user?.first_name} {user?.last_name}
                  </span>
                  <span className="text-[9px] text-slate-500 font-bold tracking-widest uppercase">
                    {user?.role?.toUpperCase() || "STUDENT"}
                  </span>
                </div>
                <div className="w-10 h-10 rounded-full bg-[#5D6BDE] overflow-hidden flex items-center justify-center font-bold text-sm shadow-sm group-hover:scale-105 transition-transform">
                    {user?.profile_picture_url ? (
                        <Image 
                            src={user.profile_picture_url} 
                            alt="Profile" 
                            width={40} 
                            height={40} 
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <span className="text-white">
                            {user?.first_name?.[0]}{user?.last_name?.[0]}
                        </span>
                    )}
                </div>
              </div>
              
              {showLogout && (
                <div className="absolute right-0 top-full mt-2 w-40 bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-slate-100 p-2 z-50 overflow-hidden">
                  <button 
                    onClick={handleLogout}
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
            Accommodation History
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-4">
            Review your residency timeline and previous applications.
          </p>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* MAIN CONTENT AREA */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* ACTIVE NOW CARD */}
            {currentResidency ? (
                <div className="bg-[#FDFFF4] rounded-[24px] p-6 border border-[#eef1d6] shadow-sm relative overflow-hidden">
                   <div className="absolute top-4 right-4 bg-[#78A24C] text-white text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                     Active Now
                   </div>
                   
                   <div className="flex flex-col md:flex-row gap-6 items-start">
                      <div className="w-full md:w-48 h-32 rounded-xl overflow-hidden shadow-md bg-slate-100 flex items-center justify-center">
                         <Building2 className="w-10 h-10 text-slate-300" />
                      </div>
                      <div className="flex-1">
                         <h2 className="text-2xl font-bold text-[#2A3F2D] mb-1 leading-tight">
                            {currentResidency.unit?.accommodation?.name || "Active Residence"}
                         </h2>
                         <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                            {currentResidency.unit?.unit_type?.replace('_', ' ') || "Standard"} • {currentResidency.unit?.accommodation?.location || "Campus"}
                         </p>
                         
                         <div className="grid grid-cols-2 gap-8">
                            <div>
                               <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Room</p>
                               <p className="text-lg font-bold text-slate-900">{currentResidency.unit?.unit_number || "TBD"}</p>
                            </div>
                            <div>
                               <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Stay Dates</p>
                               <p className="text-sm font-bold text-slate-900 leading-tight">
                                    {formatDateRange(currentResidency.move_in_date, null)}
                               </p>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
            ) : (
                <div className="bg-white/50 rounded-[24px] p-10 border border-dashed border-slate-200 text-center">
                    <p className="text-slate-400 italic text-sm font-medium">No active residency found.</p>
                </div>
            )}

            {/* PAST RESIDENCES SECTION */}
            <div className="space-y-4">
               <div className="flex justify-between items-center px-2">
                  <h3 className="text-[17px] font-extrabold text-[#2A3F2D]">Residency Timeline</h3>
                  <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">
                    {history.length} {history.length === 1 ? 'Record' : 'Records'} Found
                  </span>
               </div>

               <div className="bg-[#FDFFF4] rounded-[24px] overflow-hidden border border-[#eef1d6] shadow-sm divide-y divide-[#eef1d6]">
                  {history.length > 0 ? (
                      history.map((record, i) => (
                        <div key={i} className="p-6 flex flex-col md:flex-row items-center gap-6 md:gap-12 hover:bg-[#F8F9EC] transition-colors group">
                           <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                               record.application_status === 'rejected' || record.application_status === 'cancelled' 
                               ? 'bg-red-50 text-red-400' 
                               : 'bg-[#E9EBC1] text-[#709849]'
                           }`}>
                              {record.application_status === 'rejected' || record.application_status === 'cancelled' 
                              ? <XCircle className="w-6 h-6" /> 
                              : <Building2 className="w-6 h-6" />}
                           </div>
                           <div className="flex-1 min-w-[140px]">
                              <h4 className="text-[17px] font-bold text-slate-900">
                                {record.accommodation?.name || "Application"}
                              </h4>
                              <p className="text-[13px] font-medium text-slate-500 mt-0.5">
                                {record.unit?.unit_number ? `Room ${record.unit.unit_number} • ` : ""}
                                {record.preferred_unit_type?.replace('_', ' ') || "Residency"}
                              </p>
                           </div>
                           <div className="text-center md:text-left">
                              <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Period</p>
                              <p className="text-[14px] font-bold text-slate-900 whitespace-nowrap">
                                {formatDateRange(record.check_in || record.date_submitted, record.check_out)}
                              </p>
                           </div>
                           <div className="flex flex-col items-end gap-1 shrink-0 ml-auto">
                              <div className={`flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider mb-1 px-3 py-1 rounded-full ${
                                  record.application_status === 'approved' || record.application_status === 'completed'
                                  ? 'text-[#78A24C] bg-[#F1F4E4]'
                                  : record.application_status === 'rejected' || record.application_status === 'cancelled'
                                  ? 'text-red-500 bg-red-50'
                                  : 'text-[#18395B] bg-slate-100'
                              }`}>
                                 {record.application_status === 'approved' || record.application_status === 'completed' ? <CheckCircle2 className="w-3.5 h-3.5" /> : null}
                                 {record.application_status?.replace('_', ' ') || "Pending"}
                              </div>
                           </div>
                        </div>
                      ))
                  ) : (
                    <div className="p-12 text-center">
                        <p className="text-slate-400 text-sm italic">No past residency records found.</p>
                    </div>
                  )}
               </div>
            </div>
          </div>

          {/* SIDEBAR */}
          <div className="flex flex-col">
            
            {/* RESIDENCE SUMMARY CARD */}
            <div className="bg-[#6492A7] rounded-[24px] p-8 shadow-md text-white flex flex-col h-full relative overflow-hidden">
               <div>
                 <h2 className="text-[17px] font-extrabold mb-8 tracking-wide">Stay Summary</h2>
                 
                 <div className="space-y-8">
                    <div className="flex justify-between items-end border-b border-white/20 pb-4">
                       <p className="text-[14px] font-medium text-white/70">Total Applications</p>
                       <p className="text-4xl font-extrabold">{totalRecords}</p>
                    </div>
                    <div className="flex justify-between items-end border-b border-white/20 pb-4">
                       <p className="text-[14px] font-medium text-white/70">Approved Stays</p>
                       <p className="text-4xl font-extrabold">{completedRecords + (currentResidency ? 1 : 0)}</p>
                    </div>
                    <div className="flex justify-between items-end border-b border-white/20 pb-4">
                       <p className="text-[14px] font-medium text-white/70">Cancellation Rate</p>
                       <p className="text-4xl font-extrabold">
                            {totalRecords > 0 ? Math.round((history.filter(h => h.application_status === 'cancelled').length / totalRecords) * 100) : 0}%
                       </p>
                    </div>
                 </div>

                 <div className="mt-12 bg-white/10 rounded-2xl p-6 border border-white/10 backdrop-blur-sm">
                    <p className="text-[11px] font-extrabold text-white/90 uppercase tracking-[0.2em] mb-4">Resident Status</p>
                    <p className="text-[15px] text-white/80 leading-relaxed font-medium">
                       {completedRecords > 0 
                         ? "Your residency history shows a consistent record of university living. Great job maintaining your records!"
                         : "Start your journey with UPLB housing. Apply to one of our available halls from the dashboard."}
                    </p>
                 </div>
               </div>

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
