"use client";

import React, { useState, useEffect } from "react";
import { Bell, LogOut, Search } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";

interface ManagerDashboardHeaderProps {
    profile: any;
    initialNotifications: any[];
}

export function ManagerDashboardHeader({ profile, initialNotifications }: ManagerDashboardHeaderProps) {
    const [showLogout, setShowLogout] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState(initialNotifications);
    const router = useRouter();

    const managerName = profile ? `${profile.first_name} ${profile.last_name}` : "Manager";
    const managerInitials = profile ? `${profile.first_name?.[0] || ""}${profile.last_name?.[0] || ""}`.toUpperCase() : "M";
    const managerAvatar = profile?.profile_picture_url || null;

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
        const supabase = getSupabaseBrowserClient();
        await supabase.auth.signOut();
        window.location.href = "/onboarding";
    };

    return (
        <header className="flex justify-between items-center px-8 lg:px-16 xl:px-24 mt-6 mb-4 relative z-50">
            <div className="relative w-full max-w-[400px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                    type="text"
                    placeholder="Search data, students, or rooms..."
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-200/50 rounded-full text-sm border-none focus:ring-2 focus:ring-slate-300 outline-none font-medium placeholder:text-slate-400"
                />
            </div>
            <div className="flex items-center gap-6">
                <div className="relative">
                    <button
                        className={`relative text-slate-600 hover:text-slate-900 transition-colors p-2 rounded-full hover:bg-slate-100 ${showNotifications ? 'bg-slate-100 text-[#5D6BDE]' : ''}`}
                        onClick={() => setShowNotifications(!showNotifications)}
                    >
                        <Bell className="w-5 h-5" />
                        {notifications.filter(n => !n.is_read).length > 0 && (
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#A05C5C] rounded-full ring-2 ring-[#F6F8D5]"></span>
                        )}
                    </button>

                    {showNotifications && (
                        <div className="absolute right-0 top-full mt-4 w-80 bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-slate-100 p-2 z-[60] overflow-hidden">
                            <div className="px-4 py-3 border-b border-slate-50 flex justify-between items-center">
                                <h3 className="text-sm font-bold text-slate-900">Notifications</h3>
                                <button
                                    className="text-[10px] font-bold text-[#5D6BDE] uppercase tracking-wider hover:underline transition-colors"
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
                            <div className="max-h-[350px] overflow-y-auto pr-2">
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
                                                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!n.is_read ? 'bg-[#5D6BDE]' : 'bg-transparent'}`}></div>
                                                <div>
                                                    <p className="text-[13px] font-bold text-slate-900 mb-1 group-hover:text-[#5D6BDE] transition-colors">{n.title}</p>
                                                    <p className="text-[12px] text-slate-500 leading-relaxed mb-1.5">{n.message}</p>
                                                    <p className="text-[10px] text-slate-400 font-medium">{new Date(n.created_at).toLocaleDateString()}</p>
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
                                className="w-full py-3 text-[11px] font-bold text-slate-500 hover:text-[#5D6BDE] transition-colors border-t border-slate-50"
                                onClick={() => { setShowNotifications(false); router.push('/manager/notifications'); }}
                            >
                                View All Activity
                            </button>
                        </div>
                    )}
                </div>
                <div className="relative">
                    <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setShowLogout(!showLogout)}>
                        <div className="flex flex-col items-end">
                            <span className="text-[13px] font-bold text-slate-900 leading-tight">{managerName}</span>
                            <span className="text-[9px] text-slate-500 font-bold tracking-widest uppercase">MANAGER</span>
                        </div>
                        <div className="w-9 h-9 rounded-full bg-[#5D6BDE] text-white flex items-center justify-center font-bold text-sm shadow-sm group-hover:scale-105 transition-transform overflow-hidden">
                            {managerAvatar ? (
                                <Image
                                    src={managerAvatar}
                                    alt="Profile"
                                    width={36}
                                    height={36}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                managerInitials
                            )}
                        </div>
                    </div>
                    {showLogout && (
                        <div className="absolute right-0 top-full mt-2 w-40 bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-slate-100 p-2 z-50">
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
    );
}
