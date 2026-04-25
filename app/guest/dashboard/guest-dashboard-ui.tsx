"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
    Search, Bell, Building2, History, FileText,
    Folder, Download, Plus, ArrowRight, LogOut
} from "lucide-react";
import { Archivo } from "next/font/google";
import { Accommodation } from "@/types/accommodation_units";
import { AccommodationHistory } from "@/types/accomodation/accomodationHistory";

const archivo = Archivo({ subsets: ["latin"] });

interface GuestDashboardUIProps {
    profile: any;
    initialActiveResidency?: any;
    initialApplications?: any[];
    initialHistory?: any[];
    initialDocuments?: any[];
    initialBills?: any[];
    onLogout?: () => void;
    isLoggingOut?: boolean;
}

export default function GuestDashboardUI({ 
    profile, 
    initialActiveResidency, 
    initialApplications = [], 
    initialHistory = [], 
    initialDocuments = [],
    initialBills = [],
    onLogout, 
    isLoggingOut 
}: GuestDashboardUIProps) {
    const [showLogout, setShowLogout] = useState(false);
    const [activeResidency, setActiveResidency] = useState<any>(initialActiveResidency);
    const [isLoadingResidency, setIsLoadingResidency] = useState(false);
    const [applications, setApplications] = useState<any[]>(initialApplications);
    const [isLoadingApplications, setIsLoadingApplications] = useState(false);
    const [documents, setDocuments] = useState<any[]>(initialDocuments);
    const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
    const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
    const [isLoadingAccommodations, setIsLoadingAccommodations] = useState(true);
    const [history, setHistory] = useState<AccommodationHistory[]>(initialHistory);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [bills, setBills] = useState<any[]>(initialBills);
    const [isLoadingBills, setIsLoadingBills] = useState(false);
    

    useEffect(() => {
        async function fetchAccommodations() {
            try {
                // Fetch Accommodations Preview
                const resAcc = await fetch("/api/dashboard/tiles?type=accommodations");
                if (resAcc.ok) {
                    const data = await resAcc.json();
                    setAccommodations(data);
                }
            } catch (error) {
                console.error("Error fetching accommodations:", error);
            } finally {
                setIsLoadingAccommodations(false);
            }
        }

        fetchAccommodations();
    }, []);

    const userInitials = profile ? `${profile.first_name?.[0] ?? ""}${profile.last_name?.[0] ?? ""}`.toUpperCase() : "G";
    const userName = profile ? `${profile.first_name} ${profile.last_name}` : "Guest";

    return (
        <div className={`min-h-screen bg-[#F6F8D5] p-6 lg:p-10 text-slate-800 flex flex-col items-center ${archivo.className}`}>
            <div className="w-full max-w-[1100px]">
                {/* TOP BAR */}
                <header className="flex flex-col-reverse md:flex-row justify-between items-start md:items-center w-full mb-12 gap-4">
                    <div className="relative w-full md:w-[350px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search data, guests, or rooms..."
                            className="w-full pl-11 pr-4 py-3 bg-slate-100/80 rounded-full text-sm border-none focus:ring-2 focus:ring-slate-300 outline-none font-medium placeholder:text-slate-400"
                        />
                    </div>
                    <div className="flex items-center gap-6 self-end md:self-auto">
                        <button className="relative text-slate-700 hover:text-slate-900 transition-colors">
                            <Bell className="w-5 h-5" />
                            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#A05C5C] rounded-full ring-2 ring-[#FDFBF7]"></span>
                        </button>

                        {/* PROFILE / LOGOUT DROPDOWN */}
                        <div className="relative">
                            <div
                                className="flex items-center gap-3 cursor-pointer group"
                                onClick={() => setShowLogout(!showLogout)}
                            >
                                <div className="flex flex-col items-end">
                                    <span className="text-[13px] font-bold text-slate-900 leading-tight">{userInitials}</span>
                                    <span className="text-[9px] text-slate-500 font-bold tracking-widest uppercase">GUEST</span>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-[#5D6BDE] text-white flex items-center justify-center font-bold text-sm shadow-sm group-hover:scale-105 transition-transform overflow-hidden">
                                    {profile?.profile_picture_url ? (
                                        <Image 
                                            src={profile.profile_picture_url} 
                                            alt="Profile" 
                                            width={40} 
                                            height={40} 
                                            className="w-full h-full object-cover"
                                        />
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
                                        disabled={isLoggingOut}
                                        className="w-full flex items-center gap-2 text-left px-3 py-2.5 text-[13px] font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        {isLoggingOut ? "Exiting..." : "Log out"}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* HERO SECTION */}
                <section className="mb-10">
                    <h3 className="text-[11px] font-extrabold text-[#4A3022] tracking-[0.2em] uppercase mb-2">
                        Welcome Home, {profile?.first_name || "Guest"}
                    </h3>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-[#4A3022] tracking-tight">
                        Pahingahan Para sa Pangarap
                    </h1>
                </section>

                {/* TOP TWO CARDS */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
                    {/* LEFT LARGE CARD */}
                    <div className="lg:col-span-2 bg-[#FDFFF4] rounded-[24px] p-6 md:p-8 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-[#eef1d6] relative overflow-hidden flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-start mb-6">
                                <span className="bg-[#668E42] text-white text-[10px] font-bold px-3 py-1.5 rounded-[12px] uppercase tracking-wider">
                                    Active Residency
                                </span>
                                <Building2 className="w-6 h-6 text-[#8BAE90] stroke-[1.5]" />
                            </div>
    
                            <h2 className="text-2xl md:text-[28px] font-bold text-[#2A3F2D] mb-1 leading-tight flex items-center gap-2">
                                {activeResidency ? (
                                    <>
                                        {activeResidency.accommodation?.name}, Room {activeResidency.unit?.unit_number} <ArrowRight className="w-6 h-6 text-[#8BAE90] stroke-[1.5]" />
                                    </>
                                ) : isLoadingResidency ? (
                                    "Loading..."
                                ) : (
                                    "No Active Residency"
                                )}
                            </h2>
                            <p className="text-[13px] font-medium text-slate-500 mb-8 max-w-[80%]">
                                {activeResidency?.accommodation?.location || "University of the Philippines Los Baños, College, Laguna"}
                            </p>
    
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-8">
                                <div className="bg-[#F6F8D5]/60 rounded-[14px] p-4 flex flex-col justify-center border border-[#eef1d6]">
                                    <p className="text-[9px] font-extrabold text-[#709849] uppercase tracking-widest mb-1">Check-in</p>
                                    <p className="text-[15px] font-bold text-slate-900">
                                        {activeResidency?.move_in_date ? new Date(activeResidency.move_in_date).toLocaleDateString() : "---"}
                                    </p>
                                </div>
                                <div className="bg-[#F6F8D5]/60 rounded-[14px] p-4 flex flex-col justify-center border border-[#eef1d6]">
                                    <p className="text-[9px] font-extrabold text-[#709849] uppercase tracking-widest mb-1">Status</p>
                                    <p className="text-[15px] font-bold text-slate-900">
                                        {activeResidency?.assignment_status || "Pending"}
                                    </p>
                                </div>
                                <div className="bg-[#F6F8D5]/60 rounded-[14px] p-4 flex flex-col justify-center border border-[#eef1d6]">
                                    <p className="text-[9px] font-extrabold text-[#709849] uppercase tracking-widest mb-1">Roommate</p>
                                    <p className="text-[15px] font-bold text-slate-900">
                                        {activeResidency?.unit?.unit_type || "---"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* RIGHT SMALL CARD - ACCOMMODATION HISTORY */}
                    <div className="bg-[#6492A7] rounded-[24px] p-6 md:p-8 shadow-[0_4px_15px_rgba(100,146,167,0.2)] text-white flex flex-col justify-between relative overflow-hidden">
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-[18px] font-black tracking-tight uppercase leading-none">
                                    Accommodation<br />History
                                </h2>
                                <History className="w-5 h-5 text-white/70" />
                            </div>
                            
                            <div className="space-y-5 mb-8">
                                {isLoadingHistory ? (
                                    <p className="text-[11px] text-white/70">Loading history...</p>
                                ) : history.length === 0 ? (
                                    <p className="text-[11px] text-white/70">No history found.</p>
                                ) : (
                                    history.slice(0, 3).map((item) => (
                                    <div
                                        key={item.assignment_id}
                                        className="border-l-2 border-white/20 pl-4 py-1"
                                    >
                                        <h3 className="text-[15px] font-bold leading-tight">
                                        {item.accommodation?.name ?? "Unnamed Accommodation"}
                                        </h3>

                                        <p className="text-[11px] text-white/70 mt-1 font-medium">
                                        {item.move_in_date
                                            ? new Date(item.move_in_date).getFullYear()
                                            : "2026"}
                                        {" - "}
                                        {item.actual_move_out_date
                                            ? new Date(item.actual_move_out_date).getFullYear()
                                            : "2026"}
                                        </p>
                                    </div>
                                    ))
                                )}
                                </div>
                            
                        </div>

                        <div className="mt-4">
                            <Link href="/guest/history">
                                <button className="w-full py-3 bg-white text-[#6492A7] text-[13px] font-bold rounded-full transition-all hover:bg-slate-50 active:scale-[0.98] flex items-center justify-center gap-2 group">
                                    View Full History <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                                </button>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* ACCOMMODATIONS PREVIEW - ENCLOSED IN SECTION CONTAINER */}
                <section className="mb-14 bg-[#FDFFF4] rounded-[40px] p-8 md:p-12 border border-[#eef1d6] shadow-[0_8px_30px_rgba(0,0,0,0.03)] relative overflow-hidden">
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#F6F8D5]/40 rounded-full blur-3xl"></div>

                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6 relative z-10">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="w-8 h-[2px] bg-[#709849]"></span>
                                <h3 className="text-[11px] font-extrabold text-[#709849] tracking-[0.25em] uppercase">Guest-Ready Stays</h3>
                            </div>
                            <h2 className="text-3xl md:text-4xl font-extrabold text-[#2A3F2D] tracking-tight">Accommodations</h2>
                            <p className="text-[14px] text-slate-500 font-medium mt-2 max-w-md">Options curated for guests and short-term residents.</p>
                        </div>
                        <Link href="/guest/accommodations">
                            <button className="flex items-center gap-2 text-[#557F44] font-black text-[13px] hover:translate-x-1 transition-all bg-white px-7 py-3.5 rounded-2xl border border-[#eef1d6] shadow-sm hover:shadow-md active:scale-95">
                                Explore All Accommodations <ArrowRight className="w-4 h-4" />
                            </button>
                        </Link>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
                    {accommodations.slice(0, 3).map((accommodation, i) => (
                            <div key={i} className="bg-[#F9FBEC] rounded-[32px] overflow-hidden border border-slate-100/60 shadow-[0_4px_15px_rgba(0,0,0,0.03)] group hover:shadow-2xl hover:shadow-[#709849]/5 transition-all duration-500">
                                <div className="h-44 relative overflow-hidden bg-[#F8F9EC]">
                                    <div className="w-full h-full bg-[#F6F8D5]/30 group-hover:scale-110 transition-transform duration-700 flex items-center justify-center">
                                        <Building2 className="w-10 h-10 text-[#709849]/20" />
                                    </div>
                                    <div className="absolute top-5 right-5 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-2xl text-[11px] font-black text-[#2A3F2D] shadow-lg">
                                        {accommodation.min_price && accommodation.max_price
                                            ? `₱${accommodation.min_price} - ₱${accommodation.max_price}`
                                            : accommodation.min_price
                                            ? `₱${accommodation.min_price}`
                                            : accommodation.max_price
                                            ? `₱${accommodation.max_price}`
                                            : "No price available to show"}
                                    </div>
                                </div>
                                <div className="p-8">
                                    <h4 className="text-[18px] font-bold text-[#2A3F2D] mb-1.5">{accommodation.name}</h4>
                                    <p className="text-[10px] font-extrabold text-[#709849] uppercase tracking-[0.15em] mb-6">{accommodation.accommodation_type}</p>
                                    <Link href="/guest/accommodations">
                                        <button className="w-full py-3.5 bg-[#6492A7] hover:bg-[#4f7b8f] text-white text-[13px] font-bold rounded-2xl transition-all active:scale-[0.98] shadow-md shadow-[#6492A7]/10">
                                            Details
                                        </button>
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* BOTTOM THREE CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {/* BILLING CARD */}
                    <div className="bg-[#FDFFF4] rounded-[24px] p-6 md:p-8 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-[#eef1d6] flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-[17px] font-extrabold text-[#2A3F2D]">Billing Summary</h2>
                                <FileText className="w-5 h-5 text-[#8BAE90] stroke-[1.5]" />
                            </div>

                             <div className="mb-8">
                                <p className="text-4xl font-extrabold text-[#113a68] leading-none mb-2 tracking-tight">
                                    ₱{bills[0]?.amount?.toLocaleString() || "0.00"}
                                </p>
                                <p className="text-[10px] font-extrabold text-[#D03027] tracking-[0.1em] uppercase">
                                    Balance Due {bills[0]?.due_date ? new Date(bills[0].due_date).toLocaleDateString(undefined, { month: 'short', day: '2-digit' }) : "---"}
                                </p>
                            </div>

                            <div className="space-y-4 mb-8 border-t border-[#eef1d6] pt-5">
                                {bills[0]?.breakdown?.length > 0 ? (
                                    bills[0].breakdown.map((item: any, idx: number) => (
                                        <div key={idx} className="flex justify-between items-start">
                                            <div>
                                                <p className="text-[13px] font-extrabold text-slate-900 capitalize">{item.label?.replace('_', ' ')}</p>
                                                <p className="text-[10px] font-medium text-slate-400 mt-0.5">{item.amount < 0 ? 'Discount' : 'Charge'}</p>
                                            </div>
                                            <span className="text-[13px] font-extrabold text-slate-900">₱{Math.abs(item.amount).toLocaleString()}</span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-[11px] text-slate-400">No recent billing items.</p>
                                )}
                            </div>
                        </div>

                        <Link href="/guest/billing">
                            <button className="w-full py-3.5 bg-[#6492A7] hover:bg-[#4f7b8f] text-white text-[13px] font-bold rounded-xl transition-all shadow-[0_2px_8px_rgba(100,146,167,0.3)] hover:shadow-[0_4px_12px_rgba(100,146,167,0.4)] active:scale-[0.98]">
                                View Bills
                            </button>
                        </Link>
                    </div>

                    {/* DOCUMENTS CARD */}
                    <div className="bg-[#FDFFF4] rounded-[24px] p-6 md:p-8 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-[#eef1d6] flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-[17px] font-extrabold text-[#2A3F2D]">Documents</h2>
                                <Folder className="w-5 h-5 text-[#8BAE90] stroke-[1.5]" />
                            </div>

                            <div className="space-y-3 mb-8">
                                {isLoadingDocuments ? (
                                    <p className="text-[11px] text-slate-400">Loading documents...</p>
                                ) : documents.length === 0 ? (
                                    <p className="text-[11px] text-slate-400">No documents found.</p>
                                ) : (
                                    documents.slice(0, 3).map((doc) => (
                                        <div key={doc.id} className="bg-[#F8F9EC] rounded-[14px] p-3 pl-4 flex justify-between items-center border border-[#eef1d6] group hover:bg-[#f3f5e1] transition-colors cursor-pointer">
                                            <div className="flex items-center gap-3.5">
                                                <div className="w-8 h-8 bg-white border border-[#e2e7c3] rounded-[9px] flex items-center justify-center text-[#2C5282] shadow-sm">
                                                    <FileText className="w-4 h-4" strokeWidth={2.5} />
                                                </div>
                                                <div>
                                                    <p className="text-[13px] font-bold text-slate-900 mb-0.5 truncate max-w-[120px]">{doc.file_name}</p>
                                                    <p className="text-[9px] font-bold text-[#668E42] tracking-wider uppercase">
                                                        {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : 'VERIFIED'}
                                                    </p>
                                                </div>
                                            </div>
                                            <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="text-[#a5b487] group-hover:text-[#668E42] transition-colors pr-2">
                                                <Download className="w-4 h-4 stroke-[2.5]" />
                                            </a>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* APPLICATIONS CARD */}
                    <div className="bg-[#FDFFF4] rounded-[24px] p-6 md:p-8 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-[#eef1d6] flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-[17px] font-extrabold text-[#2A3F2D]">Applications</h2>
                                <History className="w-5 h-5 text-[#8BAE90] stroke-[1.5]" />
                            </div>

                            <div className="space-y-6 mb-8 px-1">
                                {isLoadingApplications ? (
                                    <p className="text-[11px] text-slate-400">Loading applications...</p>
                                ) : applications.length === 0 ? (
                                    <p className="text-[11px] text-slate-400">No applications found.</p>
                                ) : (
                                    applications.slice(0, 3).map((app) => (
                                        <div key={app.application_id} className="relative pl-6">
                                            <div className={`absolute left-0 top-1.5 w-2.5 h-2.5 rounded-full ${
                                                app.application_status === 'approved' ? 'bg-[#B3D68B]' :
                                                app.application_status === 'rejected' ? 'bg-[#D03027]' :
                                                'bg-[#5591AB]'
                                            }`}></div>
                                            <p className="text-[13px] font-bold text-slate-900 leading-none mb-1">
                                                {app.term_applied || "Current Semester"}
                                            </p>
                                            <p className="text-[10px] font-medium text-slate-400 capitalize">
                                                {app.application_status.replace(/_/g, ' ')}
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <Link href="/guest/application">
                            <button className="w-full py-3.5 bg-white hover:bg-slate-50 text-[#1f3d5f] border border-[#dce3bc] text-[13px] font-extrabold rounded-[14px] transition-all hover:border-[#cfd8df] active:scale-[0.98]">
                                Start New Application
                            </button>
                        </Link>
                    </div>
                </div>

                {/* BOTTOM BANNER */}
                <div className="flex flex-col md:flex-row gap-0 rounded-[24px] overflow-hidden shadow-sm h-auto md:h-[220px]">
                    <div className="w-full md:w-[45%] bg-slate-800 relative min-h-[220px] md:min-h-full">
                        <div className="absolute inset-0 bg-gradient-to-t from-[#112F40]/90 to-transparent z-10"></div>
                        {/* Fallback image block, replacing with Unsplash placeholder */}
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=1000')] bg-cover bg-center bg-no-repeat z-0 opacity-80 mix-blend-luminosity"></div>

                        <div className="absolute bottom-7 left-8 right-8 z-20">
                            <h3 className="text-white font-bold text-[22px] mb-0.5 tracking-tight">Campus Life</h3>
                            <p className="text-white/80 text-[11px] font-medium tracking-wide">University of the Philippines Los Baños</p>
                        </div>
                    </div>

                    <div className="flex-1 bg-[#F8F9EC] p-8 md:p-10 flex flex-col justify-center border-l-4 border-[#123151] relative">
                        <h2 className="text-[#103050] text-[26px] md:text-[28px] font-extrabold italic mb-5 leading-tight tracking-tight">
                            "Pahingahan Para sa Pangarap"
                        </h2>
                        <p className="text-slate-600 text-sm font-medium leading-relaxed max-w-[95%]">
                            At Elbnb, we don't just provide housing; we curate an environment where your academic excellence meets premium living. Your journey this semester is ours too.
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
}
