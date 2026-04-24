"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Info, MapPin, DoorOpen, UploadCloud } from "lucide-react";

export function PaymentModal({
  applicationId,
  accommodation,
  unit,
}: {
  applicationId: string;
  accommodation: string;
  unit: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState("");

  const refreshPaymentDetails = async () => {
    if (!applicationId) return;
    try {
      const formData = new FormData();
      formData.append("applicationId", applicationId);
      formData.append("receiptFile", uploadFile);

      // Note: Make sure this endpoint matches your actual backend route for application payments
      const response = await fetch("/api/guest/applications/upload-receipt", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const [isLoadingDetails, setIsLoadingDetails] = useState(false);
        const [paymentDetails, setPaymentDetails] = useState<any>(null);
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || "Failed to upload receipt.");
      }

        const refreshPaymentDetails = async () => {
          if (!isOpen || !applicationId) return;

          setIsLoadingDetails(true);

          try {
            const response = await fetch(`/api/applications/payment-details?applicationId=${encodeURIComponent(applicationId)}`);
            const payload = await response.json().catch(() => ({}));

            if (!response.ok) {
              throw new Error(payload.error || "Failed to load billing details.");
            }

            setPaymentDetails(payload);
          } catch (error) {
            setPaymentDetails(null);
            console.error("Failed to load payment details:", error);
          } finally {
            setIsLoadingDetails(false);
          }
        };

        useEffect(() => {
          refreshPaymentDetails();
          // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [isOpen, applicationId]);

        const breakdownItems = useMemo(() => {
          return Array.isArray(paymentDetails?.breakdown) ? paymentDetails.breakdown : [];
        }, [paymentDetails]);

      setIsOpen(false);
      window.location.reload(); // Reload to update the grid status

    } catch (err: any) {
      setUploadError(err.message || "An error occurred while uploading.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset file state when modal closes/opens
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setUploadFile(null);
      setUploadError("");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button 
          className="w-full bg-[#78A24C] hover:bg-[#63853e] text-white font-bold text-xs py-2 rounded-lg shadow-sm transition-all"
        > 
          Proceed to Payment
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-[#FDFFF4] border-[#e8e2d6] sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-[#44291B] text-xl font-bold">
            Payment Details
          </DialogTitle>
          <DialogDescription className="text-[#44291B]/70">
            Please review your assignment and settle the fees to secure your spot.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2 space-y-4">
          {/* Accommodation Summary */}
          <div className="space-y-2">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#44291B]/50">Accommodation Summary</h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 p-3 bg-white border border-[#e8e2d6] rounded-lg">
                <MapPin className="w-4 h-4 text-[#264384]" />
                <div className="overflow-hidden">
                  <p className="text-[10px] text-[#44291B]/50 leading-none mb-1">Dormitory</p>
                  <p className="text-sm font-bold text-[#44291B] truncate">{accommodation}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-white border border-[#e8e2d6] rounded-lg">
                <DoorOpen className="w-4 h-4 text-[#264384]" />
                <div>
                  <p className="text-[10px] text-[#44291B]/50 leading-none mb-1">Unit / Room</p>
                  <p className="text-sm font-bold text-[#44291B]">{unit}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Fees Breakdown Box */}
          <div className="space-y-2">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#44291B]/50">Fees Breakdown</h4>
            <div className="bg-[#F6F8D5] p-4 rounded-lg border border-[#e8e2d6] space-y-2">
              {isLoadingDetails ? (
                <div className="text-sm text-slate-500">Loading invoice breakdown...</div>
              ) : breakdownItems.length > 0 ? (
                breakdownItems.map((item: any, index: number) => (
                  <div key={`${item.label}-${index}`} className="flex justify-between text-sm">
                    <span className="text-[#44291B]/60 capitalize">{String(item.label || "Item").replace(/_/g, " ")}</span>
                    <span className="font-bold text-[#44291B]">₱{Number(item.amount || 0).toLocaleString()}</span>
                  </div>
                ))
              ) : (
                <div className="text-sm text-slate-500">No invoice breakdown found yet.</div>
              )}
              <div className="border-t border-[#e8e2d6] pt-2 flex justify-between font-bold text-[#264384] text-lg">
                <span>Total Due:</span>
                <span>₱{Number(paymentDetails?.summary?.total || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {paymentDetails?.receiptPreviewUrl ? (
            <div className="space-y-2">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#44291B]/50">Uploaded Receipt</h4>
              <div className="rounded-xl border border-slate-200 bg-white p-3 flex items-center gap-3">
                <img src={paymentDetails.receiptPreviewUrl} alt="Uploaded receipt preview" className="w-14 h-14 object-cover rounded-md border border-slate-200" />
                <div className="text-xs text-slate-600">
                  A receipt already exists for this invoice. You can review or cancel it from the Billing page.
                </div>
              </div>
            </div>
          ) : null}

          {/* --- UPLOAD RECEIPT SECTION --- */}
          <div className="space-y-2">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#44291B]/50">Proof of Payment</h4>
            <div className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50/40 p-4">
              <div className="flex flex-col gap-3">
                <div className="text-xs text-slate-600">
                  Please upload a clear photo of your transaction receipt. Supports JPG, JPEG, PDF.
                </div>
                <input
                  type="file"
                  accept=".jpg, .jpeg, .pdf" // OR ".jpg, .jpeg, .pdf, image/jpeg, application/pdf" for maximum compatibility
                  disabled={isProcessing}
                  onChange={(e) => {
                    setUploadFile(e.target.files?.[0] || null);
                    setUploadError(""); // Clear any previous errors on change
                  }}
                  className="block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-white file:text-slate-700 hover:file:bg-slate-50 transition disabled:opacity-50"
                />
                {uploadError && <div className="text-xs text-red-600 font-medium">{uploadError}</div>}
              </div>
            </div>
          </div>

          {/* Alert/Notice */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-md border border-blue-100">
            <Info className="w-4 h-4 text-[#264384] mt-0.5 shrink-0" />
            <p className="text-[11px] text-[#264384]/80 leading-tight">
              Confirmation of payment will automatically update your status. Please do not close the window until the transaction is finished.
            </p>
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-0 mt-2">
          <Button 
            variant="ghost" 
            onClick={() => setIsOpen(false)}
            className="text-[#44291B]/60 hover:text-[#44291B] hover:bg-gray-100"
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button 
            onClick={handlePayment}
            className="bg-[#264384] hover:bg-[#1e3569] text-white px-8 font-bold"
            disabled={isProcessing || !uploadFile}
          >
            {isProcessing ? (
               <span className="inline-flex items-center gap-2">
                 <UploadCloud className="size-4 animate-bounce" /> Uploading...
               </span>
            ) : "Confirm & Pay"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}