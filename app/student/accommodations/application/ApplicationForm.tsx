"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCallback, useEffect, useState } from "react";
import { Archivo, Archivo_Black } from "next/font/google";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Upload,
  CheckCircle,
  Calendar as CalendarIcon,
  Loader2,
  ChevronLeft,
  Building,
  User,
  FileText,
  Home,
} from "lucide-react";
import { format } from "date-fns";
import { PageLoader } from "@/components/ui/page-loader";

import type {
  ApplicationStatus,
  AccommodationApplication,
} from "@/types/application_workflow";
import type {
  Accommodation,
  Unit,
  UnitType,
} from "@/types/accommodation_units";
import { useRouter, useSearchParams } from "next/navigation";
import { createActivityLog, getCurrentUserFromApi, isUserRole } from "@/services/activity_log/browser";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";

const archivo = Archivo({ subsets: ["latin"] });
const archivoBlack = Archivo_Black({ subsets: ["latin"], weight: "400" });

const unitTypes: [UnitType, ...UnitType[]] = ["room", "bedspace", "wholeunit"];

// Validation Schema
const formSchema = z
  .object({
    notes: z.string().optional(),
    preferred_accommodation_id: z.string().min(1, "Dormitory is required"),
    preferred_unit_type: z.string().min(1, "Please select a valid unit type"),
    checkIn: z.date().refine((val) => val !== undefined && val !== null, {
      message: "Check-in date is required",
    }),
    checkOut: z.date().refine((val) => val !== undefined && val !== null, {
      message: "Check-out date is required",
    }),
    duration_of_stay: z.string().min(1, "Duration of stay"),
  })
  .refine(
    (data) => {
      if (data.checkIn && data.checkOut) {
        return data.checkOut > data.checkIn;
      }
      return true;
    },
    {
      message: "Check-out date must be after check-in date",
      path: ["checkOut"],
    },
  );

type FormValues = z.infer<typeof formSchema>;

