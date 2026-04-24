"use client";

import { useState, useEffect } from "react";
import { Resident } from "./types";
import { format } from "date-fns";


import {
  ArrowLeft,
  MapPin,
  Calendar,
  History,
  ArrowUpRight,
  LogOut,
  LogIn,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  ShieldAlert,
  CalendarArrowDown,
  CalendarArrowUp,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";


interface Props {
  resident: Resident;
  onAction: (id: string, action: string, date: string, details?: any) => void;
  onBack: () => void;
  isLoading?: boolean;
  showOverride?: boolean;
}

export default function ResidentDetail({
  resident,
  onAction,
  onBack,
  isLoading = false,
  showOverride = false
}: Props) {
  const [confirmingAction, setConfirmingAction] = useState<string | null>(null);
  const [actionDate, setActionDate] = useState(new Date().toISOString().split('T')[0]);
  const [overrideReason, setOverrideReason] = useState("");
  const [targetUnit, setTargetUnit] = useState("");
  const [isForced, setIsForced] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastTargetUnit, setLastTargetUnit] = useState("");

  // Reset confirmation state when resident changes
  useEffect(() => {
    setConfirmingAction(null);
    setOverrideReason("");
    setTargetUnit("");
    setIsForced(false);
    setActionDate(new Date().toISOString().split('T')[0]);
  }, [resident.assignment_id]);


  const isAwaiting = resident.assignment_status === "waiting_payment" || resident.assignment_status === "pending";
  const isActive = resident.assignment_status === "active";
  const isCompleted = resident.assignment_status === "completed";
  const isTerminated = resident.assignment_status === "terminated";
  const isCancelled = resident.assignment_status === "cancelled";
  const isCheckedOut = isCompleted || isTerminated || isCancelled;

  const statusMapping: Record<string, { label: string; style: string }> = {
    active: { label: "Active Stay", style: "bg-[#E7FAD3] text-[#78A24C]" },
    completed: { label: "Completed", style: "bg-[#E0F2FE] text-[#0369A1]" },
    cancelled: { label: "Cancelled", style: "bg-[#F3F4F6] text-[#6B7280]" },
    terminated: { label: "Terminated", style: "bg-[#FEF2F2] text-[#B91C1C]" },
    waiting_payment: { label: "Waiting Payment", style: "bg-[#FFF7ED] text-[#EA580C]" },
    pending: { label: "Pending Approval", style: "bg-[#EEF2FF] text-[#4F46E5]" },
  };

  const currentStatus = statusMapping[resident.assignment_status] || { label: resident.assignment_status, style: "bg-gray-100 text-gray-600" };

  const formatDate = (date: string | null | undefined) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">

      <div className="lg:hidden p-4 border-b border-[#e8e2d6]">
        <button onClick={onBack} className="flex items-center gap-2 text-[#264384] font-bold text-sm">
          <ArrowLeft className="w-4 h-4" />
          Back to Residents
        </button>
      </div>

      <div className="p-8 pb-4 space-y-4">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h1 className="text-3xl font-[family-name:var(--font-archivo-black)] text-[#44291B] tracking-tight">
              {resident.users.first_name} {resident.users.last_name}
            </h1>
            <p className="text-sm text-[#44291B]/60 font-medium">{resident.users.email}</p>
          </div>
        </div>

        <Card className="overflow-hidden border-[#e8e2d6] bg-[#FDFFF4] shadow-sm rounded-xl">
          <CardContent className="p-0">
            <div className="flex flex-col md:flex-row items-stretch">

              {/* Left Section: Room Info */}
              <div className="flex flex-1 gap-4 items-center px-4 py-3 border-b md:border-b-0 md:border-r border-[#e8e2d6]/60">
                <div>
                  <p className="text-[9px] text-[#44291B]/50 font-black uppercase tracking-[0.15em] mb-0.5">
                    Unit
                  </p>
                  <h2 className="text-lg font-[family-name:var(--font-archivo-black)] text-[#44291B] leading-none">
                    Rm {resident.unit.unit_number}
                  </h2>
                </div>
              </div>

              {/* Right Section: Dates */}
              <div className="flex items-center gap-5 px-4 py-3 bg-white/30">
                <div>
                  <p className="text-sm font-bold text-[#44291B] tabular-nums leading-none mt-2">
                    {formatDate(resident.move_in_date)}
                  </p>
                  <p className="text-[9px] text-[#44291B]/40 font-bold uppercase tracking-wider mt-1">
                    Move In
                  </p>
                </div>

                <Separator orientation="vertical" className="h-6 bg-[#e8e2d6]" />

                <div>
                  <p className="text-sm font-bold text-[#44291B] tabular-nums leading-none mt-2">
                    {formatDate(resident.expected_move_out_date)}
                  </p>
                  <p className="text-[9px] text-[#44291B]/40 font-bold uppercase tracking-wider mt-1">
                    Move Out
                  </p>
                </div>
              </div>

            </div>
          </CardContent>
        </Card>

        {/* Timeline / History */}
        <Card className="border-[#e8e2d6] bg-[#FDFFF4] shadow-sm rounded-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-[#44291B]">
              <History className="h-4 w-4" />
              <span className="font-bold text-sm uppercase tracking-widest">History</span>
            </CardTitle>
          </CardHeader>

          <CardContent>

            {/* Timeline Container */}
            <div className="relative pl-8 space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-[#e8e2d6]">

              {/* Event: Assigned */}
              <div className="relative flex items-start">

                <div className="absolute left-[-26px] top-1.5 h-3 w-3 rounded-full border-2 border-white bg-[#5591AB] shadow-sm z-10" />
                <div>
                  <p className="text-sm font-bold text-[#44291B] leading-none mb-1">Assigned</p>
                  <p className="text-xs text-[#44291B]/50 font-medium">
                    Room {resident.unit.unit_number} • {formatDate(resident.created_at)}
                  </p>
                </div>
              </div>

              {/* Event: Moved In */}
              {(isActive || isCheckedOut) && (
                <div className="relative flex items-start">
                  <div className="absolute left-[-26px] top-1.5 h-3 w-3 rounded-full border-2 border-white bg-[#78A24C] shadow-sm z-10" />
                  <div>
                    <p className="text-sm font-bold text-[#44291B] leading-none mb-1">Moved In</p>
                    <p className="text-xs text-[#44291B]/50 font-medium">
                      {formatDate(resident.move_in_date)}
                    </p>
                  </div>
                </div>
              )}

              {/* Event: Checked Out */}
              {isCheckedOut && (
                <div className="relative flex items-start">
                  <div className={cn(
                    "absolute left-[-26px] top-1.5 h-3 w-3 rounded-full border-2 border-white shadow-sm z-10",
                    isCompleted ? "bg-[#0369A1]" : isTerminated ? "bg-[#B91C1C]" : "bg-gray-400"
                  )} />
                  <div>
                    <p className="text-sm font-bold text-[#44291B] leading-none mb-1">
                      {isCompleted ? "Completed Stay" : isTerminated ? "Stay Terminated" : "Assignment Cancelled"}
                    </p>
                    <p className="text-xs text-[#44291B]/50 font-medium">
                      {formatDate(resident.actual_move_out_date || resident.expected_move_out_date)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Status Message & Actions */}
        <div className="pt-4 space-y-4">
          {confirmingAction ? (
            <div className={cn(
              "bg-[#FDFFF4] rounded-2xl p-6 shadow-xl animate-in zoom-in-95 duration-200 border",
              confirmingAction === "terminate" ? "border-[#DF3538]" :
                confirmingAction === "record-move-in" ? "border-[#78A24C]" :
                  "border-[#264384]"
            )}>
              <div className="flex items-center gap-3 mb-4">
                <div className={cn(
                  "h-10 w-10 rounded-full flex items-center justify-center",
                  confirmingAction === "override" ? "bg-amber-100 text-amber-700" :
                    confirmingAction === "terminate" ? "bg-[#FBB0B2]/20 text-[#DF3538]" :
                      confirmingAction === "record-move-in" ? "bg-[#E7FAD3] text-[#78A24C]" :
                        "bg-[#264384]/10 text-[#264384]"
                )}>
                  {confirmingAction === "record-move-in" ? <CalendarArrowDown className="w-5 h-5" /> :
                    confirmingAction === "override" ? <RefreshCw className="w-5 h-5" /> :
                      confirmingAction === "terminate" ? <ShieldAlert className="w-5 h-5" /> :
                        <CalendarArrowUp className="w-5 h-5" />}
                </div>
                <div>
                  <h4 className="font-bold text-[#44291B]">
                    {confirmingAction === "record-move-in" ? "Confirm Move-In" :
                      confirmingAction === "record-move-out" ? "Confirm Move-Out" :
                        confirmingAction === "override" ? "Admin Override: Transfer Resident" :
                          "Confirm Early Termination"}
                  </h4>
                  <p className="text-xs text-[#44291B]/60">
                    {confirmingAction === "override" ? "Move resident to a different unit." : "Please specify the date for this action."}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {confirmingAction === "override" ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-[#44291B] ml-1">Current Unit</label>
                        <div className="bg-gray-100 border border-[#e8e2d6] rounded-xl py-2.5 px-4 text-sm font-bold text-[#44291B]/50">
                          {resident.unit.unit_number}
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-[#44291B] ml-1">New Unit #</label>
                        <input
                          type="text"
                          value={targetUnit}
                          placeholder="e.g. 104-B"
                          onChange={(e) => setTargetUnit(e.target.value)}
                          className="w-full bg-[#F6F8D5]/30 border border-[#e8e2d6] rounded-xl py-2.5 px-4 text-sm font-bold text-[#44291B] outline-none focus:ring-2 focus:ring-[#264384]/10 focus:border-[#264384] transition-all"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#44291B]/40 ml-1">Effective Date</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full bg-[#FDFFF4] border border-[#e8e2d6] rounded-xl py-2.5 px-4 text-sm font-bold text-[#44291B] outline-none justify-start h-auto transition-all hover:bg-[#F6F8D5]/50",
                            !actionDate && "text-muted-foreground"
                          )}
                        >
                          <Calendar className="mr-2 h-4 w-4 text-[#44291B]/40" />
                          {actionDate ? format(new Date(actionDate), "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-[#FDFFF4] border-[#e8e2d6]" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={new Date(actionDate)}
                          onSelect={(date) => {
                            if (date) {
                              setActionDate(date.toISOString().split('T')[0]);
                            }
                          }}
                          initialFocus
                          className="bg-[#FDFFF4]"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                )}

                <div className="flex gap-2">
                  <Button
                    onClick={() => setConfirmingAction(null)}
                    variant="outline"
                    className="flex-1 border-[#e8e2d6] text-[#44291B]/60 font-bold h-11 rounded-xl"
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      const details = confirmingAction === "override" ? { targetUnit, reason: overrideReason, force: isForced } : undefined;
                      const isOverride = confirmingAction === "override";
                      const savedTarget = targetUnit;

                      onAction(resident.assignment_id, confirmingAction, actionDate, details);
                      setConfirmingAction(null);

                      if (isOverride) {
                        setLastTargetUnit(savedTarget);
                        setShowSuccessModal(true);
                      }
                    }}
                    className={cn(
                      "flex-[2] font-bold h-11 rounded-xl shadow-lg transition-all duration-200",
                      confirmingAction === "override"
                        ? (targetUnit
                          ? "bg-[#EB8A0B] hover:bg-[#EFC58F] text-white shadow-amber-600/20"
                          : "bg-[#44291B]/5 text-[#44291B]/30 shadow-none")
                        : confirmingAction === "terminate"
                          ? "bg-[#DF3538] hover:bg-[#B52A2D] text-white shadow-[#DF3538]/20"
                          : confirmingAction === "record-move-in"
                            ? "bg-[#78A24C] hover:bg-[#60833D] text-white shadow-[#78A24C]/20"
                            : "bg-[#264384] hover:bg-[#1a2d5a] text-white shadow-[#264384]/20"
                    )}
                    disabled={isLoading || (confirmingAction === "override" && !targetUnit)}
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> :
                      confirmingAction === "override" ? "Confirm Transfer" : "Confirm Action"}
                  </Button>
                </div>
              </div>
            </div>

          ) : (
            <>
              {/* STATUS-SPECIFIC MESSAGING & ACTIONS */}

              {resident.assignment_status === "pending" && (
                <div className="bg-[#EEF2FF] border border-[#4F46E5]/30 rounded-2xl p-6 space-y-4">
                  <div className="flex gap-3">
                    <Clock className="h-5 w-5 text-[#4F46E5] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-[#44291B]/80 text-sm">Awaiting Admin Approval</p>
                      <p className="text-xs text-[#44291B]/70 mt-1 leading-relaxed">
                        The assignment has been made by the Dorm Manager and is currently pending final application approval from the Admin.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {resident.assignment_status === "waiting_payment" && (
                <div className="bg-[#FFF7ED] border border-[#EA580C]/30 rounded-2xl p-6 space-y-4">
                  <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-[#EA580C] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-[#44291B]/80 text-sm">Approved & Awaiting Arrival</p>
                      <p className="text-xs text-[#44291B]/70 mt-1 leading-relaxed">
                        Resident has been approved. Record their physical arrival below to activate the stay.
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      setConfirmingAction("record-move-in");
                      setActionDate(new Date().toISOString().split('T')[0]);
                    }}
                    className="w-full bg-[#EB8A0B] hover:bg-[#B56C0D] text-white font-bold h-11 rounded-xl shadow-lg shadow-[#264384]/10"
                    disabled={isLoading}
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Record Physical Move-in"}
                  </Button>
                </div>
              )}

              {isActive && (
                <div className="space-y-4">
                  <div className="bg-[#E7FAD3] border border-[#78A24C] rounded-2xl p-6 flex gap-3">
                    <CheckCircle2 className="h-5 w-5 text-[#78A24C] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-[#44291B]/80 text-sm">Currently Active Stay</p>
                      <p className="text-xs text-[#44291B]/70 mt-1 leading-relaxed">
                        Resident is currently staying in Unit {resident.unit.unit_number}. Expected move-out: {formatDate(resident.expected_move_out_date)}.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={() => {
                        setConfirmingAction("record-move-out");
                        setActionDate(new Date().toISOString().split('T')[0]);
                      }}
                      variant="outline"
                      className="bg-[#FDFFF4] border-[#e8e2d6] text-[#44291B] font-bold h-11 rounded-xl shadow-sm hover:[#F3F5CB]"
                      disabled={isLoading}
                    >
                      <CalendarArrowUp className="w-4 h-4 mr-2" />
                      Move-out
                    </Button>
                    <Button
                      onClick={() => {
                        setConfirmingAction("terminate");
                        setActionDate(new Date().toISOString().split('T')[0]);
                      }}
                      variant="outline"
                      className="bg-[#FDFFF4] border-[#e8e2d6] text-[#DF3538] font-bold h-11 rounded-xl shadow-sm hover:bg-[#FBB0B2]/20 hover:text-[#DF3538]"
                      disabled={isLoading}
                    >
                      Terminate
                      <ShieldAlert className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {isCompleted && (
                <div className="bg-[#E0F2FE] border border-[#0369A1]/30 rounded-2xl p-6">
                  <div className="flex gap-3">
                    <CheckCircle2 className="h-5 w-5 text-[#0369A1] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-[#44291B]/80 text-sm">Stay Completed</p>
                      <p className="text-xs text-[#44291B]/70 mt-1 leading-relaxed">
                        The resident has successfully completed their stay and moved out on {formatDate(resident.actual_move_out_date)}.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {isTerminated && (
                <div className="bg-[#FEF2F2] border border-[#B91C1C]/30 rounded-2xl p-6">
                  <div className="flex gap-3">
                    <ShieldAlert className="h-5 w-5 text-[#B91C1C] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-[#B91C1C] text-sm">Stay Terminated</p>
                      <p className="text-xs text-[#B91C1C]/70 mt-1 leading-relaxed">
                        This stay was terminated by administration before the expected end date. Effective: {formatDate(resident.actual_move_out_date)}.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {isCancelled && (
                <div className="bg-[#F3F4F6] border border-gray-300 rounded-2xl p-6">
                  <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-gray-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-gray-700 text-sm">Assignment Cancelled</p>
                      <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                        The accommodation assignment was cancelled. This often happens automatically if payment is not received within the required timeframe.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {showOverride && isActive && (
                <Button
                  onClick={() => {
                    setConfirmingAction("override");
                    setTargetUnit("");
                    setOverrideReason("");
                    setIsForced(false);
                  }}
                  variant="ghost"
                  className="w-full text-amber-700 hover:text-amber-800 hover:bg-amber-50 font-bold text-xs flex items-center justify-center gap-2 border border-dashed border-amber-200 rounded-xl py-6"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Admin Override: Transfer to Different Unit
                </Button>
              )}
            </>
          )}
        </div>

      </div>

      {/* Decorative Footer Icon */}
      <div className="mt-auto p-8 flex justify-start">
        <div className="h-8 w-8 rounded-full border border-[#e8e2d6] flex items-center justify-center text-[#44291B]/20">
          <History className="h-4 w-4" />
        </div>
      </div>

      {/* Success Modal for Override */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md bg-[#FDFFF4] border-[#e8e2d6] rounded-3xl p-0 overflow-hidden">
          <div className="bg-[#78A24C] p-5 flex flex-col items-center justify-center text-white text-center">
            <DialogTitle className="text-2xl font-[family-name:var(--font-archivo-black)] tracking-tight">
              Transfer Successful!
            </DialogTitle>
            <p className="text-white/80 text-sm font-medium mt-2">
              The resident has been officially reassigned.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
