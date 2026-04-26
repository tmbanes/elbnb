"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, College, COLLEGES } from "@/types/user.types";

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

//style constants
const label_style = "block text-xs font-semibold uppercase tracking-wider text-slate-300"

const field_style =
  "rounded-full border-none bg-[#fcf4d9] px-4 py-1.5 text-base " +
  "text-[#2d1a12] placeholder-[#2d1a12]/30 shadow-sm " +
  "transition-all outline-none";

const full_width = field_style + " w-full"

const button_style = "w-full h-11 rounded-full bg-[#fbbc05] text-[#2d1a12] font-semibold hover:bg-[#f9d776]";

type StudentRoleData = {
  student_num: string;
  degree_program: string;
  college: College;
  enrollment_status: "enrolled" | "loa" | "awol";
  emergency_person: string,
  emergency_contact: string;
  home_address: string;
};

type GuestRoleData = {
  valid_id: string;
  purpose_visit: string;
};

type ProfileCompletionRole = "student" | "guest";

const initialStudentData: StudentRoleData = {
  student_num: "",
  degree_program: "",
  college: "CAS",
  enrollment_status: "enrolled",
  emergency_person: "",
  emergency_contact: "",
  home_address: ""
};

const initialGuestData: GuestRoleData = {
  valid_id: "",
  purpose_visit: "",
};

const enrollmentOptions = [
  { value: "enrolled", label: "Enrolled" },
  { value: "loa", label: "Leave of Absence" },
  { value: "awol", label: "AWOL" },
];