// Reusable Components
function SectionCard({
  title,
  children,
  highlighted = false,
  onEdit, // New prop to handle the click
  className,
  icon,
}: {
  title: string;
  children: React.ReactNode;
  highlighted?: boolean;
  onEdit?: () => void; // Optional function
  className?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div
      className={`
        relative rounded-2xl border-2 bg-white mb-4 transition-all duration-300 ease-in-out
        hover:scale-[1.01] hover:shadow-xl hover:border-[#78A24C] group
        ${highlighted ? "border-blue-400 shadow-md" : "border-[#78A24C]/30"}
        ${className || "p-6"}
      `}
    >
      {/* Edit Button - Visible on Hover */}
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-[#78A24C] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-tighter"
        >
          Edit Section
        </button>
      )}

      <div className="flex items-center mb-6">
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${highlighted ? "bg-[#F2C908]" : "bg-[#78A24C]/25"}`}>
          {icon && (
            <span className="text-[#567536] [&>svg]:w-[18px] [&>svg]:h-[18px] group-hover:animate-pulse">
              {icon}
            </span>
          )}
          <span className={`text-[15px] font-bold tracking-wider ${highlighted ? "text-[#1F2937]" : "text-[#3d2000]"}`}>
            {title}
          </span>
        </div>
      </div>

      <div className="transition-opacity duration-300 flex-grow flex flex-col">{children}</div>
    </div>
  );
}
function Field({
  label,
  italic,
  required,
  error,
  children,
}: {
  label: string;
  italic?: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm font-semibold text-[#3d2000] whitespace-nowrap">
        {label}
        {italic && (
          <span className="font-normal italic text-[#6a5a3a] ml-1">
            {italic}
          </span>
        )}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  );
}

const inputClass =
  "bg-white border-2 border-[#78A24C] rounded-xl px-4 h-11 text-sm text-gray-700 placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-[#78A24C]/30 focus-visible:border-[#78A24C]";

const inputErrorClass =
  "bg-white border-2 border-red-400 rounded-xl px-4 h-11 text-sm text-gray-700 placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-red-300";

const triggerClass =
  "w-full bg-white border-2 border-[#78A24C] rounded-xl px-4 h-11 text-sm text-gray-700 focus:ring-2 focus:ring-[#78A24C]/30";

const triggerErrorClass =
  "w-full bg-white border-2 border-red-400 rounded-xl px-4 h-11 text-sm text-gray-700 focus:ring-2 focus:ring-red-300";

export default function ApplyAccommodationForm({ authUser }: { authUser: any }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const accommodationIdFromQuery = searchParams.get("accommodationId") ?? "";
  const unitIdFromQuery = searchParams.get("unitId") ?? "";

  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const [accommodation, setAccommodation] = useState<Accommodation | null>(
    null,
  );
  const [unit, setUnit] = useState<Unit | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string>("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [userId, setUserId] = useState<string>("");
  const [userRole, setUserRole] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedData, setSubmittedData] = useState<FormValues | null>(null);
  const [dynamicUnitTypes, setDynamicUnitTypes] = useState<string[]>([]);

  const [userInfo, setUserInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
    contactNumber: "",
    studentId: "",
    role: "",
    sex: "",
  });

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      duration_of_stay: "6", // Default duration
    },
  });

  // Watch these two fields
  const watchCheckIn = watch("checkIn");
  const watchDuration = watch("duration_of_stay");

  useEffect(() => {
    if (watchCheckIn && watchDuration) {
      const durationMonths = parseInt(watchDuration);
      if (!isNaN(durationMonths)) {
        const newCheckOut = new Date(watchCheckIn);
        newCheckOut.setMonth(newCheckOut.getMonth() + durationMonths);

        // Update the hidden/read-only checkOut field in the form state
        setValue("checkOut", newCheckOut, { shouldValidate: true });
      }
    }
  }, [watchCheckIn, watchDuration, setValue]);

  const onSubmit = async (data: FormValues) => {
    if (!file) {
      setFileError("Please upload a document before submitting.");
      return;
    }

    setIsSubmitting(true);
    setShowSuccess(true);
    setFileError("");

    try {
      const months = Math.round(
        (data.checkOut.getTime() - data.checkIn.getTime()) /
        (1000 * 60 * 60 * 24 * 30.44)
      );

      // Pack the application JSON as a string field alongside the file
      const formData = new FormData();
      formData.append("file", file);
      formData.append("data", JSON.stringify({
        preferred_accommodation_id: accommodationIdFromQuery,
        preferred_unit_type: unitIdFromQuery ? "" : data.preferred_unit_type,
        duration_of_stay: months || 1,
        check_in: format(data.checkIn, "yyyy-MM-dd"),
        check_out: format(data.checkOut, "yyyy-MM-dd"),
        number_of_companions:
          //userRole === "guest" &&
          accommodation?.accommodation_type === "renting_space"
            ? 1
            : 0,
        unit_id: unitIdFromQuery,
      }));

      // Single request — no Content-Type header, browser sets multipart boundary
      const response = await fetch("/api/student/applications", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.error || "Failed to submit.");
        setShowSuccess(false);
        return;
      }

      setSubmittedData(data);
      // Log submit application here
      const profile = await getCurrentUserFromApi();
      const userRole = isUserRole(profile?.role) ? profile.role : "guest";
      // accommodationIdFromQuery

      // if (profile?.user_id) {
      //   await createActivityLog({
      //     p_user_id: profile.user_id,
      //     p_action_type: "submit_application",
      //     p_log_desc: `${profile.first_name} ${profile.last_name}  submitted application`,
      //     p_entity_type: "accommodation",
      //     p_entity_id: accommodationIdFromQuery,
      //     p_user_role: userRole,
      //   })
      // }

      setShowSuccess(true);
    } catch (error) {
      console.error("Submission error:", error);
      alert("An unexpected error occurred.");
      setShowSuccess(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fetch current user and check
  useEffect(() => {
    const fetchUser = async () => {
      try {

        const res = await fetch("/api/user/profile");
        const userProfile = await res.json();

        if (userProfile) {
          setUserInfo({
            firstName: userProfile.first_name || "",
            lastName: userProfile.last_name || "",
            email: userProfile.email || "",
            contactNumber: userProfile.contact_number || "",
            studentId: userProfile.student_num || "",
            role: userProfile.role || "",
            sex: userProfile.sex || "",
          });
        }

      } catch (err) {
        console.error("Auth error:", err);
      }
    };
    fetchUser();
  }, [setValue, authUser]);

  // FETCH ACCOMMODATION + UNIT details for display
  useEffect(() => {
    if (!accommodationIdFromQuery) {
      setTimeout(() => setIsInitialLoading(false), 1500);
      return;
    }

    const fetchAccommodation = async () => {
      try {
        const res = await fetch("/api/shared/dashboard/tiles?type=accommodations");
        if (!res.ok) throw new Error("Failed to fetch accommodations");

        const data: Accommodation[] = await res.json();
        const matched =
          data.find((a) => a.accommodation_id === accommodationIdFromQuery) ??
          null;
        setAccommodation(matched);

        const resUnit = await fetch(
          `/api/shared/dashboard/tiles?type=units-by-accommodation&accommodationId=${accommodationIdFromQuery}`,
        );
        if (!resUnit.ok) throw new Error("Failed to fetch units");

        const dataUnits: Unit[] = await resUnit.json();

        // Derive available unit types from the fetched units
        const types = Array.from(new Set(dataUnits.map(u => u.unit_type)));
        setDynamicUnitTypes(types);

        if (unitIdFromQuery) {
          const matchedUnit =
            dataUnits.find((u) => u.unit_id === unitIdFromQuery) ?? null;
          setUnit(matchedUnit);
        }
      } catch (error) {
        console.error("Failed to fetch accommodation:", error);
      } finally {
        setTimeout(() => setIsInitialLoading(false), 3000);
      }
    };

    fetchAccommodation();
  }, [accommodationIdFromQuery, unitIdFromQuery]);

  if (isInitialLoading) {
    return <PageLoader />;
  }

  // summary of application screen
  if (submittedData && !showSuccess) {
    return (
      <div
        className={`${archivo.className} min-h-[calc(100vh-4rem)] bg-[#F6F8D5] py-6 px-6 md:px-[1.5in] overflow-y-auto`}
      >
        <div className="flex items-center gap-3 mb-2">
          <CheckCircle className="h-7 w-7 text-[#78A24C]" />
          <h1 className={`${archivoBlack.className} text-3xl sm:text-4xl uppercase text-[#3d2000]`}>
            Application Summary
          </h1>
        </div>
        <p className="text-sm text-[#5a4a2a] mb-5">
          Your application has been submitted. Here are the details you
          provided.
        </p>

        <SectionCard title="Personal Information" icon={<User />}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
            <div>
              <p className="text-xs font-semibold text-[#78A24C] uppercase tracking-wide">First Name</p>
              <p className="text-base text-[#3d2000] font-bold capitalize">{userInfo.firstName || "--"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-[#78A24C] uppercase tracking-wide">Last Name</p>
              <p className="text-base text-[#3d2000] font-bold capitalize">{userInfo.lastName || "--"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-[#78A24C] uppercase tracking-wide">Email Address</p>
              <p className="text-base text-[#3d2000] font-bold">{userInfo.email || "--"}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <p className="text-xs font-semibold text-[#78A24C] uppercase tracking-wide">Student ID</p>
              <p className="text-base text-[#3d2000] font-bold">{userInfo.studentId || "--"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-[#78A24C] uppercase tracking-wide">Contact Number</p>
              <p className="text-base text-[#3d2000] font-bold">{userInfo.contactNumber || "--"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-[#78A24C] uppercase tracking-wide">Applicant Type</p>
              <p className="text-base text-[#3d2000] font-bold capitalize">{userInfo.role.replace("_", " ") || "--"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-[#78A24C] uppercase tracking-wide">Sex</p>
              <p className="text-base text-[#3d2000] font-bold capitalize">{userInfo.sex || "--"}</p>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Dormitory & Stay Preference">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              {
                label: "Selected Dormitory",
                // Show the actual fetched name if available, otherwise fallback to the form data
                value: accommodation?.name || submittedData.preferred_accommodation_id,
              },
              {
                label: "Unit Type",
                // Format "wholeunit" to "Whole Unit" and capitalize others
                value:
                  submittedData.preferred_unit_type === "wholeunit"
                    ? "Whole Unit"
                    : submittedData.preferred_unit_type
                      .charAt(0)
                      .toUpperCase() +
                    submittedData.preferred_unit_type.slice(1),
              },
              {
                label: "Check-in Date",
                value: format(submittedData.checkIn, "MMM dd, yyyy"),
              },
              {
                label: "Check-out Date",
                value: format(submittedData.checkOut, "MMM dd, yyyy"),
              },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-[10px] font-bold text-[#78A24C] uppercase tracking-widest mb-1">
                  {item.label}
                </p>
                <p className="text-sm text-[#3d2000] font-semibold">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Uploaded Document">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-[#78A24C]" />
            <p className="text-sm text-[#3d2000] font-medium">{file?.name}</p>
          </div>
        </SectionCard>

        <div className="flex justify-end mt-8">
          <Button
            onClick={() => router.push("/student/dashboard")}
            className="bg-[#78A24C] hover:bg-[#5f8a38] text-white px-7 py-3 text-base font-bold rounded-xl transition-all hover:scale-105"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Application form screen
  return (
    <div
      className={`${archivo.className} min-h-[calc(100vh-4rem)] bg-[#F6F8D5] py-6 px-6 md:px-[1.5in] overflow-y-auto`}
    >
      <h1 className={`${archivoBlack.className} pt-10 text-4xl md:text-5xl text-[#3d2000] mb-1`}>
        Apply for Accommodation
      </h1>
      <p className="text-sm text-[#5a4a2a] mb-5">
        Fill out the form below to submit your application for dormitory
        accommodation
      </p>

      <SectionCard title="Accommodation & Unit Details" icon={<Home />}>
        <div className="flex flex-col md:flex-row gap-8">
          {accommodation ? (
            <>
              {/* IMAGE on the left */}
              <div className="w-full md:w-1/3 flex-shrink-0">
                <div className="w-full h-full min-h-[200px] bg-gray-300 flex items-center justify-center text-gray-500 text-xs rounded-xl overflow-hidden shadow-sm border-2 border-[#78A24C]/30 relative">
                  {accommodation.image ? (
                    <img
                      src={accommodation.image}
                      alt={accommodation.name}
                      className="absolute inset-0 w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    "[Image Placeholder]"
                  )}
                </div>
              </div>

              {/* ACCOMMODATION & UNIT DETAILS in one column */}
              <div className="w-full md:w-2/3 flex flex-col space-y-6 justify-center">
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-bold text-[#78A24C] uppercase tracking-widest mb-1">
                      Accommodation Name
                    </p>
                    <p className="text-xl font-black text-[#3d2000]">
                      {accommodation.name}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-bold text-[#78A24C] uppercase tracking-wider">
                        Location
                      </p>
                      <p className="text-sm text-[#3d2000]">
                        {accommodation.location}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-[#78A24C] uppercase tracking-wider">
                        Type
                      </p>
                      <p className="text-sm text-[#3d2000] capitalize">
                        {accommodation.accommodation_type.replace("_", " ")}
                      </p>
                    </div>
                  </div>
                </div>

                {unit ? (
                  <div className="border-t border-[#78A24C]/20 pt-6">
                    <div className="grid grid-cols-2 gap-y-4">
                      <div>
                        <p className="text-[10px] font-bold text-[#78A24C] uppercase tracking-widest mb-1">
                          Unit Number
                        </p>
                        <p className="text-lg font-black text-[#3d2000]">
                          #{unit.unit_number}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-[#78A24C] uppercase tracking-widest mb-1">
                          Monthly Fee
                        </p>
                        <p className="text-lg font-black text-[#264384]">
                          ₱{unit.rental_fee}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-[#6a5a3a] uppercase tracking-tighter">
                          Unit Type
                        </p>
                        <p className="text-sm text-[#3d2000] capitalize">
                          {unit.unit_type}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-[#6a5a3a] uppercase tracking-tighter">
                          Stay Limits
                        </p>
                        <p className="text-sm text-[#3d2000]">
                          {unit.min_stay_duration}-{unit.max_stay_duration} mo.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="border-t border-[#78A24C]/20 pt-6">
                    <p className="text-xs text-[#6a5a3a] italic">
                      No specific unit selected
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Simple Loading State */
            <div className="w-full animate-pulse space-y-4">
              <div className="h-48 bg-[#78A24C]/10 rounded-xl w-full md:w-1/3 mb-6 md:mb-0"></div>
              <div className="space-y-2">
                <div className="h-3 bg-[#78A24C]/10 rounded w-1/4"></div>
                <div className="h-5 bg-[#78A24C]/10 rounded w-1/2"></div>
              </div>
            </div>
          )}
        </div>
      </SectionCard>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* TOP ROW */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 items-stretch">
          {/* LEFT COLUMN */}
          <div className="flex flex-col h-full">
            <SectionCard title="Personal Information" icon={<User />} className="p-6 flex-grow flex flex-col !mb-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-grow">
                <Field label="First Name">
                  <Input readOnly className={`${inputClass} bg-gray-50 text-[#3d2000] font-medium cursor-not-allowed capitalize`} value={userInfo.firstName || "--"} />
                </Field>
                <Field label="Last Name">
                  <Input readOnly className={`${inputClass} bg-gray-50 text-[#3d2000] font-medium cursor-not-allowed capitalize`} value={userInfo.lastName || "--"} />
                </Field>
                <div className="md:col-span-2">
                  <Field label="Email Address">
                    <Input readOnly className={`${inputClass} bg-gray-50 text-[#3d2000] font-medium cursor-not-allowed`} value={userInfo.email || "--"} />
                  </Field>
                </div>
                <Field label="Student ID">
                  <Input readOnly className={`${inputClass} bg-gray-50 text-[#3d2000] font-medium cursor-not-allowed`} value={userInfo.studentId || "--"} />
                </Field>
                <Field label="Contact Number">
                  <Input readOnly className={`${inputClass} bg-gray-50 text-[#3d2000] font-medium cursor-not-allowed`} value={userInfo.contactNumber || "--"} />
                </Field>
                <Field label="Applicant Type">
                  <Input readOnly className={`${inputClass} bg-gray-50 text-[#3d2000] font-medium cursor-not-allowed capitalize`} value={userInfo.role.replace("_", " ") || "--"} />
                </Field>
                <Field label="Sex">
                  <Input readOnly className={`${inputClass} bg-gray-50 text-[#3d2000] font-medium cursor-not-allowed capitalize`} value={userInfo.sex || "--"} />
                </Field>
              </div>
            </SectionCard>
          </div>

          {/* RIGHT COLUMN */}
          <div className="flex flex-col h-full">
            {/* Address Information Component Was Here */}

            <SectionCard title="Dormitory Preferences" icon={<Building />} className="p-6 flex-grow flex flex-col !mb-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-grow">
                <div className="md:col-span-2">
                  <Field
                    label="Selected Accommodation"
                    required
                    error={errors.preferred_accommodation_id?.message}
                  >
                    <Input
                      readOnly
                      className={`${inputClass} bg-gray-50 text-[#3d2000] font-medium cursor-not-allowed`}
                      value={accommodation?.name || "Loading..."}
                      {...register("preferred_accommodation_id")}
                    />
                  </Field>
                </div>

                {!unitIdFromQuery && (
                  <Field
                    label="Preferred Unit Type"
                    required
                    error={errors.preferred_unit_type?.message}
                  >
                    <Controller
                      name="preferred_unit_type"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger
                            className={
                              errors.preferred_unit_type
                                ? triggerErrorClass
                                : triggerClass
                            }
                          >
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            {dynamicUnitTypes.length > 0 ? (
                              dynamicUnitTypes.map((type) => (
                                <SelectItem
                                  key={type}
                                  value={type}
                                  className="capitalize"
                                >
                                  {type === "wholeunit" ? "Whole Unit" : type}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="none" disabled>No types available</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </Field>
                )}

                <Field
                  label="Duration (Months)"
                  required
                  error={errors.duration_of_stay?.message}
                >
                  <Input
                    type="number"
                    className={inputClass}
                    placeholder="e.g. 6"
                    {...register("duration_of_stay")}
                  />
                </Field>

                <Field
                  label="Check-in Date"
                  required
                  error={errors.checkIn?.message}
                >
                  <Controller
                    name="checkIn"
                    control={control}
                    render={({ field }) => (
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className={`flex items-center justify-between w-full h-11 px-4 rounded-xl border-2 text-sm bg-white transition-all ${errors.checkIn ? "border-red-400" : "border-[#78A24C]"
                              } ${!field.value ? "text-gray-400" : "text-gray-700"}`}
                          >
                            {field.value
                              ? format(field.value, "MMM dd, yyyy")
                              : "mm/dd/yyyy"}
                            <CalendarIcon className="h-4 w-4 text-[#78A24C]" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date(new Date().setHours(0, 0, 0, 0))
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    )}
                  />
                </Field>

                <Field label="Check-out Date">
                  <div className="relative">
                    <Input
                      readOnly
                      className={`${inputClass} bg-gray-100 font-bold placeholder:font-normal border-dashed cursor-not-allowed text-xs sm:text-sm`}
                      value={
                        watch("checkOut")
                          ? format(watch("checkOut"), "MMM dd, yyyy")
                          : ""
                      }
                      placeholder="Calculated Automatically"
                    />
                    <input type="hidden" {...register("checkOut")} />
                  </div>
                </Field>

                <div className="md:col-span-2">
                  <Field label="Notes" italic="(Optional)" error={errors.notes?.message}>
                    <textarea
                      className={`${inputClass} h-auto py-3`}
                      rows={2}
                      placeholder="Any special requests or notes..."
                      {...register("notes")}
                    />
                  </Field>
                </div>
              </div>
            </SectionCard>
          </div>
        </div>

        {/* BOTTOM ROW: Upload Document */}
        <div className="mb-6">
          <SectionCard title="Upload Document (Valid ID, Enrollment Form, or Any Supporting Document)" icon={<FileText />} className="p-6 flex-grow flex flex-col !mb-0">
            <div
              className="flex-grow border-2 border-dashed border-[#78A24C] rounded-xl p-5 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-[#78A24C]/5 transition-all"
              onClick={() => document.getElementById("file-upload")?.click()}
            >
              {file ? (
                /* PREVIEW / FILE SELECTED STATE */
                <div className="flex flex-col items-center gap-3">
                  {file.type.startsWith("image/") ? (
                    /* Image Preview */
                    <div className="relative w-40 h-40 border-2 border-[#78A24C] rounded-lg overflow-hidden bg-white shadow-sm">
                      <img
                        src={URL.createObjectURL(file)}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    /* Non-Image File Icon (PDF, DOCX, etc.) */
                    <div className="w-40 h-40 border-2 border-[#78A24C] rounded-lg bg-gray-50 flex flex-col items-center justify-center p-4 text-center">
                      <div className="bg-[#78A24C] p-3 rounded-full mb-2">
                        <CheckCircle className="h-8 w-8 text-white" />
                      </div>
                      <p className="text-[10px] font-bold text-[#3d2000] break-all px-2">
                        {file.name.toUpperCase()}
                      </p>
                    </div>
                  )}

                  <div className="flex flex-col items-center mt-2 cursor-default" onClick={(e) => e.stopPropagation()}>
                    <p className="text-[10px] text-green-700 font-medium truncate max-w-[200px] text-center mb-1">
                      {file.name}
                    </p>
                    <p className="text-[10px] text-gray-500 font-medium mb-2">
                      1 file selected
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      type="button"
                      className="border-[#78A24C] text-[#78A24C] hover:bg-[#78A24C]/10 text-[10px] uppercase font-black px-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        document.getElementById("file-upload")?.click();
                      }}
                    >
                      Change Files
                    </Button>
                  </div>
                </div>
              ) : (
                /* EMPTY STATE */
                <>
                  <Upload className="h-7 w-7 text-[#78A24C]" />
                  <p className="text-xs text-gray-400 font-medium">
                    Drag and drop file here
                  </p>
                  <p className="text-[10px] text-gray-400 -mt-2">
                    Supports PDF, JPG, PNG, DOCX
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    className="border-[#78A24C] text-[#78A24C] hover:bg-[#78A24C]/10 mt-2"
                  >
                    Click here to upload
                  </Button>
                </>
              )}
            </div>

            {fileError && (
              <p className="text-xs text-red-500 mt-2 font-bold text-center italic">
                {fileError}
              </p>
            )}

            <input
              id="file-upload"
              type="file"
              className="hidden"
              onChange={(e) => {
                const selected = e.target.files?.[0] ?? null;
                if (selected) {
                  setFile(selected);
                  setFileError("");
                }
              }}
            />
          </SectionCard>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 pb-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
            className="border-2 border-[#78A24C] text-[#78A24C] hover:bg-gray-200 hover:text-[#78A24C] px-7 py-3 text-base font-bold rounded-xl transition-all hover:scale-105"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-[#78A24C] hover:bg-[#5f8a38] text-white px-7 py-3 text-base font-bold rounded-xl transition-all hover:scale-105"
          >
            {isSubmitting ? "Submitting..." : "Submit Application"}
          </Button>
        </div>
      </form>

      <Dialog
        open={showSuccess}
        onOpenChange={!isSubmitting ? setShowSuccess : undefined}
      >
        <DialogContent className="bg-[#F6F8D5] border-2 border-[#78A24C] rounded-2xl max-w-sm text-center">
          <DialogHeader>
            <div className="flex justify-center mb-2">
              {isSubmitting ? (
                // LOADING STATE ICON
                <div className="bg-[#78A24C] rounded-full p-3 animate-spin">
                  <Loader2 className="h-10 w-10 text-white" />
                </div>
              ) : (
                // SUCCESS STATE ICON
                <div className="bg-[#78A24C] rounded-full p-3">
                  <CheckCircle className="h-10 w-10 text-white" />
                </div>
              )}
            </div>
            <DialogTitle className="text-xl font-black text-[#3d2000] text-center">
              {isSubmitting
                ? "Submitting Application..."
                : "Application Submitted!"}
            </DialogTitle>
          </DialogHeader>

          <p className="text-sm text-[#5a4a2a] text-center leading-relaxed">
            {isSubmitting
              ? "Please wait while we process your request and upload your documents."
              : "Your application has been successfully submitted. You will be notified of any updates via email."}
          </p>

          {!isSubmitting && (
            <Button
              onClick={() => setShowSuccess(false)}
              className="w-full bg-[#78A24C] hover:bg-[#5f8a38] text-white font-bold rounded-xl py-3 mt-2"
            >
              Confirm
            </Button>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
