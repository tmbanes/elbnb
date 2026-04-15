"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue,} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {Dialog, DialogContent, DialogHeader, DialogTitle,} from "@/components/ui/dialog";
import { useState } from "react";
import { Archivo } from "next/font/google";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {Popover, PopoverTrigger, PopoverContent,} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar"
import { Upload, CheckCircle, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";

const archivo = Archivo({ subsets: ["latin"] });

// Validation Schema
const formSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z
    .string()
    .min(1, "Email is required")
    .refine(
      (val) => /^[^\s@]+@(gmail\.com|up\.edu\.ph|yahoo\.com|outlook\.com)$/.test(val),
      { message: "Email must end with @gmail.com, @up.edu.ph, @yahoo.com, or @outlook.com" }
    ),
  studentId: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^2\d{3}-\d{5}$/.test(val),
      { message: "Student ID format must be 2XXX-XXXXX (e.g. 2024-12345)" }
    ),
  contactNumber: z
    .string()
    .min(1, "Contact number is required")
    .refine(
      (val) => /^\d+$/.test(val),
      { message: "Contact number must contain numbers only" }
    ),
  applicantType: z.string().min(1, "Applicant type is required"),
  gender: z.string().min(1, "Gender is required"),
  streetAddress: z.string().min(1, "Street address is required"),
  province: z.string().min(1, "Province is required"),
  city: z.string().min(1, "City is required"),
  barangay: z.string().min(1, "Barangay is required"),
  zipCode: z
    .string()
    .min(1, "Zip code is required")
    .refine(
      (val) => /^\d+$/.test(val),
      { message: "Zip code must be numbers only" }
    ),
  dormitory: z.string().min(1, "Dormitory is required"),
  roomType: z.string().min(1, "Room type is required"),
  checkIn: z
    .date()
    .refine((val) => val !== undefined && val !== null, {
      message: "Check-in date is required",
    }),
  checkOut: z
    .date()
    .refine((val) => val !== undefined && val !== null, {
      message: "Check-out date is required",
    }),
  emergencyFirstName: z.string().min(1, "First name is required"),
  emergencyLastName: z.string().min(1, "Last name is required"),
  emergencyContact: z
    .string()
    .min(1, "Contact number is required")
    .refine((val) => /^\d+$/.test(val), { message: "Contact number must be numbers only" }),
  relationship: z.string().min(1, "Relationship is required"),
}).refine((data) => {
  if (data.checkIn && data.checkOut) {
    return data.checkOut > data.checkIn;
  }
  return true;
}, {
  message: "Check-out date must be after check-in date",
  path: ["checkOut"],
});

type FormValues = z.infer<typeof formSchema>;

