"use client";

import { Manager } from "../../../../../types/housing/types";
import AssignedProperties from "./AssignedProperties";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { ChevronLeft, Mail, MapPin } from "lucide-react"

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
      <Button variant="link" onClick={onBack} className="pl-0 text-[#264384] h-auto py-0">
        <ChevronLeft className="mr-1 h-4 w-4" /> Back to Managers
      </Button>

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
                <p className="text-xs text-[#8c8b82] mt-0.5">Property Manager</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 bg-[#F6F8D5] border border-[#e2e4c0] rounded-full px-2.5 py-1 text-[11px] text-[#44291B]">
                  <Mail className="w-3 h-3 text-[#6b6a62]" />
                  {manager.users.email}
                </span>
                {manager.office_location && (
                  <span className="inline-flex items-center gap-1.5 bg-[#F6F8D5] border border-[#e2e4c0] rounded-full px-2.5 py-1 text-[11px] text-[#44291B]">
                    <MapPin className="w-3 h-3 text-[#6b6a62]" />
                    {manager.office_location}
                  </span>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="hidden md:block w-px h-12 bg-[#e2e4c0]" />

            {/* Meta */}
            <div className="flex flex-col gap-2.5 min-w-[140px]">
              <div>
                <p className="text-[10px] font-semibold text-[#8c8b82] uppercase tracking-wider">Employee ID</p>
                <p className="text-sm font-medium text-[#44291B]">{manager.employee_id}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 self-start mt-5 ml-8">
              <Button variant="outline" size="sm" onClick={() => onEdit(manager)} className="bg-[#264384] text-white">
                Edit
              </Button>
              <Button variant="destructive" size="sm" onClick={() => onDelete(manager.employee_id)}>
                Delete
              </Button>
            </div>

          </div>
        </CardContent>
      </Card>

      <AssignedProperties managerId={manager.users.user_id} />
    </div>
  );
}
