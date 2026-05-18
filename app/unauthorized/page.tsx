import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-[#F6F8D5] flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-[24px] p-8 md:p-12 shadow-sm border border-[#eef1d6] max-w-md w-full text-center">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldAlert className="w-10 h-10 text-red-500" />
        </div>
        
        <h1 className="text-2xl md:text-3xl font-extrabold text-[#44291B] mb-3">
          Access Denied
        </h1>
        
        <p className="text-slate-500 font-medium text-sm md:text-base leading-relaxed mb-8">
          You do not have the required permissions to access this page. This area is restricted to specific user roles.
        </p>
        
        <div className="flex flex-col gap-3">
          <Link href="/auth-callback" className="w-full">
            <button className="w-full py-3.5 bg-[#264384] hover:bg-[#1e3569] text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Return to My Dashboard
            </button>
          </Link>
          <Link href="/" className="w-full">
            <button className="w-full py-3.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-all">
              Go to Homepage
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
