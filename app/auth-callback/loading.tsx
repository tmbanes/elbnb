import { Loader2 } from "lucide-react";

export default function AuthCallbackLoading() {
  return (
    <div className="min-h-screen bg-[#F6F8D5] flex flex-col items-center justify-center">
      <Loader2 className="w-12 h-12 text-[#264384] animate-spin mb-4" />
      <h2 className="text-xl font-bold text-[#44291B]">Authenticating...</h2>
      <p className="text-sm text-slate-500 mt-2">Please wait while we log you in.</p>
    </div>
  );
}
