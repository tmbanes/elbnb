"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { User } from "@supabase/supabase-js";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmail } from "@/services/browser/auth";

//ui components
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";


//style constants
const label_style = "block text-xs font-semibold uppercase tracking-wider text-slate-300"

const field_style = 
  "rounded-full border-none bg-[#fcf4d9] px-4 py-1.5 text-base " +
  "text-[#2d1a12] placeholder-[#2d1a12]/30 shadow-sm " +
  "transition-all outline-none";

const button_style = "w-full h-11 rounded-full bg-[#fbbc05] text-[#2d1a12] font-semibold hover:bg-[#f9d776]";


export default function LoginWithEmailSetup({ user }: { user: User | null }) {
  const [status, setStatus] = useState("");
  const supabase = getSupabaseBrowserClient();
  const [currentUser, setCurrentUser] = useState<User | null>(user);
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setCurrentUser(session?.user ?? null);
      }
    );
    return () => listener?.subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    if (currentUser) {
      router.push("/");
    }
  }, [currentUser]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const response = await signInWithEmail(formData);

    if (!response.success) {
      setStatus(response.error ?? "Login failed");
      return;
    }

    router.push("/role-selection");
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/onboarding");
  };

  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-center bg-[#8dbd59] p-4 font-sans selection:bg-emerald-500/30">
      <div className="w-full max-w-md space-y-6">

        {/* Login Card */}
        {!currentUser && (
          <Card className="w-full max-w-xl bg-[#5591AB]">
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-[#F6F8D5]">Welcome back</CardTitle>
              <CardDescription className="text-[#F6F8D5]">
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
                  <Input
                    className={field_style}
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    required
                  />
                </div>

                {status && (
                  <p className="text-sm text-red-500">{status}</p>
                )}

                 <Button type="submit" className="w-full rounded-full bg-[#fbbc05] text-[#2d1a12] font-semibold hover:bg-[#f9d776]">
                  Log In
                </Button>

              </CardContent>
            </form>
          </Card>
        )}

        {/* Session Card */}
        {/* <Card>
          <CardHeader>
            <CardTitle>Session</CardTitle>
            <CardDescription>
              {currentUser
                ? currentUser.email
                : "No active session"}
            </CardDescription>
          </CardHeader>

          <CardFooter className="flex justify-between">
            {currentUser ? (
              <Button variant="destructive" onClick={handleLogout}>
                Log Out
              </Button>
            ) : (
              <span className="text-sm text-muted-foreground">
                Not logged in
              </span>
            )}
          </CardFooter>
        </Card> */}
      </div>
    </main>
  );
}