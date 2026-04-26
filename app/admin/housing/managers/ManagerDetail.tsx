"use client";

import { Manager } from "../../../../types/housing/types";
import AssignedProperties from "./AssignedProperties";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Mail, MapPin, Pencil, Trash2, ChevronLeft } from "lucide-react"

interface ManagerDetailProps {
  manager: Manager;
  onEdit: (manager: Manager) => void;
  onDelete: (manager: Manager) => void;
  onBack?: () => void;
}

export default function ManagerDetail({
  manager,
  onEdit,
  onDelete,
  onBack,
}: ManagerDetailProps) {
  const initials = `${manager.users.first_name[0]}${manager.users.last_name[0]}`.toUpperCase();

  return (
    <div className="p-6 space-y-6 max-w-full overflow-hidden">
      {onBack && (
        <Button
          variant="ghost"
          onClick={onBack}
          className="lg:hidden p-0 h-auto hover:bg-transparent text-[#264384]"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to List
        </Button>
      )}
      <Card className="bg-[#FDFFF4] border-[#e2e4c0] shadow-sm overflow-hidden">
        <CardContent className="px-5 py-4">

          <div className="flex items-start gap-4 flex-wrap sm:flex-nowrap min-w-0">

            {/* Avatar */}
            <div className="w-14 h-14 rounded-full bg-[#e8edf7] border-2 border-[#d1daf0] flex items-center justify-center text-lg font-semibold text-[#264384] shrink-0">
              {initials}
            </div>

            {/* Name + pills */}
            <div className="flex flex-col gap-1.5 flex-1 min-w-0">
              <div className="truncate">
                <h1 className="text-xl font-bold text-[#44291B] leading-tight truncate">
                  {manager.users.first_name} {manager.users.last_name}
                </h1>
                <p className="text-xs text-[#44291B] mt-0.5 pl-0.5">Property Manager</p>
              </div>

              <div className="flex flex-wrap gap-2 min-w-0">

                <span className="inline-flex items-center gap-1.5 bg-[#ebf2f4] border border-[#d1e3e8] rounded-full px-2.5 py-1 text-xs text-[#264384] max-w-full">
                  <Mail className="w-3 h-3 shrink-0" />
                  <span className="truncate">{manager.users.email}</span>
                </span>

                {manager.office_location && (
                  <span className="inline-flex items-center gap-1.5 bg-[#ebf2f4] border border-[#d1e3e8] rounded-full px-2.5 py-1 text-xs text-[#264384] max-w-full">
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span className="truncate">{manager.office_location}</span>
                  </span>
                )}
              </div>
            </div>


            <div className="flex gap-2 shrink-0">
              <Button
                size="icon"
                onClick={() => onEdit(manager)}
                className="bg-[#CDDBF9] hover:bg-[#7B9FEF] text-[#264384]"
                title="Edit" >
                <Pencil className="h-4 w-4" />
              </Button>

              <Button
                variant="destructive"
                size="icon"
                onClick={() => onDelete(manager)}
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

          </div>
        </CardContent>
      </Card>

      <AssignedProperties managerId={manager.users.user_id} />
    </div>
  );
}