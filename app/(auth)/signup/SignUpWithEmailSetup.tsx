"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, UserRole } from "@/types/user.types";

//ui components
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { ChevronLeft } from "lucide-react";
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

const button_style = "w-full h-11 rounded-full bg-[#fbbc05] text-[#2d1a12] font-semibold hover:bg-[#f9d776]";

type SignupFormData = {
  email: string;
  password: string;
  role: UserRole;
};

const initialFormData: SignupFormData = {
  email: "",
  password: "",
  role: "student",
};

type Role = "student" | "guest";

const roleLabels: Record<Role, string> = {
  student: "Student",
  guest: "Guest"

};
const roleDescriptions: Record<Role, string> = {
  student: "Access student-specific housing and residency features.",
  guest: "Quick access for visitors and temporary stays."

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
      setCurrentUser((session?.user as unknown as User) ?? null);
    });
    return () => listener?.subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    if (currentUser && currentUser.role) {
      router.push("/");
    }
  }, [currentUser, router]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (value: string) => {
    setFormData((prev) => ({ ...prev, role: value as UserRole }));
  };


  const getPayload = () => {
    return {
      email: formData.email,
      password: formData.password,
      role: formData.role,
      user_status: "active",
      // We send empty strings for required fields in the backend if any, 
      // but names will be updated in the next step.
      first_name: "TBD",
      last_name: "TBD",
    };
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("");
    setLoading(true);

    const payload = getPayload();
    setStatus("");
    setLoading(true);

    try {
      // Manual Validation
      if (!payload.email || !payload.email.includes("@")) {
        setStatus("Please enter a valid email address.");
        setLoading(false);
        return;
      }
      if (!payload.password || payload.password.length < 6) {
        setStatus("Password must be at least 6 characters long.");
        setLoading(false);
        return;
      }

      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      // Handle non-JSON responses (SyntaxError prevention)
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Server returned non-JSON response:", text);
        setStatus("Server error during signup. Please try again.");
        setLoading(false);
        return;
      }

      const data = await response.json();

      if (!response.ok || !data.success) {
        setStatus(data.error ?? "Signup failed. Please try again.");
        setLoading(false);
        return;
      }

      setStatus("Signup successful! Redirecting...");
      router.push("/complete-profile");

    } catch (error) {
      setStatus("Unable to complete signup. Please try again later.");
      console.error("Signup error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (

    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#8dbd59] p-4 font-sans selection:bg-emerald-500/30">

      {/* Main Auth Card */}
      <Card className="bg-[#5591AB] shadow-sm w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-[#F6F8D5]">Get Started!</CardTitle>
          <CardDescription className="text-[#F6F8D5]">
            Choose your role and credentials to begin
          </CardDescription>
          <Button 
            variant="ghost" 
            onClick={() => router.push('/onboarding')}
            className="absolute top-4 right-4 text-[#F6F8D5] hover:bg-white/10 hover:text-white rounded-full h-8 w-8 p-0"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role selection */}
            <Label className={label_style}>I am a...</Label>
            <div className="grid gap-4 sm:grid-cols-2">
              {Object.entries(roleLabels).map(([role, label]) => (
                <Card
                  key={role}
                  className={`cursor-pointer rounded-2xl border transition-all duration-200 ${formData.role === role ?
                    "border-[#fbbc05] bg-[#fcf4d9] shadow-xl scale-[1.02]"
                    : "border-white/10 bg-white/10 hover:border-white/30 hover:bg-white/20"
                    }`}
                  onClick={() => handleRoleChange(role as Role)}
                >
                  <CardHeader>
                    <CardTitle
                      className={`font-bold ${formData.role === role ? "text-[#2d1a12]" : "text-white"
                        }`}>
                      {label}</CardTitle>

                    <CardDescription className={`mt-3 text-sm leading-6 ${formData.role === role ? "text-[#2d1a12]/80" : "text-slate-100"
                      }`}>
                      {roleDescriptions[role as Role]}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>

            {/* <div className="grid gap-2">
              <Label htmlFor="role" className={label_style}>I am a...</Label>
              <Select onValueChange={handleRoleChange} defaultValue={formData.role}>
                <SelectTrigger className="w-full h-11 rounded-full border-none bg-[#fcf4d9] text-[#2d1a12] px-4">
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent className="bg-[#fcf4d9] text-[#2d1a12] border-none rounded-2xl">
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="guest">Guest</SelectItem>
                </SelectContent>
              </Select>
            </div> */}

            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email" className={label_style}>Email</Label>
                <Input
                  className={field_style}
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@up.edu.ph"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password" className={label_style}>Password</Label>
                <Input
                  className={field_style}
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                />
              </div>
            </div>

            {status && (
              <p className={`rounded-full px-4 py-3 text-center text-sm ${status.includes("successful") ? "bg-emerald-500/20 text-emerald-100" : "bg-red-500/20 text-red-200"}`}>
                {status}
              </p>
            )}

            <Button type="submit" disabled={loading} className={button_style}>
              {loading ? "Signing up..." : "Create account"}
            </Button>

          </form>
          <div className="mt-6 flex justify-center">
            <Button 
              variant="link" 
              onClick={() => router.push('/onboarding')}
              className="text-[#F6F8D5]/60 hover:text-[#F6F8D5] flex items-center gap-1 no-underline"
            >
              <ChevronLeft className="h-4 w-4" />
              Go back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>

  );
}
