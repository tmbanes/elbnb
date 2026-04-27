"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, College, COLLEGES, SEX } from "@/types/user.types";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils/ui-utils";

///ui components
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  emergency_person: string;
  emergency_contact: string;
  home_address: string;
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
  emergency_person: "",
  emergency_contact: "",
  home_address: ""
};

const enrollmentOptions = [
  { value: "enrolled", label: "Enrolled" },
  { value: "loa", label: "Leave of Absence" },
  { value: "awol", label: "AWOL" },
];

const UPLB_PROGRAMS: Record<College, string[]> = {
  CAS: ["BA Comm Arts", "BA Philosophy", "BA Sociology", "BS Applied Mathematics", "BS Applied Physics", "BS Biology", "BS Chemistry", "BS Computer Science", "BS Mathematics", "BS Mathematics and Science Teaching", "BS Statistics"],
  CEAT: ["BS Agricultural and Biosystems Engineering", "BS Chemical Engineering", "BS Civil Engineering", "BS Electrical Engineering", "BS Industrial Engineering", "BS Mechanical Engineering"],
  CAFS: ["BS Agriculture", "BS Food Technology", "BS Agricultural Chemistry", "BS Agricultural Biotechnology"],
  CVM: ["Doctor of Veterinary Medicine"],
  CDC: ["BS Development Communication"],
  CEM: ["BS Agribusiness Management and Entrepreneurship", "BS Agricultural and Applied Economics", "BS Economics"],
  CHE: ["BS Human Ecology", "BS Nutrition"],
  CFNR: ["BS Forestry"],
  SESAM: ["BS Environmental Science"],
  CPAf: ["BS Development Management"]
};

