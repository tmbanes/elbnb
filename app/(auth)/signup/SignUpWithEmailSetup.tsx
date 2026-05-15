"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, UserRole } from "@/types/user.types";

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
import { ArrowLeft, Eye, EyeOff, Home } from "lucide-react";
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
  "transition-all outline-none font-[family-name:var(--font-archivo)]";

type SignupFormData = { email: string; password: string; role: UserRole };
const initialFormData: SignupFormData = { email: "", password: "", role: "student" };
type Role = "student" | "guest";
const roleLabels: Record<Role, string> = { student: "Student", guest: "Guest" };
const roleDescriptions: Record<Role, string> = {
  student: "Access student-specific housing and residency features.",
  guest: "Quick access for visitors and temporary stays.",
};

export default function SignUpWithEmailSetup({ user: _initialUser }: { user: User | null }) {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const [formData, setFormData] = useState<SignupFormData>(initialFormData);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(() => {});
    return () => listener?.subscription.unsubscribe();
  }, [supabase]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (value: string) => {
    setFormData((prev) => ({ ...prev, role: value as UserRole }));
  };

  const getPayload = () => {
    const payload: any = {
      email: formData.email,
      password: formData.password,
      role: formData.role,
      user_status: "active",
      first_name: "TBD",
      last_name: "TBD",
    };
    if (formData.role === "guest") {
      payload.valid_id = "TBD";
      payload.purpose_visit = "TBD";
    }
    return payload;
  };

  const handleSubmit = async (event: { preventDefault(): void }) => {
    event.preventDefault();
    setStatus("");
    setLoading(true);
    const payload = getPayload();

    try {
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

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
      router.push("/auth-callback");
    } catch (error) {
      setStatus("Unable to complete signup. Please try again later.");
      console.error("Signup error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden bg-[#87CEEB] font-[family-name:var(--font-archivo)]">
      {/* Grain filter */}
      <svg className="hidden">
        <filter id="grain-signup">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          <feComposite operator="in" in2="SourceGraphic" />
          <feColorMatrix type="matrix" values="1 0 0 0 0,0 1 0 0 0,0 0 1 0 0,0 0 0 0.08 0" />
          <feBlend mode="multiply" in2="SourceGraphic" />
        </filter>
      </svg>

      {/* Clouds — left */}
      <div className="absolute top-[8%] left-[-2%] pointer-events-none z-[5]">
        <img src="/logo/clouds/cloud-element-23.png" alt="" className="w-56 md:w-80 opacity-90 float-animation" />
      </div>
      <div className="absolute top-[35%] left-[-3%] pointer-events-none z-[3]">
        <img src="/logo/clouds/cloud-element-23.png" alt="" className="w-36 md:w-52 opacity-40 float-animation-reverse" />
      </div>
      <div className="absolute top-[5%] left-[25%] pointer-events-none z-[4]">
        <img src="/logo/clouds/cloud-element-25.png" alt="" className="w-32 md:w-44 opacity-60 float-animation-slow" />
      </div>

      {/* Clouds — right */}
      <div className="absolute top-[8%] right-[-2%] pointer-events-none z-[5]">
        <img src="/logo/clouds/cloud-element-24.png" alt="" className="w-64 md:w-96 opacity-85 float-animation-reverse" />
      </div>
      <div className="absolute top-[20%] right-[18%] pointer-events-none z-[4]">
        <img src="/logo/clouds/cloud-element-24.png" alt="" className="w-28 md:w-40 opacity-60 float-animation" />
      </div>
      <div className="absolute top-[42%] right-[8%] pointer-events-none z-[5]">
        <img src="/logo/clouds/cloud-element-23.png" alt="" className="w-24 md:w-36 opacity-70 float-animation-slow" />
      </div>

      {/* Green hills */}
      <div className="absolute bottom-0 left-[30%] -translate-x-1/2 w-[280vw] md:w-[180vw] h-[28vh] z-[1] pointer-events-none"
        style={{ background: '#98C965', borderTopLeftRadius: '50% 100%', borderTopRightRadius: '50% 100%', filter: 'url(#grain-signup)' }} />
      <div className="absolute bottom-0 left-[75%] -translate-x-1/2 w-[260vw] md:w-[160vw] h-[22vh] z-[2] pointer-events-none"
        style={{ background: '#8ABF55', borderTopLeftRadius: '50% 100%', borderTopRightRadius: '50% 100%', filter: 'url(#grain-signup)' }} />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[250vw] md:w-[150vw] h-[16vh] z-[3] pointer-events-none"
        style={{ background: '#7EB647', borderTopLeftRadius: '50% 100%', borderTopRightRadius: '50% 100%', filter: 'url(#grain-signup)' }} />

      {/* Card */}
      <div className="relative z-10 w-full max-w-md px-4 py-8 space-y-4">
          <div className="flex items-center justify-center relative z-20 translate-y-8">
            <div className="w-20 h-20 bg-[#F6F8D5] border-4 border-[#3e2319] rounded-full flex items-center justify-center shadow-lg" style={{ filter: 'url(#grain-signup)' }}>
              <img src="/logo/logo_house.png" alt="ELbnb" className="h-10 w-auto" />
            </div>
          </div>

        <Card className="w-full bg-[#5591AB] border-0 shadow-2xl rounded-3xl overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-3xl font-black text-[#F6F8D5] font-[family-name:var(--font-archivo-black)]">
              Get Started!
            </CardTitle>
            <CardDescription className="text-[#F6F8D5]/80 font-[family-name:var(--font-archivo)]">
              Choose your role and credentials to begin
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label className={label_style}>I am a...</Label>
                <div className="grid gap-3 sm:grid-cols-2 mt-2">
                  {Object.entries(roleLabels).map(([role, label]) => (
                    <Card
                      key={role}
                      className={`cursor-pointer rounded-2xl border transition-all duration-200 ${
                        formData.role === role
                          ? "border-[#fbbc05] bg-[#fcf4d9] shadow-xl scale-[1.02]"
                          : "border-white/10 bg-white/10 hover:border-white/30 hover:bg-white/20"
                      }`}
                      onClick={() => handleRoleChange(role as Role)}
                    >
                      <CardHeader className="pb-2 pt-3 px-4">
                        <CardTitle className={`text-sm font-bold font-[family-name:var(--font-archivo-black)] ${formData.role === role ? "text-[#2d1a12]" : "text-white"}`}>
                          {label}
                        </CardTitle>
                        <CardDescription className={`text-xs leading-5 font-[family-name:var(--font-archivo)] ${formData.role === role ? "text-[#2d1a12]/70" : "text-slate-100"}`}>
                          {roleDescriptions[role as Role]}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </div>

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
                <div className="relative">
                  <Input
                    className={`${field_style} pr-10`}
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#2d1a12]/50 hover:text-[#2d1a12]"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>

              {status && (
                <p className={`rounded-full px-4 py-2 text-center text-sm font-medium ${status.includes("successful") ? "bg-green-500/20 text-green-100" : "bg-red-500/20 text-red-200"}`}>
                  {status}
                </p>
              )}

              <Button type="submit" disabled={loading} className="w-full h-11 rounded-full bg-[#fbbc05] text-[#2d1a12] font-bold hover:bg-[#f9d776] font-[family-name:var(--font-archivo)]">
                {loading ? "Signing up..." : "Create account"}
              </Button>
            </form>
          </CardContent>
        </Card>
          <div className="flex items-center justify-center gap-4">
            <Button variant="link" onClick={() => router.push("/onboarding")} className="text-[#3E2723]/80 hover:text-[#3E2723] flex items-center gap-1 no-underline font-bold font-[family-name:var(--font-archivo)]">
              <ArrowLeft className="h-4 w-4" />

              Go back
            </Button>
            <span className="text-[#3E2723]/30 font-bold">•</span>
            <Button variant="link" onClick={() => router.push("/")} className="text-[#3E2723]/80 hover:text-[#3E2723] flex items-center gap-1 no-underline font-bold font-[family-name:var(--font-archivo)]">
              <Home className="h-4 w-4" />
              Back to Home
            </Button>
          </div>

      </div>

      <style jsx global>{`
        @keyframes cloudFloat {
          0%, 100% { transform: translateX(0px); }
          50% { transform: translateX(25px); }
        }
        @keyframes cloudFloatReverse {
          0%, 100% { transform: translateX(0px); }
          50% { transform: translateX(-20px); }
        }
        .float-animation { animation: cloudFloat 12s ease-in-out infinite; }
        .float-animation-reverse { animation: cloudFloatReverse 15s ease-in-out infinite; }
        .float-animation-slow { animation: cloudFloat 18s ease-in-out infinite; }
      `}</style>
    </main>
  );
}
