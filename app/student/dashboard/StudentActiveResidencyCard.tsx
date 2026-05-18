"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Building2, Calendar, CheckCircle2, AlertCircle, X, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { submitExtensionRequest } from "./actions";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface StudentActiveResidencyCardProps {
    user: any;
    currentResidency: any;
}

export function StudentActiveResidencyCard({ user, currentResidency }: StudentActiveResidencyCardProps) {
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [showSuccessToast, setShowSuccessToast] = useState(false);
    const [isSubmittingExtension, setIsSubmittingExtension] = useState(false);
    const router = useRouter();

    const dormName = currentResidency?.unit?.accommodation?.name || "No Active Residency";
    const dormAddress = currentResidency?.unit?.accommodation?.location || "No location details available yet";
    const roomNumber = currentResidency?.unit?.unit_number ? `Room ${currentResidency.unit.unit_number}` : "";
    const checkInDate = currentResidency?.move_in_date ? new Date(currentResidency.move_in_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "Not yet scheduled";
    const status = currentResidency?.assignment_status ? (currentResidency.assignment_status.charAt(0).toUpperCase() + currentResidency.assignment_status.slice(1).replace('_', ' ')) : "No active residency yet";
    const unitType = currentResidency?.unit?.unit_type ? (currentResidency.unit.unit_type.charAt(0).toUpperCase() + currentResidency.unit.unit_type.slice(1)) : "No unit assigned yet";

    const renewalStart = currentResidency?.unit?.accommodation?.renewal_start_date;
    const renewalEnd = currentResidency?.unit?.accommodation?.renewal_end_date;

    const formatDate = (dateStr: string) => {
        if (!dateStr) return "TBD";
        return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    };

    const today = new Date();
    const isInRenewalPeriod = renewalStart && renewalEnd &&
        today >= new Date(renewalStart) &&
        today <= new Date(renewalEnd);

    const isRenewalAvailable = isInRenewalPeriod;

    const handleConfirmExtension = async () => {
        if (!user?.user_id || !currentResidency) return;

        setIsSubmittingExtension(true);
        try {
            const result = await submitExtensionRequest(user.user_id, currentResidency);
            if (!result.success) throw new Error(result.error);

            setIsConfirmModalOpen(false);
            setShowSuccessToast(true);
            setTimeout(() => setShowSuccessToast(false), 5000);
        } catch (err: any) {
            console.error("Failed to submit extension:", err);
            alert(`Failed to submit extension: ${err.message}`);
        } finally {
            setIsSubmittingExtension(false);
        }
    };

    return (
        <>
            {/* SUCCESS TOAST */}
            {showSuccessToast && (
                <div className="fixed top-8 right-8 z-[100] animate-in slide-in-from-right-10 duration-500">
                    <div className="bg-white border-l-4 border-emerald-500 shadow-2xl rounded-xl p-4 flex items-center gap-4 max-w-md">
                        <div className="bg-emerald-100 p-2 rounded-full">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <p className="font-bold text-slate-900 text-sm">Extension Submitted!</p>
                            <p className="text-slate-500 text-xs">Your request to extend stay has been sent for processing.</p>
                        </div>
                        <button onClick={() => setShowSuccessToast(false)} className="text-slate-400 hover:text-slate-600 ml-2">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            <div className="lg:col-span-2 bg-white rounded-[24px] p-6 md:p-8 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-[#eef1d6] relative overflow-hidden flex flex-col justify-between min-h-[340px]">
                <div>
                    <div className="flex justify-between items-start mb-6">
                        <span className="bg-[#668E42] text-white text-[10px] font-bold px-3 py-1.5 rounded-[12px] uppercase tracking-wider">
                            Current Accommodation
                        </span>
                        <Building2 className="w-6 h-6 text-[#8BAE90] stroke-[1.5]" />
                    </div>

                    {currentResidency?.unit?.accommodation?.image && (
                        <div className="absolute inset-0 z-0 opacity-10">
                            <Image
                                src={currentResidency.unit.accommodation.image}
                                alt="Background"
                                fill
                                className="object-cover"
                            />
                        </div>
                    )}

                    <h2 className="text-2xl md:text-[28px] font-bold text-[#2A3F2D] mb-1 leading-tight">
                        {dormName}{roomNumber ? `, ${roomNumber}` : ""}
                    </h2>
                    <p className="text-[13px] font-medium text-slate-500 mb-8 max-w-[80%]">
                        {dormAddress}
                    </p>
                </div>

                {dormName !== "No Active Residency" ? (
                    <>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4 w-full">
                            <div className="bg-[#F6F8D5]/60 rounded-[14px] p-4 flex flex-col justify-center border border-[#eef1d6]">
                                <p className="text-[9px] font-extrabold text-[#709849] uppercase tracking-widest mb-1">Check-in</p>
                                <p className="text-[15px] font-bold text-slate-900">{checkInDate}</p>
                            </div>
                            <div className="bg-[#F6F8D5]/60 rounded-[14px] p-4 flex flex-col justify-center border border-[#eef1d6]">
                                <p className="text-[9px] font-extrabold text-[#709849] uppercase tracking-widest mb-1">Status</p>
                                <p className="text-[15px] font-bold text-slate-900">{status}</p>
                            </div>
                            <div className="bg-[#F6F8D5]/60 rounded-[14px] p-4 flex flex-col justify-center border border-[#eef1d6] sm:col-span-1 col-span-2">
                                <p className="text-[9px] font-extrabold text-[#709849] uppercase tracking-widest mb-1">Unit Type</p>
                                <p className="text-[15px] font-bold text-slate-900">{unitType}</p>
                            </div>
                        </div>

                        {/* RENEWAL / EXTEND STAY BUTTON - BOTTOM RIGHT */}
                        <div className="mt-8 flex justify-end">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="w-full md:w-auto">
                                            <Button
                                                disabled={!isRenewalAvailable || isSubmittingExtension}
                                                onClick={() => setIsConfirmModalOpen(true)}
                                                className={`w-full md:w-auto h-auto py-3 px-8 rounded-2xl font-bold text-[12px] transition-all flex items-center justify-center gap-2 shadow-lg ${isRenewalAvailable
                                                    ? 'bg-[#668E42] hover:bg-[#557F44] text-white shadow-[#668E42]/10 active:scale-[0.98]'
                                                    : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none'
                                                    }`}
                                            >
                                                <Calendar className="w-4 h-4" />
                                                {isSubmittingExtension ? "Submitting..." : "Extend Stay"}
                                            </Button>
                                        </div>
                                    </TooltipTrigger>
                                    {!isRenewalAvailable && (
                                        <TooltipContent className="bg-slate-800 text-white border-none p-3 rounded-xl shadow-xl max-w-[250px]">
                                            <div className="flex items-start gap-2">
                                                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                                                <p className="text-[11px] font-medium leading-relaxed">
                                                    Accommodation renewal can only be accessed during the renewal period:
                                                    <span className="block mt-1 font-bold text-white">
                                                        {formatDate(renewalStart)} – {formatDate(renewalEnd)}
                                                    </span>
                                                </p>
                                            </div>
                                        </TooltipContent>
                                    )}
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    </>
                ) : (
                    <div className="mt-auto pt-6">
                        <div className="bg-[#F8F9EC]/80 rounded-[18px] p-5 flex flex-col md:flex-row items-start md:items-center justify-between border border-[#eef1d6] gap-5">
                            <div className="flex items-start md:items-center gap-4">
                                <p className="text-[13px] text-slate-600 font-medium italic leading-relaxed max-w-[90%]">
                                    You are not currently assigned to any accommodation. Browse our available options to find your next stay.
                                </p>
                            </div>
                            <Button
                                onClick={() => router.push("/student/accommodations")}
                                className="group shrink-0 w-full md:w-auto h-auto py-3 px-6 rounded-xl font-bold text-[12px] bg-[#668E42] hover:bg-[#557F44] text-white flex items-center justify-center gap-2 shadow-sm transition-all hover:-translate-y-0.5 active:scale-[0.98] border-none outline-none"
                            >
                                Browse Options <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* CONFIRMATION MODAL */}
            <Dialog open={isConfirmModalOpen} onOpenChange={setIsConfirmModalOpen}>
                <DialogContent className="max-w-md bg-white rounded-3xl p-8 border-none shadow-2xl">
                    <DialogHeader>
                        <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4 border border-emerald-100">
                            <Calendar className="w-7 h-7 text-emerald-600" />
                        </div>
                        <DialogTitle className="text-2xl font-extrabold text-slate-900 tracking-tight">Confirm Extension of Stay</DialogTitle>
                        <DialogDescription className="text-slate-500 text-[15px] font-medium leading-relaxed pt-2">
                            By confirming, you are applying to extend your stay for the next semester. Please ensure your records and documents are updated to avoid delays in processing.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-8 gap-3 sm:flex-row flex-col">
                        <Button
                            variant="outline"
                            disabled={isSubmittingExtension}
                            onClick={() => setIsConfirmModalOpen(false)}
                            className="flex-1 py-6 rounded-2xl border-slate-200 text-slate-600 font-bold text-[13px] hover:bg-slate-50"
                        >
                            Cancel
                        </Button>
                        <Button
                            disabled={isSubmittingExtension}
                            onClick={handleConfirmExtension}
                            className="flex-1 py-6 rounded-2xl bg-[#668E42] hover:bg-[#557F44] text-white font-bold text-[13px] shadow-lg shadow-[#668E42]/20"
                        >
                            {isSubmittingExtension ? "Processing..." : "Confirm Extension"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