export default function CompleteProfile({ user }: { user: User | null }) {
  const [personalDetails, setPersonalDetails] = useState({
    first_name: user?.first_name === "TBD" ? "" : (user?.first_name || ""),
    middle_name: user?.middle_name || "",
    last_name: user?.last_name === "TBD" ? "" : (user?.last_name || ""),
  });

  const initialRole: ProfileCompletionRole | null =
    user?.role === "student" || user?.role === "guest" ? user.role : null;

  const [selectedRole, setSelectedRole] = useState<ProfileCompletionRole | null>(initialRole);

  const [roleData, setRoleData] = useState<StudentRoleData | GuestRoleData>(
    initialRole === "student" ? initialStudentData : initialGuestData
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const targetRoute: Record<string, string> = {
    student: "/student/dashboard",
    guest: "/guest/dashboard",
    dormitory_manager: "/manager/dashboard",
    housing_admin: "/admin/dashboard",
  };

  const handlePersonalFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPersonalDetails((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleFieldChange = (name: string, value: string) => {
    setRoleData((prev) => ({ ...prev, [name]: value }));
  };

  const handleContinue = async () => {
    if (!selectedRole) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/complete-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: selectedRole,
          ...personalDetails,
          roleData
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || "Unable to save profile.");
        return;
      }

      router.push(targetRoute[selectedRole] || "/");
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
          <CardTitle className="text-3xl font-bold text-[#F6F8D5]">Complete your profile</CardTitle>
          <CardDescription className="text-[#F6F8D5]">
            Please provide your personal details to finish signing up as a <span className="capitalize font-semibold underline underline-offset-4">{selectedRole ?? "user"}</span>.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">

          {!user?.role && (
            <div className="space-y-2">
              <Label className={label_style}>Role</Label>
              <Select
                onValueChange={(value) => {
                  const role = value as ProfileCompletionRole;
                  setSelectedRole(role);
                  setRoleData(role === "student" ? initialStudentData : initialGuestData);
                  setError(null);
                }}
                value={selectedRole ?? undefined}
              >
                <SelectTrigger className="w-full bg-[#fcf4d9] text-[#2d1a12]">
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent className="bg-[#fcf4d9] text-[#2d1a12]">
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="guest">Guest</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Personal Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-[#F6F8D5] border-b border-[#F6F8D5]/20 pb-1">Personal Information</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className={label_style}>First Name</Label>
                <Input
                  name="first_name"
                  className={field_style}
                  value={personalDetails.first_name}
                  onChange={handlePersonalFieldChange}
                  placeholder="First name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className={label_style}>Middle Name</Label>
                <Input
                  name="middle_name"
                  className={field_style}
                  value={personalDetails.middle_name}
                  onChange={handlePersonalFieldChange}
                  placeholder="Middle name (optional)"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className={label_style}>Last Name</Label>
              <Input
                name="last_name"
                className={full_width}
                value={personalDetails.last_name}
                onChange={handlePersonalFieldChange}
                placeholder="Last name"
                required
              />
            </div>
          </div>

          {/* Role-specific Form */}
          {selectedRole && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-[#F6F8D5] border-b border-[#F6F8D5]/20 pb-1 capitalize">{selectedRole} Details</h3>

              {selectedRole === "student" ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className={label_style}>Student Number</Label>
                    <Input
                      className={field_style}
                      value={(roleData as StudentRoleData).student_num ?? ""}
                      onChange={(e) =>
                        handleRoleFieldChange("student_num", e.target.value)
                      }
                      placeholder="20XX-XXXXX"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className={label_style}>Degree Program</Label>
                    <Input
                      className={field_style}
                      value={(roleData as StudentRoleData).degree_program ?? ""}
                      onChange={(e) =>
                        handleRoleFieldChange("degree_program", e.target.value)
                      }
                      placeholder="e.g. BS Computer Science"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className={label_style}>Enrollment Status</Label>
                    <Select
                      onValueChange={(value) =>
                        handleRoleFieldChange("enrollment_status", value)
                      }
                      defaultValue={(roleData as StudentRoleData).enrollment_status}
                      required
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
                    <Label className={label_style}>College</Label>
                    <Select
                      onValueChange={(value) =>
                        handleRoleFieldChange("college", value)
                      }
                      defaultValue={(roleData as StudentRoleData).college}
                      required
                    >
                      <SelectTrigger className="w-full bg-[#fcf4d9] text-[#2d1a12]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#fcf4d9] text-[#2d1a12]">
                        {COLLEGES.map((college) => (
                          <SelectItem key={college} value={college}>
                            {college}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label className={label_style}>Home Address</Label>
                    <Input
                      className={full_width}
                      value={(roleData as StudentRoleData).home_address ?? ""}
                      onChange={(e) =>
                        handleRoleFieldChange("home_address", e.target.value)
                      }
                      placeholder="Full Address"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className={label_style}>Emergency Person</Label>
                    <Input
                      className={field_style}
                      value={(roleData as StudentRoleData).emergency_person ?? ""}
                      onChange={(e) =>
                        handleRoleFieldChange("emergency_person", e.target.value)
                      }
                      placeholder="Name of emergency contact"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className={label_style}>Emergency Contact #</Label>
                    <Input
                      className={field_style}
                      value={(roleData as StudentRoleData).emergency_contact ?? ""}
                      onChange={(e) =>
                        handleRoleFieldChange("emergency_contact", e.target.value)
                      }
                      placeholder="09XXXXXXXXX"
                      required
                    />
                  </div>
                </div>
              ) : (
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label className={label_style}>Valid ID</Label>
                    <Input
                      className={field_style}
                      value={(roleData as GuestRoleData).valid_id ?? ""}
                      onChange={(e) =>
                        handleRoleFieldChange("valid_id", e.target.value)
                      }
                      placeholder="ID Number / Type"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className={label_style}>Purpose of Visit</Label>
                    <Input
                      className={field_style}
                      value={(roleData as GuestRoleData).purpose_visit ?? ""}
                      onChange={(e) =>
                        handleRoleFieldChange("purpose_visit", e.target.value)
                      }
                      placeholder="e.g. Temporary stay, visiting family"
                      required
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <Button
            onClick={handleContinue}
            disabled={loading || !selectedRole}
            className={button_style}
          >
            {loading ? "Saving..." : "Finish Setup"}
          </Button>

          {error && (
            <p className="text-sm bg-red-500/20 text-red-100 p-3 rounded-full text-center">{error}</p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
