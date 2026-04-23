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
import { Archivo } from "next/font/google";
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
} from "lucide-react";
import { format } from "date-fns";

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

const archivo = Archivo({ subsets: ["latin"] });

const unitTypes: [UnitType, ...UnitType[]] = ["room", "bedspace", "wholeunit"];

// Validation Schema
const formSchema = z
  .object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z
      .string()
      .min(1, "Email is required")
      .refine(
        (val) =>
          /^[^\s@]+@(gmail\.com|up\.edu\.ph|yahoo\.com|outlook\.com)$/.test(
            val,
          ),
        {
          message:
            "Email must end with @gmail.com, @up.edu.ph, @yahoo.com, or @outlook.com",
        },
      ),
    studentId: z
      .string()
      .optional()
      .refine((val) => !val || /^2\d{3}-\d{5}$/.test(val), {
        message: "Student ID format must be 2XXX-XXXXX (e.g. 2024-12345)",
      }),
    contactNumber: z
      .string()
      .min(1, "Contact number is required")
      .refine((val) => /^\d+$/.test(val), {
        message: "Contact number must contain numbers only",
      }),
    applicantType: z.string().min(1, "Applicant type is required"),
    gender: z.string().min(1, "Gender is required"),
    // streetAddress: z.string().min(1, "Street address is required"),
    // province: z.string().min(1, "Province is required"),
    // city: z.string().min(1, "City is required"),
    // barangay: z.string().min(1, "Barangay is required"),
    // zipCode: z
    //   .string()
    //   .min(1, "Zip code is required")
    //   .refine((val) => /^\d+$/.test(val), {
    //     message: "Zip code must be numbers only",
    //   }),
    preferred_accommodation: z.string().min(1, "Dormitory is required"),
    preferred_unit_type: z.enum(unitTypes, {
      errorMap: () => ({ message: "Please select a valid unit type" }),
    }),
    checkIn: z.date().refine((val) => val !== undefined && val !== null, {
      message: "Check-in date is required",
    }),
    checkOut: z.date().refine((val) => val !== undefined && val !== null, {
      message: "Check-out date is required",
    }),
    duration_of_stay: z.string().min(1, "Duration of stay"),
    // emergencyFirstName: z.string().min(1, "First name is required"),
    // emergencyLastName: z.string().min(1, "Last name is required"),
    // emergencyContact: z
    //   .string()
    //   .min(1, "Contact number is required")
    //   .refine((val) => /^\d+$/.test(val), {
    //     message: "Contact number must be numbers only",
    //   }),
    // relationship: z.string().min(1, "Relationship is required"),
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
}: {
  title: string;
  children: React.ReactNode;
  highlighted?: boolean;
  onEdit?: () => void; // Optional function
}) {
  return (
    <div
      className={`
        relative rounded-2xl border-2 bg-white p-6 mb-4 transition-all duration-300 ease-in-out
        hover:scale-[1.01] hover:shadow-xl hover:border-[#78A24C] group
        ${highlighted ? "border-blue-400 shadow-md" : "border-[#78A24C]/30"}
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

      <div className="flex items-center gap-2 pb-3 mb-4 border-b border-[#78A24C]/20">
        <span className="text-[#78A24C] text-sm group-hover:animate-pulse">
          ★
        </span>
        <span className="text-sm font-bold text-[#3d2000] uppercase tracking-wider">
          {title}
        </span>
      </div>

      <div className="transition-opacity duration-300">{children}</div>
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
      <Label className="text-sm font-semibold text-[#3d2000]">
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

// main fform
export default function ApplyAccommodationForm() {
  const searchParams = useSearchParams();
  // const router = useRouter()
  const accommodationIdFromQuery = searchParams.get("accommodationId") ?? "";
  const unitIdFromQuery = searchParams.get("unitId") ?? "";

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

    // Calculate duration in months for the backend
    const months = Math.round(
      (data.checkOut.getTime() - data.checkIn.getTime()) /
      (1000 * 60 * 60 * 24 * 30.44),
    );

    const payload = {
      preferred_accommodation: accommodationIdFromQuery,
      preferred_unit_type: unitIdFromQuery ? "" : data.preferred_unit_type,
      date_submitted: new Date().toISOString(),
      duration_of_stay: months || 1,
      check_in: format(data.checkIn, "yyyy-MM-dd"),
      check_out: format(data.checkOut, "yyyy-MM-dd"),
      number_of_companions:
        userRole === "guest" &&
          accommodation?.accommodation_type === "renting_space"
          ? 1
          : 0,
      application_status: "pending_dorm_manager" as ApplicationStatus,
      user_id: userId,
      unit_id: unitIdFromQuery,
    };

    try {
      const response = await fetch("/api/applications/create_application", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.error || "Failed to submit.");
        return;
      }

      setSubmittedData(data);
      setShowSuccess(true);
    } catch (error) {
      console.error("Submission error:", error);
      alert("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fetch current user and check
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth");
        if (!res.ok) throw new Error("Auth failed");
        const data = await res.json();
        if (data.user?.user_id) {
          setUserId(data.user.user_id);
          setUserRole(data.user.role);
        }
      } catch (err) {
        console.error("Auth error:", err);
      }
    };
    fetchUser();
  }, []);

  // FETCH ACCOMMODATION + UNIT details for display
  useEffect(() => {
    if (!accommodationIdFromQuery) return;

    const fetchAccommodation = async () => {
      try {
        const res = await fetch("/api/dashboard/tiles?type=accommodations");
        if (!res.ok) throw new Error("Failed to fetch accommodations");

        const data: Accommodation[] = await res.json();
        const matched =
          data.find((a) => a.accommodation_id === accommodationIdFromQuery) ??
          null;
        setAccommodation(matched);

        if (unitIdFromQuery) {
          const resUnit = await fetch(
            `/api/dashboard/tiles?type=units-by-accommodation&accommodationId=${accommodationIdFromQuery}`,
          );
          if (!resUnit.ok) throw new Error("Failed to fetch units");

          const dataUnits: Unit[] = await resUnit.json();
          const matchedUnit =
            dataUnits.find((u) => u.unit_id === unitIdFromQuery) ?? null;
          setUnit(matchedUnit);
        }
      } catch (error) {
        console.error("Failed to fetch accommodation:", error);
      }
    };

    fetchAccommodation();
  }, [accommodationIdFromQuery, unitIdFromQuery]);

  // summary of application screen
  if (submittedData && !showSuccess) {
    return (
      <div
        className={`${archivo.className} min-h-[calc(100vh-4rem)] bg-[#F6F8D5] p-6 overflow-y-auto`}
      >
        <div className="flex items-center gap-3 mb-2">
          <CheckCircle className="h-7 w-7 text-[#78A24C]" />
          <h1 className="text-2xl font-black uppercase tracking-widest text-[#3d2000]">
            Application Summary
          </h1>
        </div>
        <p className="text-sm text-[#5a4a2a] mb-5">
          Your application has been submitted. Here are the details you
          provided.
        </p>

        <SectionCard title="Personal Information">
          <div className="grid grid-cols-3 gap-4">
            {[
              ["First Name", submittedData.firstName],
              ["Last Name", submittedData.lastName],
              ["Email Address", submittedData.email],
              ["Student ID", submittedData.studentId || "N/A"],
              ["Contact Number", submittedData.contactNumber],
              ["Applicant Type", submittedData.applicantType],
              ["Gender", submittedData.gender],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-xs font-semibold text-[#78A24C] uppercase tracking-wide">
                  {label}
                </p>
                <p
                  className={`text-sm text-[#3d2000] font-medium ${label === "Email Address" ? "" : "capitalize"}`}
                >
                  {value}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* <SectionCard title="Address Information">
          <div className="grid grid-cols-3 gap-4">
            {[
              ["Street Address", submittedData.streetAddress],
              ["Province", submittedData.province],
              ["City", submittedData.city],
              ["Barangay", submittedData.barangay],
              ["Zip Code", submittedData.zipCode],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-xs font-semibold text-[#78A24C] uppercase tracking-wide">
                  {label}
                </p>
                <p className="text-sm text-[#3d2000] font-medium">{value}</p>
              </div>
            ))}
          </div>
        </SectionCard> */}

        <SectionCard title="Dormitory & Stay Preference">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              {
                label: "Selected Dormitory",
                // Show the actual fetched name if available, otherwise fallback to the form data
                value: submittedData.preferred_accommodation,
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

        {/* <SectionCard title="Emergency Contact Information">
          <div className="grid grid-cols-4 gap-4">
            {[
              ["First Name", submittedData.emergencyFirstName],
              ["Last Name", submittedData.emergencyLastName],
              ["Contact Number", submittedData.emergencyContact],
              ["Relationship", submittedData.relationship],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-xs font-semibold text-[#78A24C] uppercase tracking-wide">
                  {label}
                </p>
                <p className="text-sm text-[#3d2000] font-medium capitalize">
                  {value}
                </p>
              </div>
            ))}
          </div>
        </SectionCard> */}

        <SectionCard title="Uploaded Document">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-[#78A24C]" />
            <p className="text-sm text-[#3d2000] font-medium">{file?.name}</p>
          </div>
        </SectionCard>
      </div>
    );
  }

  // Application form screen
  return (
    <div
      className={`${archivo.className} min-h-[calc(100vh-4rem)] bg-[#F6F8D5] p-6 overflow-y-auto`}
    >
      <h1 className="text-2xl font-black uppercase tracking-widest text-[#3d2000] mb-1">
        Apply for Accommodation
      </h1>
      <p className="text-sm text-[#5a4a2a] mb-5">
        Fill out the form below to submit your application for dormitory
        accommodation
      </p>

      <SectionCard title="Accommodation & Unit Details">
        <div className="space-y-6">
          {accommodation ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
              {/* LEFT side: Accommodation Info */}
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-bold text-[#78A24C] uppercase tracking-widest mb-1">
                    Accommodation Name
                  </p>
                  <p className="text-base font-bold text-[#3d2000]">
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

              {/* RIGHT side: Unit Info */}
              {unit ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 border-t md:border-t-0 md:border-l border-[#78A24C]/20 pt-4 md:pt-0 md:pl-8">
                    <div className="grid grid-cols-2 gap-y-4">
                      <div>
                        <p className="text-[10px] font-bold text-[#78A24C] uppercase tracking-widest mb-1">
                          Unit Number
                        </p>
                        <p className="text-base font-bold text-[#3d2000]">
                          #{unit.unit_number}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-[#78A24C] uppercase tracking-widest mb-1">
                          Monthly Fee
                        </p>
                        <p className="text-base font-bold text-[#264384]">
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
                </div>
              ) : (
                <div className="flex items-center md:border-l border-[#78A24C]/20 md:pl-8">
                  <p className="text-xs text-[#6a5a3a] italic">
                    No specific unit selected
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Simple Loading State */
            <div className="animate-pulse space-y-2">
              <div className="h-3 bg-[#78A24C]/10 rounded w-1/4"></div>
              <div className="h-5 bg-[#78A24C]/10 rounded w-1/2"></div>
            </div>
          )}
        </div>
      </SectionCard>

      <form onSubmit={handleSubmit(onSubmit)}>
        <SectionCard title="Personal Information">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <Field
              label="First Name"
              required
              error={errors.firstName?.message}
            >
              <Input
                className={errors.firstName ? inputErrorClass : inputClass}
                placeholder="Maria"
                {...register("firstName")}
              />
            </Field>
            <Field label="Last Name" required error={errors.lastName?.message}>
              <Input
                className={errors.lastName ? inputErrorClass : inputClass}
                placeholder="Makiling"
                {...register("lastName")}
              />
            </Field>
            <Field label="Email Address" required error={errors.email?.message}>
              <Input
                className={errors.email ? inputErrorClass : inputClass}
                type="email"
                placeholder="maria.makiling@up.edu.ph"
                {...register("email")}
              />
            </Field>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <Field
              label="Student ID"
              italic="(if applicable)"
              error={errors.studentId?.message}
            >
              <Input
                className={errors.studentId ? inputErrorClass : inputClass}
                placeholder="2XXX-XXXXX"
                {...register("studentId")}
              />
            </Field>
            <Field
              label="Contact Number"
              required
              error={errors.contactNumber?.message}
            >
              <Input
                className={errors.contactNumber ? inputErrorClass : inputClass}
                placeholder="09XXXXXXXXX"
                {...register("contactNumber")}
                onKeyDown={(e) => {
                  if (
                    !/^\d$/.test(e.key) &&
                    ![
                      "Backspace",
                      "Delete",
                      "ArrowLeft",
                      "ArrowRight",
                      "Tab",
                    ].includes(e.key)
                  ) {
                    e.preventDefault();
                  }
                }}
              />
            </Field>
            <Field
              label="Applicant Type"
              required
              error={errors.applicantType?.message}
            >
              <Controller
                name="applicantType"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger
                      className={
                        errors.applicantType ? triggerErrorClass : triggerClass
                      }
                    >
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="guest">Guest</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Field label="Gender" required error={errors.gender?.message}>
              <Controller
                name="gender"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger
                      className={
                        errors.gender ? triggerErrorClass : triggerClass
                      }
                    >
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
          </div>
        </SectionCard>

        {/* <SectionCard title="Address Information">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Field
              label="Street Address"
              required
              error={errors.streetAddress?.message}
            >
              <Input
                className={errors.streetAddress ? inputErrorClass : inputClass}
                placeholder="123 Mabini Street"
                {...register("streetAddress")}
              />
            </Field>
            <Field label="Province" required error={errors.province?.message}>
              <Input
                className={errors.province ? inputErrorClass : inputClass}
                placeholder="Laguna"
                {...register("province")}
              />
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Field label="City" required error={errors.city?.message}>
              <Input
                className={errors.city ? inputErrorClass : inputClass}
                placeholder="Los Banos"
                {...register("city")}
              />
            </Field>
            <Field label="Barangay" required error={errors.barangay?.message}>
              <Input
                className={errors.barangay ? inputErrorClass : inputClass}
                placeholder="Batong Malake"
                {...register("barangay")}
              />
            </Field>
            <Field label="Zip Code" required error={errors.zipCode?.message}>
              <Input
                className={errors.zipCode ? inputErrorClass : inputClass}
                placeholder="XXXX"
                {...register("zipCode")}
                onKeyDown={(e) => {
                  if (
                    !/^\d$/.test(e.key) &&
                    ![
                      "Backspace",
                      "Delete",
                      "ArrowLeft",
                      "ArrowRight",
                      "Tab",
                    ].includes(e.key)
                  ) {
                    e.preventDefault();
                  }
                }}
              />
            </Field>
          </div>
        </SectionCard> */}

        <SectionCard title="Dormitory Preference">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* First Row */}
            <Field
              label="Selected Accommodation"
              required
              error={errors.preferred_accommodation?.message}
            >
              <Input
                readOnly
                className={`${inputClass} bg-gray-50 text-[#3d2000] font-medium cursor-not-allowed`}
                value={accommodation?.name || "Loading..."}
                {...register("preferred_accommodation")}
              />
            </Field>

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
                      {unitTypes.map((type) => (
                        <SelectItem
                          key={type}
                          value={type}
                          className="capitalize"
                        >
                          {type === "wholeunit" ? "Whole Unit" : type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

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

            {/* Second Row */}
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
                          : "Select date"}
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

            <Field label="Check-out Date" italic="(Calculated Automatically)">
              <div className="relative">
                <Input
                  readOnly
                  className={`${inputClass} bg-gray-100 font-bold border-dashed cursor-not-allowed`}
                  value={
                    watch("checkOut")
                      ? format(watch("checkOut"), "MMM dd, yyyy")
                      : "--"
                  }
                />
                <input type="hidden" {...register("checkOut")} />
              </div>
            </Field>
          </div>
        </SectionCard>

        {/* <SectionCard title="Emergency Contact Information">
          <div className="grid grid-cols-4 gap-4">
            <Field
              label="First Name"
              required
              error={errors.emergencyFirstName?.message}
            >
              <Input
                className={
                  errors.emergencyFirstName ? inputErrorClass : inputClass
                }
                placeholder="Maria"
                {...register("emergencyFirstName")}
              />
            </Field>
            <Field
              label="Last Name"
              required
              error={errors.emergencyLastName?.message}
            >
              <Input
                className={
                  errors.emergencyLastName ? inputErrorClass : inputClass
                }
                placeholder="Makiling"
                {...register("emergencyLastName")}
              />
            </Field>
            <Field
              label="Contact Number"
              required
              error={errors.emergencyContact?.message}
            >
              <Input
                className={
                  errors.emergencyContact ? inputErrorClass : inputClass
                }
                placeholder="09123456789"
                {...register("emergencyContact")}
                onKeyDown={(e) => {
                  if (
                    !/^\d$/.test(e.key) &&
                    ![
                      "Backspace",
                      "Delete",
                      "ArrowLeft",
                      "ArrowRight",
                      "Tab",
                    ].includes(e.key)
                  ) {
                    e.preventDefault();
                  }
                }}
              />
            </Field>
            <Field
              label="Relationship"
              required
              error={errors.relationship?.message}
            >
              <Controller
                name="relationship"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger
                      className={
                        errors.relationship ? triggerErrorClass : triggerClass
                      }
                    >
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="parent">Parent</SelectItem>
                      <SelectItem value="sibling">Sibling</SelectItem>
                      <SelectItem value="guardian">Guardian</SelectItem>
                      <SelectItem value="spouse">Spouse</SelectItem>
                      <SelectItem value="friend">Friend</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
          </div>
        </SectionCard> */}

        <SectionCard title="Upload Document (ID, Enrollment, or any supporting file)">
          <div
            className="border-2 border-dashed border-[#78A24C] rounded-xl p-5 flex flex-col items-center gap-4 cursor-pointer hover:bg-[#78A24C]/5 transition-all"
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

                <div className="flex flex-col items-center">
                  <p className="text-xs text-green-700 font-medium">
                    {file.name}
                  </p>
                  <p className="text-[10px] text-gray-500 font-medium mb-2">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    className="border-[#78A24C] text-[#78A24C] hover:bg-[#78A24C]/10 text-[10px] uppercase font-black px-6"
                  >
                    Change File
                  </Button>
                </div>
              </div>
            ) : (
              /* EMPTY STATE */
              <>
                <Upload className="h-7 w-7 text-[#78A24C]" />
                <p className="text-xs text-gray-400 font-medium">
                  Drag and drop any file here
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

        {/* Submit Button */}
        <div className="flex justify-end pb-6">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-[#78A24C] hover:bg-[#5f8a38] text-white px-7 py-3 text-base font-bold rounded-xl"
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
