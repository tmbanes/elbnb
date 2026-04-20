"use client";

import { Manager } from "../../../../types/housing/types";
import AssignedProperties from "./AssignedProperties";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { ChevronLeft, Mail, MapPin, Pencil, Trash2 } from "lucide-react"

interface ManagerDetailProps {
  manager: Manager;
  onBack: () => void;
  onEdit: (manager: Manager) => void;
  onDelete: (id: string) => void;
}

export default function ManagerDetail({
  manager,
  onBack,
  onEdit,
  onDelete,
}: ManagerDetailProps) {
  const initials = `${manager.users.first_name[0]}${manager.users.last_name[0]}`.toUpperCase();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="text-[#264384] hover:bg-[#e8edf7]">
          <ChevronLeft className="mr-2 h-3.5 w-3.5" />
          Close
        </Button>
      </div>

      <Card className="bg-[#FDFFF4] border-[#e2e4c0] shadow-sm overflow-hidden">
        <CardContent className="px-5 py-4">
          <div className="flex items-center gap-4 flex-wrap">

            {/* Avatar */}
            <div className="w-14 h-14 rounded-full bg-[#e8edf7] border-2 border-[#d1daf0] flex items-center justify-center text-lg font-semibold text-[#264384] shrink-0">
              DM
            </div>

            {/* Name + pills */}
            <div className="flex flex-col gap-1.5 flex-1 min-w-0">
              <div>
                <h1 className="text-xl font-bold text-[#44291B] leading-tight">
                  {manager.users.first_name} {manager.users.last_name}
                </h1>
                <p className="text-xs text-[#44291B] mt-0.5 pl-0.5">Property Manager</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 bg-[#9CB3E8] border border-[#264384] rounded-full px-2.5 py-1 text-[11px] text-[#264384]">
                  <Mail className="w-3 h-3 text-[#264384]" />
                  {manager.users.email}
                </span>
                {manager.office_location && (
                  <span className="inline-flex items-center gap-1.5 bg-[#9CB3E8] border border-[264384] rounded-full px-2.5 py-1 text-[11px] text-[#264384]">
                    <MapPin className="w-3 h-3 text-[#264384]" />
                    {manager.office_location}
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 self-start ml-8">
              <Button 
                size="icon" 
                onClick={() => onEdit(manager)} 
                className="bg-transparent hover:bg-[#5273BC] text-[#264384] hover:text-white" 
                title="Edit" > 
                
                <Pencil className="h-4 w-4" /> 
              </Button>
              
              <Button 
                variant="destructive" 
                size="icon" 
                onClick={() => onDelete(manager.employee_id)}
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