// Reusable Components
function SectionCard({
  title,
  children,
  highlighted = false,
}: {
  title: string;
  children: React.ReactNode;
  highlighted?: boolean;
}) {
  return (
    <div className={`rounded-2xl border-2 bg-[#F6F8D5] p-6 mb-4 ${
      highlighted ? "border-blue-400" : "border-[#78A24C]"
    }`}>
      <div className="flex items-center gap-2 pb-3 mb-4 border-b border-[#78A24C]/30">
        <span className="text-[#78A24C] text-sm">★</span>
        <span className="text-sm font-bold text-[#3d2000]">{title}</span>
      </div>
      {children}
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
        {italic && <span className="font-normal italic text-[#6a5a3a] ml-1">{italic}</span>}
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
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string>("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [submittedData, setSubmittedData] = useState<FormValues | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = (data: FormValues) => {
    if (!file) {
      setFileError("Please upload a document before submitting.");
      return;
    }
    setFileError("");
    setSubmittedData(data);
    setShowSuccess(true);
  };

  // summary of application screen
  if (submittedData && !showSuccess) {
    return (
      <div className={`${archivo.className} min-h-[calc(100vh-4rem)] bg-[#F6F8D5] p-6 overflow-y-auto`}>
        <div className="flex items-center gap-3 mb-2">
          <CheckCircle className="h-7 w-7 text-[#78A24C]" />
          <h1 className="text-2xl font-black uppercase tracking-widest text-[#3d2000]">
            Application Summary
          </h1>
        </div>
        <p className="text-sm text-[#5a4a2a] mb-5">
          Your application has been submitted. Here are the details you provided.
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
                <p className="text-xs font-semibold text-[#78A24C] uppercase tracking-wide">{label}</p>
                <p className={`text-sm text-[#3d2000] font-medium ${label === "Email Address" ? "" : "capitalize"}`}>   
                  {value}
               </p>
            </div>
          ))}
          </div>
        </SectionCard>

        <SectionCard title="Address Information">
          <div className="grid grid-cols-3 gap-4">
            {[
              ["Street Address", submittedData.streetAddress],
              ["Province", submittedData.province],
              ["City", submittedData.city],
              ["Barangay", submittedData.barangay],
              ["Zip Code", submittedData.zipCode],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-xs font-semibold text-[#78A24C] uppercase tracking-wide">{label}</p>
                <p className="text-sm text-[#3d2000] font-medium">{value}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Dormitory Preference">
          <div className="grid grid-cols-4 gap-4">
            {[
              ["Dormitory", submittedData.dormitory === "mens" ? "Men's Dormitory" : "Women's Dormitory"],
              ["Room Type", submittedData.roomType === "shared" ? "Shared Room" : "Private Room"],
              ["Check-in Date", format(submittedData.checkIn, "MMM dd, yyyy")],
              ["Check-out Date", format(submittedData.checkOut, "MMM dd, yyyy")],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-xs font-semibold text-[#78A24C] uppercase tracking-wide">{label}</p>
                <p className="text-sm text-[#3d2000] font-medium">{value}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Emergency Contact Information">
          <div className="grid grid-cols-4 gap-4">
            {[
              ["First Name", submittedData.emergencyFirstName],
              ["Last Name", submittedData.emergencyLastName],
              ["Contact Number", submittedData.emergencyContact],
              ["Relationship", submittedData.relationship],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-xs font-semibold text-[#78A24C] uppercase tracking-wide">{label}</p>
                <p className="text-sm text-[#3d2000] font-medium capitalize">{value}</p>
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
      </div>
    );
  }

  // Application form screen
  return (
    <div className={`${archivo.className} min-h-[calc(100vh-4rem)] bg-[#F6F8D5] p-6 overflow-y-auto`}>
      <h1 className="text-2xl font-black uppercase tracking-widest text-[#3d2000] mb-1">
        Apply for Accommodation
      </h1>
      <p className="text-sm text-[#5a4a2a] mb-5">
        Fill out the form below to submit your application for dormitory accommodation
      </p>

      <form onSubmit={handleSubmit(onSubmit)}>

        <SectionCard title="Personal Information">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <Field label="First Name" required error={errors.firstName?.message}>
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
            <Field label="Student ID" italic="(if applicable)" error={errors.studentId?.message}>
              <Input
                className={errors.studentId ? inputErrorClass : inputClass}
                placeholder="2XXX-XXXXX"
                {...register("studentId")}
              />
            </Field>
            <Field label="Contact Number" required error={errors.contactNumber?.message}>
              <Input
                className={errors.contactNumber ? inputErrorClass : inputClass}
                placeholder="09XXXXXXXXX"
                {...register("contactNumber")}
                onKeyDown={(e) => {
                  if (
                    !/^\d$/.test(e.key) &&
                    !["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"].includes(e.key)
                  ) {
                    e.preventDefault();
                  }
                }}
              />
            </Field>
            <Field label="Applicant Type" required error={errors.applicantType?.message}>
              <Controller
                name="applicantType"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className={errors.applicantType ? triggerErrorClass : triggerClass}>
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
                    <SelectTrigger className={errors.gender ? triggerErrorClass : triggerClass}>
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

        <SectionCard title="Address Information">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Field label="Street Address" required error={errors.streetAddress?.message}>
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
                    !["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"].includes(e.key)
                  ) {
                    e.preventDefault();
                  }
                }}
              />
            </Field>
          </div>
        </SectionCard>

        <SectionCard title="Dormitory Preference">
          <div className="grid grid-cols-4 gap-4">
            <Field label="Dormitory" required error={errors.dormitory?.message}>
              <Controller
                name="dormitory"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className={errors.dormitory ? triggerErrorClass : triggerClass}>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mens">Men's Dormitory</SelectItem>
                      <SelectItem value="womens">Women's Dormitory</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Field label="Room Type" required error={errors.roomType?.message}>
              <Controller
                name="roomType"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className={errors.roomType ? triggerErrorClass : triggerClass}>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="shared">Shared Room</SelectItem>
                      <SelectItem value="private">Private Room</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Field label="Check-in Date" required error={errors.checkIn?.message}>
              <Controller
                name="checkIn"
                control={control}
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className={`flex items-center justify-between w-full h-11 px-4 rounded-xl border-2 text-sm bg-white ${
                          errors.checkIn ? "border-red-400" : "border-[#78A24C]"
                        } ${!field.value ? "text-gray-400" : "text-gray-700"}`}
                      >
                        {field.value ? format(field.value, "MMM dd, yyyy") : "Select date"}
                        <CalendarIcon className="h-4 w-4 text-[#78A24C]" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                )}
              />
            </Field>
            <Field label="Check-out Date" required error={errors.checkOut?.message}>
              <Controller
                name="checkOut"
                control={control}
                render={({ field }) => {
                  const checkIn = control._formValues.checkIn;
                  return (
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className={`flex items-center justify-between w-full h-11 px-4 rounded-xl border-2 text-sm bg-white ${
                            errors.checkOut ? "border-red-400" : "border-[#78A24C]"
                          } ${!field.value ? "text-gray-400" : "text-gray-700"}`}
                        >
                          {field.value ? format(field.value, "MMM dd, yyyy") : "Select date"}
                          <CalendarIcon className="h-4 w-4 text-[#78A24C]" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date(new Date().setHours(0, 0, 0, 0)) ||
                            (checkIn ? date <= checkIn : false)
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  );
                }}
              />
            </Field>
          </div>
        </SectionCard>

        <SectionCard title="Emergency Contact Information">
          <div className="grid grid-cols-4 gap-4">
            <Field label="First Name" required error={errors.emergencyFirstName?.message}>
              <Input
                className={errors.emergencyFirstName ? inputErrorClass : inputClass}
                placeholder="Maria"
                {...register("emergencyFirstName")}
              />
            </Field>
            <Field label="Last Name" required error={errors.emergencyLastName?.message}>
              <Input
                className={errors.emergencyLastName ? inputErrorClass : inputClass}
                placeholder="Makiling"
                {...register("emergencyLastName")}
              />
            </Field>
            <Field label="Contact Number" required error={errors.emergencyContact?.message}>
              <Input
                className={errors.emergencyContact ? inputErrorClass : inputClass}
                placeholder="09123456789"
                {...register("emergencyContact")}
                onKeyDown={(e) => {
                  if (
                    !/^\d$/.test(e.key) &&
                    !["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"].includes(e.key)
                  ) {
                    e.preventDefault();
                  }
                }}
              />
            </Field>
            <Field label="Relationship" required error={errors.relationship?.message}>
              <Controller
                name="relationship"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className={errors.relationship ? triggerErrorClass : triggerClass}>
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
        </SectionCard>

        <SectionCard title="Upload Document (Student ID or Proof of Enrollment)">
          <div
            className="border-2 border-dashed border-[#78A24C] rounded-xl p-5 flex flex-col items-center gap-2 cursor-pointer hover:bg-[#78A24C]/5 transition-colors"
            onClick={() => document.getElementById("file-upload")?.click()}
          >
            <Upload className="h-7 w-7 text-[#78A24C]" />
            <p className="text-xs text-gray-400">Drag and drop files here</p>
            <Button variant="outline" size="sm" type="button"
              className="border-[#78A24C] text-[#78A24C] hover:bg-[#78A24C]/10">
              Click here to upload
            </Button>
            {file && <p className="text-xs text-green-700 font-medium">{file.name}</p>}
          </div>
          {fileError && <p className="text-xs text-red-500 mt-1">{fileError}</p>}
          <input
            id="file-upload"
            type="file"
            className="hidden"
            onChange={(e) => {
              const selected = e.target.files?.[0] ?? null;
              setFile(selected);
              if (selected) setFileError("");
            }}
          />
        </SectionCard>

        {/* Submit Button */}
        <div className="flex justify-end pb-6">
          <Button
            type="submit"
            className="bg-[#78A24C] hover:bg-[#5f8a38] text-white px-7 py-3 text-base font-bold rounded-xl"
          >
            Submit Application
          </Button>
        </div>
      </form>

      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="bg-[#F6F8D5] border-2 border-[#78A24C] rounded-2xl max-w-sm text-center">
          <DialogHeader>
            <div className="flex justify-center mb-2">
              <div className="bg-[#78A24C] rounded-full p-3">
                <CheckCircle className="h-10 w-10 text-white" />
              </div>
            </div>
            <DialogTitle className="text-xl font-black text-[#3d2000] text-center">
              Application Submitted!
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[#5a4a2a] text-center leading-relaxed">
            Your application has been successfully submitted.
            <br />
            You will be notified of any updates via email.
          </p>
          <Button
            onClick={() => setShowSuccess(false)}
            className="w-full bg-[#78A24C] hover:bg-[#5f8a38] text-white font-bold rounded-xl py-3 mt-2"
          >
            Confirm
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}