import React, { useEffect, useState } from "react";
import {
    Search, Bell, LayoutDashboard, Building2, Bed, Users, FileText,
    Banknote, LogOut, UserPlus, ArrowLeftRight, AlertTriangle, Users2, Circle, Settings2, BarChart2, CheckCircle2, ChevronRight,
    ChevronLeft, Filter, User, Plus, RotateCcw
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
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

    const [dbRooms, setDbRooms] = useState<{
        id: string,
        unit_id: string,
        status: string,
        current: number,
        max: number,
        occupants: any[]
    }[]>([]);
    const [selectedRoom, setSelectedRoom] = useState<any>(null);
    const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);

    // Student Table State
    const [allStudents, setAllStudents] = useState<any[]>([]);
    const [waitlistStudents, setWaitlistStudents] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'residents' | 'waitlist'>('residents');
    const [waitlistCount, setWaitlistCount] = useState(0);
    const [tableSearch, setTableSearch] = useState("");
    const [tablePage, setTablePage] = useState(1);
    const [tableFilters, setTableFilters] = useState({
        yearLevel: "all",
        roomStatus: "all",
        gender: "all",
        paymentStatus: "all",
        course: "all",
        college: "all"
    });
    const studentsPerPage = 5;

    const handleResetFilters = () => {
        setTableSearch("");
        setTableFilters({
            yearLevel: "all",
            college: "all",
            roomStatus: "all",
            paymentStatus: "all"
        });
        setTablePage(1);
    };

    useEffect(() => {
        async function fetchDashboardData() {
            try {
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

                            // 5. Fetch Active Assignments for these units
                            const { data: assignments } = await supabase
                                .from('accommodation_assignment')
                                .select(`
                                    *,
                                    users:user_id (
                                        first_name,
                                        last_name
                                    )
                                `)
                                .eq('assignment_status', 'active')
                                .in('unit_id', units.map((u: any) => u.unit_id)) as any;

                            const occupantsMap = new Map();
                            assignments?.forEach((asg: any) => {
                                if (!occupantsMap.has(asg.unit_id)) {
                                    occupantsMap.set(asg.unit_id, []);
                                }
                                occupantsMap.get(asg.unit_id).push({
                                    id: asg.user_id,
                                    name: asg.users ? `${asg.users.first_name} ${asg.users.last_name}` : "Unknown",
                                    student_number: asg.student_number || "2024-XXXXX",
                                    avatar: null
                                });
                            });

                            let occ = 0;
                            let vac = 0;

                            const parsedRooms = units.map((u: any) => {
                                const currentOccupants = occupantsMap.get(u.unit_id) || [];
                                const count = currentOccupants.length;

                                let st = "vacant";
                                if (u.unit_status === 'inactive' || u.unit_status === 'maintenance') {
                                    st = "maintenance";
                                } else if (count >= u.max_occupancy) {
                                    st = "full";
                                } else if (count > 0) {
                                    st = "partial";
                                } else {
                                    st = "vacant";
                                }

                                occ += count;
                                vac += (u.max_occupancy - count);

                                return {
                                    id: u.unit_number,
                                    unit_id: u.unit_id,
                                    status: st,
                                    current: count,
                                    max: u.max_occupancy,
                                    occupants: currentOccupants
                                };
                            });

                            setDbRooms(parsedRooms);
                            setOccupiedCount(occ);
                            setAvailableCount(vac);
                            const rate = (occ / (occ + vac)) * 100;
                            setOccupiedRate(rate ? rate.toFixed(1) : "0.0");

                            const students = Array.from(occupantsMap.values()).flat().map((s: any) => {
                                const room = parsedRooms.find((r: any) => r.occupants.some((o: any) => o.id === s.id));
                                return {
                                    ...s,
                                    room_number: room?.id || "N/A",
                                    year_level: "Senior",
                                    gender: "Male",
                                    payment_status: "Cleared",
                                    college: "CAS"
                                };
                            });
                            setAllStudents(students);

                            // 6. Fetch Waitlist (Approved but not yet assigned/active)
                            const { data: waitlistApps } = await supabase
                                .from('accommodation_application')
                                .select(`
                                    *,
                                    users:user_id (
                                        first_name,
                                        last_name,
                                        student_number,
                                        home_region,
                                        year_level,
                                        college,
                                        gender
                                    )
                                `)
                                .eq('application_status', 'approved')
                                .eq('preferred_accommodation_id', accom.accommodation_id) as any;

                            const waitlist = waitlistApps?.map((app: any) => ({
                                id: app.user_id,
                                name: app.users ? `${app.users.first_name} ${app.users.last_name}` : "Unknown",
                                student_number: app.users?.student_number || "2024-XXXXX",
                                date_approved: app.updated_at || app.date_submitted,
                                home_region: app.users?.home_region || "Region IV-A",
                                priority_score: Math.floor(Math.random() * 40) + 60, // Placeholder score
                                year_level: app.users?.year_level || "Freshman",
                                college: app.users?.college || "CAS",
                                gender: app.users?.gender || "Female",
                                avatar: null
                            })) || [];

                            setWaitlistStudents(waitlist);
                            setWaitlistCount(waitlist.length);
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
        { id: "201A", unit_id: "1", status: "full", current: 4, max: 4, occupants: [] },
        { id: "201B", unit_id: "2", status: "full", current: 4, max: 4, occupants: [] },
        { id: "202A", unit_id: "3", status: "vacant", current: 0, max: 4, occupants: [] },
        { id: "202B", unit_id: "4", status: "maintenance", current: 0, max: 4, occupants: [] },
        { id: "203A", unit_id: "5", status: "partial", current: 2, max: 4, occupants: [] },
        { id: "203B", unit_id: "6", status: "full", current: 4, max: 4, occupants: [] }
    ];

    const currentData = activeTab === 'residents' ? allStudents : waitlistStudents;

    const filteredStudents = currentData.filter(student => {
        const matchesSearch = (student.name || "").toLowerCase().includes(tableSearch.toLowerCase()) ||
            (student.student_number || "").toLowerCase().includes(tableSearch.toLowerCase());
        const matchesYear = tableFilters.yearLevel === "all" || student.year_level === tableFilters.yearLevel;
        const matchesGender = tableFilters.gender === "all" || student.gender === tableFilters.gender;
        const matchesRoomStatus = activeTab === 'waitlist' ? true : (tableFilters.roomStatus === "all" || (
            tableFilters.roomStatus === "full" ? rooms.find(r => r.id === student.room_number)?.status === "full" :
                tableFilters.roomStatus === "partial" ? rooms.find(r => r.id === student.room_number)?.status === "partial" : true
        ));
        const matchesPayment = activeTab === 'waitlist' ? true : (tableFilters.paymentStatus === "all" || student.payment_status === tableFilters.paymentStatus);
        const matchesCollege = tableFilters.college === "all" || student.college === tableFilters.college;

        return matchesSearch && matchesYear && matchesGender && matchesRoomStatus && matchesPayment && matchesCollege;
    });

    const paginatedStudents = filteredStudents.slice((tablePage - 1) * studentsPerPage, tablePage * studentsPerPage);
    const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);

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

                    {/* FOUR COLUMN GRID */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                        {/* TOTAL ROOMS */}
                        <div className="bg-white rounded-[20px] p-5 shadow-sm border border-slate-100/50 flex flex-col justify-between h-[180px]">
                            <h3 className="text-[10px] font-bold text-slate-400 tracking-[0.1em] uppercase">Total Rooms</h3>
                            <div>
                                <p className="text-[38px] font-black text-[#0B3A64] leading-none mb-1">{totalRooms}</p>
                                <p className="text-[11px] text-slate-500 font-medium">Certified Living Units</p>
                            </div>
                        </div>

                        {/* OCCUPANCY RATE */}
                        <div className="bg-[#5D84A6] rounded-[20px] p-5 shadow-sm flex flex-col justify-between h-[180px] relative overflow-hidden text-white">
                            <div className="absolute -right-4 -bottom-4 opacity-10">
                                <BarChart2 className="w-32 h-32" />
                            </div>
                            <h3 className="text-[10px] font-bold text-white/70 tracking-[0.1em] uppercase relative z-10">Occupancy</h3>
                            <div className="relative z-10">
                                <div className="flex items-baseline gap-1 mb-2">
                                    <p className="text-[42px] font-black leading-none tracking-tight">{occupiedRate}</p>
                                    <p className="text-[18px] font-bold">%</p>
                                </div>
                                <div className="flex flex-col gap-1 text-[10px] font-medium">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-[#A8CA77]"></div>
                                        <span>{occupiedCount} Occupied</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-[#8EB2CE]"></div>
                                        <span>{availableCount} Vacant</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* PENDING ASSIGNMENT (WAITLIST) */}
                        <div className="bg-white rounded-[20px] p-5 shadow-sm border border-slate-100/50 flex flex-col justify-between h-[180px]">
                            <div className="flex justify-between items-center">
                                <h3 className="text-[10px] font-bold text-slate-400 tracking-[0.1em] uppercase">Pending Assignment</h3>
                                <span className="bg-[#5D6BDE]/10 text-[#5D6BDE] text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Waitlist</span>
                            </div>
                            <div>
                                <p className="text-[38px] font-black text-[#5D6BDE] leading-none mb-1">{waitlistCount}</p>
                                <p className="text-[11px] text-slate-500 font-medium">Approved Students Waiting</p>
                            </div>
                        </div>

                        {/* PENDING APPROVALS */}
                        <div className="bg-white rounded-[20px] p-5 shadow-sm border border-slate-100/50 flex flex-col h-[180px]">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-[10px] font-bold text-[#0B3A64] tracking-[0.1em] uppercase">Pending Approvals</h3>
                                <span className="bg-[#D03027] text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">3 Urgent</span>
                            </div>
                            <div className="flex-1 flex flex-col gap-2 overflow-y-auto pr-1 scrollbar-hide">
                                <div className="bg-[#F6F8E8] rounded-lg p-2 flex items-start gap-2.5">
                                    <div className="text-[#7A9D54] mt-0.5"><UserPlus className="w-3.5 h-3.5" /></div>
                                    <div className="overflow-hidden">
                                        <p className="text-[11px] font-bold text-[#0B3A64] leading-tight mb-0.5 truncate">Check-in Request</p>
                                        <p className="text-[9px] text-slate-500 font-medium truncate">Julian M.</p>
                                    </div>
                                </div>
                                <div className="bg-[#FDF3E9] rounded-lg p-2 flex items-start gap-2.5">
                                    <div className="text-[#C55745] mt-0.5"><AlertTriangle className="w-3.5 h-3.5" /></div>
                                    <div className="overflow-hidden">
                                        <p className="text-[11px] font-bold text-[#0B3A64] leading-tight mb-0.5 truncate">Emergency Maint.</p>
                                        <p className="text-[9px] text-slate-500 font-medium truncate">Wing D</p>
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
                                        <div
                                            key={room.id}
                                            onClick={() => {
                                                setSelectedRoom(room);
                                                setIsRoomModalOpen(true);
                                            }}
                                            className={`border rounded-xl p-3 flex flex-col items-center justify-center gap-1.5 h-[80px] cursor-pointer transition-all hover:shadow-md hover:scale-[1.03] active:scale-[0.98] ${room.status === 'full' ? 'bg-[#EBF2E1] border-[#D5E1CD]' :
                                                room.status === 'partial' ? 'bg-[#FFF9E6] border-[#F2E8C4]' :
                                                    room.status === 'vacant' ? 'bg-slate-50 border-slate-200' :
                                                        'bg-[#FDECEB] border-[#F3D5D3]'
                                                }`}
                                        >
                                            <span className={`text-[12px] font-black ${room.status === 'full' ? 'text-[#4B692F]' :
                                                room.status === 'partial' ? 'text-[#B08E2E]' :
                                                    room.status === 'vacant' ? 'text-slate-400' :
                                                        'text-[#C55745]'
                                                }`}>{room.id}</span>

                                            <div className="flex items-center gap-1">
                                                {room.status === 'full' && <Users2 className="w-4 h-4 text-[#7A9D54]" />}
                                                {room.status === 'partial' && <Users className="w-4 h-4 text-[#B08E2E]" />}
                                                {room.status === 'vacant' && <Circle className="w-3 h-3 text-slate-300" />}
                                                {room.status === 'maintenance' && <Settings2 className="w-4 h-4 text-[#DE7A6A]" />}
                                                <span className="text-[9px] font-bold opacity-70">{room.current}/{room.max}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col gap-2 mb-6 max-h-[300px] overflow-y-auto pr-2">
                                    {rooms.map(room => (
                                        <div
                                            key={room.id}
                                            onClick={() => {
                                                setSelectedRoom(room);
                                                setIsRoomModalOpen(true);
                                            }}
                                            className="flex justify-between items-center py-3 px-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-all cursor-pointer group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110 ${room.status === 'full' ? 'bg-[#EBF2E1] text-[#7A9D54]' :
                                                    room.status === 'partial' ? 'bg-[#FFF9E6] text-[#B08E2E]' :
                                                        room.status === 'vacant' ? 'bg-slate-50 text-slate-300' :
                                                            'bg-[#FDECEB] text-[#DE7A6A]'
                                                    }`}>
                                                    {room.status === 'full' && <Users2 className="w-5 h-5" />}
                                                    {room.status === 'partial' && <Users className="w-5 h-5" />}
                                                    {room.status === 'vacant' && <Circle className="w-4 h-4" />}
                                                    {room.status === 'maintenance' && <Settings2 className="w-5 h-5" />}
                                                </div>
                                                <div>
                                                    <span className="text-[14px] font-black text-[#0B3A64]">Room {room.id}</span>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{room.current} of {room.max} Occupied</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className={`text-[10px] uppercase font-black tracking-widest px-2.5 py-1 rounded-full ${room.status === 'full' ? 'bg-[#7A9D54] text-white' :
                                                    room.status === 'partial' ? 'bg-[#F2C908] text-black' :
                                                        room.status === 'vacant' ? 'bg-slate-200 text-slate-500' :
                                                            'bg-[#DE7A6A] text-white'
                                                    }`}>
                                                    {room.status === 'partial' ? 'Partially Occupied' : room.status}
                                                </span>
                                                <ChevronRight className="w-4 h-4 text-slate-300" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="flex gap-6 mt-auto border-t border-slate-100 pt-5">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-[#7A9D54]"></div>
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Full Capacity</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-[#F2C908]"></div>
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Partially Occupied</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-slate-200"></div>
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Unoccupied</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-[#C55745]"></div>
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Maintenance</span>
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

                    {/* CONSOLIDATED TABLE CONTAINER */}
                    <div className="bg-white rounded-[24px] shadow-sm border border-slate-100/50 mb-8 overflow-hidden">
                        {/* TABS & SEARCH/FILTERS - UNIFIED HEADER */}
                        <div className="px-8 pt-8 pb-6 border-b border-slate-50">
                            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                                <div className="flex items-center gap-8">
                                    <button
                                        onClick={() => { setActiveTab('residents'); setTablePage(1); }}
                                        className={`relative pb-4 text-[14px] font-black uppercase tracking-widest transition-colors ${activeTab === 'residents' ? 'text-[#0B3A64]' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        Residents
                                        {activeTab === 'residents' && <div className="absolute bottom-0 left-0 w-full h-1 bg-[#5591AB] rounded-full"></div>}
                                    </button>
                                    <button
                                        onClick={() => { setActiveTab('waitlist'); setTablePage(1); }}
                                        className={`relative pb-4 text-[14px] font-black uppercase tracking-widest transition-colors ${activeTab === 'waitlist' ? 'text-[#0B3A64]' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        Waitlist
                                        {activeTab === 'waitlist' && <div className="absolute bottom-0 left-0 w-full h-1 bg-[#5591AB] rounded-full"></div>}
                                    </button>
                                </div>

                                <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                                    <div className="relative flex-1 xl:flex-none xl:w-[240px]">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                        <input
                                            type="text"
                                            placeholder="Search Name/ID..."
                                            value={tableSearch}
                                            onChange={(e) => setTableSearch(e.target.value)}
                                            className="w-full pl-11 pr-4 py-2.5 bg-[#F8F9FD] border border-slate-100 rounded-full text-[12px] outline-none focus:ring-2 focus:ring-[#5591AB]/10 font-medium placeholder:text-slate-400"
                                        />
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                        <div className="flex items-center gap-2 bg-[#F8F9FD] px-3 py-1 rounded-full border border-slate-100">
                                            <Select value={tableFilters.yearLevel} onValueChange={(v) => setTableFilters(prev => ({ ...prev, yearLevel: v }))}>
                                                <SelectTrigger className="h-7 border-none bg-transparent text-[11px] font-bold text-[#0B3A64] focus:ring-0 w-[80px] p-0 px-2">
                                                    <SelectValue placeholder="Year" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">Years</SelectItem>
                                                    <SelectItem value="Freshman">Freshman</SelectItem>
                                                    <SelectItem value="Sophomore">Sophomore</SelectItem>
                                                    <SelectItem value="Junior">Junior</SelectItem>
                                                    <SelectItem value="Senior">Senior</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="flex items-center gap-2 bg-[#F8F9FD] px-3 py-1 rounded-full border border-slate-100">
                                            <Select value={tableFilters.college} onValueChange={(v) => setTableFilters(prev => ({ ...prev, college: v }))}>
                                                <SelectTrigger className="h-7 border-none bg-transparent text-[11px] font-bold text-[#0B3A64] focus:ring-0 w-[90px] p-0 px-2">
                                                    <SelectValue placeholder="College" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">Colleges</SelectItem>
                                                    <SelectItem value="CAS">CAS</SelectItem>
                                                    <SelectItem value="CEAT">CEAT</SelectItem>
                                                    <SelectItem value="CEM">CEM</SelectItem>
                                                    <SelectItem value="CFNR">CFNR</SelectItem>
                                                    <SelectItem value="CHE">CHE</SelectItem>
                                                    <SelectItem value="CVM">CVM</SelectItem>
                                                    <SelectItem value="CAFS">CAFS</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {activeTab === 'residents' && (
                                            <>
                                                <div className="flex items-center gap-2 bg-[#F8F9FD] px-3 py-1 rounded-full border border-slate-100">
                                                    <Select value={tableFilters.roomStatus} onValueChange={(v) => setTableFilters(prev => ({ ...prev, roomStatus: v }))}>
                                                        <SelectTrigger className="h-7 border-none bg-transparent text-[11px] font-bold text-[#0B3A64] focus:ring-0 w-[100px] p-0 px-2">
                                                            <SelectValue placeholder="Room" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="all">Room Status</SelectItem>
                                                            <SelectItem value="full">Full Capacity</SelectItem>
                                                            <SelectItem value="partial">Has Space</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="flex items-center gap-2 bg-[#F8F9FD] px-3 py-1 rounded-full border border-slate-100">
                                                    <Select value={tableFilters.paymentStatus} onValueChange={(v) => setTableFilters(prev => ({ ...prev, paymentStatus: v }))}>
                                                        <SelectTrigger className="h-7 border-none bg-transparent text-[11px] font-bold text-[#0B3A64] focus:ring-0 w-[90px] p-0 px-2">
                                                            <SelectValue placeholder="Pay" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="all">Payments</SelectItem>
                                                            <SelectItem value="Cleared">Cleared</SelectItem>
                                                            <SelectItem value="Pending">Pending</SelectItem>
                                                            <SelectItem value="Overdue">Overdue</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </>
                                        )}

                                        <button
                                            onClick={handleResetFilters}
                                            className="p-2 text-slate-400 hover:text-[#DE7A6A] transition-colors"
                                            title="Reset Filters"
                                        >
                                            <RotateCcw className="w-4 h-4" />
                                        </button>

                                        <button className="flex items-center gap-2 px-5 py-2 bg-[#5591AB] text-white rounded-full text-[12px] font-bold hover:bg-[#467A91] transition-all shadow-sm">
                                            <Search className="w-3.5 h-3.5" />
                                            Search
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-[#F9F7EF] border-b border-slate-100">
                                        <th className="py-4 px-8 text-[11px] font-extrabold text-[#443322] uppercase tracking-[0.1em]">Student / Property</th>
                                        <th className="py-4 px-2 text-[11px] font-extrabold text-[#443322] uppercase tracking-[0.1em]">Student Number</th>
                                        {activeTab === 'residents' ? (
                                            <>
                                                <th className="py-4 px-2 text-[11px] font-extrabold text-[#443322] uppercase tracking-[0.1em]">Room / Capacity</th>
                                                <th className="py-4 px-2 text-[11px] font-extrabold text-[#443322] uppercase tracking-[0.1em] text-right">Status</th>
                                            </>
                                        ) : (
                                            <th className="py-4 px-2 text-[11px] font-extrabold text-[#443322] uppercase tracking-[0.1em] text-right">Date Applied</th>
                                        )}
                                        <th className="py-4 px-8 text-[11px] font-extrabold text-[#443322] uppercase tracking-[0.1em] text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedStudents.length > 0 ? paginatedStudents.map((student, idx) => (
                                        <tr key={idx} className="border-b border-slate-50 last:border-0 group hover:bg-[#F9FBFD] transition-colors">
                                            <td className="py-5 px-8">
                                                <div className="flex items-center gap-3">
                                                    <div>
                                                        <p className="text-[14px] font-black text-[#0B3A64] leading-none mb-1.5">{student.name}</p>
                                                        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Prop: {student.college || "MAKILING-RES-HALL"}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-5 px-2">
                                                <span className="text-[13px] font-bold text-slate-600">{student.student_number}</span>
                                            </td>
                                            {activeTab === 'residents' ? (
                                                <>
                                                    <td className="py-5 px-2">
                                                        <div className="flex flex-col">
                                                            <span className="text-[14px] font-black text-[#0B3A64]">Unit {student.room_number}</span>
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase">Year {student.year_level[0]} Resident</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-5 px-2 text-right">
                                                        <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${student.payment_status === 'Cleared' ? 'bg-[#EBF2E1] text-[#7A9D54]' :
                                                            student.payment_status === 'Pending' ? 'bg-[#F2F4F7] text-[#667085]' :
                                                                'bg-[#FDECEB] text-[#DE7A6A]'
                                                            }`}>
                                                            {student.payment_status === 'Cleared' ? 'PAID' : student.payment_status.toUpperCase()}
                                                        </span>
                                                    </td>
                                                </>
                                            ) : (
                                                <td className="py-5 px-2 text-right">
                                                    <span className="text-[13px] font-medium text-slate-600">{new Date(student.date_approved).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                </td>
                                            )}
                                            <td className="py-5 px-8 text-right">
                                                <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button className="p-1.5 text-slate-400 hover:text-[#5591AB] hover:bg-slate-50 rounded-lg">
                                                        <FileText className="w-4 h-4" />
                                                    </button>
                                                    <button className="p-1.5 text-slate-400 hover:text-[#5591AB] hover:bg-slate-50 rounded-lg">
                                                        <Circle className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={activeTab === 'residents' ? 5 : 4} className="py-12 text-center text-slate-400 text-[13px] font-medium">No records found matching your selection.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* PAGINATION */}
                        <div className="flex justify-between items-center px-10 py-8 bg-[#F9FBFD]/50 border-t border-slate-50">
                            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">
                                Page <span className="text-[#5591AB]">{tablePage}</span> of {totalPages || 1}
                            </p>
                            <div className="flex gap-3">
                                <button
                                    disabled={tablePage === 1}
                                    onClick={() => setTablePage(p => Math.max(1, p - 1))}
                                    className="px-4 py-2 bg-white border border-slate-200 rounded-full text-[11px] font-bold text-slate-600 disabled:opacity-30 hover:bg-slate-50 transition-all shadow-sm"
                                >
                                    Previous
                                </button>
                                <button
                                    disabled={tablePage === totalPages || totalPages === 0}
                                    onClick={() => setTablePage(p => Math.min(totalPages, p + 1))}
                                    className="px-4 py-2 bg-white border border-slate-200 rounded-full text-[11px] font-bold text-slate-600 disabled:opacity-30 hover:bg-slate-50 transition-all shadow-sm"
                                >
                                    Next
                                </button>
                            </div>
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

            {/* ROOM DETAIL MODAL */}
            <Dialog open={isRoomModalOpen} onOpenChange={setIsRoomModalOpen}>
                <DialogContent className="sm:max-w-[450px] p-0 border-none rounded-[28px] overflow-hidden bg-white shadow-2xl">
                    <div className="bg-[#0B3A64] p-8 text-white relative overflow-hidden">
                        <div className="absolute -right-10 -top-10 opacity-10">
                            <Building2 className="w-48 h-48" />
                        </div>
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-4">
                                <span className={`text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full border border-white/20 ${selectedRoom?.status === 'full' ? 'bg-[#7A9D54]/20 text-[#D5E1CD]' :
                                    selectedRoom?.status === 'partial' ? 'bg-[#F2C908]/20 text-[#F2E8C4]' :
                                        'bg-white/10 text-white/60'
                                    }`}>
                                    {selectedRoom?.status}
                                </span>
                            </div>
                            <h2 className="text-3xl font-black tracking-tight mb-1">Room {selectedRoom?.id}</h2>
                            <p className="text-white/60 text-[12px] font-bold uppercase tracking-widest">{selectedRoom?.current} of {selectedRoom?.max} slots assigned</p>
                        </div>
                    </div>

                    <div className="p-8">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.2em]">Current Occupants</h3>
                            <span className="text-[10px] font-bold text-slate-300 uppercase">{selectedRoom?.occupants.length} Found</span>
                        </div>

                        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {selectedRoom?.occupants.length > 0 ? selectedRoom.occupants.map((occ: any, i: number) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 transition-all hover:border-[#0B3A64]/20 hover:shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                                            <AvatarImage src={occ.avatar} />
                                            <AvatarFallback className="bg-[#5D6BDE] text-white font-black text-sm">
                                                {occ.name.split(' ').map((n: any) => n[0]).join('')}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="text-[15px] font-black text-[#0B3A64] leading-tight mb-0.5">{occ.name}</p>
                                            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">{occ.student_number}</p>
                                        </div>
                                    </div>
                                    <button className="w-8 h-8 rounded-full flex items-center justify-center text-slate-300 hover:text-[#0B3A64] hover:bg-white transition-all shadow-none hover:shadow-sm">
                                        <User className="w-4 h-4" />
                                    </button>
                                </div>
                            )) : (
                                <div className="py-12 flex flex-col items-center justify-center text-center">
                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                        <Users className="w-8 h-8 text-slate-200" />
                                    </div>
                                    <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Room is empty</p>
                                    <p className="text-slate-300 text-[11px] mt-1">No students currently assigned</p>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => setIsRoomModalOpen(false)}
                            className="w-full mt-8 py-4 bg-[#F2C908] hover:bg-[#EBC207] text-[#0B3A64] font-black text-[13px] rounded-2xl transition-all shadow-md active:scale-[0.98] uppercase tracking-widest"
                        >
                            Close View
                        </button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
