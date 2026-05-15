import React from "react";
import Image from "next/image";
import Link from "next/link";
import { History, FileText, ArrowRight } from "lucide-react";
import { Archivo } from "next/font/google";

import { StudentDashboardHeader } from "./StudentDashboardHeader";
import { StudentAccommodationsPreview } from "./StudentAccommodationsPreview";
import { StudentActiveResidencyCard } from "./StudentActiveResidencyCard";
import { DashboardRealtimeSync } from "@/components/DashboardRealtimeSync";

const archivo = Archivo({ subsets: ["latin"] });

interface StudentDashboardUIProps {
    user: any;
    currentResidency: any;
    history: any[];
    billingSummary: any;
    bills: any[];
    stats: any;
    accommodations: any[];
    documents: any[];
    notifications: any[];
}

export default function StudentDashboardUI({
    user,
    currentResidency,
    history,
    billingSummary,
    bills,
    stats,
    accommodations = [],
    documents,
    notifications = []
}: StudentDashboardUIProps & { accommodations?: any[] }) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);
    };

    const dormName = currentResidency?.unit?.accommodation?.name || "No Active Residency";

    return (
        <div className={`min-h-screen bg-[#F6F8D5] py-6 px-6 lg:py-10 lg:px-[1in] text-slate-800 flex flex-col items-center ${archivo.className}`}>
            <DashboardRealtimeSync table="activity_log" event="INSERT" />
            <div className="w-full max-w-[1100px]">
                {/* TOP BAR */}
                <StudentDashboardHeader user={user} initialNotifications={notifications} />



                {/* HERO SECTION */}
                <section className="mb-10">
                    <h3 className="text-[11px] font-extrabold text-[#4A3022] tracking-[0.2em] uppercase mb-2">
                        Welcome Home, {user?.first_name}
                    </h3>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-[#4A3022] tracking-tight">
                        Pahingahan Para sa Pangarap
                    </h1>
                </section>

                {/* TOP TWO CARDS */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
                    <StudentActiveResidencyCard user={user} currentResidency={currentResidency} />

                    {/* RIGHT SMALL CARD - ACCOMMODATION HISTORY */}
                    <div className="bg-[#6492A7] rounded-[24px] p-6 md:p-8 md:pb-6 shadow-[0_4px_15px_rgba(100,146,167,0.2)] text-white flex flex-col justify-between relative overflow-hidden">
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <span className="text-[20px] font-extrabold tracking-[0em] uppercase text-white/90">Accommodation History</span>
                                <History className="w-5 h-5 text-white/70" />
                            </div>

                            <div className="space-y-4 mb-6 px-1">
                                {history.length > 0 ? (
                                    history.slice(0, 3).map((item, i) => (
                                        <div key={i} className="border-l-2 border-white/20 pl-4 py-0.5">
                                            <h3 className="text-[15px] font-bold leading-tight">
                                                {item.accommodation?.name || "Past Residence"}
                                            </h3>
                                            <p className="text-[11px] text-white/70 mt-0.5">
                                                {item.check_in ? new Date(item.check_in).getFullYear() : ""} - {item.check_out ? new Date(item.check_out).getFullYear() : "Present"}
                                            </p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-white/60 italic">No previous records found.</p>
                                )}
                            </div>
                        </div>

                        <div className="mt-auto">
                            <Link href="/student/history">
                                <button className="w-full py-3 bg-white text-[#6492A7] text-[13px] font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-white/90 transition-all shadow-lg shadow-[#6492A7]/10 active:scale-[0.98] group">
                                    View Full History <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </Link>
                        </div>
                    </div>
                </div>

                <StudentAccommodationsPreview initialAccommodations={accommodations} />

                {/* BOTTOM TWO CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-8">
                    {/* BILLING CARD */}
                    <div className="bg-white rounded-[24px] p-6 md:p-8 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-[#eef1d6] flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-[17px] font-extrabold text-[#2A3F2D]">Billing Summary</h2>
                                <FileText className="w-5 h-5 text-[#8BAE90] stroke-[1.5]" />
                            </div>

                            <div className="mb-8">
                                <p className="text-4xl font-extrabold text-[#113a68] leading-none mb-2 tracking-tight">
                                    {formatCurrency(billingSummary?.balance || 0)}
                                </p>
                                <p className="text-[10px] font-extrabold text-[#D03027] tracking-[0.1em] uppercase">
                                    Total Outstanding Balance
                                </p>
                            </div>

                            <div className="space-y-4 mb-8 border-t border-[#eef1d6] pt-5">
                                {bills.length > 0 ? (
                                    bills.slice(0, 2).map((bill, i) => (
                                        <div key={i} className="flex justify-between items-start">
                                            <div>
                                                <p className="text-[13px] font-extrabold text-slate-900 truncate max-w-[150px]">
                                                    {bill.billing_period_date ? `Invoice for ${new Date(bill.billing_period_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}` : "Room Rent"}
                                                </p>
                                                <p className="text-[10px] font-medium text-slate-400 mt-0.5">Due {new Date(bill.due_date).toLocaleDateString()}</p>
                                            </div>
                                            <span className="text-[13px] font-extrabold text-slate-900">{formatCurrency(bill.amount)}</span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-xs text-slate-400 italic">No pending bills found.</p>
                                )}
                            </div>
                        </div>

                        <Link href="/student/billing">
                            <button className="w-full py-3.5 bg-[#6492A7] hover:bg-[#4f7b8f] text-white text-[13px] font-bold rounded-xl transition-all shadow-[0_2px_8px_rgba(100,146,167,0.3)] hover:shadow-[0_4px_12px_rgba(100,146,167,0.4)] active:scale-[0.98]">
                                View All Bills
                            </button>
                        </Link>
                    </div>

                    {/* APPLICATIONS CARD */}
                    <div className="bg-white rounded-[24px] p-6 md:p-8 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-[#eef1d6] flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-[17px] font-extrabold text-[#2A3F2D]">Applications</h2>
                                <History className="w-5 h-5 text-[#8BAE90] stroke-[1.5]" />
                            </div>

                            <div className="space-y-6 mb-8 px-1">
                                {history.length > 0 ? (
                                    history.slice(0, 3).map((app, i) => (
                                        <div key={i} className="relative pl-6">
                                            <div className={`absolute left-0 top-1.5 w-2 h-2 rounded-full ${app.application_status === 'approved' ? 'bg-[#B3D68B]' : app.application_status === 'rejected' ? 'bg-[#D03027]' : 'bg-[#18395B]'}`}></div>
                                            <p className="text-[13px] font-bold text-slate-900 leading-none mb-1">
                                                {app.date_submitted ? new Date(app.date_submitted).toLocaleDateString() : "Recent Application"}
                                            </p>
                                            <p className="text-[10px] font-medium text-slate-400 truncate max-w-[180px]">
                                                {app.accommodation?.name || "Application"} ({app.application_status ? app.application_status.charAt(0).toUpperCase() + app.application_status.slice(1) : "Pending"})
                                            </p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-xs text-slate-400 italic">No recent applications found.</p>
                                )}
                            </div>
                        </div>

                        <Link href="/student/accommodations">
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
                        <div
                            className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0 opacity-80 mix-blend-luminosity"
                            style={{ backgroundImage: "url('https://international.uplb.edu.ph/wp-content/uploads/2022/02/M40A9936-min-scaled.jpg')" }}
                        ></div>

                        <div className="absolute bottom-7 left-8 right-8 z-20">
                            <h3 className="text-white font-bold text-[22px] mb-0.5 tracking-tight">{dormName !== "No Active Residency" ? dormName : "Campus Living"}</h3>
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
