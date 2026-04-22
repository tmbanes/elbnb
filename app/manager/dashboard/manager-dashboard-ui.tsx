import React, { useEffect, useState } from "react";
import {
    Search, Bell, LayoutDashboard, Building2, Bed, Users, FileText,
    Banknote, LogOut, UserPlus, ArrowLeftRight, AlertTriangle, Users2, Circle, Settings2, BarChart2, CheckCircle2, ChevronRight
} from "lucide-react";
import { Archivo } from "next/font/google";

const archivo = Archivo({ subsets: ["latin"] });

interface ManagerDashboardUIProps {
    onLogout?: () => void;
    isLoggingOut?: boolean;
}

export default function ManagerDashboardUI({ onLogout, isLoggingOut }: ManagerDashboardUIProps) {
    const [showLogout, setShowLogout] = useState(false);
    const [roomView, setRoomView] = useState<'grid' | 'list'>('grid');

    const [managerName, setManagerName] = useState("JD");
    const [managerInitials, setManagerInitials] = useState("JD");
    const [dormName, setDormName] = useState("Makiling Residence Hall");
    const [dormLocation, setDormLocation] = useState("University of the Philippines Los Baños");

    // Metrics 
    const [totalRooms, setTotalRooms] = useState(1240);
    const [occupiedRate, setOccupiedRate] = useState("94.2");
    const [occupiedCount, setOccupiedCount] = useState(1188);
    const [availableCount, setAvailableCount] = useState(72);

    const [dbRooms, setDbRooms] = useState<{ id: string, status: string }[]>([]);

    useEffect(() => {
        async function fetchDashboardData() {
            try {
                // Dynamically import client to prevent SSR issues
                const { getSupabaseBrowserClient } = await import("@/lib/supabase/browser-client");
                const supabase = getSupabaseBrowserClient();

                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return; // Not logged in

                // 1. Fetch user data for Top Right Corner
                const { data: profile } = await supabase
                    .from('users')
                    .select('first_name, last_name')
                    .eq('user_id', user.id)
                    .single() as any;

                if (profile) {
                    const initials = `${profile.first_name?.[0] || ""}${profile.last_name?.[0] || ""}`.toUpperCase();
                    setManagerInitials(initials || "JD");
                    setManagerName(`${profile.first_name} ${profile.last_name}`);
                }

                // 2. Fetch manager info to get employee_id
                const { data: managerInfo } = await supabase
                    .from('dormitory_manager')
                    .select('employee_id')
                    .eq('user_id', user.id)
                    .single() as any;

                if (managerInfo?.employee_id) {
                    // 3. Fetch Accommodation Data
                    const { data: accom } = await supabase
                        .from('accommodation')
                        .select('*')
                        .eq('manager_id', managerInfo.employee_id)
                        .single() as any;

                    if (accom) {
                        setDormName(accom.name);
                        setDormLocation(accom.location);

                        // 4. Fetch Unit Data for this Accommodation
                        const { data: units } = await supabase
                            .from('unit')
                            .select('*')
                            .eq('accommodation_id', accom.accommodation_id) as any;

                        if (units && units.length > 0) {
                            setTotalRooms(units.length);

                            let occ = 0;
                            let vac = 0;

                            const parsedRooms = units.map((u: any) => {
                                let st = "vacant";
                                if (u.unit_status === 'inactive' || u.unit_status === 'maintenance') {
                                    st = "maintenance";
                                } else if (u.current_occupancy >= u.max_occupancy) {
                                    st = "occupied";
                                    occ += u.max_occupancy;
                                } else if (u.current_occupancy > 0) {
                                    st = "occupied";
                                    occ += u.current_occupancy;
                                    vac += (u.max_occupancy - u.current_occupancy);
                                } else {
                                    st = "vacant";
                                    vac += u.max_occupancy;
                                }
                                return { id: u.unit_number, status: st };
                            });

                            setDbRooms(parsedRooms);
                            setOccupiedCount(occ);
                            setAvailableCount(vac);
                            const rate = (occ / (occ + vac)) * 100;
                            setOccupiedRate(rate ? rate.toFixed(1) : "0.0");
                        }
                    }
                }
            } catch (err) {
                console.error("Failed to load generic dashboard metrics from DB:", err);
            }
        }

        fetchDashboardData();
    }, []);

    const rooms = dbRooms.length > 0 ? dbRooms : [
        { id: "201A", status: "occupied" },
        { id: "201B", status: "occupied" },
        { id: "202A", status: "vacant" },
        { id: "202B", status: "maintenance" },
        { id: "203A", status: "occupied" },
        { id: "203B", status: "occupied" },
        { id: "204A", status: "occupied" },
        { id: "204B", status: "occupied" },
        { id: "205A", status: "occupied" },
        { id: "205B", status: "vacant" },
        { id: "206A", status: "occupied" },
        { id: "206B", status: "occupied" }
    ];

    return (
        <div className={`flex h-screen bg-[#F6F5ED] overflow-hidden ${archivo.className}`}>

            {/* MAIN CONTENT */}
            <main className="flex-1 flex flex-col h-full overflow-hidden">
                {/* TOP HEADER */}
                <header className="flex justify-between items-center px-8 lg:px-10 mt-6 mb-4">
                    <div className="relative w-full max-w-[400px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search data, students, or rooms..."
                            className="w-full pl-11 pr-4 py-2.5 bg-slate-200/50 rounded-full text-sm border-none focus:ring-2 focus:ring-slate-300 outline-none font-medium placeholder:text-slate-400"
                        />
                    </div>

                    <div className="flex items-center gap-6">
                        <button className="relative text-slate-600 hover:text-slate-900 transition-colors">
                            <Bell className="w-5 h-5" />
                            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#A05C5C] rounded-full ring-2 ring-[#F6F5ED]"></span>
                        </button>

                        <div className="relative">
                            <div
                                className="flex items-center gap-3 cursor-pointer group"
                                onClick={() => setShowLogout(!showLogout)}
                            >
                                <div className="flex flex-col items-end">
                                    <span className="text-[13px] font-bold text-slate-900 leading-tight">{managerName}</span>
                                    <span className="text-[9px] text-slate-500 font-bold tracking-widest uppercase">MANAGER</span>
                                </div>
                                <div className="w-9 h-9 rounded-full bg-[#5D6BDE] text-white flex items-center justify-center font-bold text-sm shadow-sm group-hover:scale-105 transition-transform">
                                    {managerInitials}
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

                <div className="px-8 lg:px-10 flex-1 overflow-auto pb-10">
                    {/* TITLE BLOCK */}
                    <div className="mb-6">
                        <h1 className="text-[32px] md:text-[38px] font-black text-[#0B3A64] tracking-tight leading-none mb-1">
                            Manager Dashboard
                        </h1>
                        <p className="text-[13px] text-slate-500 font-medium">
                            Real-time oversight of the Makiling Residence Hall.
                        </p>
                    </div>

                    {/* TOP DORM CARD */}
                    <div className="bg-white rounded-xl p-4 md:p-5 flex justify-between items-center shadow-sm border border-slate-100/50 mb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-[#E9F0FD] text-[#3668C1] rounded-lg flex items-center justify-center">
                                <Building2 className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-[16px] font-bold text-[#0B3A64]">{dormName}</h2>
                                <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                                    <span className="text-slate-400">📍</span> {dormLocation}
                                </p>
                            </div>
                        </div>
                        <button className="px-5 py-2 border border-slate-200 text-[#0B3A64] text-[11px] font-bold rounded-lg hover:bg-slate-50 transition-colors uppercase tracking-wider">
                            Manage Dorm
                        </button>
                    </div>

                    {/* THREE COLUMN GRID */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        {/* TOTAL ROOMS */}
                        <div className="bg-white rounded-[20px] p-6 shadow-sm border border-slate-100/50 flex flex-col justify-between h-[200px]">
                            <h3 className="text-[10px] font-bold text-slate-400 tracking-[0.1em] uppercase">Total Rooms</h3>
                            <div>
                                <p className="text-[42px] font-black text-[#0B3A64] leading-none mb-1">{totalRooms}</p>
                                <p className="text-[12px] text-slate-500 font-medium">Certified Living Units</p>
                            </div>
                        </div>

                        {/* OCCUPANCY RATE */}
                        <div className="bg-[#5D84A6] rounded-[20px] p-6 shadow-sm flex flex-col justify-between h-[200px] relative overflow-hidden text-white">
                            <div className="absolute -right-4 -bottom-4 opacity-10">
                                <BarChart2 className="w-40 h-40" />
                            </div>
                            <h3 className="text-[10px] font-bold text-white/70 tracking-[0.1em] uppercase relative z-10">Occupancy Rate</h3>
                            <div className="relative z-10">
                                <div className="flex items-baseline gap-1 mb-3">
                                    <p className="text-[54px] font-black leading-none tracking-tight">{occupiedRate}</p>
                                    <p className="text-[24px] font-bold">%</p>
                                </div>
                                <div className="flex items-center gap-4 text-[11px] font-medium">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2.5 h-2.5 rounded-full bg-[#A8CA77]"></div>
                                        <span>{occupiedCount} Occupied</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2.5 h-2.5 rounded-full bg-[#8EB2CE]"></div>
                                        <span>{availableCount} Available</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* PENDING APPROVALS */}
                        <div className="bg-white rounded-[20px] p-6 shadow-sm border border-slate-100/50 flex flex-col h-[200px]">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-[11px] font-bold text-[#0B3A64] tracking-[0.05em] uppercase">Pending Approvals</h3>
                                <span className="bg-[#D03027] text-white text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">3 Urgent</span>
                            </div>
                            <div className="flex-1 flex flex-col gap-2 overflow-y-auto pr-1">
                                <div className="bg-[#F6F8E8] rounded-lg p-2.5 flex items-start gap-3">
                                    <div className="text-[#7A9D54] mt-0.5"><UserPlus className="w-4 h-4" /></div>
                                    <div>
                                        <p className="text-[12px] font-bold text-[#0B3A64] leading-tight mb-0.5">Late Check-in Request</p>
                                        <p className="text-[10px] text-slate-500 font-medium">Room 402D • Julian M.</p>
                                    </div>
                                </div>
                                <div className="bg-[#F6F8E8] rounded-lg p-2.5 flex items-start gap-3">
                                    <div className="text-[#7A9D54] mt-0.5"><ArrowLeftRight className="w-4 h-4" /></div>
                                    <div>
                                        <p className="text-[12px] font-bold text-[#0B3A64] leading-tight mb-0.5">Room Transfer Petition</p>
                                        <p className="text-[10px] text-slate-500 font-medium">Hall C → Hall A • Sarah K.</p>
                                    </div>
                                </div>
                                <div className="bg-[#FDF3E9] rounded-lg p-2.5 flex items-start gap-3">
                                    <div className="text-[#C55745] mt-0.5"><AlertTriangle className="w-4 h-4" /></div>
                                    <div>
                                        <p className="text-[12px] font-bold text-[#0B3A64] leading-tight mb-0.5">Emergency Maintenance</p>
                                        <p className="text-[10px] text-slate-500 font-medium">Basement Flood Risk • Wing D</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* TWO COLUMN GRID - BOTTOM */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                        {/* ROOM INVENTORY STATUS */}
                        <div className="lg:col-span-2 bg-white rounded-[20px] p-6 shadow-sm border border-slate-100/50 flex flex-col">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="text-[14px] font-extrabold text-[#0B3A64] uppercase tracking-wide mb-1">Room Inventory Status</h3>
                                    <p className="text-[11px] text-slate-400 font-medium tracking-wide">Live view of facility distribution</p>
                                </div>
                                <div className="flex bg-slate-100 p-1 rounded-lg">
                                    <button
                                        onClick={() => setRoomView('grid')}
                                        className={`px-4 py-1.5 text-[10px] font-bold rounded-md uppercase tracking-wide shadow-sm transition-colors ${roomView === 'grid' ? 'bg-[#0B3A64] text-white' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        Grid
                                    </button>
                                    <button
                                        onClick={() => setRoomView('list')}
                                        className={`px-4 py-1.5 text-[10px] font-bold rounded-md uppercase tracking-wide shadow-sm transition-colors ${roomView === 'list' ? 'bg-[#0B3A64] text-white' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        List
                                    </button>
                                </div>
                            </div>

                            {roomView === 'grid' ? (
                                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-6">
                                    {rooms.map(room => (
                                        <div key={room.id} className={`border rounded-lg p-3 flex flex-col items-center justify-center gap-1 h-[65px] ${room.status === 'occupied' ? 'bg-[#EBF2E1] border-[#D5E1CD]' :
                                            room.status === 'vacant' ? 'bg-[#F8F9EC] border-[#EBEFCC]' :
                                                'bg-[#FDECEB] border-[#F3D5D3]'
                                            }`}>
                                            <span className={`text-[11px] font-bold ${room.status === 'occupied' ? 'text-[#4B692F]' :
                                                room.status === 'vacant' ? 'text-[#A4AE85]' :
                                                    'text-[#C55745]'
                                                }`}>{room.id}</span>
                                            {room.status === 'occupied' && <Users2 className="w-4 h-4 text-[#7A9D54]" />}
                                            {room.status === 'vacant' && <Circle className="w-3.5 h-3.5 text-[#C4CDA9]" />}
                                            {room.status === 'maintenance' && <Settings2 className="w-4 h-4 text-[#DE7A6A]" />}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col gap-2 mb-6 max-h-[160px] overflow-y-auto pr-2">
                                    {rooms.map(room => (
                                        <div key={room.id} className="flex justify-between items-center py-2 px-3 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${room.status === 'occupied' ? 'bg-[#EBF2E1] text-[#7A9D54]' :
                                                    room.status === 'vacant' ? 'bg-[#F8F9EC] text-[#C4CDA9]' :
                                                        'bg-[#FDECEB] text-[#DE7A6A]'
                                                    }`}>
                                                    {room.status === 'occupied' && <Users2 className="w-4 h-4" />}
                                                    {room.status === 'vacant' && <Circle className="w-3.5 h-3.5" />}
                                                    {room.status === 'maintenance' && <Settings2 className="w-4 h-4" />}
                                                </div>
                                                <span className="text-[13px] font-bold text-[#0B3A64]">Room {room.id}</span>
                                            </div>
                                            <span className={`text-[10px] uppercase font-bold tracking-wider ${room.status === 'occupied' ? 'text-[#4B692F]' :
                                                room.status === 'vacant' ? 'text-[#A4AE85]' :
                                                    'text-[#C55745]'
                                                }`}>
                                                {room.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="flex gap-4 mt-auto border-t border-slate-100 pt-4">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-sm bg-[#7A9D54]"></div>
                                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Occupied</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-sm bg-[#DCE4C5]"></div>
                                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Vacant</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-sm bg-[#C55745]"></div>
                                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Maintenance</span>
                                </div>
                            </div>
                        </div>

                        {/* MAINTENANCE OVERVIEW */}
                        <div className="bg-[#30507B] rounded-[20px] p-6 shadow-sm flex flex-col relative overflow-hidden text-white h-auto sm:h-[290px] md:h-auto">
                            <div className="absolute -right-8 -bottom-8 opacity-10">
                                <Settings2 className="w-48 h-48" />
                            </div>

                            <h3 className="text-[11px] font-bold text-white/70 tracking-[0.1em] uppercase relative z-10 mb-5">Maintenance Overview</h3>

                            <div className="flex gap-8 items-end border-b border-white/20 pb-4 mb-4 relative z-10">
                                <div>
                                    <p className="text-[38px] font-black leading-none tracking-tight mb-1">14</p>
                                    <p className="text-[20px] font-bold">Open</p>
                                </div>
                                <div className="pb-1">
                                    <p className="text-[10px] font-bold text-white/70 tracking-wider uppercase mb-1">84% Resolution</p>
                                    <p className="text-[10px] font-bold text-white/70 tracking-wider uppercase">Rate</p>
                                    <div className="w-24 h-1 bg-[#1A3355] rounded-full mt-2 overflow-hidden">
                                        <div className="w-[84%] h-full bg-[#A3C7E6] rounded-full"></div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-6 relative z-10">
                                <div className="bg-[#3D608F] p-3 rounded-xl border border-[#4F75A8]">
                                    <p className="text-[8px] font-extrabold text-white/70 uppercase tracking-widest mb-1.5">High Priority</p>
                                    <p className="text-[22px] font-black leading-none">04</p>
                                </div>
                                <div className="bg-[#3D608F] p-3 rounded-xl border border-[#4F75A8]">
                                    <p className="text-[8px] font-extrabold text-white/70 uppercase tracking-widest mb-1.5">Completed</p>
                                    <p className="text-[22px] font-black leading-none">128</p>
                                </div>
                            </div>

                            <button className="w-full mt-auto py-3 bg-[#BBE0F9] hover:bg-[#A3D0EF] text-[#0B3A64] text-[12px] font-bold rounded-lg transition-colors shadow-sm relative z-10 tracking-widest uppercase">
                                Generate Report
                            </button>
                        </div>
                    </div>

                    {/* RECENT ACTIVITY ARCHIVE - FULL WIDTH */}
                    <div className="bg-white rounded-[20px] p-6 shadow-sm border border-slate-100/50">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-[16px] font-bold text-[#0B3A64] tracking-tight">Recent Activity Archive</h3>
                            <button className="text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest flex items-center gap-1 transition-colors">
                                View Historical Data <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                            </button>
                        </div>

                        <div className="space-y-5">
                            {/* Item 1 */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-start gap-4">
                                    <div className="mt-1 w-2.5 h-2.5 rounded-full bg-[#7A9D54]"></div>
                                    <div>
                                        <p className="text-[13px] text-slate-800 font-medium">
                                            <span className="font-bold text-[#0B3A64]">Resident Checked In</span> by <span className="font-bold">System Admin</span>
                                        </p>
                                        <p className="text-[11px] text-slate-500 mt-0.5">Marcus Aurelius • Room 102A • South Wing</p>
                                    </div>
                                </div>
                                <span className="text-[10px] text-slate-400 font-bold">09:42 AM</span>
                            </div>

                            {/* Item 2 */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-start gap-4">
                                    <div className="mt-1 w-2.5 h-2.5 rounded-full bg-[#0B3A64]"></div>
                                    <div>
                                        <p className="text-[13px] text-slate-800 font-medium">
                                            <span className="font-bold text-[#0B3A64]">Maintenance Request Filed</span> by <span className="font-bold">Resident</span>
                                        </p>
                                        <p className="text-[11px] text-slate-500 mt-0.5">HVAC Malfunction • Room 305B • Hall C</p>
                                    </div>
                                </div>
                                <span className="text-[10px] text-slate-400 font-bold">08:15 AM</span>
                            </div>

                            {/* Item 3 */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-start gap-4">
                                    <div className="mt-1 w-2.5 h-2.5 rounded-full bg-[#3668C1]"></div>
                                    <div>
                                        <p className="text-[13px] text-slate-800 font-medium">
                                            <span className="font-bold text-[#0B3A64]">Keycard Deactivated</span> by <span className="font-bold">Security</span>
                                        </p>
                                        <p className="text-[11px] text-slate-500 mt-0.5">Lost Property Protocol • Resident ID 8842</p>
                                    </div>
                                </div>
                                <span className="text-[10px] text-slate-400 font-bold">07:30 AM</span>
                            </div>

                            {/* Item 4 */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-start gap-4">
                                    <div className="mt-1 w-2.5 h-2.5 rounded-full bg-[#C55745]"></div>
                                    <div>
                                        <p className="text-[13px] text-slate-800 font-medium">
                                            <span className="font-bold text-[#0B3A64]">Access Alert</span> by <span className="font-bold">Door Sensor</span>
                                        </p>
                                        <p className="text-[11px] text-slate-500 mt-0.5">Unauthorized Exit Entry • Rear Gate 04</p>
                                    </div>
                                </div>
                                <span className="text-[10px] text-slate-400 font-bold">04:20 AM</span>
                            </div>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}
