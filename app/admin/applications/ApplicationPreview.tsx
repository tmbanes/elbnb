"use client";

import { X, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ApplicationPreview({
  onClose,
}: {
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-6">

      {/* OUTER CONTAINER */}
      <div className="relative w-full h-full flex items-center justify-center">

        {/* CLOSE BUTTON (top-left of container) */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="absolute top-4 left-4 bg-white/80 backdrop-blur hover:bg-white shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </Button>

        {/* SCROLL WRAPPER */}
        <div className="w-full h-full overflow-auto flex items-center justify-center">

          {/* PAPER */}
          <div className="w-[130mm] h-full bg-white shadow-2xl rounded-sm">

            {/* DOCUMENT CONTENT */}
            <div className="p-10 text-sm text-black font-serif space-y-6">

              {/* HEADER */}
              <div className="text-center space-y-1">
                <h1 className="text-lg font-bold uppercase">
                  Dormitory Application Form
                </h1>
                <p className="text-xs text-gray-500">
                  University Housing Office
                </p>
              </div>

              <hr />

              {/* SECTION 1 */}
              <div className="space-y-2">
                <h2 className="font-bold text-sm">Personal Information</h2>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <p><b>Name:</b> Juan Dela Cruz</p>
                  <p><b>Student ID:</b> 2024-12345</p>
                  <p><b>Email:</b> juan@email.com</p>
                  <p><b>Course:</b> BS Computer Science</p>
                </div>
              </div>

              {/* SECTION 2 */}
              <div className="space-y-2">
                <h2 className="font-bold text-sm">Application Details</h2>
                <div className="grid grid-cols-2 gap-2 text-xs">
                    <p><b>Dorm:</b> Sampaguita Residence</p>
                    <p><b>Room Type:</b> Double Occupancy</p>
                    <p><b>Duration:</b> 6 Months</p>
                    <p><b>Check-in:</b> 2026-01-10</p>
                </div>
              </div>

              {/* SECTION 3 */}
              <div className="space-y-2">
                <h2 className="font-bold text-sm">Emergency Contact</h2>
                <div className="grid grid-cols-2 gap-2 text-xs">
                    <p><b>Name:</b> Maria Dela Cruz</p>
                    <p><b>Contact:</b> 0917-000-0000</p>
                </div>
              </div>

              {/* DECLARATION */}
              <div className="space-y-2 pt-4">
                <h2 className="font-bold text-sm">Declaration</h2>
                <p className="text-justify text-xs leading-relaxed">
                  I hereby certify that all information provided is true and correct.
                  I understand that any falsification may result in rejection of my application.
                </p>
              </div>

              {/* SIGNATURE */}
              <div className="pt-10">
                <div className="w-64 border-t border-black"></div>
                <p className="text-xs text-gray-500 mt-1">Applicant Signature</p>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}