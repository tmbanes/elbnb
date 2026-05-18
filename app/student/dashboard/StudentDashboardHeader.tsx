"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Bell, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { createActivityLog } from "@/services/activity_log";

interface StudentDashboardHeaderProps {
    user: any;
    initialNotifications: any[];
}

export function StudentDashboardHeader({ user, initialNotifications }: StudentDashboardHeaderProps) {
    const [showLogout, setShowLogout] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState(initialNotifications);
    const router = useRouter();
    const supabase = getSupabaseBrowserClient();

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

        if (user?.user_id) {
            await createActivityLog({
                p_user_id: user.user_id,
                p_action_type: "logout",
                p_log_desc: `${user.first_name} logged out `,
                p_entity_type: "auth",
                p_entity_id: user.user_id,
                p_user_role: user.role,
            });
        }

        await supabase.auth.signOut();
        setTimeout(() => {
            window.location.href = "/";
        }, 300);
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <header className="flex flex-col-reverse md:flex-row justify-between items-start md:items-center w-full mb-12 gap-4 relative z-50">
            <div className="flex items-center gap-4 w-full md:w-auto"></div>

            <div className="flex items-center gap-6 self-end md:self-auto">
                <div className="relative">
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="relative text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
                    >
                        <Bell className="w-5 h-5" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#A05C5C] text-white text-[9px] font-bold rounded-full ring-2 ring-[#FDFBF7] flex items-center justify-center">
                                {unreadCount}
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
                                                    <p className="text-[10px] text-slate-400 font-medium">{new Date(n.created_at || n.date_submitted || Date.now()).toLocaleDateString()}</p>
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
    );
}
