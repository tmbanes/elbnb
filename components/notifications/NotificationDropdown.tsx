import React, { useState, useEffect, useRef } from "react";
import { 
  Bell, FileText, CheckCircle, XCircle, CreditCard, 
  Building, User, Folder, Key, BarChart, Info 
} from "lucide-react";
import { useRouter } from "next/navigation";

// 1. Database Interfaces
export interface DBUser {
  user_id: string;
  first_name: string;
  last_name: string;
  role: string;
}

export interface AppNotification {
  log_id: string;
  user_id: string;
  user_role: string;
  timestamp: string;
  action_type: string;
  log_desc: string;
  entity_type: string;
  entity_id: string;
  isRead: boolean;
}

interface NotificationDropdownProps {
  user: DBUser;
}

export default function NotificationDropdown({ user }: NotificationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- REFINED MOCK DATA ---
  const [notifications, setNotifications] = useState<AppNotification[]>([
    {
      log_id: "log-001",
      user_id: user.user_id,
      user_role: user.role,
      timestamp: "JUST NOW", 
      action_type: "approve_application", 
      log_desc: "Congratulations! Your application for Makiling Residence Hall has been approved.", 
      entity_type: "application", // Matching your new categories
      entity_id: "app-882",
      isRead: false
    },
    {
      log_id: "log-002",
      user_id: user.user_id,
      user_role: user.role,
      timestamp: "10 MINS AGO", 
      action_type: "generate_billing", 
      log_desc: "Your monthly invoice for October (₱1,240.50) has been generated.", 
      entity_type: "billing",
      entity_id: "inv-104",
      isRead: false
    },
    {
      log_id: "log-003",
      user_id: user.user_id,
      user_role: user.role,
      timestamp: "2 HOURS AGO", 
      action_type: "screen_application", 
      log_desc: "Your application is currently being screened by the dorm manager.", 
      entity_type: "application",
      entity_id: "app-882",
      isRead: false
    },
    {
      log_id: "log-004",
      user_id: user.user_id,
      user_role: user.role,
      timestamp: "1 DAY AGO", 
      action_type: "create_assignment", 
      log_desc: "You have been officially assigned to Room 302, Bed A.", 
      entity_type: "assignment",
      entity_id: "ast-302",
      isRead: true
    },
    {
      log_id: "log-005",
      user_id: user.user_id,
      user_role: user.role,
      timestamp: "2 DAYS AGO", 
      action_type: "mark_billing_paid", 
      log_desc: "Payment of ₱800.00 received. Thank you!", 
      entity_type: "billing",
      entity_id: "inv-099",
      isRead: true
    },
    {
      log_id: "log-006",
      user_id: user.user_id,
      user_role: user.role,
      timestamp: "3 DAYS AGO", 
      action_type: "reject_application", 
      log_desc: "We regret to inform you that your application for Men's Residence Hall was not approved.", 
      entity_type: "application",
      entity_id: "app-711",
      isRead: true
    },
    {
      log_id: "log-008",
      user_id: user.user_id,
      user_role: user.role,
      timestamp: "LAST WEEK", 
      action_type: "update_accomm", 
      log_desc: "Maintenance notice: Water interruption scheduled for Makiling Hall.", 
      entity_type: "accommodation",
      entity_id: "mkl-01",
      isRead: true
    }
  ]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAllAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  // --- STYLING HELPER ---
  const getNotificationStyle = (type: string) => {
    let title = "";
    switch (type) {
      // Applications
      case "approve_application": title = "Application Approved"; break;
      case "reject_application": title = "Application Status Update"; break;
      case "screen_application": title = "Application Under Review"; break;
      case "submit_application": title = "Application Submitted"; break;
      
      // Billing
      case "generate_billing": title = "New Billing Statement"; break;
      case "mark_billing_paid": title = "Payment Received"; break;
      case "update_billing": title = "Billing Update"; break;
      
      // Assignments
      case "create_assignment": title = "New Room Assignment"; break;
      case "reassign_assignment": title = "Room Reassignment"; break;
      case "terminate_assignment": title = "Assignment Terminated"; break;
      case "assignment_paid": title = "Assignment Fee Paid"; break;
            
      default:
        title = type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    
    let Icon = Info;
    let colors = "bg-slate-100 text-slate-600 group-hover:bg-slate-200";

    if (type.includes("approve") || type.includes("accept") || type === "assignment_paid" || type === "mark_billing_paid") {
       Icon = CheckCircle;
       colors = "bg-[#668E42]/15 text-[#557F44] group-hover:bg-[#668E42]/25"; 
    } 
    else if (type.includes("reject") || type.includes("cancel") || type.includes("terminate") || type.includes("delete") || type.includes("deactivate")) {
       Icon = XCircle;
       colors = "bg-[#D03027]/15 text-[#D03027] group-hover:bg-[#D03027]/25"; 
    } 
    else if (type.includes("billing")) {
       Icon = CreditCard;
       colors = "bg-[#6492A7]/15 text-[#4f7b8f] group-hover:bg-[#6492A7]/25"; 
    } else if (type.includes("application")) {
       Icon = FileText;
       colors = "bg-sky-100 text-sky-700 group-hover:bg-sky-200";
    } else if (type.includes("assignment")) {
       Icon = Key;
       colors = "bg-indigo-100 text-indigo-700 group-hover:bg-indigo-200";
    } else if (type.includes("accomm")) {
       Icon = Building;
       colors = "bg-emerald-100 text-emerald-700 group-hover:bg-emerald-200";
    } else if (type.includes("user") || type === "login" || type === "logout") {
       Icon = User;
       colors = "bg-slate-200 text-slate-700 group-hover:bg-slate-300";
    } else if (type.includes("report")) {
       Icon = BarChart;
       colors = "bg-purple-100 text-purple-700 group-hover:bg-purple-200";
    }

    return { title, Icon, colors };
  };

  // --- ROUTING HELPER ---
  const handleNotificationClick = (notification: AppNotification) => {
    setNotifications(prev => prev.map(n => n.log_id === notification.log_id ? { ...n, isRead: true } : n));
    setIsOpen(false);

    const type = notification.entity_type;
    let role = notification.user_role;
    if(role=="housing_admin") role = "admin"; 
    if(role=="dorm_manager") role = "manager"; 

    switch (type) {
      case "accommodation":
        router.push(`/${role}/accommodations/`);
        break;
      case "billing":
        router.push(`/${role}/application/${id}`);
        break;
      case "assignment":
        router.push(`/${role}/applications/`);
        break;
      case "auth":
      case "user":
      default:
        router.push(`/dashboard`);
    }
  };

  return (
    <div className="relative z-50" ref={dropdownRef}>
      
      {/* TRIGGER BUTTON */}
      <button onClick={() => setIsOpen(!isOpen)} className="relative text-slate-700 hover:text-slate-900 transition-colors">
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#D03027] rounded-full ring-2 ring-[#FDFBF7]"></span>}
      </button>

      {/* DROPDOWN MENU */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-3 w-72 sm:w-[360px] bg-white rounded-xl shadow-[0_4px_25px_rgba(0,0,0,0.1)] border border-slate-100 overflow-hidden origin-top-right animate-in fade-in zoom-in-95 duration-150">
          
          <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50/50">
            <h4 className="text-[13px] font-extrabold text-slate-900">Notifications {unreadCount > 0 && `(${unreadCount})`}</h4>
            <button onClick={markAllAsRead} className="text-[10px] font-bold text-[#668E42] hover:text-[#557F44] transition-colors">Mark all read</button>
          </div>

          <div className="max-h-[380px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs font-medium">You're all caught up!</div>
            ) : (
              notifications.map((notif) => {
                const { title, Icon, colors } = getNotificationStyle(notif.action_type);

                return (
                  <div 
                    key={notif.log_id} 
                    onClick={() => handleNotificationClick(notif)} 
                    className={`p-4 border-b border-slate-50 transition-colors cursor-pointer flex gap-3.5 group ${!notif.isRead ? 'bg-slate-50/50 hover:bg-slate-100' : 'opacity-70 hover:opacity-100 bg-white hover:bg-slate-50'}`}
                  >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${colors}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    
                    <div className="flex-1 pr-2">
                      <p className="text-[13px] font-bold text-slate-900 mb-0.5 leading-tight">{title}</p>
                      <p className="text-[11px] font-medium text-slate-500 leading-snug mb-1.5">{notif.log_desc}</p>
                      <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">{notif.timestamp}</p>
                    </div>

                    {!notif.isRead && <div className="w-2 h-2 rounded-full bg-[#6492A7] mt-1.5 flex-shrink-0"></div>}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}