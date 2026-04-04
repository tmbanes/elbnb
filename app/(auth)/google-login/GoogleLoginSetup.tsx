// /google-login/GoogleLoginSetup.tsx
"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { signInWithGoogle } from "@/services/browser/auth";
import { User } from "@supabase/supabase-js";
import { useState, useEffect } from "react";

type GoogleLoginProps = {
  user: User | null;
};

export default function GoogleLoginSetup({ user }: GoogleLoginProps) {
  const supabase = getSupabaseBrowserClient();
  const [currentUser, setCurrentUser] = useState<User | null>(user);

  async function handleSignOut() {
    await supabase.auth.signOut();
    setCurrentUser(null);
  }

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setCurrentUser(session?.user ?? null);
      },
    );

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, [supabase]);

  async function handleGoogleLogin() {
    await signInWithGoogle("/dashboard");
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#8dbd59] p-4 font-sans selection:bg-emerald-500/30">
      <div className="w-full max-w-md space-y-6">
        
        {!currentUser && (
          <div className="relative overflow-hidden rounded-3xl bg-[#5591AB] p-8 shadow-2xl backdrop-blur-xl">
           
            <div className="absolute -right-10 -top-10 -z-10 h-32 w-32 rounded-full bg-emerald-500/20 blur-3xl" />
            <div className="absolute -left-10 -bottom-10 -z-10 h-32 w-32 rounded-full bg-blue-500/20 blur-3xl" />

            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-4xl font-bold text-[#F6F8D5]">
                  Continue with Google
                </h2>
                <p className="text-l text-[#F6F8D5]">Sign in using your Google account</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full mt-4 bg-[#fbbc05] hover:bg-[#fcf4d9] text-[#fcf4d9] hover:text-[#2d1a12] font-bold py-3 rounded-xl transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
            >
              Continue with Google
            </button>
          </div>
        )}

        {/* Session Status Card */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
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
        </div>
      </div>
    </div>
  );
}
