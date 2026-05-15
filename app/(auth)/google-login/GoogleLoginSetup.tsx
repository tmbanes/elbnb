// /google-login/GoogleLoginSetup.tsx
"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { signInWithGoogle } from "@/services/browser/auth";
import { User } from "@/types/user.types";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

//ui components
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { ChevronLeft } from "lucide-react";
//style constants
const button_style = "w-full h-11 rounded-full bg-[#fbbc05] text-[#2d1a12] font-semibold hover:bg-[#f9d776]";

type GoogleLoginProps = {
  user: User | null;
};

export default function GoogleLoginSetup({ user }: GoogleLoginProps) {
  const supabase = getSupabaseBrowserClient();
  const [currentUser, setCurrentUser] = useState<User | null>(user);
  const router = useRouter();

  async function handleSignOut() {
    await supabase.auth.signOut();
    setCurrentUser(null);
  }

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser((session?.user as unknown as User) ?? null);
    });
    return () => listener?.subscription.unsubscribe();
  }, [supabase]);

  // Removed the useEffect watching currentUser to avoid client-side bouncing.
  // The Google OAuth callback will automatically redirect to /auth-callback.

  async function handleGoogleLogin() {
    await signInWithGoogle("/complete-profile");
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#8dbd59] p-4 font-sans selection:bg-emerald-500/30">
      <div className="w-full max-w-md space-y-6">



        {!currentUser && (
          <div>
            <Card className="w-full max-w-xl bg-[#5591AB]">
              <CardHeader>
                <CardTitle className="text-3xl font-bold text-[#F6F8D5]">Continue with Google</CardTitle>
                <CardDescription className="text-[#F6F8D5]">
                  Sign in with your Google account
                </CardDescription>
                <Button
                  variant="ghost"
                  onClick={() => router.push('/complete-profile')}
                  className="absolute top-4 right-4 text-[#F6F8D5] hover:bg-white/10 hover:text-white rounded-full h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>

                <Button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="w-full mt-4 bg-[#fbbc05] hover:bg-[#fcf4d9] text-[#fcf4d9] hover:text-[#2d1a12] font-bold py-3 rounded-xl transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
                >
                  Continue with Google
                </Button>
              </CardHeader>
            </Card>
            <div className="mt-8 flex justify-center">
              <Button
                variant="link"
                onClick={() => router.push('/onboarding')}
                className="text-[#F6F8D5]/60 hover:text-[#F6F8D5] flex items-center gap-1 no-underline font-semibold"
              >
                <ChevronLeft className="h-4 w-4" />
                Go back
              </Button>
            </div>
          </div>
        )}


        {/* Session Status Card */}
        {/* <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white">System Session</h3>
              <p className="text-xs text-slate-500">
                {currentUser ? currentUser.email : "No active session detected"}
              </p>
            </div>
            {currentUser ? (
              <button 
                onClick={handleSignOut}
                className="px-4 py-2 text-xs font-bold text-white bg-red-500/20 hover:bg-red-500/40 rounded-lg transition-colors"
              >
                Log Out
              </button>
            ) : (
              <span className="h-2 w-2 rounded-full bg-slate-600 animate-pulse" />
            )}
          </div>
        </div> */}
      </div>
    </div>
  );
}
