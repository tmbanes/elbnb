import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
    Building2, History, FileText, ArrowRight
} from "lucide-react";
import { Archivo } from "next/font/google";
import { GuestDashboardHeader } from "./GuestDashboardHeader";
import { GuestAccommodationsPreview } from "./GuestAccommodationsPreview";

const archivo = Archivo({ subsets: ["latin"] });

interface GuestDashboardUIProps {
    profile: any;
    initialActiveResidency?: any;
    initialApplications?: any[];
    initialHistory?: any[];
    initialDocuments?: any[];
    initialBills?: any[];
    notifications?: any[];
}

export default function GuestDashboardUI({ 
    profile, 
    initialActiveResidency, 
    initialApplications = [], 
    initialHistory = [], 
    initialDocuments = [],
    initialBills = [],
    notifications = [],
    accommodations = []
}: GuestDashboardUIProps & { accommodations?: any[] }) {

    const activeResidency = initialActiveResidency;
    const isLoadingResidency = false;
    const applications = initialApplications;
    const isLoadingApplications = false;
    const documents = initialDocuments;
    const history = initialHistory;
    const isLoadingHistory = false;
    const bills = initialBills;

    return (
        <div className={`min-h-screen bg-[#F6F8D5] p-6 lg:p-10 text-slate-800 flex flex-col items-center ${archivo.className}`}>
            <div className="w-full max-w-[1100px]">
                {/* TOP BAR */}
                <GuestDashboardHeader profile={profile} initialNotifications={notifications} />


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

                            {activeResidency?.accommodation?.image && (
                                <div className="absolute inset-0 z-0 opacity-10">
                                    <Image 
                                        src={activeResidency.accommodation.image} 
                                        alt="Background" 
                                        fill 
                                        className="object-cover"
                                    />
                                </div>
                            )}
    
                            {activeResidency ? (
                                <>
                                    <h2 className="text-2xl md:text-[28px] font-bold text-[#2A3F2D] mb-1 leading-tight flex items-center gap-2">
                                        {activeResidency.accommodation?.name}, Room {activeResidency.unit?.unit_number} <ArrowRight className="w-6 h-6 text-[#8BAE90] stroke-[1.5]" />
                                    </h2>
                                    <p className="text-[13px] font-medium text-slate-500 mb-8 max-w-[80%]">
                                        {activeResidency.accommodation?.location || "University of the Philippines Los Baños, College, Laguna"}
                                    </p>
            
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-8">
                                        <div className="bg-[#F6F8D5]/60 rounded-[14px] p-4 flex flex-col justify-center border border-[#eef1d6]">
                                            <p className="text-[9px] font-extrabold text-[#709849] uppercase tracking-widest mb-1">Check-in</p>
                                            <p className="text-[15px] font-bold text-slate-900">
                                                {activeResidency.move_in_date ? new Date(activeResidency.move_in_date).toLocaleDateString() : "To be determined"}
                                            </p>
                                        </div>
                                        <div className="bg-[#F6F8D5]/60 rounded-[14px] p-4 flex flex-col justify-center border border-[#eef1d6]">
                                            <p className="text-[9px] font-extrabold text-[#709849] uppercase tracking-widest mb-1">Status</p>
                                            <p className="text-[15px] font-bold text-slate-900">
                                                {activeResidency.assignment_status || "Pending"}
                                            </p>
                                        </div>
                                        <div className="bg-[#F6F8D5]/60 rounded-[14px] p-4 flex flex-col justify-center border border-[#eef1d6]">
                                            <p className="text-[9px] font-extrabold text-[#709849] uppercase tracking-widest mb-1">Roommate</p>
                                            <p className="text-[15px] font-bold text-slate-900">
                                                {activeResidency.unit?.unit_type || "No unit assigned yet"}
                                            </p>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <h2 className="text-2xl md:text-[28px] font-bold text-[#2A3F2D] mb-1 leading-tight flex items-center gap-2">
                                        {isLoadingResidency ? "Loading..." : "No Active Residency"}
                                    </h2>
                                    <p className="text-[13px] font-medium text-slate-500 mb-8 max-w-[80%]">
                                        University of the Philippines Los Baños, College, Laguna
                                    </p>
                                    
                                    {!isLoadingResidency && (
                                        <div className="mt-auto pt-6">
                                            <div className="bg-[#F8F9EC]/80 rounded-[18px] p-5 flex flex-col md:flex-row items-start md:items-center justify-between border border-[#eef1d6] gap-5">
                                                <div className="flex items-start md:items-center gap-4">
                                                    <p className="text-[13px] text-slate-600 font-medium italic leading-relaxed max-w-[90%]">
                                                        You are not currently assigned to any accommodation. Browse our available options to find your next stay.
                                                    </p>
                                                </div>
                                                <Link
                                                    href="/guest/accommodations"
                                                    className="group shrink-0 w-full md:w-auto h-auto py-3 px-6 rounded-xl font-bold text-[12px] bg-[#668E42] hover:bg-[#557F44] text-white flex items-center justify-center gap-2 shadow-sm transition-all hover:-translate-y-0.5 active:scale-[0.98] border-none outline-none"
                                                >
                                                    Browse Options <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                                </Link>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
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
                <GuestAccommodationsPreview initialAccommodations={accommodations} />

                {/* BOTTOM TWO CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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
                                    <p className="text-[11px] text-slate-400 italic">No recent applications found.</p>
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
