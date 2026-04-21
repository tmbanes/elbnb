"use client";

import { useState } from "react";
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
import { Info, MapPin, DoorOpen } from "lucide-react"; // Added icons for the summary

export function PaymentModal({ 
  applicationId, 
  accommodation, 
  unit 
}: { 
  applicationId: string; 
  accommodation: string; 
  unit: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = async () => {
    setIsProcessing(true);
    // Add your payment integration logic here
    setTimeout(() => {
      setIsProcessing(false);
      setIsOpen(false);
    }, 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
          {/* --- NEW ACCOMMODATION SUMMARY SECTION --- */}
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

          {/* Payment Summary Box */}
          <div className="space-y-2">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#44291B]/50">Fees Breakdown</h4>
            <div className="bg-[#F6F8D5] p-4 rounded-lg border border-[#e8e2d6] space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[#44291B]/60">Reservation Fee:</span>
                <span className="font-bold text-[#44291B]">₱1,000.00</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#44291B]/60">Security Deposit:</span>
                <span className="font-bold text-[#44291B]">₱2,000.00</span>
              </div>
              <div className="border-t border-[#e8e2d6] pt-2 flex justify-between font-bold text-[#264384] text-lg">
                <span>Total Due:</span>
                <span>₱3,000.00</span>
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
            disabled={isProcessing}
          >
            {isProcessing ? "Connecting..." : "Confirm & Pay"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}