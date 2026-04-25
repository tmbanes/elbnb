"use client";

import Modal from "./Modal";
import { Badge } from "@/components/ui/badge";
import { User, Users, Banknote, Armchair, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { Unit } from "@/types/housing/types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  unit: Unit | null;
  accentColor?: string;
}

export default function ViewUnitModal({ isOpen, onClose, unit, accentColor = "#264384" }: Props) {
  if (!unit) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Unit ${unit.unit_number} Details`}
      description="View complete information for this unit"
    >
      <div className="space-y-6">

        {/* Unit Summary Header */}
        <div className={cn(
          "flex items-center justify-between p-4 rounded-xl border",
          accentColor === "#5591AB"
            ? "bg-[#ebf2f4] border-[#d1e3e8]"
            : "bg-[#fbecd7] border-[#f5dab8]"
        )}>
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-widest text-[#44291B] font-bold">Unit Type</p>
            <h3 className="text-xl font-bold text-[#44291B] font-archivo-black capitalize">{unit.unit_type}</h3>
          </div>
          <div className={cn(
            "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
            unit.unit_status?.toLowerCase() === "active" || unit.unit_status?.toLowerCase() === "occupied"
              ? "bg-[#E7FAD3] text-[#78A24C] border-[#d8e7c8]"
              : "bg-gray-100 text-gray-600 border-gray-200"
          )}>
            <span className={cn(
              "mr-1.5 h-1.5 w-1.5 rounded-full",
              unit.unit_status?.toLowerCase() === "active" || unit.unit_status?.toLowerCase() === "occupied" ? "bg-[#78A24C]" : "bg-gray-400"
            )} />
            {unit.unit_status || "Unknown"}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Occupancy Card */}
          <div className="p-4 rounded-xl bg-[#EEF2FB] border border-[#c5d0ef] space-y-3">
            <div className="flex items-center gap-2 text-[#264384]">
              <Users className="h-4 w-4" />
              <span className="text-[11px]  font-bold uppercase tracking-wider">Occupancy</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-[#44291B]">{unit.current_occupancy} / {unit.max_occupancy}</p>
              <p className="text-[10px] text-[#8c8b82] uppercase tracking-tighter">Spaces Filled</p>
            </div>
            <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#264384] transition-all duration-500"
                style={{ width: `${(unit.current_occupancy / unit.max_occupancy) * 100}%` }}
              />
            </div>
          </div>

          {/* Pricing Card */}
          <div className="p-4 rounded-xl bg-[#F0F6E9] border border-[#d8e7c8] space-y-3">
            <div className="flex items-center gap-2 text-[#3B6D11]">
              <Banknote className="h-4 w-4" />
              <span className="text-[11px] font-bold uppercase tracking-wider">Rental Fee</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-[#44291B]">₱{unit.rental_fee.toLocaleString()}</p>
              <p className="text-[10px] text-[#8c8b82] uppercase tracking-tighter">per month</p>
            </div>
          </div>
        </div>

        {/* Configuration List */}
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#44291B] ml-1">Additional Details</p>
          <div className="rounded-xl border border-[#e2e4c0] bg-white divide-y divide-[#e2e4c0]">
            <DetailRow
              icon={<Armchair className="h-3.5 w-3.5" />}
              label="Furnishing"
              value={unit.furnishing_status || "Standard"}
            />
            <DetailRow
              icon={<Calendar className="h-3.5 w-3.5" />}
              label="Min Stay"
              value={unit.min_stay_duration ? `${unit.min_stay_duration} days` : "No minimum"}
            />
            <DetailRow
              icon={<Calendar className="h-3.5 w-3.5" />}
              label="Max Stay"
              value={unit.max_stay_duration ? `${unit.max_stay_duration} days` : "Flexible"}
            />
          </div>
        </div>

        {/* Occupants List (Dummy) */}
        {unit.current_occupancy > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#44291B] font-archivo-black ml-1">Current Occupants</p>
            <div className="rounded-xl border border-[#e2e4c0] bg-white overflow-hidden shadow-sm">
              {[...Array(unit.current_occupancy)].map((_, i) => {
                const names = ["Alexander Thorne", "Elena Rodriguez", "Julian Hayes", "Sofia Chen", "Marcus Wright"];
                const emails = ["alex.t@example.com", "elena.r@example.com", "j.hayes@example.com", "s.chen@example.com", "m.wright@example.com"];
                return (
                  <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-[#e2e4c0] last:border-0 hover:bg-[#F6F8D5]/30 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-[#EEF2FB] flex items-center justify-center border border-[#c5d0ef]">
                      <User className="h-5 w-5 text-[#264384]" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[13px] font-bold text-[#44291B]">{names[i % names.length]}</p>
                      <p className="text-[10px] text-[#8c8b82] font-medium">{emails[i % emails.length]}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div className="flex items-center gap-2.5 text-[#8c8b82]">
        {icon}
        <span className="text-[12px] font-medium">{label}</span>
      </div>
      <span className="text-[12px] font-bold text-[#44291B] capitalize">{value}</span>
    </div>
  );
}
