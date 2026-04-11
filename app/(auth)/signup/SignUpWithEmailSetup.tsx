"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { signUpWithEmail } from "@/services/browser/auth";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserRole, UserStatus } from "@/types/user.types";
import { User } from "@supabase/supabase-js";
import { redirect } from 'next/navigation';

//ui components
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

//role options
const roleOptions: Array<{ value: UserRole; label: string }> = [
  { value: "student", label: "Student" },
  { value: "guest", label: "Guest" },
];

const enrollmentOptions = [
  { value: "enrolled", label: "Enrolled" },
  { value: "graduated", label: "Graduated" },
  { value: "dropped", label: "Dropped" },
];

const residencyOptions = [
  { value: "resident", label: "Resident" },
  { value: "non-resident", label: "Non-Resident" },
  { value: "evicted", label: "Evicted" },
];

type SignupFormData = {
  first_name: string;
  middle_name: string;
  last_name: string;
  email: string;
  password: string;
  role: UserRole;
  user_status: UserStatus;
  student_number: string;
  degree_program: string;
  enrollment_status: "enrolled" | "graduated" | "dropped";
  // residency_status: "freshman" | "sophomore" | "junior" | "senior" | "delayed";
  residency_status: "resident" | "non-resident" | "evicted";
  valid_id: string;
  purpose_visit: string;
  occupancy_status: string;
};

const initialFormData: SignupFormData = {
  first_name: "",
  middle_name: "",
  last_name: "",
  email: "",
  password: "",
  role: "student",
  user_status: "inactive",
  student_number: "",
  degree_program: "",
  enrollment_status: "enrolled",
  residency_status: "resident",
  valid_id: "",
  purpose_visit: "",
  occupancy_status: "",
};

export default function SignUpWithEmailSetup({ user: initialUser }: { user: User | null }) {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const [currentUser, setCurrentUser] = useState<User | null>(initialUser);
  const [formData, setFormData] = useState<SignupFormData>(initialFormData);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null);
    });
    return () => listener?.subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    if (currentUser) {
     redirect('/app');
    }
  }, [currentUser]);

  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  //student & guest additional fields
  const renderDynamicFields = () => {
    switch (formData.role) {

      //STUDENT FIELDS: student_number, degree_program, enrollment_status, residency_status
      case "student":
        return (
          <>
            <div className="grid gap-2">
              <Label htmlFor="student_number">Student Number</Label>
              <Input
                id="student_number"
                name="student_number"
                type="text"
                value={formData.student_number}
                onChange={handleChange}
                placeholder="202312345"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="degree_program">Degree Program</Label>
              <Input
                id="degree_program"
                name="degree_program"
                type="text"
                value={formData.degree_program}
                onChange={handleChange}
                placeholder="BS Computer Science"
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="enrollment_status">Enrollment Status</Label>
                <select
                  id="enrollment_status"
                  name="enrollment_status"
                  value={formData.enrollment_status}
                  onChange={handleChange}
                  className="h-12 rounded-full border border-slate-200 bg-white px-4 text-sm outline-none"
                >
                  {enrollmentOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="residency_status">Residency Status</Label>
                <select
                  id="residency_status"
                  name="residency_status"
                  value={formData.residency_status}
                  onChange={handleChange}
                  className="h-12 rounded-full border border-slate-200 bg-white px-4 text-sm outline-none"
                >
                  {residencyOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </>
        );

      //GUEST FIELDS: valid_id, purpose_visit, occupancy_status
      case "guest":
        return (
          <>
            <div className="grid gap-2">
              <Label htmlFor="valid_id">Valid ID</Label>
              <Input
                id="valid_id"
                name="valid_id"
                type="text"
                value={formData.valid_id}
                onChange={handleChange}
                placeholder="Passport or ID number"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="purpose_visit">Purpose of Visit</Label>
              <Input
                id="purpose_visit"
                name="purpose_visit"
                type="text"
                value={formData.purpose_visit}
                onChange={handleChange}
                placeholder="Attending event"
                required
              />
            </div>

            {/* double check */}
            <div className="grid gap-2">
              <Label htmlFor="occupancy_status">Occupancy Date</Label>
              <Input
                id="occupancy_status"
                name="occupancy_status"
                type="date"
                value={formData.occupancy_status}
                onChange={handleChange}
                required
              />
            </div>
          </>
        );
      default:
        return null;
    }
  };

  const getPayload = () => {
    const basePayload = {
      first_name: formData.first_name,
      middle_name: formData.middle_name || undefined,
      last_name: formData.last_name,
      email: formData.email,
      password: formData.password,
      role: formData.role,
      user_status: formData.user_status,
    };

    //role dependent fields
    switch (formData.role) {
      case "student":
        return {
          ...basePayload,
          student_number: formData.student_number,
          degree_program: formData.degree_program,
          enrollment_status: formData.enrollment_status,
          residency_status: formData.residency_status,
          violation_count: 0,
        };
      case "guest":
        return {
          ...basePayload,
          valid_id: formData.valid_id,
          purpose_visit: formData.purpose_visit,
          occupancy_status: formData.occupancy_status,
        };
      default:
        return basePayload;
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("");
    setLoading(true);

    const payload = getPayload();

    try {
      const response = await fetch("/api/auth/signUp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      //troubleshooting: check response
      console.log("Response:", data);

      if (!response.ok || !data.success) {
        setStatus(data.error ?? "Signup failed. Please try again.");
        setLoading(false);
        return;
      }

      setStatus("Signup successful! Redirecting...");
      router.push("/role-selection");

    } catch (error) {
      setStatus("Unable to complete signup. Please try again later.");
      console.error("Signup error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-lg my-8 mx-auto">
      <CardHeader>
        <CardTitle>Get Started!</CardTitle>
        <CardDescription>
          Kindly fill up the following fields
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  name="first_name"
                  type="text"
                  value={formData.first_name}
                  onChange={handleChange}
                  placeholder="First name"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="middle_name">Middle Name</Label>
                <Input
                  id="middle_name"
                  name="middle_name"
                  type="text"
                  value={formData.middle_name}
                  onChange={handleChange}
                  placeholder="Middle name"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                name="last_name"
                type="text"
                value={formData.last_name}
                onChange={handleChange}
                placeholder="Last name"
                required
              />
            </div>

            <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="h-12 rounded-full border border-slate-200 bg-white px-4 text-sm outline-none"
              >
                {roleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="name@example.com"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Choose a secure password"
                required
              />
            </div>

            <div className="space-y-4">{renderDynamicFields()}</div>
          </div>

          {status && (
            <p className="rounded-full bg-red-500/10 px-4 py-3 text-center text-sm text-red-700">
              {status}
            </p>
          )}

          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Signing up..." : "Create account"}
            </Button>
          </CardFooter>
        </form>
      </CardContent>
    </Card>
  );
}
