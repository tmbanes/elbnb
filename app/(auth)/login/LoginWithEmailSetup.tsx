"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { User } from "@/types/user.types";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmail } from "@/services/browser/auth";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ArrowLeft, Home, Eye, EyeOff } from "lucide-react";

const label_style = "block text-xs font-semibold uppercase tracking-wider text-[#F6F8D5]/80 font-[family-name:var(--font-archivo)]";
const field_style =
  "rounded-full border-none bg-[#fcf4d9] px-4 py-1.5 text-base " +
  "text-[#2d1a12] placeholder-[#2d1a12]/30 shadow-sm " +
  "transition-all outline-none font-[family-name:var(--font-archivo)]";

export default function LoginWithEmailSetup({ user }: { user: User | null }) {
  const [status, setStatus] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const supabase = getSupabaseBrowserClient();
  const [currentUser, setCurrentUser] = useState<User | null>(user);
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser((session?.user as unknown as User) ?? null);
    });
    return () => listener?.subscription.unsubscribe();
  }, [supabase]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  async function handleSubmit(event: { preventDefault(): void }) {
    event.preventDefault();
    const response = await signInWithEmail(formData);
    if (!response.success) {
      setStatus(response.error ?? "Login failed");
      return;
    }
    setStatus("Login successful! Redirecting...");
    router.push("/auth-callback");
  }

  return (
    <main
      className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden bg-[#87CEEB] font-[family-name:var(--font-archivo)]"
    >
      {/* Grain filter */}
      <svg className="hidden">
        <filter id="grain-login">
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
      <div
        className="absolute bottom-0 left-[30%] -translate-x-1/2 w-[280vw] md:w-[180vw] h-[28vh] z-[1] pointer-events-none"
        style={{ background: '#98C965', borderTopLeftRadius: '50% 100%', borderTopRightRadius: '50% 100%', filter: 'url(#grain-login)' }}
      />
      <div
        className="absolute bottom-0 left-[75%] -translate-x-1/2 w-[260vw] md:w-[160vw] h-[22vh] z-[2] pointer-events-none"
        style={{ background: '#8ABF55', borderTopLeftRadius: '50% 100%', borderTopRightRadius: '50% 100%', filter: 'url(#grain-login)' }}
      />
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[250vw] md:w-[150vw] h-[16vh] z-[3] pointer-events-none"
        style={{ background: '#7EB647', borderTopLeftRadius: '50% 100%', borderTopRightRadius: '50% 100%', filter: 'url(#grain-login)' }}
      />

      {/* Card */}
      {!currentUser && (      
       <div className="relative z-10 w-full max-w-md px-4 space-y-4">
          <div className="flex items-center justify-center relative z-20 translate-y-8">
            <div className="w-20 h-20 bg-[#F6F8D5] border-4 border-[#3e2319] rounded-full flex items-center justify-center shadow-lg" style={{ filter: 'url(#grain-login)' }}>
              <img src="/logo/logo_house.png" alt="ELbnb" className="h-10 w-auto" />
            </div>
          </div>

          <Card className="w-full bg-[#5591AB] border-0 shadow-2xl rounded-3xl overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-3xl font-black text-[#F6F8D5] font-[family-name:var(--font-archivo-black)]">
                Welcome back
              </CardTitle>
              <CardDescription className="text-[#F6F8D5]/80 font-[family-name:var(--font-archivo)]">
                Enter your credentials to continue
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className={label_style}>Email</Label>
                  <Input
                    className={field_style}
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="name@uplb.edu.ph"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className={label_style}>Password</Label>
                  <div className="relative">
                    <Input
                      className={`${field_style} pr-10`}
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Enter your password"
                      required
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

                {status && (
                  <p className={`rounded-full px-4 py-2 text-center text-sm font-medium ${
                    status.includes("successful") ? "bg-green-500/20 text-green-100" : "bg-red-500/20 text-red-200"
                  }`}>
                    {status}
                  </p>
                )}

                <Button
                  type="submit"
                  className="w-full h-11 rounded-full bg-[#fbbc05] text-[#2d1a12] font-bold hover:bg-[#f9d776] font-[family-name:var(--font-archivo)]"
                >
                  Log In
                </Button>
              </CardContent>
            </form>
          </Card>

          <div className="flex items-center justify-center gap-4">
            <Button
              variant="link"
              onClick={() => router.push("/onboarding")}
              className="text-[#3E2723]/80 hover:text-[#3E2723] flex items-center gap-1 no-underline font-bold font-[family-name:var(--font-archivo)]"
            >
              <ArrowLeft className="h-4 w-4" />

              Go back
            </Button>
            <span className="text-[#3E2723]/30 font-bold">•</span>
            <Button
              variant="link"
              onClick={() => router.push("/")}
              className="text-[#3E2723]/80 hover:text-[#3E2723] flex items-center gap-1 no-underline font-bold font-[family-name:var(--font-archivo)]"
            >
              <Home className="h-4 w-4" />
              Back to Home
            </Button>
          </div>
        </div>
      )}

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