// FUNCTION: Lets user complete profile
// @params: user (User)
// @returns: void
export default function CompleteProfile({ user }: { user: User | null }) {
  const [personalDetails, setPersonalDetails] = useState({
    first_name: user?.first_name === "TBD" ? "" : (user?.first_name || ""),
    middle_name: "", // Initial value must be blank
    last_name: user?.last_name === "TBD" ? "" : (user?.last_name || ""),
    sex: user?.sex,
    birthdate: (user as any)?.birthdate ? new Date((user as any).birthdate) : undefined
  });

  const initialRole: ProfileCompletionRole | null =
    user?.role === "student" || user?.role === "guest" ? user.role : null;

  const [selectedRole, setSelectedRole] = useState<ProfileCompletionRole | null>(initialRole);

  const [roleData, setRoleData] = useState<StudentRoleData | GuestRoleData>(
    initialRole === "student" ? { ...initialStudentData, degree_program: UPLB_PROGRAMS[initialStudentData.college][0] } : initialGuestData
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  const handleSignOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    router.refresh();
    router.push("/onboarding");
  };

  const targetRoute: Record<string, string> = {
    student: "/student/dashboard",
    guest: "/guest/dashboard",
    dormitory_manager: "/manager/dashboard",
    housing_admin: "/admin/dashboard",
  };

  const handlePersonalFieldChange = (name: string, value: string) => {
    setPersonalDetails((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleFieldChange = (name: string, value: string) => {
    // If college changes, reset degree program to the first available for that college
    if (name === "college") {
      setRoleData((prev) => ({
        ...prev,
        college: value as College,
        degree_program: UPLB_PROGRAMS[value as College][0]
      }));
    } else {
      setRoleData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const validateForm = () => {
    // 1. Personal Details Validation
    if (!personalDetails.first_name.trim()) return "First name is required.";
    if (!personalDetails.last_name.trim()) return "Last name is required.";
    if (!personalDetails.sex) return "Sex is required.";
    if (!personalDetails.birthdate) return "Birthdate is required.";

    // 2. Role Specific Validation
    if (!selectedRole) return "Please select a role.";

    if (selectedRole === "student") {
      const data = roleData as StudentRoleData;

      // Basic empty checks
      if (!data.student_num.trim()) return "Student number is required.";
      if (!data.degree_program.trim()) return "Degree program is required.";
      if (!data.college) return "College is required.";
      if (!data.enrollment_status) return "Enrollment status is required.";
      if (!data.home_address.trim()) return "Home address is required.";
      if (!data.emergency_person.trim()) return "Emergency person name is required.";
      if (!data.emergency_contact.trim()) return "Emergency contact number is required.";

      // Format checks
      if (!/^\d{9}$/.test(data.student_num)) {
        return "Student number must be exactly 9 digits (e.g. 202312345).";
      }
      if (!/^09\d{9}$/.test(data.emergency_contact)) {
        return "Emergency contact must be in the format 09XXXXXXXXX.";
      }
    }

    if (selectedRole === "guest") {
      const data = roleData as GuestRoleData;
      if (!data.valid_id.trim()) return "Valid ID is required.";
      if (!data.purpose_visit.trim()) return "Purpose of visit is required.";
      if (!data.emergency_person.trim()) return "Emergency person name is required.";
      if (!data.emergency_contact.trim()) return "Emergency contact number is required.";
      if (!data.home_address.trim()) return "Home address is required.";

      // Format check for guest too
      if (!/^09\d{9}$/.test(data.emergency_contact)) {
        return "Emergency contact must be in the format 09XXXXXXXXX.";
      }
    }

    return null;
  };

  const handleContinue = async () => {
    if (!selectedRole) return;

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Format birthdate to YYYY-MM-DD string to avoid timezone shifts
      const formattedDetails = {
        ...personalDetails,
        birthdate: personalDetails.birthdate ? format(personalDetails.birthdate, "yyyy-MM-dd") : undefined
      };

      const response = await fetch("/api/auth/complete-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: selectedRole,
          ...formattedDetails,
          roleData
        }),
      });

      // Handle non-JSON responses (SyntaxError prevention)
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Server returned non-JSON response:", text);
        setError("Server error. Please try again later.");
        return;
      }

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
              <Label className={label_style}>Role <span className="text-red-500">*</span></Label>
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
                <Label className={label_style}>First Name <span className="text-red-500">*</span></Label>
                <Input
                  name="first_name"
                  className={field_style}
                  value={personalDetails.first_name}
                  onChange={(e) => handlePersonalFieldChange("first_name", e.target.value)}
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
                  onChange={(e) => handlePersonalFieldChange("middle_name", e.target.value)}
                  placeholder="Middle name (optional)"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className={label_style}>Last Name <span className="text-red-500">*</span></Label>
              <Input
                name="last_name"
                className={full_width}
                value={personalDetails.last_name}
                onChange={(e) => handlePersonalFieldChange("last_name", e.target.value)}
                placeholder="Last name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className={label_style}>Sex <span className="text-red-500">*</span></Label>
              <Select
                onValueChange={(value) =>
                  handlePersonalFieldChange("sex", value as string)
                }
                defaultValue={personalDetails.sex}
                required
              >
                <SelectTrigger className="w-full bg-[#fcf4d9] text-[#2d1a12]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#fcf4d9] text-[#2d1a12]">
                  {SEX.map((sex) => (
                    <SelectItem key={sex} value={sex}>
                      {sex}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Birthdate Field */}
            <div className="space-y-2">
              <Label className={label_style}>Birthdate <span className="text-red-500">*</span></Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal h-11 bg-[#fcf4d9] text-[#2d1a12] border-none rounded-full",
                      !personalDetails.birthdate && "text-[#2d1a12]/30"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {personalDetails.birthdate ? format(personalDetails.birthdate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-[#fcf4d9] border-none" align="start">
                  <Calendar
                    mode="single"
                    selected={personalDetails.birthdate}
                    onSelect={(date) => handlePersonalFieldChange("birthdate", date as any)}
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                    captionLayout="dropdown"
                    fromYear={1900}
                    toYear={new Date().getFullYear()}
                    initialFocus
                    className="rounded-xl border-none"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Role-specific Form */}
          {selectedRole && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-[#F6F8D5] border-b border-[#F6F8D5]/20 pb-1 capitalize">{selectedRole} Details</h3>

              {selectedRole === "student" ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className={label_style}>Student Number <span className="text-red-500">*</span></Label>
                    <Input
                      type="text"
                      className={field_style}
                      value={(roleData as StudentRoleData).student_num ?? ""}
                      onChange={(e) =>
                        handleRoleFieldChange("student_num", e.target.value)
                      }
                      placeholder="20XXXXXXXX (9 digits)"
                      required
                    />
                    <p className="text-[10px] text-[#2d1a12]/60 font-semibold pl-1">Format: 9 digits (e.g. 202314986)</p>
                  </div>

                  <div className="space-y-2">
                    <Label className={label_style}>Degree Program <span className="text-red-500">*</span></Label>
                    <Select
                      onValueChange={(value) =>
                        handleRoleFieldChange("degree_program", value)
                      }
                      value={(roleData as StudentRoleData).degree_program}
                      required
                    >
                      <SelectTrigger className="w-full bg-[#fcf4d9] text-[#2d1a12]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#fcf4d9] text-[#2d1a12]">
                        {UPLB_PROGRAMS[(roleData as StudentRoleData).college].map((prog) => (
                          <SelectItem key={prog} value={prog}>
                            {prog}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className={label_style}>Enrollment Status <span className="text-red-500">*</span></Label>
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
                    <Label className={label_style}>College <span className="text-red-500">*</span></Label>
                    <Select
                      onValueChange={(value) => {
                        handleRoleFieldChange("college", value);
                        handleRoleFieldChange("degree_program", "");
                      }}
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
                    <Label className={label_style}>Home Address <span className="text-red-500">*</span></Label>
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
                    <Label className={label_style}>Emergency Person <span className="text-red-500">*</span></Label>
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
                    <Label className={label_style}>Emergency Contact # <span className="text-red-500">*</span></Label>
                    <Input
                      type="text"
                      className={field_style}
                      value={(roleData as StudentRoleData).emergency_contact || ""}
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
                    <Label className={label_style}>Valid ID <span className="text-red-500">*</span></Label>
                    <Input
                      type="text"
                      className={field_style}
                      value={(roleData as GuestRoleData).valid_id || ""}
                      onChange={(e) =>
                        handleRoleFieldChange("valid_id", e.target.value)
                      }
                      placeholder="ID Number / Type"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className={label_style}>Purpose of Visit <span className="text-red-500">*</span></Label>
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

                  <div className="space-y-2">
                    <Label className={label_style}>Home Address <span className="text-red-500">*</span></Label>
                    <Input
                      className={full_width}
                      value={(roleData as GuestRoleData).home_address ?? ""}
                      onChange={(e) =>
                        handleRoleFieldChange("home_address", e.target.value)
                      }
                      placeholder="Full Address"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className={label_style}>Emergency Person <span className="text-red-500">*</span></Label>
                    <Input
                      className={field_style}
                      value={(roleData as GuestRoleData).emergency_person ?? ""}
                      onChange={(e) =>
                        handleRoleFieldChange("emergency_person", e.target.value)
                      }
                      placeholder="Name of emergency contact"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className={label_style}>Emergency Contact # <span className="text-red-500">*</span></Label>
                    <Input
                      className={field_style}
                      value={(roleData as GuestRoleData).emergency_contact ?? ""}
                      onChange={(e) =>
                        handleRoleFieldChange("emergency_contact", e.target.value)
                      }
                      placeholder="09XXXXXXXXX"
                      required
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <Button
              onClick={handleContinue}
              disabled={loading || !selectedRole}
              className={button_style}
            >
              {loading && !error ? "Saving..." : "Finish Setup"}
            </Button>

            <Button
              variant="ghost"
              onClick={handleSignOut}
              disabled={loading}
              className="w-full h-11 rounded-full border-2 border-[#F6F8D5]/40 text-[#F6F8D5] hover:bg-[#F6F8D5]/10 hover:text-[#F6F8D5]"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out & Cancel
            </Button>
          </div>

          {error && (
            <p className="text-sm bg-red-500/20 text-red-100 p-3 rounded-full text-center">{error}</p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
