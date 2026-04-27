"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Archivo } from "next/font/google";
import {
  Bell, CheckCircle, XCircle, CreditCard, FileText,
  Key, Building, User, BarChart, Info, ArrowLeft,
  CheckCheck, Filter, Clock, Search
} from "lucide-react";

const archivo = Archivo({ subsets: ["latin"] });

interface Notification {
  id: string;
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
  type: string;
  link?: string;
}

interface NotificationsPageUIProps {
  initialNotifications: Notification[];
  role: "student" | "guest" | "admin" | "manager";
  backHref: string;
}

// Color theme per role
const roleTheme = {
  student: { accent: "#668E42", accentDark: "#557F44", accentLight: "#F6F8D5", badge: "bg-[#668E42]/10 text-[#557F44]", dot: "bg-[#668E42]", hover: "hover:text-[#668E42]" },
  guest:   { accent: "#6492A7", accentDark: "#4f7b8f", accentLight: "#F6F8D5", badge: "bg-[#6492A7]/10 text-[#4f7b8f]", dot: "bg-[#6492A7]", hover: "hover:text-[#6492A7]" },
  admin:   { accent: "#78A24C", accentDark: "#5C7E3A", accentLight: "#FDFFF4", badge: "bg-[#78A24C]/10 text-[#5C7E3A]", dot: "bg-[#78A24C]", hover: "hover:text-[#78A24C]" },
  manager: { accent: "#5D6BDE", accentDark: "#4A57C8", accentLight: "#F6F8D5", badge: "bg-[#5D6BDE]/10 text-[#4A57C8]", dot: "bg-[#5D6BDE]", hover: "hover:text-[#5D6BDE]" },
};

const getIconStyle = (type: string, actionType?: string) => {
  const t = (actionType || type || "").toLowerCase();
  if (t.includes("approve") || t.includes("accept") || t.includes("paid")) {
    return { Icon: CheckCircle, colors: "bg-[#668E42]/15 text-[#557F44]" };
  }
  if (t.includes("reject") || t.includes("cancel") || t.includes("terminate") || t.includes("delete")) {
    return { Icon: XCircle, colors: "bg-[#D03027]/15 text-[#D03027]" };
  }
  if (t.includes("billing") || t.includes("payment")) {
    return { Icon: CreditCard, colors: "bg-[#6492A7]/15 text-[#4f7b8f]" };
  }
  if (t.includes("application") || t.includes("submission") || t.includes("screen") || t.includes("screen")) {
    return { Icon: FileText, colors: "bg-sky-100 text-sky-700" };
  }
  if (t.includes("assignment")) {
    return { Icon: Key, colors: "bg-indigo-100 text-indigo-700" };
  }
  if (t.includes("accommodation") || t.includes("accomm")) {
    return { Icon: Building, colors: "bg-emerald-100 text-emerald-700" };
  }
  if (t.includes("user") || t.includes("login") || t.includes("logout")) {
    return { Icon: User, colors: "bg-slate-100 text-slate-600" };
  }
  if (t.includes("report")) {
    return { Icon: BarChart, colors: "bg-purple-100 text-purple-700" };
  }
  return { Icon: Info, colors: "bg-slate-100 text-slate-600" };
};

const formatRelativeTime = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
};

type FilterTab = "all" | "unread" | "read";

