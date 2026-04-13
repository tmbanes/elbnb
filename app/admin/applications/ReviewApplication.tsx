"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function ReviewApplication({
  onClose,
}: {
  onClose: () => void;
}) {
  return (
    <div className="p-6 bg-[#F6F8D5] min-h-screen text-[#44291B]">

      {/* HEADER */}
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          onClick={onClose}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>

        <h1 className="text-2xl font-bold">
          Review Application
        </h1>
      </div>

      {/* TEMP CONTENT */}
      <div className="bg-white border border-[#e8e2d6] rounded-md p-6 shadow-sm">
        <p className="text-sm text-gray-600">
          Application review page placeholder.
        </p>
      </div>

    </div>
  );
}