import React, { useState } from "react";
import Image from "next/image";
import {
    Search, Bell, Building2, History, FileText,
    Folder, Download, Plus, ArrowRight, LogOut
} from "lucide-react";
import { Archivo } from "next/font/google";

const archivo = Archivo({ subsets: ["latin"] });

interface GuestDashboardUIProps {
    onLogout?: () => void;
    isLoggingOut?: boolean;
}

export default function GuestDashboardUI({ onLogout, isLoggingOut }: GuestDashboardUIProps) {
    const [showLogout, setShowLogout] = useState(false);

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
                                    <span className="text-[13px] font-bold text-slate-900 leading-tight">JD</span>
                                    <span className="text-[9px] text-slate-500 font-bold tracking-widest uppercase">GUEST</span>
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

                {/* HERO SECTION */}
                <section className="mb-10">
                    <h3 className="text-[11px] font-extrabold text-[#4A3022] tracking-[0.2em] uppercase mb-2">
                        Welcome Home, Name
                    </h3>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-[#4A3022] tracking-tight">
                        Pahingahan Para sa Pangarap
                    </h1>
                </section>

                {/* TOP TWO CARDS */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    {/* LEFT LARGE CARD */}
                    <div className="lg:col-span-2 bg-[#FDFFF4] rounded-[24px] p-6 md:p-8 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-[#eef1d6] relative overflow-hidden flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-start mb-6">
                                <span className="bg-[#668E42] text-white text-[10px] font-bold px-3 py-1.5 rounded-[12px] uppercase tracking-wider">
                                    Active Residency
                                </span>
                                <Building2 className="w-6 h-6 text-[#8BAE90] stroke-[1.5]" />
                            </div>

                            <h2 className="text-2xl md:text-[28px] font-bold text-[#2A3F2D] mb-1 leading-tight">
                                Makiling Residence Hall, Room 302
                            </h2>
                            <p className="text-[13px] font-medium text-slate-500 mb-8 max-w-[80%]">
                                University of the Philippines Los Baños, College, Laguna, Philippines 4031
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-8">
                                <div className="bg-[#F6F8D5]/60 rounded-[14px] p-4 flex flex-col justify-center border border-[#eef1d6]">
                                    <p className="text-[9px] font-extrabold text-[#709849] uppercase tracking-widest mb-1">Check-in</p>
                                    <p className="text-[15px] font-bold text-slate-900">Aug 15, 2024</p>
                                </div>
                                <div className="bg-[#F6F8D5]/60 rounded-[14px] p-4 flex flex-col justify-center border border-[#eef1d6]">
                                    <p className="text-[9px] font-extrabold text-[#709849] uppercase tracking-widest mb-1">Status</p>
                                    <p className="text-[15px] font-bold text-slate-900">Fully Paid</p>
                                </div>
                                <div className="bg-[#F6F8D5]/60 rounded-[14px] p-4 flex flex-col justify-center border border-[#eef1d6]">
                                    <p className="text-[9px] font-extrabold text-[#709849] uppercase tracking-widest mb-1">Roommate</p>
                                    <p className="text-[15px] font-bold text-slate-900">Four-person Unit</p>
                                </div>
                            </div>
                        </div>

                        {/* BOTTOM STRIP ACTIVE RESIDENCY */}
                        <div className="flex items-center justify-between mt-2 pt-2">
                            <div className="flex items-center -space-x-2.5">
                                <div className="w-[30px] h-[30px] rounded-full border-2 border-[#FDFFF4] bg-orange-200 overflow-hidden relative shadow-sm">
                                    {/* Placeholder avatar */}
                                    <img src="https://i.pravatar.cc/100?img=1" alt="Avatar" className="w-full h-full object-cover" />
                                </div>
                                <div className="w-[30px] h-[30px] rounded-full border-2 border-[#FDFFF4] bg-blue-200 overflow-hidden relative shadow-sm">
                                    <img src="https://i.pravatar.cc/100?img=2" alt="Avatar" className="w-full h-full object-cover" />
                                </div>
                                <div className="w-[30px] h-[30px] rounded-full border-2 border-[#FDFFF4] bg-[#E9EBC1] flex items-center justify-center text-[10px] font-bold text-[#668E42] relative z-10 shadow-sm">
                                    +1
                                </div>
                            </div>
                            <button className="flex items-center gap-1.5 text-[13px] font-bold text-[#557F44] hover:text-[#3B5B2E] transition-colors group">
                                View Hall Details <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                            </button>
                        </div>
                    </div>

                    {/* RIGHT SMALL CARD - LATEST UPDATE */}
                    <div className="bg-[#6492A7] rounded-[24px] p-6 md:p-8 shadow-[0_4px_15px_rgba(100,146,167,0.2)] text-white flex flex-col justify-between relative overflow-hidden">
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <span className="text-[10px] font-extrabold tracking-[0.2em] uppercase text-white/90">Latest Update</span>
                                <History className="w-5 h-5 text-white/70" />
                            </div>
                            <h2 className="text-2xl font-bold mb-4 leading-tight tracking-tight">
                                Application for Women's<br />Residence Hall
                            </h2>

                            <div className="flex items-center gap-2 mb-6">
                                <span className="w-2.5 h-2.5 bg-white shadow-[0_0_8px_rgba(255,255,255,0.6)] rounded-full"></span>
                                <span className="text-[15px] font-medium text-white/95">Under Review</span>
                            </div>

                            <p className="text-[13px] text-white/80 leading-relaxed font-medium">
                                Our admissions committee is currently evaluating your application for Women's Residence Hall.
                            </p>
                        </div>

                        <div className="mt-8">
                            <div className="h-2 bg-[#4c7385] rounded-full overflow-hidden w-full mb-3">
                                <div className="w-3/4 h-full bg-white/90 rounded-full shadow-[0_0_5px_rgba(255,255,255,0.5)]"></div>
                            </div>
                            <p className="text-[10px] text-white/70 text-center font-medium tracking-wide">Estimated response in 3-5 business days</p>
                        </div>
                    </div>
                </div>

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
                                <p className="text-4xl font-extrabold text-[#113a68] leading-none mb-2 tracking-tight">₱1,240.50</p>
                                <p className="text-[10px] font-extrabold text-[#D03027] tracking-[0.1em] uppercase">Balance Due Oct 01</p>
                            </div>

                            <div className="space-y-4 mb-8 border-t border-[#eef1d6] pt-5">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-[13px] font-extrabold text-slate-900">Monthly Rent</p>
                                        <p className="text-[10px] font-medium text-slate-400 mt-0.5">Sept 2024</p>
                                    </div>
                                    <span className="text-[13px] font-extrabold text-slate-900">₱800.00</span>
                                </div>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-[13px] font-extrabold text-slate-900">Extra</p>
                                        <p className="text-[10px] font-medium text-slate-400 mt-0.5">Extra Charges for Appliances</p>
                                    </div>
                                    <span className="text-[13px] font-extrabold text-slate-900">₱440.00</span>
                                </div>
                            </div>
                        </div>

                        <button className="w-full py-3.5 bg-[#6492A7] hover:bg-[#4f7b8f] text-white text-[13px] font-bold rounded-xl transition-all shadow-[0_2px_8px_rgba(100,146,167,0.3)] hover:shadow-[0_4px_12px_rgba(100,146,167,0.4)] active:scale-[0.98]">
                            View Bills
                        </button>
                    </div>

                    {/* DOCUMENTS CARD */}
                    <div className="bg-[#FDFFF4] rounded-[24px] p-6 md:p-8 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-[#eef1d6] flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-[17px] font-extrabold text-[#2A3F2D]">Documents</h2>
                                <Folder className="w-5 h-5 text-[#8BAE90] stroke-[1.5]" />
                            </div>

                            <div className="space-y-3 mb-8">
                                <div className="bg-[#F8F9EC] rounded-[14px] p-3 pl-4 flex justify-between items-center border border-[#eef1d6] group hover:bg-[#f3f5e1] transition-colors cursor-pointer">
                                    <div className="flex items-center gap-3.5">
                                        <div className="w-8 h-8 bg-white border border-[#e2e7c3] rounded-[9px] flex items-center justify-center text-[#2C5282] shadow-sm">
                                            <FileText className="w-4 h-4" strokeWidth={2.5} />
                                        </div>
                                        <div>
                                            <p className="text-[13px] font-bold text-slate-900 mb-0.5">Guest_ID_Scan.pdf</p>
                                            <p className="text-[9px] font-bold text-[#668E42] tracking-wider">VERIFIED • 2.4MB</p>
                                        </div>
                                    </div>
                                    <button className="text-[#a5b487] group-hover:text-[#668E42] transition-colors pr-2">
                                        <Download className="w-4 h-4 stroke-[2.5]" />
                                    </button>
                                </div>

                                <div className="bg-[#F8F9EC] rounded-[14px] p-3 pl-4 flex justify-between items-center border border-[#eef1d6] group hover:bg-[#f3f5e1] transition-colors cursor-pointer">
                                    <div className="flex items-center gap-3.5">
                                        <div className="w-8 h-8 bg-white border border-[#e2e7c3] rounded-[9px] flex items-center justify-center text-[#2C5282] shadow-sm">
                                            <FileText className="w-4 h-4" strokeWidth={2.5} />
                                        </div>
                                        <div>
                                            <p className="text-[13px] font-bold text-slate-900 mb-0.5">Residence_Proof.pdf</p>
                                            <p className="text-[9px] font-bold text-[#668E42] tracking-wider">VERIFIED • 1.1MB</p>
                                        </div>
                                    </div>
                                    <button className="text-[#a5b487] group-hover:text-[#668E42] transition-colors pr-2">
                                        <Download className="w-4 h-4 stroke-[2.5]" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <button className="w-full py-3.5 bg-[#F8F9EC] hover:bg-[#eaeebb] text-[#5d8339] text-[13px] font-bold rounded-[14px] flex items-center justify-center gap-2 border border-[#dce3bc] transition-all hover:shadow-sm active:scale-[0.98]">
                            <Plus className="w-4 h-4 stroke-[2.5]" /> Upload New File
                        </button>
                    </div>

                    {/* APPLICATIONS CARD */}
                    <div className="bg-[#FDFFF4] rounded-[24px] p-6 md:p-8 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-[#eef1d6] flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-[17px] font-extrabold text-[#2A3F2D]">Applications</h2>
                                <History className="w-5 h-5 text-[#8BAE90] stroke-[1.5]" />
                            </div>

                            <div className="space-y-6 mb-8 px-1">
                                <div className="relative pl-6">
                                    <div className="absolute left-0 top-1.5 w-2 h-2 rounded-full bg-[#B3D68B]"></div>
                                    <p className="text-[13px] font-bold text-slate-900 leading-none mb-1">2nd Sem, AY 2024–2025</p>
                                    <p className="text-[10px] font-medium text-slate-400">Makiling Residence Hall (Approved)</p>
                                </div>
                                <div className="relative pl-6">
                                    <div className="absolute left-0 top-1.5 w-2 h-2 rounded-full bg-[#D03027]"></div>
                                    <p className="text-[13px] font-bold text-slate-900 leading-none mb-1">2nd Sem, AY 2024–2025</p>
                                    <p className="text-[10px] font-medium text-slate-400">Women's Residence Hall (Rejected)</p>
                                </div>
                                <div className="relative pl-6">
                                    <div className="absolute left-0 top-1.5 w-2 h-2 rounded-full bg-[#18395B]"></div>
                                    <p className="text-[13px] font-bold text-slate-900 leading-none mb-1">2nd Sem, AY 2024–2025</p>
                                    <p className="text-[10px] font-medium text-slate-400">Men's Residence Hall (Rejected)</p>
                                </div>
                            </div>
                        </div>

                        <button className="w-full py-3.5 bg-white hover:bg-slate-50 text-[#1f3d5f] border border-[#dce3bc] text-[13px] font-extrabold rounded-[14px] transition-all hover:border-[#cfd8df] active:scale-[0.98]">
                            Start New Application
                        </button>
                    </div>
                </div>

                {/* BOTTOM BANNER */}
                <div className="flex flex-col md:flex-row gap-0 rounded-[24px] overflow-hidden shadow-sm h-auto md:h-[220px]">
                    <div className="w-full md:w-[45%] bg-slate-800 relative min-h-[220px] md:min-h-full">
                        <div className="absolute inset-0 bg-gradient-to-t from-[#112F40]/90 to-transparent z-10"></div>
                        {/* Fallback image block, replacing with Unsplash placeholder */}
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=1000')] bg-cover bg-center bg-no-repeat z-0 opacity-80 mix-blend-luminosity"></div>

                        <div className="absolute bottom-7 left-8 right-8 z-20">
                            <h3 className="text-white font-bold text-[22px] mb-0.5 tracking-tight">Makiling Residence Hall</h3>
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