export default function NotificationsPageUI({ initialNotifications, role, backHref }: NotificationsPageUIProps) {
  const router = useRouter();
  const theme = roleTheme[role];

  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");

  // Sync read state from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const readIds = JSON.parse(localStorage.getItem("read_notifications") || "[]");
      setNotifications(
        initialNotifications.map((n) => ({
          ...n,
          is_read: n.is_read || readIds.includes(n.id),
        }))
      );
    }
  }, [initialNotifications]);

  const markAllAsRead = () => {
    if (typeof window !== "undefined") {
      const existing = JSON.parse(localStorage.getItem("read_notifications") || "[]");
      const allIds = Array.from(new Set([...existing, ...notifications.map((n) => n.id)]));
      localStorage.setItem("read_notifications", JSON.stringify(allIds));
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const markOneAsRead = (id: string) => {
    if (typeof window !== "undefined") {
      const existing = JSON.parse(localStorage.getItem("read_notifications") || "[]");
      if (!existing.includes(id)) {
        localStorage.setItem("read_notifications", JSON.stringify([...existing, id]));
      }
    }
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  const handleClick = (n: Notification) => {
    markOneAsRead(n.id);
    if (n.link) router.push(n.link);
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const filtered = notifications.filter((n) => {
    const matchesTab =
      filter === "all" ? true : filter === "unread" ? !n.is_read : n.is_read;
    const q = search.toLowerCase();
    const matchesSearch =
      !q || n.title.toLowerCase().includes(q) || n.message.toLowerCase().includes(q);
    return matchesTab && matchesSearch;
  });

  return (
    <div className={`min-h-screen bg-[#F6F8D5] ${archivo.className}`}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* ── Back Button ── */}
        <button
          onClick={() => router.push(backHref)}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span className="text-[13px] font-bold uppercase tracking-widest">Back to Dashboard</span>
        </button>

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-5 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ backgroundColor: theme.accent + "20" }}>
                <Bell className="w-5 h-5" style={{ color: theme.accent }} />
              </div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Notifications</h1>
            </div>
            <p className="text-[13px] text-slate-500 font-medium ml-[52px]">
              {unreadCount > 0 ? (
                <span>You have <span className="font-bold" style={{ color: theme.accent }}>{unreadCount} unread</span> notification{unreadCount !== 1 ? "s" : ""}</span>
              ) : (
                "All caught up! No unread notifications."
              )}
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-2 text-[12px] font-bold px-4 py-2.5 rounded-xl border transition-all hover:shadow-sm active:scale-[0.98]"
              style={{ color: theme.accent, borderColor: theme.accent + "40", backgroundColor: theme.accent + "10" }}
            >
              <CheckCheck className="w-4 h-4" />
              Mark all as read
            </button>
          )}
        </div>

        {/* ── Search + Filter Bar ── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-4 mb-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 rounded-xl border border-slate-100 text-[13px] font-medium text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-slate-200 transition-all"
            />
          </div>

          <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
            {(["all", "unread", "read"] as FilterTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-4 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all ${
                  filter === tab
                    ? "bg-white shadow-sm text-slate-900"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {tab}
                {tab === "unread" && unreadCount > 0 && (
                  <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-white text-[9px] font-black" style={{ backgroundColor: theme.accent }}>
                    {unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Notification List ── */}
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] py-20 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell className="w-7 h-7 text-slate-300" />
              </div>
              <p className="text-slate-500 font-bold text-sm mb-1">No notifications found</p>
              <p className="text-slate-400 text-xs">
                {filter !== "all" ? `Try switching to "All" to see everything.` : "You're all caught up!"}
              </p>
            </div>
          ) : (
            filtered.map((notif, i) => {
              const { Icon, colors } = getIconStyle(notif.type, notif.title);
              const isClickable = !!notif.link;

              return (
                <div
                  key={notif.id}
                  onClick={() => isClickable && handleClick(notif)}
                  className={`bg-white rounded-2xl border transition-all duration-200 flex gap-4 p-5 group relative overflow-hidden ${
                    !notif.is_read
                      ? "border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.06)]"
                      : "border-slate-50 shadow-[0_1px_4px_rgba(0,0,0,0.03)] opacity-70"
                  } ${isClickable ? "cursor-pointer hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:-translate-y-0.5" : "cursor-default"}`}
                >
                  {/* Unread accent stripe */}
                  {!notif.is_read && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ backgroundColor: theme.accent }} />
                  )}

                  {/* Icon */}
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors ${colors}`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-3 mb-1">
                      <p className={`text-[14px] font-bold leading-snug transition-colors ${
                        !notif.is_read ? "text-slate-900" : "text-slate-600"
                      } ${isClickable ? `group-hover:` + theme.hover.replace("hover:", "") : ""}`}>
                        {notif.title}
                      </p>
                      <div className="flex items-center gap-2 shrink-0">
                        {!notif.is_read && (
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: theme.accent }} />
                        )}
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatRelativeTime(notif.created_at)}
                        </span>
                      </div>
                    </div>

                    <p className="text-[12px] text-slate-500 leading-relaxed mb-2">{notif.message}</p>

                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${theme.badge}`}>
                        {notif.type || "general"}
                      </span>
                      {isClickable && (
                        <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-600 transition-colors">
                          Click to view →
                        </span>
                      )}
                      {!notif.is_read && (
                        <button
                          onClick={(e) => { e.stopPropagation(); markOneAsRead(notif.id); }}
                          className="ml-auto text-[10px] font-bold text-slate-400 hover:text-slate-700 transition-colors uppercase tracking-wider"
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ── Summary Footer ── */}
        {filtered.length > 0 && (
          <div className="mt-8 text-center">
            <p className="text-[12px] text-slate-400 font-medium">
              Showing <span className="font-bold text-slate-600">{filtered.length}</span> of{" "}
              <span className="font-bold text-slate-600">{notifications.length}</span> notifications
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
