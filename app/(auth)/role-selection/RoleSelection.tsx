"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

///ui components
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

//style constants
const label_style = "block text-xs font-semibold uppercase tracking-wider text-slate-300"

const field_style = 
  "rounded-full border-none bg-[#fcf4d9] px-4 py-1.5 text-base " +
  "text-[#2d1a12] placeholder-[#2d1a12]/30 shadow-sm " +
  "transition-all outline-none";

const button_style = "w-full h-11 rounded-full bg-[#fbbc05] text-[#2d1a12] font-semibold hover:bg-[#f9d776]";

type Role = "guest" | "student";

type StudentRoleData = {
  student_number: string;
  degree_program: string;
  enrollment_status: "enrolled" | "loa" | "awol";
  residency_status: "resident" | "non-resident" | "evicted";
};

type GuestRoleData = {
  valid_id: string;
  purpose_visit: string;
  occupancy_status: string;
};

type RoleFormData = StudentRoleData | GuestRoleData;

const initialStudentData: StudentRoleData = {
  student_number: "",
  degree_program: "",
  enrollment_status: "enrolled",
  residency_status: "resident",
};

const initialGuestData: GuestRoleData = {
  valid_id: "",
  purpose_visit: "",
  occupancy_status: "",
};

const roleLabels: Record<Role, string> = {
  guest: "Guest",
  student: "Student",
};

const roleDescriptions: Record<Role, string> = {
  guest: "Quick access for visitors and temporary stays.",
  student: "Access student-specific housing and residency features.",
};

const enrollmentOptions = [
  { value: "enrolled", label: "Enrolled" },
  { value: "loa", label: "Leave of Absence" },
  { value: "awol", label: "AWOL" },
];

const residencyOptions = [
  { value: "resident", label: "Resident" },
  { value: "non-resident", label: "Non-Resident" },
  { value: "evicted", label: "Evicted" },
];


export default function RoleSelection() {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [roleData, setRoleData] = useState<RoleFormData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  //parse date for guest occupancy_status if roleData exists and role is guest
  const selectedDateString =
    selectedRole === "guest" && roleData
      ? (roleData as GuestRoleData).occupancy_status
      : "";

  const parsedSelectedDate = selectedDateString
    ? new Date(selectedDateString)
    : undefined;

  const selectedDate =
    parsedSelectedDate && !Number.isNaN(parsedSelectedDate.valueOf())
      ? parsedSelectedDate
      : undefined;

  const router = useRouter();

  const targetRoute: Record<Role, string> = {
    student: "/student/dashboard",
    guest: "/guest/dashboard",
  };

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
    setError(null);
    setRoleData(role === "student" ? initialStudentData : initialGuestData);
  };

  const handleFieldChange = (name: string, value: string) => {
    setRoleData((prev) => (prev ? { ...prev, [name]: value } : prev));
  };

  const handleContinue = async () => {
    if (!selectedRole || !roleData) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/role-selection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: selectedRole, ...roleData }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || "Unable to save role.");
        return;
      }

      router.push(targetRoute[selectedRole]);
    } catch (err) {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-center bg-[#8dbd59] p-4 font-sans selection:bg-emerald-500/30">

      <Card className="w-full max-w-xl bg-[#5591AB]">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-[#F6F8D5]">Choose your role</CardTitle>
          <CardDescription className="text-[#F6F8D5]">
            Select a role and complete the required details.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">

          {/* Role selection */}
          <div className="grid gap-4 sm:grid-cols-2">
            {Object.entries(roleLabels).map(([role, label]) => (
              <Card
                key={role}
                className={`cursor-pointer rounded-2xl border transition-all duration-200 ${
                  selectedRole === role ? 
                  "border-[#fbbc05] bg-[#fcf4d9] shadow-xl scale-[1.02]" 
                  :  "border-white/10 bg-white/10 hover:border-white/30 hover:bg-white/20"
                }`}
                onClick={() => handleRoleSelect(role as Role)}
              >
                <CardHeader>
                  <CardTitle 
                    className={`font-bold ${
                      selectedRole === role ? "text-[#2d1a12]" : "text-white"
                      }`}>
                    {label}</CardTitle>

                  <CardDescription className={`mt-3 text-sm leading-6 ${
                    selectedRole === role ? "text-[#2d1a12]/80" : "text-slate-100"
                    }`}>
                    {roleDescriptions[role as Role]}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>

          {/* Form */}
          {selectedRole && roleData && (
            <div className="space-y-4">

              {/* <h3 className="font-semibold text-2x text-[#F6F8D5]">
                {roleLabels[selectedRole]} Details
              </h3> */}

              {selectedRole === "student" ? (
                <>
                  <div className="space-y-2">
                    <Label className={label_style}>Student Number</Label>
                    <Input
                      className={field_style}
                      value={(roleData as StudentRoleData).student_number}
                      onChange={(e) =>
                        handleFieldChange("student_number", e.target.value)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className={label_style}>Degree Program</Label>
                    <Input
                      className={field_style}
                      value={(roleData as StudentRoleData).degree_program}
                      onChange={(e) =>
                        handleFieldChange("degree_program", e.target.value)
                      }
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label className={label_style}>Enrollment Status</Label>
                      <Select
                        onValueChange={(value) =>
                          handleFieldChange("enrollment_status", value)
                        }
                        defaultValue={
                          (roleData as StudentRoleData).enrollment_status
                        }
                        
                      >
                        <SelectTrigger className="w-full bg-[#fcf4d9] text-[#2d1a12]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#fcf4d9] text-[#2d1a12]">
                          {enrollmentOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className={label_style}>Residency Status</Label>
                      <Select
                        onValueChange={(value) =>
                          handleFieldChange("residency_status", value)
                        }
                        defaultValue={
                          (roleData as StudentRoleData).residency_status
                        }
                      >
                        <SelectTrigger className="w-full bg-[#fcf4d9] text-[#2d1a12]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#fcf4d9] text-[#2d1a12]">
                          {residencyOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label className={label_style}>Valid ID</Label>
                    <Input
                      className={field_style}
                      value={(roleData as GuestRoleData).valid_id}
                      onChange={(e) =>
                        handleFieldChange("valid_id", e.target.value)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className={label_style}>Purpose of Visit</Label>
                    <Input
                      className={field_style}
                      value={(roleData as GuestRoleData).purpose_visit}
                      onChange={(e) =>
                        handleFieldChange("purpose_visit", e.target.value)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className={label_style}>Occupancy Date</Label>

                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal bg-[#fcf4d9] text-[#2d1a12]"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>

                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={(date) =>
                            handleFieldChange(
                              "occupancy_status",
                              date ? date.toISOString() : ""
                            )
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Actions */}
          <Button
            onClick={handleContinue}
            disabled={!selectedRole || loading}
            className={button_style}
          >
            {loading ? "Saving..." : "Continue"}
          </Button>

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}