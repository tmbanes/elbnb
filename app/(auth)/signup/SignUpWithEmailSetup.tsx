"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";

//ui components
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent,
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";

//style constants
const label_style = "block text-xs font-semibold uppercase tracking-wider text-slate-300"

const field_style = 
  "rounded-full border-none bg-[#fcf4d9] px-4 py-1.5 text-base " +
  "text-[#2d1a12] placeholder-[#2d1a12]/30 shadow-sm " +
  "transition-all outline-none";

const button_style = "w-full h-11 rounded-full bg-[#fbbc05] text-[#2d1a12] font-semibold hover:bg-[#f9d776]";

type Role = "guest" | "student";

type SignupFormData = {
  first_name: string;
  middle_name: string;
  last_name: string;
  email: string;
  password: string;
};

const initialFormData: SignupFormData = {
  first_name: "",
  middle_name: "",
  last_name: "",
  email: "",
  password: "",
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
      router.push("/");
    }
  }, [currentUser, router]);

  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };


  const getPayload = () => {
    return {
      first_name: formData.first_name,
      middle_name: formData.middle_name || undefined,
      last_name: formData.last_name,
      email: formData.email,
      password: formData.password,
      user_status: "inactive",
    };
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("");
    setLoading(true);

    const payload = getPayload();

    try {
      const response = await fetch("/api/auth/signup", {
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
      router.push("/role-selection"); //redirect to /role-selection after successful signup

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
      <Card className="bg-[#5591AB] shadow-sm w-fit">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-[#F6F8D5]">Get Started!</CardTitle>
          <CardDescription className="text-[#F6F8D5]">
            Kindly fill the necessary information below
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">

              <div className="grid gap-2 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="first_name" className={label_style}>First Name</Label>
                  <Input
                    className={field_style}
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
                  <Label htmlFor="middle_name" className={label_style}>Middle Name</Label>
                  <Input
                    className={field_style}
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
                <Label htmlFor="last_name" className={label_style}>Last Name</Label>
                <Input
                  className={field_style}
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
                  <Label htmlFor="email" className={label_style}>Email</Label>
                  <Input
                    className={field_style}
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="name@up.edu.ph"
                    required
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
                    placeholder="Choose a secure password"
                    required
                  />
                </div>
              </div>

            {/* {status && (
              <p className="rounded-full bg-red-500/10 px-4 py-3 text-center text-sm text-red-700">
                {status}
              </p>
            )} */}
            
            <Button type="submit" disabled={loading} className={button_style}>
              {loading ? "Signing up..." : "Create account"}
            </Button>
            
          </form>
        </CardContent>
      </Card>
    </div>

  );
}
